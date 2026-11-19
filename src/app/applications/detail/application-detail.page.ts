import { Component, computed, inject, input, resource, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  CLOSED_STATUSES,
  PIPELINE_STATUSES,
  STATUS_LABELS,
  type ApplicationStatus,
} from '@/domain/application';
import { APPOINTMENT_KIND_LABELS, formatAppointmentTime } from '@/domain/details';
import { buildTimeline } from '@/domain/timeline';

import { ApplicationsRepository } from '../../data/applications.repository';
import { reloadOnDataChange } from '../../data/data-revision';
import { DetailsRepository } from '../../data/details.repository';
import { ToastService } from '../../ui/toast.service';
import {
  avatarVariant,
  describeTimelineItem,
  factsOf,
  formatTimelineDate,
  placeLabel,
} from '../presentation';

/** Detailseite einer Bewerbung: Status, Eckdaten, Termine, Kontakte, Notizen und Verlauf */
@Component({
  selector: 'app-application-detail-page',
  imports: [RouterLink],
  templateUrl: './application-detail.page.html',
  styleUrl: './application-detail.page.scss',
})
export class ApplicationDetailPage {
  /** Aus der Route `bewerbung/:id` */
  readonly id = input.required<string>();

  private readonly applications = inject(ApplicationsRepository);
  private readonly details = inject(DetailsRepository);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly detail = resource({
    params: () => ({ id: this.id() }),
    loader: async ({ params: { id } }) => {
      const application = await this.applications.get(id);
      if (!application) return null;
      const [events, contacts, notes, appointments] = await Promise.all([
        this.applications.statusEvents(id),
        this.details.contacts(id),
        this.details.notes(id),
        this.details.appointments(id),
      ]);
      return { application, events, contacts, notes, appointments };
    },
  });

  protected readonly timeline = computed(() => {
    const detail = this.detail.value();
    return detail ? buildTimeline(detail) : [];
  });

  protected readonly statuses = [...PIPELINE_STATUSES, ...CLOSED_STATUSES];
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly appointmentKindLabels = APPOINTMENT_KIND_LABELS;
  protected readonly formatAppointmentTime = formatAppointmentTime;
  protected readonly formatTimelineDate = formatTimelineDate;
  protected readonly describeTimelineItem = describeTimelineItem;
  protected readonly factsOf = factsOf;
  protected readonly placeLabel = placeLabel;
  protected readonly avatarVariant = avatarVariant;

  protected readonly noteDraft = signal('');
  protected readonly isBusy = signal(false);
  protected readonly actionError = signal<string | null>(null);

  constructor() {
    reloadOnDataChange(this.detail);
  }

  /** Führt eine Änderung aus; schlägt sie fehl, erscheint ein Hinweis statt eines stillen Fehlers */
  private async run(action: () => Promise<unknown>) {
    if (this.isBusy()) return;
    this.isBusy.set(true);
    this.actionError.set(null);
    try {
      await action();
    } catch {
      this.actionError.set('Das hat nicht geklappt. Bitte prüfe deine Verbindung.');
    } finally {
      this.isBusy.set(false);
    }
  }

  protected changeStatus(status: ApplicationStatus) {
    return this.run(() => this.applications.changeStatus(this.id(), status));
  }

  protected addNote() {
    const body = this.noteDraft().trim();
    if (!body) return;
    return this.run(async () => {
      await this.details.addNote(this.id(), body);
      this.noteDraft.set('');
    });
  }

  protected deleteNote(id: string) {
    if (!confirm('Notiz löschen?')) return;
    return this.run(() => this.details.deleteNote(id));
  }

  protected remove(company: string) {
    const confirmed = confirm(
      `${company} löschen?\n\nDie Bewerbung verschwindet aus allen Listen. Du kannst das gleich rückgängig machen.`,
    );
    if (!confirmed) return;
    const id = this.id();
    return this.run(async () => {
      await this.applications.archive(id);
      await this.router.navigateByUrl('/');
      this.toasts.show({
        message: `„${company}“ gelöscht`,
        action: { label: 'Rückgängig', run: () => this.applications.restore(id) },
      });
    });
  }
}
