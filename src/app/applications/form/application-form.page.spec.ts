import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { ApplicationsRepository } from '../../data/applications.repository';
import { application, settle } from '../../testing/fixtures';
import { ApplicationFormPage } from './application-form.page';

async function render(id?: string) {
  const repository = {
    get: vi.fn(async () => application({ salaryMin: 70000 })),
    create: vi.fn(async (input) => ({ ...input, id: 'new-id' })),
    update: vi.fn(async () => undefined),
  };
  TestBed.configureTestingModule({
    providers: [provideRouter([]), { provide: ApplicationsRepository, useValue: repository }],
  });
  const router = TestBed.inject(Router);
  const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
  const fixture = TestBed.createComponent(ApplicationFormPage);
  if (id) fixture.componentRef.setInput('id', id);
  await settle(fixture);
  const element = fixture.nativeElement as HTMLElement;
  const input = (label: string) =>
    [...element.querySelectorAll('label.jp-field')]
      .find((field) => field.querySelector('.jp-field__label')?.textContent?.trim() === label)!
      .querySelector<HTMLInputElement>('input, textarea')!;
  const type = (label: string, value: string) => {
    const field = input(label);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const submit = async () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    await settle(fixture);
  };
  return { fixture, element, input, type, submit, repository, navigate };
}

describe('ApplicationFormPage', () => {
  it('meldet fehlende Pflichtfelder am Feld und speichert nicht', async () => {
    const { element, submit, repository } = await render();
    await submit();
    expect(element.textContent).toContain('Bitte das Unternehmen angeben');
    expect(element.textContent).toContain('Bitte die Position angeben');
    expect(element.textContent).toContain('Bitte prüfe die markierten Felder.');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('legt eine Bewerbung an und öffnet sie', async () => {
    const { fixture, element, type, submit, repository, navigate } = await render();
    type('Unternehmen', '  Nordlicht  ');
    type('Position', 'Dev');
    [...element.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
      .find((b) => b.textContent?.trim() === 'Hoch')!
      .click();
    fixture.detectChanges();
    type('Gehalt von (€/Jahr)', '70.000');
    await submit();
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        company: 'Nordlicht',
        role: 'Dev',
        priority: 'high',
        salaryMin: 70000,
      }),
    );
    expect(navigate).toHaveBeenCalledWith(['/bewerbung', 'new-id'], { replaceUrl: true });
  });

  it('lädt beim Bearbeiten die Werte und speichert sie zurück', async () => {
    const { input, submit, repository } = await render('a1');
    expect(input('Unternehmen').value).toBe('Acme');
    expect(input('Gehalt von (€/Jahr)').value).toBe('70.000');
    await submit();
    expect(repository.update).toHaveBeenCalledWith(
      'a1',
      expect.objectContaining({ company: 'Acme', salaryMin: 70000 }),
    );
  });

  it('prüft, dass „bis“ nicht kleiner als „von“ ist', async () => {
    const { element, type, submit, repository } = await render('a1');
    type('bis (€/Jahr)', '50.000');
    await submit();
    expect(element.textContent).toContain('Darf nicht kleiner als „von“ sein');
    expect(repository.update).not.toHaveBeenCalled();
  });
});
