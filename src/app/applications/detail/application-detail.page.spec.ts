import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import type { JobApplication } from '@/domain/application';

import { ApplicationsRepository } from '../../data/applications.repository';
import { DetailsRepository } from '../../data/details.repository';
import { RemindersRepository } from '../../data/reminders.repository';
import { ApplicationDetailPage } from './application-detail.page';

const application: JobApplication = {
  id: 'a1',
  company: 'Acme',
  role: 'Entwicklerin',
  location: 'Berlin',
  workMode: 'hybrid',
  appliedAt: '2026-11-01',
  status: 'applied',
  priority: 'high',
  nextStep: 'Unterlagen schicken',
};

async function render({ found }: { found: JobApplication | undefined } = { found: application }) {
  const applications = {
    get: vi.fn(async () => found),
    statusEvents: vi.fn(async () => [
      { from: null, to: 'applied' as const, at: '2026-11-01T08:00:00.000Z' },
    ]),
    changeStatus: vi.fn(async () => true),
    archive: vi.fn(async () => undefined),
  };
  const details = {
    contacts: vi.fn(async () => [{ id: 'c1', applicationId: 'a1', name: 'Kim Muster' }]),
    notes: vi.fn(async () => []),
    appointments: vi.fn(async () => []),
    addNote: vi.fn(async () => 'n1'),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: ApplicationsRepository, useValue: applications },
      { provide: DetailsRepository, useValue: details },
      { provide: RemindersRepository, useValue: { forApplication: vi.fn(async () => []) } },
    ],
  });
  const fixture = TestBed.createComponent(ApplicationDetailPage);
  fixture.componentRef.setInput('id', 'a1');
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, element: fixture.nativeElement as HTMLElement, applications, details };
}

describe('ApplicationDetailPage', () => {
  it('zeigt Kopf, nächsten Schritt, Kontakte und Verlauf', async () => {
    const { element } = await render();
    expect(element.querySelector('h1')?.textContent).toContain('Acme');
    expect(element.textContent).toContain('Berlin · Hybrid');
    expect(element.textContent).toContain('Unterlagen schicken');
    expect(element.textContent).toContain('Kim Muster');
    expect(element.textContent).toContain('Angelegt als „Beworben“');
  });

  it('markiert den aktuellen Status und ändert ihn per Klick', async () => {
    const { element, applications } = await render();
    const chips = [
      ...element.querySelectorAll<HTMLButtonElement>('[role="group"][aria-label="Status"] button'),
    ];
    expect(
      chips.find((chip) => chip.getAttribute('aria-pressed') === 'true')?.textContent,
    ).toContain('Beworben');
    chips.find((chip) => chip.textContent?.includes('Screening'))!.click();
    expect(applications.changeStatus).toHaveBeenCalledWith('a1', 'screening');
  });

  it('speichert eine Notiz ohne Leerraum am Rand', async () => {
    const { fixture, element, details } = await render();
    const textarea = element.querySelector('textarea')!;
    textarea.value = '  Rückruf am Montag  ';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector<HTMLFormElement>('.note-form')!.dispatchEvent(new Event('submit'));
    expect(details.addNote).toHaveBeenCalledWith('a1', 'Rückruf am Montag');
  });

  it('meldet eine unbekannte Bewerbung als nicht gefunden', async () => {
    const { element } = await render({ found: undefined });
    expect(element.querySelector('h1')?.textContent).toContain('Nicht gefunden');
  });
});
