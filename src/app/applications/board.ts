import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  PIPELINE_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
  type JobApplication,
} from '@/domain/application';
import { formatAppointmentTime } from '@/domain/details';

/** Spalten wie kanban-board.tsx: je Pipeline-Status eine, Endzustände zusammen */
export const BOARD_COLUMNS: { key: string; title: string; statuses: ApplicationStatus[] }[] = [
  ...PIPELINE_STATUSES.map((status) => ({
    key: status,
    title: STATUS_LABELS[status],
    statuses: [status],
  })),
  { key: 'closed', title: 'Abgeschlossen', statuses: ['rejected', 'withdrawn'] },
];

/** Board-Ansicht auf breiten Bildschirmen: eine Spalte je Status */
@Component({
  selector: 'app-board',
  imports: [RouterLink],
  template: `
    <div class="board">
      @for (column of columns(); track column.key) {
        <section
          class="column"
          [attr.data-status]="column.statuses[0]"
          [attr.aria-label]="column.title"
        >
          <header class="column-header">
            <span class="dot" aria-hidden="true"></span>
            <h3>{{ column.title }}</h3>
            <span class="count">{{ column.cards.length }}</span>
          </header>
          @for (card of column.cards; track card.id) {
            <a class="card" [routerLink]="['/bewerbung', card.id]">
              <span class="company">
                @if (card.priority === 'high') {
                  <span class="priority" aria-hidden="true">● </span>
                }
                {{ card.company }}
              </span>
              <span class="role">{{ card.role }}</span>
              @if (nextAppointments().get(card.id); as next) {
                <span class="meta">{{ formatAppointmentTime(next) }}</span>
              }
            </a>
          }
        </section>
      }
    </div>
  `,
  styles: `
    .board {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 16px;
    }

    .column {
      display: flex;
      flex: none;
      flex-direction: column;
      gap: 8px;
      width: 232px;
      padding: 10px;
      border-radius: 14px;
      background: var(--jp-background-selected);
    }

    .column-header {
      display: flex;
      align-items: center;
      gap: 7px;
      padding: 4px;

      h3 {
        flex: 1;
        margin: 0;
        color: var(--jp-text);
        font-size: 13px;
        font-weight: 700;
      }
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: var(--jp-status-dot);
    }

    .count {
      color: var(--jp-text-secondary);
      font-size: 12px;
      font-variant-numeric: tabular-nums;
    }

    .card {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 11px;
      border: 1px solid var(--jp-border);
      border-radius: 10px;
      background: var(--jp-background-element);
      color: var(--jp-text);
      text-decoration: none;

      &:hover {
        opacity: 0.75;
      }
    }

    .company {
      font-size: 14px;
      font-weight: 600;
    }

    .priority {
      color: var(--jp-accent-text);
    }

    .role {
      color: var(--jp-text-secondary);
      font-size: 12px;
      line-height: 17px;
    }

    .meta {
      margin-top: 3px;
      color: var(--jp-accent-text);
      font-size: 11px;
      font-weight: 600;
    }
  `,
})
export class Board {
  readonly applications = input.required<JobApplication[]>();
  readonly nextAppointments = input<ReadonlyMap<string, string>>(new Map());

  protected readonly formatAppointmentTime = formatAppointmentTime;
  protected readonly columns = computed(() =>
    BOARD_COLUMNS.map((column) => ({
      ...column,
      cards: this.applications().filter((card) => column.statuses.includes(card.status)),
    })),
  );
}
