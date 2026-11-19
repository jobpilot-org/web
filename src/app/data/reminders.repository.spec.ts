import type { JobApplication } from '@/domain/application';
import { DEFAULT_REMINDER_SETTINGS } from '@/domain/reminders';

import { parseReminderSettings, reminderChanges, toReminder } from './reminders.repository';

describe('parseReminderSettings', () => {
  it('nutzt ohne gespeicherte Werte die Standards', () => {
    expect(parseReminderSettings(new Map())).toEqual(DEFAULT_REMINDER_SETTINGS);
  });

  it('liest gespeicherte Werte und fängt kaputte ab', () => {
    expect(
      parseReminderSettings(
        new Map([
          ['reminders.followUpDays', '7'],
          ['reminders.appointments', 'off'],
          ['reminders.thankYou', 'on'],
        ]),
      ),
    ).toEqual({ followUpDays: 7, appointments: false, thankYou: true });
    expect(parseReminderSettings(new Map([['reminders.followUpDays', 'abc']])).followUpDays).toBe(
      DEFAULT_REMINDER_SETTINGS.followUpDays,
    );
  });
});

describe('toReminder', () => {
  it('normalisiert Zeitpunkte und lässt leere Spalten weg', () => {
    expect(
      toReminder({
        user_id: 'u',
        key: 'follow-up:a1',
        application_id: 'a1',
        kind: 'follow-up',
        due_at: '2026-11-20T09:00:00+01:00',
        title: 'Nachhaken bei Acme?',
        body: '',
        done_at: null,
        snoozed_until: null,
        created_at: '2026-11-19T08:00:00+00:00',
      }),
    ).toEqual({
      key: 'follow-up:a1',
      applicationId: 'a1',
      kind: 'follow-up',
      dueAt: '2026-11-20T08:00:00.000Z',
      title: 'Nachhaken bei Acme?',
      body: '',
      doneAt: undefined,
      snoozedUntil: undefined,
    });
  });
});

describe('reminderChanges', () => {
  const application: JobApplication & { createdAt: string } = {
    id: 'a1',
    company: 'Acme',
    role: 'Dev',
    location: 'Berlin',
    appliedAt: '2026-10-01',
    status: 'applied',
    priority: 'normal',
    createdAt: '2026-10-01T08:00:00.000Z',
  };

  it('plant ohne Statusereignis ab dem Anlegen ein Nachhaken', () => {
    const changes = reminderChanges({
      applications: [application],
      appointments: [],
      settings: DEFAULT_REMINDER_SETTINGS,
      stored: [],
      now: new Date('2026-11-19T12:00:00Z'),
    });
    expect(changes.insert.map((reminder) => reminder.kind)).toEqual(['follow-up']);
    expect(changes.remove).toEqual([]);
  });

  it('ändert nichts, wenn schon alles gespeichert ist', () => {
    const now = new Date('2026-11-19T12:00:00Z');
    const input = {
      applications: [application],
      appointments: [],
      settings: DEFAULT_REMINDER_SETTINGS,
      now,
    };
    const first = reminderChanges({ ...input, stored: [] });
    const second = reminderChanges({ ...input, stored: first.insert });
    expect(second).toEqual({ insert: [], update: [], remove: [] });
  });
});
