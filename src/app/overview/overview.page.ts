import { Component, computed, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { countByFilter, matchesFilter, type StatusFilter } from '@/domain/application';
import { APPOINTMENT_KIND_LABELS, formatAppointmentTime } from '@/domain/details';
import { dueToday } from '@/domain/reminders';

import { ApplicationRow } from '../applications/application-row';
import { ApplicationsRepository } from '../data/applications.repository';
import { reloadOnDataChange } from '../data/data-revision';
import { DetailsRepository } from '../data/details.repository';
import { RemindersRepository } from '../data/reminders.repository';
import { ReminderList } from '../reminders/reminder-list';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const METRICS: { filter: StatusFilter; label: string }[] = [
  { filter: 'active', label: 'Laufend' },
  { filter: 'interviewing', label: 'Gespräche' },
  { filter: 'offer', label: 'Angebote' },
];

/** Tab „Übersicht“ wie (tabs)/index.tsx der mobile-app */
@Component({
  selector: 'app-overview-page',
  imports: [RouterLink, ApplicationRow, ReminderList],
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.scss',
})
export class OverviewPage {
  private readonly applications = inject(ApplicationsRepository);
  private readonly details = inject(DetailsRepository);
  private readonly reminders = inject(RemindersRepository);

  protected readonly data = resource({
    loader: async () => {
      const now = new Date();
      const [applications, upcoming, open] = await Promise.all([
        this.applications.listActive(),
        this.details.upcomingAppointments(now, new Date(now.getTime() + WEEK_MS)),
        this.reminders.open(),
      ]);
      return { applications, upcoming, due: dueToday(open, now) };
    },
  });

  protected readonly metrics = METRICS;
  protected readonly kindLabels = APPOINTMENT_KIND_LABELS;
  protected readonly formatAppointmentTime = formatAppointmentTime;
  protected readonly greetingDate = new Intl.DateTimeFormat('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  protected readonly counts = computed(() => countByFilter(this.data.value()?.applications ?? []));

  /** Hinweis im Fokus-Panel: nächster Termin, sonst wichtigste Bewerbung mit nächstem Schritt */
  protected readonly focus = computed(() => {
    const data = this.data.value();
    if (!data) return undefined;
    if (data.applications.length === 0) {
      return {
        eyebrow: 'Los geht’s',
        title: 'Deine Pipeline ist noch leer.',
        text: 'Leg deine erste Bewerbung an.',
        link: ['/bewerbung/neu'],
        linkLabel: 'Erste Bewerbung anlegen',
        icon: '✦',
      };
    }
    const next = data.upcoming[0];
    if (next) {
      return {
        eyebrow: 'Nächster Termin',
        title: `${next.company}: ${APPOINTMENT_KIND_LABELS[next.kind]}`,
        text: formatAppointmentTime(next.startsAt),
        link: ['/bewerbung', next.applicationId],
        linkLabel: 'Bewerbung öffnen',
        icon: '◷',
      };
    }
    const focus = data.applications
      .filter((a) => a.nextStep && !matchesFilter(a.status, 'closed'))
      .sort((a, b) => Number(b.priority === 'high') - Number(a.priority === 'high'))[0];
    if (focus) {
      return {
        eyebrow: 'Dein nächster Schritt',
        title: focus.company,
        text: focus.nextStep ?? '',
        link: ['/bewerbung', focus.id],
        linkLabel: 'Bewerbung öffnen',
        icon: '✦',
      };
    }
    return {
      eyebrow: 'Guter Moment',
      title: 'Zeit für die nächste Bewerbung.',
      text: 'Keine offenen Termine oder Aufgaben – alles im Griff.',
      link: ['/bewerbung/neu'],
      linkLabel: 'Bewerbung anlegen',
      icon: '✦',
    };
  });

  constructor() {
    reloadOnDataChange(this.data);
  }
}
