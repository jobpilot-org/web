import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { DetailsRepository } from '../../data/details.repository';
import { settle } from '../../testing/fixtures';
import { AppointmentFormPage, toDateTimeLocal } from './appointment-form.page';
import { ContactFormPage } from './contact-form.page';

function setup() {
  const details = {
    contact: vi.fn(async () => ({ id: 'c1', applicationId: 'a1', name: 'Kim', role: 'HR' })),
    saveContact: vi.fn(async () => 'c1'),
    deleteContact: vi.fn(async () => undefined),
    appointment: vi.fn(async () => ({
      id: 't1',
      applicationId: 'a1',
      kind: 'video' as const,
      startsAt: '2026-11-25T09:00:00.000Z',
    })),
    saveAppointment: vi.fn(async () => 't1'),
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: DetailsRepository, useValue: details }],
  });
  const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  return { details, navigate };
}

function fieldInput(element: HTMLElement, label: string) {
  return [...element.querySelectorAll('label.jp-field')]
    .find((field) => field.querySelector('.jp-field__label')?.textContent?.trim() === label)!
    .querySelector<HTMLInputElement>('input, textarea')!;
}

describe('ContactFormPage', () => {
  it('prüft die E-Mail-Adresse und speichert erst dann', async () => {
    const { details, navigate } = setup();
    const fixture = TestBed.createComponent(ContactFormPage);
    fixture.componentRef.setInput('id', 'a1');
    await settle(fixture);
    const element = fixture.nativeElement as HTMLElement;
    for (const [label, value] of [
      ['Name', 'Kim Muster'],
      ['E-Mail', 'kein-at'],
    ]) {
      const input = fieldInput(element, label);
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(element.textContent).toContain('Bitte eine gültige E-Mail-Adresse eingeben');
    expect(details.saveContact).not.toHaveBeenCalled();

    const email = fieldInput(element, 'E-Mail');
    email.value = 'kim@acme.example';
    email.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(details.saveContact).toHaveBeenCalledWith(
      'a1',
      { name: 'Kim Muster', email: 'kim@acme.example' },
      undefined,
    );
    expect(navigate).toHaveBeenCalledWith(['/bewerbung', 'a1']);
  });

  it('lädt beim Bearbeiten den Kontakt und kann ihn löschen', async () => {
    const { details } = setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const fixture = TestBed.createComponent(ContactFormPage);
    fixture.componentRef.setInput('id', 'a1');
    fixture.componentRef.setInput('kontaktId', 'c1');
    await settle(fixture);
    const element = fixture.nativeElement as HTMLElement;
    expect(fieldInput(element, 'Name').value).toBe('Kim');
    [...element.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.includes('Kontakt löschen'))!
      .click();
    await settle(fixture);
    expect(details.deleteContact).toHaveBeenCalledWith('c1');
  });
});

describe('AppointmentFormPage', () => {
  it('wandelt Zeitpunkte für datetime-local in lokale Zeit', () => {
    const date = new Date(2026, 10, 25, 10, 30);
    expect(toDateTimeLocal(date)).toBe('2026-11-25T10:30');
  });

  it('meldet ein unvollständiges Datum auf Deutsch', async () => {
    const { details } = setup();
    const fixture = TestBed.createComponent(AppointmentFormPage);
    fixture.componentRef.setInput('id', 'a1');
    await settle(fixture);
    const element = fixture.nativeElement as HTMLElement;
    const when = fieldInput(element, 'Wann');
    when.value = '';
    when.dispatchEvent(new Event('input'));
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(element.textContent).toContain('Bitte Datum und Uhrzeit wählen');
    expect(details.saveAppointment).not.toHaveBeenCalled();
  });

  it('speichert Art und Zeitpunkt eines bestehenden Termins', async () => {
    const { details } = setup();
    const fixture = TestBed.createComponent(AppointmentFormPage);
    fixture.componentRef.setInput('id', 'a1');
    fixture.componentRef.setInput('terminId', 't1');
    await settle(fixture);
    const element = fixture.nativeElement as HTMLElement;
    [...element.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
      .find((b) => b.textContent?.trim() === 'Vor Ort')!
      .click();
    fixture.detectChanges();
    expect(fieldInput(element, 'Adresse')).toBeTruthy();
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
    expect(details.saveAppointment).toHaveBeenCalledWith(
      'a1',
      { kind: 'onsite', startsAt: '2026-11-25T09:00:00.000Z' },
      't1',
    );
  });
});
