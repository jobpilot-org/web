import { inject, Injectable } from '@angular/core';

import { createId, type JobApplication } from '@/domain/application';
import type { Appointment } from '@/domain/details';
import {
  DEFAULT_REMINDER_SETTINGS,
  diffReminders,
  effectiveDueAt,
  planReminders,
  type Reminder,
  type ReminderChanges,
  type ReminderKind,
  type ReminderSettings,
} from '@/domain/reminders';

import type { Database } from '../core/database.types';
import { SUPABASE } from '../core/supabase';
import { toIsoTimestamp, toJobApplication, unwrap } from './applications.repository';
import { DataRevision } from './data-revision';
import { toAppointment } from './details.repository';
import { SettingsRepository } from './settings.repository';

type ReminderRow = Database['public']['Tables']['reminders']['Row'];

export type ReminderWithCompany = Reminder & { company: string };

const DAY = 24 * 60 * 60 * 1000;

export function toReminder(row: ReminderRow): Reminder {
  return {
    key: row.key,
    applicationId: row.application_id,
    // Die Check-Constraints der Migration lassen nur die Werte aus `domain/` zu
    kind: row.kind as ReminderKind,
    dueAt: toIsoTimestamp(row.due_at),
    title: row.title,
    body: row.body,
    doneAt: row.done_at ? toIsoTimestamp(row.done_at) : undefined,
    snoozedUntil: row.snoozed_until ? toIsoTimestamp(row.snoozed_until) : undefined,
  };
}

/** Gespeicherte Einstellungen → Regeln; fehlende oder kaputte Werte fallen auf den Standard zurück */
export function parseReminderSettings(stored: ReadonlyMap<string, string>): ReminderSettings {
  const raw = stored.get('reminders.followUpDays');
  const followUpDays = raw === undefined ? NaN : Number(raw);
  return {
    followUpDays: Number.isInteger(followUpDays)
      ? followUpDays
      : DEFAULT_REMINDER_SETTINGS.followUpDays,
    appointments: stored.get('reminders.appointments') !== 'off',
    thankYou: stored.get('reminders.thankYou') !== 'off',
  };
}

/**
 * Was sich an den gespeicherten Erinnerungen ändern muss. Rein, damit sich der Abgleich ohne
 * Datenbank testen lässt; `lastStatusChangeAt` fehlt bei Bewerbungen ohne Statusereignis.
 */
export function reminderChanges({
  applications,
  appointments,
  settings,
  stored,
  now,
}: {
  applications: (JobApplication & { createdAt: string; lastStatusChangeAt?: string })[];
  appointments: Appointment[];
  settings: ReminderSettings;
  stored: Reminder[];
  now: Date;
}): ReminderChanges {
  const planned = planReminders({
    applications: applications.map(({ createdAt, lastStatusChangeAt, ...application }) => ({
      ...application,
      lastStatusChangeAt: lastStatusChangeAt ?? createdAt,
    })),
    appointments,
    settings,
    now,
  });
  return diffReminders(planned, stored);
}

/**
 * Erinnerungen in Supabase: Abgleich mit den Regeln (ADR 3 der mobile-app) und Aktionen.
 * Im Browser gibt es keine Systembenachrichtigungen – fällige Erinnerungen stehen in der Übersicht,
 * wie in der Web-Version der mobile-app.
 */
@Injectable({ providedIn: 'root' })
export class RemindersRepository {
  private readonly supabase = inject(SUPABASE);
  private readonly revision = inject(DataRevision);
  private readonly settingsRepository = inject(SettingsRepository);

  private written<T>(result: { data: T; error: unknown }): T {
    const data = unwrap(result);
    this.revision.bump();
    return data;
  }

  private async withCompany(applicationId?: string): Promise<ReminderWithCompany[]> {
    let query = this.supabase
      .from('reminders')
      .select('*, applications!inner(company, archived_at)')
      .is('applications.archived_at', null)
      .is('done_at', null);
    if (applicationId) query = query.eq('application_id', applicationId);
    const rows = unwrap(await query) ?? [];
    return rows
      .map(({ applications, ...row }) => ({ ...toReminder(row), company: applications.company }))
      .sort((a, b) => effectiveDueAt(a).localeCompare(effectiveDueAt(b)));
  }

  async settings(): Promise<ReminderSettings> {
    return parseReminderSettings(await this.settingsRepository.all());
  }

