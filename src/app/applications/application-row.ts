import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { STATUS_LABELS, type JobApplication } from '@/domain/application';
import { formatAppointmentTime } from '@/domain/details';

import { avatarVariant, formatShortDay, placeLabel } from './presentation';

/** Zeile einer Bewerbung wie application-row.tsx: Avatar, Firma, Rolle · Ort, Status, Termin */
@Component({
  selector: 'app-application-row',
  imports: [RouterLink],
  template: `
    @let item = application();
    <a class="row" [routerLink]="['/bewerbung', item.id]" [attr.aria-label]="label()">
      <span class="jp-avatar jp-avatar--{{ avatar() }}" aria-hidden="true">{{
        item.company.charAt(0).toUpperCase()
      }}</span>
      <span class="details">
        <span class="title-line">
          <span class="company">
            @if (item.priority === 'high') {
              <span class="priority" aria-hidden="true">● </span>
            }
            {{ item.company }}
          </span>
          <span class="date">{{ formatShortDay(item.appliedAt) }}</span>
        </span>
        <span class="role">{{ subtitle() }}</span>
        <span class="badges">
          <span class="jp-status-badge" [attr.data-status]="item.status">
            <span class="jp-status-dot"></span>
            {{ statusLabels[item.status] }}
          </span>
          @if (nextAppointment(); as next) {
            <span class="appointment">{{ formatAppointmentTime(next) }}</span>
          }
        </span>
      </span>
    </a>
  `,
  styles: `
    .row {
      display: flex;
      align-items: center;
      gap: 13px;
      min-height: 88px;
      padding: 13px 0;
      border-bottom: 1px solid var(--jp-border);
      color: inherit;
      text-decoration: none;

      &:hover {
        opacity: 0.75;
      }
    }

    .details {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }

    .title-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .company {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      font-size: 15px;
      line-height: 20px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .priority {
      color: var(--jp-accent-text);
    }

    .date {
      color: var(--jp-text-secondary);
      font-size: 11px;
      line-height: 16px;
    }

    .role {
      overflow: hidden;
      color: var(--jp-text-secondary);
      font-size: 12px;
      line-height: 17px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badges {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .appointment {
      overflow: hidden;
      color: var(--jp-accent-text);
      font-size: 11px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class ApplicationRow {
  readonly application = input.required<JobApplication>();
  /** ISO-Zeitpunkt des nächsten Termins, falls vorhanden */
  readonly nextAppointment = input<string>();

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly formatShortDay = formatShortDay;
  protected readonly formatAppointmentTime = formatAppointmentTime;

  protected readonly avatar = computed(() => avatarVariant(this.application().company));
  protected readonly subtitle = computed(() =>
    [this.application().role, placeLabel(this.application())].filter(Boolean).join(' · '),
  );
  protected readonly label = computed(() => {
    const item = this.application();
    const next = this.nextAppointment();
    return [
      item.company,
      item.role,
      `Status ${STATUS_LABELS[item.status]}`,
      item.priority === 'high' ? 'hohe Priorität' : undefined,
      next ? `Termin ${formatAppointmentTime(next)}` : undefined,
    ]
      .filter(Boolean)
      .join(', ');
  });
}
