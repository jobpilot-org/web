import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApplicationsRepository } from '../data/applications.repository';
import { DetailsRepository } from '../data/details.repository';
import { SettingsRepository } from '../data/settings.repository';
import { application, settle } from '../testing/fixtures';
import { ApplicationsPage } from './applications.page';

async function render({
  stored = new Map<string, string>(),
  filter,
}: { stored?: Map<string, string>; filter?: string } = {}) {
  const settings = { all: vi.fn(async () => stored), set: vi.fn(async () => undefined) };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: ApplicationsRepository,
        useValue: {
          listActive: vi.fn(async () => [
            application({ id: 'a1', company: 'Acme', status: 'applied', appliedAt: '2026-11-01' }),
            application({
              id: 'a2',
              company: 'Globex',
              status: 'interview',
              priority: 'high',
              appliedAt: '2026-10-01',
            }),
            application({
              id: 'a3',
              company: 'Initech',
              status: 'saved',
              source: 'LinkedIn',
              appliedAt: '2026-11-05',
            }),
          ]),
        },
      },
      {
        provide: DetailsRepository,
        useValue: {
          nextAppointmentByApplication: vi.fn(
            async () => new Map([['a2', '2026-11-25T09:00:00.000Z']]),
          ),
        },
      },
      { provide: SettingsRepository, useValue: settings },
    ],
  });
  const fixture = TestBed.createComponent(ApplicationsPage);
  if (filter) fixture.componentRef.setInput('filter', filter);
  await settle(fixture);
  const element = fixture.nativeElement as HTMLElement;
  const companies = () =>
    [...element.querySelectorAll('app-application-row .company')].map((node) =>
      node.textContent?.replace('●', '').trim(),
    );
  const chip = (label: string) =>
    [...element.querySelectorAll<HTMLButtonElement>('[aria-label="Filter"] button')].find((b) =>
      b.textContent?.includes(label),
    )!;
  return { fixture, element, companies, chip, settings };
}

describe('ApplicationsPage', () => {
  it('zeigt alle Bewerbungen, neueste zuerst, mit Anzahl je Filter', async () => {
    const { companies, chip } = await render();
    expect(companies()).toEqual(['Initech', 'Acme', 'Globex']);
    expect(chip('Laufend').textContent).toContain('2');
    expect(chip('Gemerkt').textContent).toContain('1');
  });

  it('filtert per Chip und merkt sich die Auswahl', async () => {
    const { fixture, companies, chip, settings } = await render();
    chip('Gespräche').click();
    fixture.detectChanges();
    expect(companies()).toEqual(['Globex']);
    expect(settings.set).toHaveBeenCalledWith('applications.filter', 'interviewing');
  });

  it('sucht in Firma, Position, Ort und Quelle', async () => {
    const { fixture, element, companies } = await render();
    const input = element.querySelector<HTMLInputElement>('input[type="search"]')!;
    input.value = 'linkedin';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(companies()).toEqual(['Initech']);
  });

  it('sortiert nach nächstem Termin', async () => {
    const { fixture, element, companies } = await render();
    [...element.querySelectorAll<HTMLButtonElement>('.sort-option')]
      .find((b) => b.textContent?.includes('Nächster Termin'))!
      .click();
    fixture.detectChanges();
    expect(companies()[0]).toBe('Globex');
  });

  it('übernimmt gespeicherte Auswahl, ein Link aus der Übersicht hat Vorrang', async () => {
    const saved = await render({ stored: new Map([['applications.filter', 'saved']]) });
    expect(saved.companies()).toEqual(['Initech']);
    TestBed.resetTestingModule();
    const linked = await render({
      stored: new Map([['applications.filter', 'saved']]),
      filter: 'offer',
    });
    expect(linked.element.textContent).toContain('Nichts gefunden');
  });
});
