import type { JobApplication } from '@/domain/application';

/** Beispiel-Bewerbungen für Komponententests */
export function application(overrides: Partial<JobApplication> = {}): JobApplication {
  return {
    id: 'a1',
    company: 'Acme',
    role: 'Entwicklerin',
    location: 'Berlin',
    appliedAt: '2026-11-01',
    status: 'applied',
    priority: 'normal',
    ...overrides,
  };
}

/** Wartet, bis Resources geladen und die Ansicht aktualisiert ist */
export async function settle(fixture: { whenStable(): Promise<unknown>; detectChanges(): void }) {
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}
