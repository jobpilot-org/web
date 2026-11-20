import {
  formatSalary,
  fromLocalIsoDate,
  PRIORITY_LABELS,
  STATUS_LABELS,
  WORK_MODE_LABELS,
  type JobApplication,
} from '@/domain/application';
import { APPOINTMENT_KIND_LABELS } from '@/domain/details';
import type { TimelineItem } from '@/domain/timeline';

// Anzeigetexte wie in der mobile-app (application-row, detail/facts, detail/sections)

/** Ort und Arbeitsmodell, ohne Dopplung wie „Remote · Remote“ */
export function placeLabel(application: JobApplication): string | undefined {
  const mode = application.workMode ? WORK_MODE_LABELS[application.workMode] : undefined;
  if (!application.location) return mode;
  if (!mode || application.location.toLowerCase() === mode.toLowerCase()) {
    return application.location;
  }
  return `${application.location} · ${mode}`;
}

export const formatDay = (day: string) =>
  new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    fromLocalIsoDate(day),
  );

/** Kurzes Datum in Listen, z. B. „9. Okt.“ */
export const formatShortDay = (day: string) =>
  new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short' }).format(
    fromLocalIsoDate(day),
  );

/** Avatar-Farbe 0–3 nach dem ersten Buchstaben der Firma, wie AvatarColors in der mobile-app */
export function avatarVariant(company: string): number {
  return (company.charCodeAt(0) || 0) % 4;
}

export const formatTimelineDate = (at: string) =>
  new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(at),
  );

export type Fact = { label: string; value: string; url?: string };

/** Eckdaten als Liste aus Bezeichnung und Wert; leere Angaben entfallen */
export function factsOf(application: JobApplication): Fact[] {
  const salary = formatSalary(application.salaryMin, application.salaryMax);
  return [
    {
      label: application.status === 'saved' ? 'Gemerkt am' : 'Beworben am',
      value: formatDay(application.appliedAt),
    },
    { label: 'Priorität', value: PRIORITY_LABELS[application.priority] },
    ...(application.source ? [{ label: 'Quelle', value: application.source }] : []),
    ...(salary ? [{ label: 'Gehalt', value: salary }] : []),
    ...(application.jobUrl
      ? [
          {
            label: 'Stellenanzeige',
            value: application.jobUrl.replace(/^https?:\/\/(www\.)?/, ''),
            url: application.jobUrl,
          },
        ]
      : []),
  ];
}

export function describeTimelineItem(item: TimelineItem): string {
  switch (item.kind) {
    case 'status':
      return item.event.from
        ? `Status: ${STATUS_LABELS[item.event.from]} → ${STATUS_LABELS[item.event.to]}`
        : `Angelegt als „${STATUS_LABELS[item.event.to]}“`;
    case 'note':
      return `Notiz: ${item.note.body.split('\n')[0]}`;
    case 'appointment':
      return `${item.upcoming ? 'Geplant' : 'Termin'}: ${APPOINTMENT_KIND_LABELS[item.appointment.kind]}`;
  }
}
