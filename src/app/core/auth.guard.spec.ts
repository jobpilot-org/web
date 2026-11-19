import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
} from '@angular/router';
import type { Session } from '@supabase/supabase-js';

import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

function runGuard(session: Session | null, url = '/') {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: { ready: Promise.resolve(), session: signal(session) } },
    ],
  });
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
  );
}

describe('authGuard', () => {
  it('lässt mit Session durch', async () => {
    expect(await runGuard({ user: { email: 'a@b.de' } } as Session)).toBe(true);
  });

  it('schickt ohne Session zur Anmeldung und merkt sich das Ziel', async () => {
    const result = await runGuard(null, '/bewerbung/1');
    const router = TestBed.inject(Router);
    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/anmelden?weiter=%2Fbewerbung%2F1',
    );
  });
});
