import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'anmelden',
    title: 'Anmelden – jobpilot',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    title: 'Bewerbungen – jobpilot',
    canActivate: [authGuard],
    loadComponent: () => import('./applications/applications.page').then((m) => m.ApplicationsPage),
  },
  {
    path: 'bewerbung/:id',
    title: 'Bewerbung – jobpilot',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./applications/detail/application-detail.page').then((m) => m.ApplicationDetailPage),
  },
  { path: '**', redirectTo: '' },
];
