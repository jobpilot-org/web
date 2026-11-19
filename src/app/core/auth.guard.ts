import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';

import { AuthService } from './auth.service';

/** Ohne Session geht es zur Anmeldung, danach zurück zur gewünschten Seite */
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.ready;
  if (auth.session()) return true;
  return router.createUrlTree(['/anmelden'], { queryParams: { weiter: state.url } });
};
