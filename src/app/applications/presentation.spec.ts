import type { JobApplication } from '@/domain/application';

import { describeTimelineItem, factsOf, placeLabel } from './presentation';

const application: JobApplication = {
  id: 'a1',
  company: 'Acme',
  role: 'Dev',
  location: 'Berlin',
  appliedAt: '2026-11-01',
  status: 'applied',
  priority: 'high',
};

describe('placeLabel', () => {
  it('verbindet Ort und Arbeitsmodell', () => {
    expect(placeLabel({ ...application, workMode: 'hybrid' })).toBe('Berlin · Hybrid');
  });

  it('doppelt nichts, wenn der Ort schon das Arbeitsmodell ist', () => {
    expect(placeLabel({ ...application, location: 'Remote', workMode: 'remote' })).toBe('Remote');
  });

  it('zeigt nur das Arbeitsmodell ohne Ort', () => {
    expect(placeLabel({ ...application, location: '', workMode: 'onsite' })).toBe('Vor Ort');
  });
});

describe('factsOf', () => {
  it('lässt leere Angaben weg', () => {
    expect(factsOf(application).map((fact) => fact.label)).toEqual(['Beworben am', 'Priorität']);
  });

  it('nennt bei „Gemerkt“ das Merkdatum und kürzt den Anzeigen-Link', () => {
    const facts = factsOf({
      ...application,
      status: 'saved',
      source: 'LinkedIn',
      salaryMin: 60000,
      jobUrl: 'https://www.example.com/job/1',
    });
    expect(facts.map((fact) => fact.label)).toEqual([
      'Gemerkt am',
      'Priorität',
      'Quelle',
      'Gehalt',
      'Stellenanzeige',
    ]);
    expect(facts.at(-1)).toEqual({
      label: 'Stellenanzeige',
      value: 'example.com/job/1',
      url: 'https://www.example.com/job/1',
    });
  });
});

describe('describeTimelineItem', () => {
  const at = '2026-11-01T08:00:00.000Z';

  it('beschreibt Anlegen und Statuswechsel', () => {
    expect(
      describeTimelineItem({ kind: 'status', at, event: { from: null, to: 'applied', at } }),
    ).toBe('Angelegt als „Beworben“');
    expect(
      describeTimelineItem({ kind: 'status', at, event: { from: 'applied', to: 'interview', at } }),
    ).toBe('Status: Beworben → Fachgespräch');
  });

  it('zeigt von Notizen nur die erste Zeile', () => {
    const note = { id: 'n1', applicationId: 'a1', body: 'Erste Zeile\nZweite', createdAt: at };
    expect(describeTimelineItem({ kind: 'note', at, note })).toBe('Notiz: Erste Zeile');
  });

  it('unterscheidet geplante und vergangene Termine', () => {
    const appointment = { id: 't1', applicationId: 'a1', kind: 'video' as const, startsAt: at };
    expect(describeTimelineItem({ kind: 'appointment', at, appointment, upcoming: true })).toBe(
      'Geplant: Video-Call',
    );
    expect(describeTimelineItem({ kind: 'appointment', at, appointment, upcoming: false })).toBe(
      'Termin: Video-Call',
    );
  });
});
