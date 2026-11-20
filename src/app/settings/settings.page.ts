import { Component, inject, resource, signal } from '@angular/core';

import { toCsv } from '@/domain/csv';
import { FOLLOW_UP_OPTIONS, type ReminderSettings } from '@/domain/reminders';

import { AuthService } from '../core/auth.service';
import { ApplicationsRepository } from '../data/applications.repository';
import { RemindersRepository } from '../data/reminders.repository';

/**
 * Tab „Einstellungen“ wie (tabs)/einstellungen.tsx: Konto, Erinnerungen, Daten sichern.
 * KI-Assistent und Backup kommen, sobald es sie in der web-app gibt.
 */
@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  styleUrl: './settings.page.scss',
})
export class SettingsPage {
  protected readonly auth = inject(AuthService);
  private readonly reminders = inject(RemindersRepository);
  private readonly applications = inject(ApplicationsRepository);

  protected readonly settings = resource({ loader: () => this.reminders.settings() });
  protected readonly followUpOptions = FOLLOW_UP_OPTIONS;
  protected readonly message = signal<string | null>(null);
  protected readonly isBusy = signal(false);

  private async run(action: () => Promise<unknown>, failure: string) {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    this.message.set(null);
    try {
      await action();
    } catch {
      this.message.set(failure);
    } finally {
      this.isBusy.set(false);
    }
  }

  protected save(change: Partial<ReminderSettings>) {
    const current = this.settings.value();
    if (!current) return;
    const next = { ...current, ...change };
    // Sofort anzeigen; schlägt das Speichern fehl, gilt wieder der gespeicherte Stand
    this.settings.set(next);
    return this.run(async () => {
      try {
        await this.reminders.saveSettings(next);
      } catch (error) {
        this.settings.reload();
        throw error;
      }
    }, 'Speichern hat nicht geklappt. Bitte prüfe deine Verbindung.');
  }

  protected signOut() {
    if (
      !confirm('Abmelden?\n\nDu landest wieder auf der Anmeldung. Deine Daten bleiben gespeichert.')
    )
      return;
    return this.run(async () => {
      const error = await this.auth.signOut();
      if (error) throw error;
    }, 'Abmelden hat nicht geklappt. Bitte prüfe deine Verbindung und versuche es noch einmal.');
  }

  /** CSV für Excel oder Numbers – Format aus `domain/csv.ts` */
  protected exportCsv() {
    return this.run(async () => {
      const csv = toCsv(await this.applications.listActive());
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `jobpilot-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'Der Export hat nicht geklappt.');
  }
}