  async saveSettings(next: ReminderSettings): Promise<void> {
    await this.settingsRepository.set('reminders.followUpDays', String(next.followUpDays));
    await this.settingsRepository.set('reminders.appointments', next.appointments ? 'on' : 'off');
    await this.settingsRepository.set('reminders.thankYou', next.thankYou ? 'on' : 'off');
  }

  /**
   * Gleicht die gespeicherten Erinnerungen mit den Regeln ab. Gibt zurück, ob sich etwas geändert
   * hat. Mehrere Geräte können gleichzeitig abgleichen: Neue Schlüssel werden per Upsert ohne
   * Überschreiben eingefügt, so bleiben Erledigt und Später erhalten.
   */
  async reconcile(now = new Date()): Promise<boolean> {
    const [applicationRows, eventRows, appointmentRows, storedRows, stored] = await Promise.all([
      this.supabase.from('applications').select('*').is('archived_at', null),
      this.supabase.from('status_events').select('application_id, at'),
      // Vergangene Termine nur, solange ein Dankeschön noch infrage kommt
      this.supabase
        .from('appointments')
        .select('*')
        .gte('starts_at', new Date(now.getTime() - 7 * DAY).toISOString()),
      this.supabase.from('reminders').select('*'),
      this.settingsRepository.all(),
    ]);

    const lastChangeById = new Map<string, string>();
    for (const row of unwrap(eventRows) ?? []) {
      const at = toIsoTimestamp(row.at);
      const previous = lastChangeById.get(row.application_id);
      if (!previous || at > previous) lastChangeById.set(row.application_id, at);
    }
    const applications = unwrap(applicationRows) ?? [];
    const activeIds = new Set(applications.map((row) => row.id));

    const changes = reminderChanges({
      applications: applications.map((row) => ({
        ...toJobApplication(row),
        createdAt: toIsoTimestamp(row.created_at),
        lastStatusChangeAt: lastChangeById.get(row.id),
      })),
      appointments: (unwrap(appointmentRows) ?? [])
        .filter((row) => activeIds.has(row.application_id))
        .map(toAppointment),
      settings: parseReminderSettings(stored),
      stored: (unwrap(storedRows) ?? []).map(toReminder),
      now,
    });
    if (!changes.insert.length && !changes.update.length && !changes.remove.length) return false;

    if (changes.remove.length) {
      unwrap(await this.supabase.from('reminders').delete().in('key', changes.remove));
    }
    if (changes.insert.length) {
      const timestamp = now.toISOString();
      unwrap(
        await this.supabase.from('reminders').upsert(
          changes.insert.map((reminder) => ({
            key: reminder.key,
            application_id: reminder.applicationId,
            kind: reminder.kind,
            due_at: reminder.dueAt,
            title: reminder.title,
            body: reminder.body,
            created_at: timestamp,
          })),
          { onConflict: 'user_id,key', ignoreDuplicates: true },
        ),
      );
    }
    for (const { key, dueAt, title, body } of changes.update) {
      unwrap(
        await this.supabase.from('reminders').update({ due_at: dueAt, title, body }).eq('key', key),
      );
    }
    this.revision.bump();
    return true;
  }

  /** Offene Erinnerungen aller nicht gelöschten Bewerbungen, nach Fälligkeit */
  open(): Promise<ReminderWithCompany[]> {
    return this.withCompany();
  }

  forApplication(applicationId: string): Promise<ReminderWithCompany[]> {
    return this.withCompany(applicationId);
  }

  async markDone(key: string, now = new Date()): Promise<void> {
    this.written(
      await this.supabase.from('reminders').update({ done_at: now.toISOString() }).eq('key', key),
    );
  }

  async snooze(key: string, until: string): Promise<void> {
    this.written(
      await this.supabase.from('reminders').update({ snoozed_until: until }).eq('key', key),
    );
  }

  async addCustom(
    applicationId: string,
    title: string,
    dueAt: string,
    now = new Date(),
  ): Promise<string> {
    const key = `custom:${createId()}`;
    this.written(
      await this.supabase.from('reminders').insert({
        key,
        application_id: applicationId,
        kind: 'custom',
        due_at: dueAt,
        title: title.trim(),
        body: '',
        created_at: now.toISOString(),
      }),
    );
    return key;
  }

  async remove(key: string): Promise<void> {
    this.written(await this.supabase.from('reminders').delete().eq('key', key));
  }
}
