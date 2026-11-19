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
import { DataRevision } from './data-revision';

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
export function unwrap<T>({ data, error }: { data: T; error: unknown }): T {
  if (error) throw error;
  return data;
}

/**
 * Bewerbungen in Supabase – dieselben Operationen wie das Repository der mobile-app, aber
 * asynchron. RLS beschränkt alle Abfragen auf die Zeilen des angemeldeten Nutzers, `user_id`
 * setzt die Datenbank selbst.
 *
 * Den Statusverlauf schreibt ein Trigger in der Datenbank, in derselben Anweisung wie die Änderung;
 * `status_events` ist für die App nur lesbar.
 */
@Injectable({ providedIn: 'root' })
export class ApplicationsRepository {
  private readonly supabase = inject(SUPABASE);
  private readonly revision = inject(DataRevision);

  /** Wie `unwrap`, meldet den Schreibvorgang aber an offene Seiten */
  private written<T>(result: { data: T; error: unknown }): T {
    const data = unwrap(result);
    this.revision.bump();
    return data;
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
    this.written(
      await this.supabase
        .from('applications')
        .insert({ ...toColumns(input), id, created_at: timestamp, updated_at: timestamp }),
    );
    return { ...input, id };
  }

  /** Speichert alle Felder; einen geänderten Status protokolliert die Datenbank */
  async update(id: string, input: ApplicationInput): Promise<void> {
    this.written(await this.supabase.from('applications').update(toColumns(input)).eq('id', id));
  }

  /** Ändert den Status in einer Anweisung. false, wenn sich nichts ändert. */
  async changeStatus(id: string, to: ApplicationStatus): Promise<boolean> {
    const rows = this.written(
      await this.supabase
        .from('applications')
        .update({ status: to })
        .eq('id', id)
        .neq('status', to)
        .select('id'),
    );
    return (rows ?? []).length > 0;
  }

  /** Anzeigentext nachtragen, ohne die übrigen Felder anzufassen */
  async setJobDescription(id: string, text: string): Promise<void> {
    this.written(
      await this.supabase
        .from('applications')
        .update({ job_description: text.trim() || null })
        .eq('id', id),
    );
  }

  /** Weiches Löschen: Eintrag verschwindet aus allen Listen, lässt sich aber zurückholen */
  async archive(id: string, now = new Date()): Promise<void> {
    this.written(
      await this.supabase
        .from('applications')
        .update({ archived_at: now.toISOString() })
        .eq('id', id),
    );
  }

  async restore(id: string): Promise<void> {
    this.written(
      await this.supabase.from('applications').update({ archived_at: null }).eq('id', id),
    );
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
