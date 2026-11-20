import type { ApplicationInput } from '@/domain/application';

import type { Database } from '../core/database.types';
import {
  toColumns,
  toIsoTimestamp,
  toJobApplication,
  toStatusEvent,
} from './applications.repository';

type ApplicationRow = Database['public']['Tables']['applications']['Row'];

const row: ApplicationRow = {
  id: 'app-1',
  user_id: '11111111-1111-1111-1111-111111111111',
  company: 'Acme',
  role: 'Entwicklerin',
  location: 'Berlin',
  work_mode: 'hybrid',
  applied_at: '2026-11-01',
  status: 'interview',
  priority: 'high',
  source: null,
  job_url: null,
  salary_min: 60000,
  salary_max: null,
  next_step: null,
  job_description: null,
  created_at: '2026-11-01T08:00:00+00:00',
  updated_at: '2026-11-02T08:00:00+00:00',
  archived_at: null,
};

describe('toIsoTimestamp', () => {
  it('wandelt das Postgres-Format in das ISO-Format der Domain um', () => {
    expect(toIsoTimestamp('2026-11-19T17:16:22.36+00:00')).toBe('2026-11-19T17:16:22.360Z');
    expect(toIsoTimestamp('2026-11-25T10:00:00+01:00')).toBe('2026-11-25T09:00:00.000Z');
  });
});

describe('toJobApplication', () => {
  it('übernimmt die Felder und lässt leere Spalten weg', () => {
    expect(toJobApplication(row)).toEqual({
      id: 'app-1',
      company: 'Acme',
      role: 'Entwicklerin',
      location: 'Berlin',
      workMode: 'hybrid',
      appliedAt: '2026-11-01',
      status: 'interview',
      priority: 'high',
      salaryMin: 60000,
      source: undefined,
      jobUrl: undefined,
      salaryMax: undefined,
      nextStep: undefined,
      jobDescription: undefined,
    });
  });

  it('enthält keine Spalten, die nur die Datenbank kennt', () => {
    const application = toJobApplication(row);
    expect(application).not.toHaveProperty('user_id');
    expect(application).not.toHaveProperty('created_at');
    expect(application).not.toHaveProperty('archived_at');
  });
});

describe('toColumns', () => {
  it('leert fehlende optionale Felder ausdrücklich', () => {
    const input: ApplicationInput = {
      company: 'Acme',
      role: 'Dev',
      location: 'Berlin',
      appliedAt: '2026-11-01',
      status: 'applied',
      priority: 'normal',
    };
    expect(toColumns(input)).toEqual({
      company: 'Acme',
      role: 'Dev',
      location: 'Berlin',
      work_mode: null,
      applied_at: '2026-11-01',
      status: 'applied',
      priority: 'normal',
      source: null,
      job_url: null,
      salary_min: null,
      salary_max: null,
      next_step: null,
      job_description: null,
    });
  });

  it('ergibt zusammen mit toJobApplication wieder die Eingabe', () => {
    const { id: _id, ...input } = toJobApplication(row);
    expect(toJobApplication({ ...row, ...toColumns(input) })).toEqual(toJobApplication(row));
  });
});

describe('toStatusEvent', () => {
  it('übernimmt Status und normalisiert den Zeitpunkt', () => {
    expect(
      toStatusEvent({
        id: 1,
        user_id: row.user_id,
        application_id: 'app-1',
        from_status: null,
        to_status: 'applied',
        at: '2026-11-01T08:00:00+00:00',
      }),
    ).toEqual({ from: null, to: 'applied', at: '2026-11-01T08:00:00.000Z' });
  });
});
