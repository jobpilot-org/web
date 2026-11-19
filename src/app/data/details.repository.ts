import { inject, Injectable } from '@angular/core';

import { createId } from '@/domain/application';
import type {
  Appointment,
  AppointmentInput,
  AppointmentKind,
  Contact,
  ContactInput,
  Note,
  UpcomingAppointment,
} from '@/domain/details';

import type { Database } from '../core/database.types';
import { SUPABASE } from '../core/supabase';
import { DataRevision } from './data-revision';
import { toIsoTimestamp, unwrap } from './applications.repository';

type Tables = Database['public']['Tables'];

export function toContact(row: Tables['contacts']['Row']): Contact {
  return {
    id: row.id,
    applicationId: row.application_id,
    name: row.name,
    role: row.role ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
  };
}

export function toNote(row: Tables['notes']['Row']): Note {
  return {
    id: row.id,
    applicationId: row.application_id,
    body: row.body,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export function toAppointment(row: Tables['appointments']['Row']): Appointment {
  return {
    id: row.id,
    applicationId: row.application_id,
    // Die Check-Constraints der Migration lassen nur die Werte aus `domain/` zu
    kind: row.kind as AppointmentKind,
    startsAt: toIsoTimestamp(row.starts_at),
    location: row.location ?? undefined,
    notes: row.notes ?? undefined,
  };
}

/** Kontakte, Notizen und Termine einer Bewerbung – dieselbe API wie in der mobile-app, asynchron */
@Injectable({ providedIn: 'root' })
export class DetailsRepository {
  private readonly supabase = inject(SUPABASE);
  private readonly revision = inject(DataRevision);

  /** Wie `unwrap`, meldet den Schreibvorgang aber an offene Seiten */
  private written<T>(result: { data: T; error: unknown }): T {
    const data = unwrap(result);
    this.revision.bump();
    return data;
  }

  // --- Kontakte ---

  async contacts(applicationId: string): Promise<Contact[]> {
    const rows = unwrap(
      await this.supabase
        .from('contacts')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at'),
    );
    return (rows ?? []).map(toContact);
  }

  async contact(id: string): Promise<Contact | undefined> {
    const row = unwrap(await this.supabase.from('contacts').select('*').eq('id', id).maybeSingle());
    return row ? toContact(row) : undefined;
  }

  /** Legt an (ohne id) oder überschreibt (mit id) */
  async saveContact(
    applicationId: string,
    input: ContactInput,
    id?: string,
    now = new Date(),
  ): Promise<string> {
    const values = {
      name: input.name,
      role: input.role ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      linkedin_url: input.linkedinUrl ?? null,
    };
    if (id) {
      this.written(await this.supabase.from('contacts').update(values).eq('id', id));
      return id;
    }
    const newId = createId();
    this.written(
      await this.supabase.from('contacts').insert({
        ...values,
        id: newId,
        application_id: applicationId,
        created_at: now.toISOString(),
      }),
    );
    return newId;
  }

  async deleteContact(id: string): Promise<void> {
    this.written(await this.supabase.from('contacts').delete().eq('id', id));
  }

  // --- Notizen ---

  /** Neueste zuerst */
  async notes(applicationId: string): Promise<Note[]> {
    const rows = unwrap(
      await this.supabase
        .from('notes')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false }),
    );
    return (rows ?? []).map(toNote);
  }

  async addNote(applicationId: string, body: string, now = new Date()): Promise<string> {
    const id = createId();
    this.written(
      await this.supabase.from('notes').insert({
        id,
        application_id: applicationId,
        body: body.trim(),
        created_at: now.toISOString(),
      }),
    );
    return id;
  }

  async deleteNote(id: string): Promise<void> {
    this.written(await this.supabase.from('notes').delete().eq('id', id));
  }

  // --- Termine ---

  /** Früheste zuerst */
  async appointments(applicationId: string): Promise<Appointment[]> {
    const rows = unwrap(
      await this.supabase
        .from('appointments')
        .select('*')
        .eq('application_id', applicationId)
        .order('starts_at'),
    );
    return (rows ?? []).map(toAppointment);
  }

  async appointment(id: string): Promise<Appointment | undefined> {
    const row = unwrap(
      await this.supabase.from('appointments').select('*').eq('id', id).maybeSingle(),
    );
    return row ? toAppointment(row) : undefined;
  }

  /** Legt an (ohne id) oder überschreibt (mit id) */
  async saveAppointment(
    applicationId: string,
    input: AppointmentInput,
    id?: string,
    now = new Date(),
  ): Promise<string> {
    const values = {
      kind: input.kind,
      starts_at: input.startsAt,
      location: input.location ?? null,
      notes: input.notes ?? null,
    };
    if (id) {
      this.written(await this.supabase.from('appointments').update(values).eq('id', id));
      return id;
    }
    const newId = createId();
    this.written(
      await this.supabase.from('appointments').insert({
        ...values,
        id: newId,
        application_id: applicationId,
        created_at: now.toISOString(),
      }),
    );
    return newId;
  }

  async deleteAppointment(id: string): Promise<void> {
    this.written(await this.supabase.from('appointments').delete().eq('id', id));
  }

  // --- Termine über alle Bewerbungen ---

  /** Termine aller nicht gelöschten Bewerbungen im Zeitraum [from, to), früheste zuerst */
  async upcomingAppointments(from: Date, to: Date): Promise<UpcomingAppointment[]> {
    const rows = unwrap(
      await this.supabase
        .from('appointments')
        .select('*, applications!inner(company, role, archived_at)')
        .is('applications.archived_at', null)
        .gte('starts_at', from.toISOString())
        .lt('starts_at', to.toISOString())
        .order('starts_at'),
    );
    return (rows ?? []).map(({ applications, ...row }) => ({
      ...toAppointment(row),
      company: applications.company,
      role: applications.role,
    }));
  }

  /** Frühester anstehender Termin je Bewerbung – für Sortierung und Listenzeilen */
  async nextAppointmentByApplication(now = new Date()): Promise<Map<string, string>> {
    const rows = unwrap(
      await this.supabase
        .from('appointments')
        .select('application_id, starts_at')
        .gte('starts_at', now.toISOString())
        .order('starts_at'),
    );
    const next = new Map<string, string>();
    for (const row of rows ?? []) {
      if (!next.has(row.application_id)) {
        next.set(row.application_id, toIsoTimestamp(row.starts_at));
      }
    }
    return next;
  }
}
