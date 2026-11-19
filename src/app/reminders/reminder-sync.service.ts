import { DestroyRef, effect, inject, Injectable } from '@angular/core';

import { AuthService } from '../core/auth.service';
import { DataRevision } from '../data/data-revision';
import { RemindersRepository } from '../data/reminders.repository';

const HOUR = 60 * 60 * 1000;
/** Mehrere Änderungen kurz hintereinander lösen nur einen Abgleich aus */
const DEBOUNCE_MS = 400;

/**
 * Hält die Erinnerungen aktuell, solange jemand angemeldet ist (ADR 3 der mobile-app): Abgleich
 * beim Start, nach Datenänderungen und stündlich – Fristen verstreichen auch ohne Änderung.
 * Der Abgleich meldet nur bei echten Änderungen eine neue Revision; der folgende Lauf findet dann
 * nichts mehr, es entsteht keine Schleife.
 */
@Injectable({ providedIn: 'root' })
export class ReminderSyncService {
  private readonly auth = inject(AuthService);
  private readonly revision = inject(DataRevision);
  private readonly reminders = inject(RemindersRepository);

  private timer: ReturnType<typeof setTimeout> | undefined;
  private running = false;
  private pending = false;

  constructor() {
    effect(() => {
      this.revision.current();
      if (this.auth.session()) this.schedule();
    });
    const hourly = setInterval(() => {
      if (this.auth.session()) this.schedule();
    }, HOUR);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(hourly);
      clearTimeout(this.timer);
    });
  }

  private schedule() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.reconcile(), DEBOUNCE_MS);
  }

  private async reconcile() {
    if (this.running) {
      this.pending = true;
      return;
    }
    this.running = true;
    try {
      await this.reminders.reconcile();
    } catch {
      // Offline o. Ä.: beim nächsten Anlass erneut versuchen
    } finally {
      this.running = false;
      if (this.pending) {
        this.pending = false;
        this.schedule();
      }
    }
  }
}
