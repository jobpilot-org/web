import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { DEFAULT_REMINDER_SETTINGS } from '@/domain/reminders';

import { AuthService } from '../core/auth.service';
import { ApplicationsRepository } from '../data/applications.repository';
import { RemindersRepository } from '../data/reminders.repository';
import { settle } from '../testing/fixtures';
import { SettingsPage } from './settings.page';

async function render(saveSettings = vi.fn(async () => undefined)) {
  const signOut = vi.fn(async () => null);
  TestBed.configureTestingModule({
    providers: [
      {
        provide: AuthService,
        useValue: { email: signal('test@jobpilot.local'), signOut },
      },
      {
        provide: RemindersRepository,
        useValue: { settings: vi.fn(async () => DEFAULT_REMINDER_SETTINGS), saveSettings },
      },
      { provide: ApplicationsRepository, useValue: { listActive: vi.fn(async () => []) } },
    ],
  });
  const fixture = TestBed.createComponent(SettingsPage);
  await settle(fixture);
  return { fixture, element: fixture.nativeElement as HTMLElement, saveSettings, signOut };
}

describe('SettingsPage', () => {
  it('zeigt das Konto und meldet nach Rückfrage ab', async () => {
    const { element, signOut } = await render();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    expect(element.textContent).toContain('test@jobpilot.local');
    [...element.querySelectorAll<HTMLButtonElement>('button')]
      .find((b) => b.textContent?.trim() === 'Abmelden')!
      .click();
    expect(signOut).toHaveBeenCalled();
  });

  it('speichert Nachhaken-Abstand und Schalter', async () => {
    const { fixture, element, saveSettings } = await render();
    [...element.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
      .find((b) => b.textContent?.trim() === '14 Tage')!
      .click();
    await settle(fixture);
    expect(saveSettings).toHaveBeenLastCalledWith({
      ...DEFAULT_REMINDER_SETTINGS,
      followUpDays: 14,
    });

    const thankYou = element.querySelectorAll<HTMLInputElement>('input[role="switch"]')[1];
    thankYou.click();
    await settle(fixture);
    expect(saveSettings).toHaveBeenLastCalledWith({
      ...DEFAULT_REMINDER_SETTINGS,
      followUpDays: 14,
      thankYou: false,
    });
  });

  it('meldet, wenn das Speichern scheitert', async () => {
    const { fixture, element } = await render(
      vi.fn(async () => Promise.reject(new Error('offline'))),
    );
    element.querySelector<HTMLInputElement>('input[role="switch"]')!.click();
    await settle(fixture);
    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Speichern hat nicht geklappt',
    );
  });
});
