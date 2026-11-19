import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ApplicationsRepository } from '../data/applications.repository';
import { DetailsRepository } from '../data/details.repository';
import { RemindersRepository } from '../data/reminders.repository';
import { application, settle } from '../testing/fixtures';
import { OverviewPage } from './overview.page';

async function render({
  applications = [] as ReturnType<typeof application>[],
  upcoming = [] as unknown[],
} = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: ApplicationsRepository,
        useValue: { listActive: vi.fn(async () => applications) },
      },
      {
        provide: DetailsRepository,
        useValue: { upcomingAppointments: vi.fn(async () => upcoming) },
      },
      { provide: RemindersRepository, useValue: { open: vi.fn(async () => []) } },
    ],
  });
  const fixture = TestBed.createComponent(OverviewPage);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

describe('OverviewPage', () => {
  it('lädt ohne Bewerbungen zum Anlegen der ersten ein', async () => {
    const element = await render();
    expect(element.querySelector('.focus-title')?.textContent).toContain(
      'Deine Pipeline ist noch leer.',
    );
    expect(element.querySelector('.focus-link')?.getAttribute('href')).toBe('/bewerbung/neu');
  });

  it('zählt laufende Bewerbungen und Gespräche zweistellig', async () => {
    const element = await render({
      applications: [
        application({ id: 'a1', status: 'applied' }),
        application({ id: 'a2', status: 'interview' }),
      ],
    });
    const values = [...element.querySelectorAll('.metric-value')].map((n) => n.textContent);
    expect(values).toEqual(['02', '01', '00']);
    expect(element.querySelector('.metric')?.getAttribute('href')).toBe(
      '/bewerbungen?filter=active',
    );
  });

  it('stellt den nächsten Termin in den Fokus, sonst den nächsten Schritt', async () => {
    const withAppointment = await render({
      applications: [application()],
      upcoming: [
        {
          id: 't1',
          applicationId: 'a1',
          kind: 'video',
          startsAt: '2030-01-01T09:00:00.000Z',
          company: 'Acme',
          role: 'Dev',
        },
      ],
    });
    expect(withAppointment.querySelector('.focus-title')?.textContent).toContain(
      'Acme: Video-Call',
    );
    TestBed.resetTestingModule();
    const withNextStep = await render({
      applications: [
        application({ id: 'a1', company: 'Low', nextStep: 'Später' }),
        application({ id: 'a2', company: 'High', priority: 'high', nextStep: 'Anrufen' }),
      ],
    });
    expect(withNextStep.querySelector('.focus-title')?.textContent).toContain('High');
    expect(withNextStep.querySelector('.focus-text')?.textContent).toContain('Anrufen');
  });
});
