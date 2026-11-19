import { Component, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  effectiveDueAt,
  formatDue,
  SNOOZE_DAYS,
  snoozeUntil,
  type ReminderKind,
} from '@/domain/reminders';

import { RemindersRepository, type ReminderWithCompany } from '../data/reminders.repository';

const ICONS: Record<ReminderKind, string> = {
  'follow-up': '↻',
  'appointment-day-before': '◷',
  'appointment-soon': '◷',
  'thank-you': '♡',
  custom: '•',
};

/**
 * Erinnerungen als Zeilen in einer Karte, mit „Erledigt“ und „Später“ – wie reminder-list.tsx.
 * Überfällige Einträge sind hervorgehoben.
 */
@Component({
  selector: 'app-reminder-list',
  imports: [RouterLink],
  template: `
    @for (reminder of reminders(); track reminder.key) {
      <div class="jp-row" [class.overdue]="isOverdue(reminder)">
        <span class="jp-row__icon" aria-hidden="true">{{ icons[reminder.kind] }}</span>
        <span class="jp-row__copy">
          @if (linkToApplication()) {
            <a
              class="jp-row__title title-link"
              [routerLink]="['/bewerbung', reminder.applicationId]"
              >{{ reminder.title }}</a
            >
          } @else {
            <span class="jp-row__title">{{ reminder.title }}</span>
          }
          <span class="jp-row__subtitle">{{ formatDue(reminder) }}</span>
          @if (detail(reminder); as text) {
            <span class="jp-row__subtitle">{{ text }}</span>
          }
        </span>
        <span class="actions">
          <button
            type="button"
            class="action done"
            [disabled]="busy()"
            [attr.aria-label]="reminder.title + ': erledigt'"
            (click)="run(() => repository.markDone(reminder.key))"
          >
            Erledigt
          </button>
          <button
            type="button"
            class="action"
            [disabled]="busy()"
            [attr.aria-label]="reminder.title + ': in ' + snoozeDays + ' Tagen erneut erinnern'"
            (click)="run(() => repository.snooze(reminder.key, snoozeUntil()))"
          >
            Später
          </button>
        </span>
      </div>
    }
    @if (failed()) {
      <p class="jp-error failed" role="alert">
        Das hat nicht geklappt. Bitte versuche es noch einmal.
      </p>
    }
  `,
  styles: `
    .overdue .jp-row__icon {
      background: var(--jp-accent);
      color: var(--jp-on-accent);
    }

    .title-link {
      color: inherit;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .actions {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 6px;
    }

    .action {
      min-width: 76px;
      padding: 5px 10px;
      border: 1px solid var(--jp-background-selected);
      border-radius: 8px;
      background: transparent;
      color: var(--jp-text-secondary);
      font: inherit;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;

      &.done {
        color: var(--jp-accent-text);
      }
    }

    .failed {
      margin: 0;
      padding: 0 15px 11px;
      font-size: 12px;
    }
  `,
})
export class ReminderList {
  readonly reminders = input.required<ReminderWithCompany[]>();
  /** In der Übersicht: Firma bei eigenen Erinnerungen nennen und zur Bewerbung verlinken */
  readonly linkToApplication = input(false);

  protected readonly repository = inject(RemindersRepository);
  protected readonly icons = ICONS;
  protected readonly formatDue = formatDue;
  protected readonly snoozeUntil = snoozeUntil;
  protected readonly snoozeDays = SNOOZE_DAYS;
  protected readonly busy = signal(false);
  protected readonly failed = signal(false);

  protected isOverdue(reminder: ReminderWithCompany) {
    return new Date(effectiveDueAt(reminder)) <= new Date();
  }

  protected detail(reminder: ReminderWithCompany) {
    return [
      reminder.body,
      this.linkToApplication() && reminder.kind === 'custom' ? reminder.company : undefined,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  protected async run(action: () => Promise<unknown>) {
    this.busy.set(true);
    this.failed.set(false);
    try {
      await action();
    } catch {
      this.failed.set(true);
    } finally {
      this.busy.set(false);
    }
  }
}
