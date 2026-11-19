import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../core/auth.service';
import { DataRevision } from '../data/data-revision';
import { RemindersRepository } from '../data/reminders.repository';
import { ReminderSyncService } from './reminder-sync.service';

describe('ReminderSyncService', () => {
  afterEach(() => vi.useRealTimers());

  function setup(session: unknown) {
    vi.useFakeTimers();
    const reconcile = vi.fn(async () => false);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { session: signal(session) } },
        { provide: RemindersRepository, useValue: { reconcile } },
      ],
    });
    TestBed.inject(ReminderSyncService);
    TestBed.tick();
    return { reconcile, revision: TestBed.inject(DataRevision) };
  }

  it('gleicht beim Start und gebündelt nach Änderungen ab', async () => {
    const { reconcile, revision } = setup({ user: {} });
    await vi.advanceTimersByTimeAsync(500);
    expect(reconcile).toHaveBeenCalledTimes(1);

    revision.bump();
    TestBed.tick();
    revision.bump();
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(500);
    expect(reconcile).toHaveBeenCalledTimes(2);
  });

  it('gleicht ohne Anmeldung nicht ab', async () => {
    const { reconcile } = setup(null);
    await vi.advanceTimersByTimeAsync(500);
    expect(reconcile).not.toHaveBeenCalled();
  });
});
