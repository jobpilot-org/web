import { inject, Injectable } from '@angular/core';

import {
  createId,
  type ApplicationInput,
  type ApplicationStatus,
  type JobApplication,
  type Priority,
  type StatusEvent,
  type WorkMode,
} from '@/domain/application';
import type { ApplicationHistory } from '@/domain/insights';

import type { Database } from '../core/database.types';
import { SUPABASE } from '../core/supabase';

type Tables = Database['public']['Tables'];
type ApplicationRow = Tables['applications']['Row'];
type StatusEventRow = Tables['status_events']['Row'];

/**
 * Postgres liefert `timestamptz` als `…+00:00`; die Domain vergleicht ISO-Strings mit `Z`, wie sie
 * `Date.toISOString()` erzeugt.
 */
export function toIsoTimestamp(value: string): string {
  return new Date(value).toISOString();
}

/** Spalten der Datenbank → Domain-Typ; leere Spalten werden zu fehlenden Feldern */
export function toJobApplication(row: ApplicationRow): JobApplication {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    location: row.location,
    // Die Check-Constraints der Migration lassen nur die Werte aus `domain/` zu
    workMode: (row.work_mode ?? undefined) as WorkMode | undefined,
    appliedAt: row.applied_at,
    status: row.status as ApplicationStatus,
    priority: row.priority as Priority,
    source: row.source ?? undefined,
    jobUrl: row.job_url ?? undefined,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    nextStep: row.next_step ?? undefined,
    jobDescription: row.job_description ?? undefined,
  };
}

/** Domain-Eingabe → Spalten; fehlende optionale Felder werden ausdrücklich geleert */
export function toColumns(input: ApplicationInput) {
  return {
    company: input.company,
    role: input.role,
    location: input.location,
    work_mode: input.workMode ?? null,
    applied_at: input.appliedAt,
    status: input.status,
    priority: input.priority,
    source: input.source ?? null,
    job_url: input.jobUrl ?? null,
    salary_min: input.salaryMin ?? null,
    salary_max: input.salaryMax ?? null,
    next_step: input.nextStep ?? null,
    job_description: input.jobDescription ?? null,
  } satisfies Tables['applications']['Update'];
}

export function toStatusEvent(row: StatusEventRow): StatusEvent {
  return {
    from: row.from_status as ApplicationStatus | null,
    to: row.to_status as ApplicationStatus,
    at: toIsoTimestamp(row.at),
  };
}

/** Supabase meldet Fehler als Rückgabewert; hier werden sie zu Ausnahmen */
function unwrap<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error;
  return data;
}

/**
 * Bewerbungen in Supabase – dieselben Operationen wie das Repository der mobile-app, aber
 * asynchron. RLS beschränkt alle Abfragen auf die Zeilen des angemeldeten Nutzers, `user_id`
 * setzt die Datenbank selbst.
 *
 * Bewerbung und Statusereignis werden nacheinander geschrieben, nicht in einer Transaktion: Schlägt
 * das zweite Schreiben fehl, fehlt dieser Eintrag im Verlauf.
 */
@Injectable({ providedIn: 'root' })
export class ApplicationsRepository {
  private readonly supabase = inject(SUPABASE);

  private async insertEvent(
    applicationId: string,
    from: ApplicationStatus | null,
    to: ApplicationStatus,
    at: string,
  ) {
    unwrap(
      await this.supabase
        .from('status_events')
        .insert({ application_id: applicationId, from_status: from, to_status: to, at }),
    );
  }

  private async currentStatus(id: string): Promise<ApplicationStatus | undefined> {
    const row = unwrap(
      await this.supabase.from('applications').select('status').eq('id', id).maybeSingle(),
    );
    return row?.status as ApplicationStatus | undefined;
  }

  /** Nicht gelöschte Bewerbungen, neueste zuerst */
  async listActive(): Promise<JobApplication[]> {
    const rows = unwrap(
      await this.supabase
        .from('applications')
        .select('*')
        .is('archived_at', null)
        .order('applied_at', { ascending: false })
        .order('created_at', { ascending: false }),
    );
    return (rows ?? []).map(toJobApplication);
  }

  async get(id: string): Promise<JobApplication | undefined> {
    const row = unwrap(
      await this.supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .is('archived_at', null)
        .maybeSingle(),
    );
    return row ? toJobApplication(row) : undefined;
  }

  async create(input: ApplicationInput, now = new Date()): Promise<JobApplication> {
    const id = createId();
    const timestamp = now.toISOString();
    unwrap(
      await this.supabase
        .from('applications')
        .insert({ ...toColumns(input), id, created_at: timestamp, updated_at: timestamp }),
    );
    await this.insertEvent(id, null, input.status, timestamp);
    return { ...input, id };
  }

  /** Speichert alle Felder; ein geänderter Status wird wie bei changeStatus protokolliert */
  async update(id: string, input: ApplicationInput, now = new Date()): Promise<void> {
    const current = await this.currentStatus(id);
    if (!current) return;
    const timestamp = now.toISOString();
    unwrap(await this.supabase.from('applications').update(toColumns(input)).eq('id', id));
    if (current !== input.status) await this.insertEvent(id, current, input.status, timestamp);
  }

  /** Ändert den Status und protokolliert den Wechsel. false, wenn sich nichts ändert. */
  async changeStatus(id: string, to: ApplicationStatus, now = new Date()): Promise<boolean> {
    const current = await this.currentStatus(id);
    if (!current || current === to) return false;
    unwrap(await this.supabase.from('applications').update({ status: to }).eq('id', id));
    await this.insertEvent(id, current, to, now.toISOString());
    return true;
  }

  /** Anzeigentext nachtragen, ohne die übrigen Felder anzufassen */
  async setJobDescription(id: string, text: string): Promise<void> {
    unwrap(
      await this.supabase
        .from('applications')
        .update({ job_description: text.trim() || null })
        .eq('id', id),
    );
  }

  /** Weiches Löschen: Eintrag verschwindet aus allen Listen, lässt sich aber zurückholen */
  async archive(id: string, now = new Date()): Promise<void> {
    unwrap(
      await this.supabase
        .from('applications')
        .update({ archived_at: now.toISOString() })
        .eq('id', id),
    );
  }

  async restore(id: string): Promise<void> {
    unwrap(await this.supabase.from('applications').update({ archived_at: null }).eq('id', id));
  }

  async statusEvents(applicationId: string): Promise<StatusEvent[]> {
    const rows = unwrap(
      await this.supabase
        .from('status_events')
        .select('*')
        .eq('application_id', applicationId)
        .order('at')
        .order('id'),
    );
    return (rows ?? []).map(toStatusEvent);
  }

  /** Alle nicht gelöschten Bewerbungen mit ihrem Verlauf – für die Auswertungen */
  async histories(): Promise<ApplicationHistory[]> {
    const rows = unwrap(
      await this.supabase
        .from('applications')
        .select('*, status_events(*)')
        .is('archived_at', null)
        .order('at', { referencedTable: 'status_events' })
        .order('id', { referencedTable: 'status_events' }),
    );
    return (rows ?? []).map(({ status_events, ...application }) => ({
      application: toJobApplication(application),
      events: status_events.map(toStatusEvent),
    }));
  }
}
