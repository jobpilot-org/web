import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

/** Tabs wie in der mobile-app: Übersicht, Bewerbungen, Auswertung, Einstellungen */
export const routes: Routes = [
  {
    path: 'anmelden',
    title: 'Anmelden – jobpilot',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Übersicht – jobpilot',
        loadComponent: () => import('./overview/overview.page').then((m) => m.OverviewPage),
      },
      {
        path: 'bewerbungen',
        title: 'Bewerbungen – jobpilot',
        loadComponent: () =>
          import('./applications/applications.page').then((m) => m.ApplicationsPage),
      },
      {
        path: 'auswertung',
        title: 'Auswertung – jobpilot',
        loadComponent: () => import('./insights/insights.page').then((m) => m.InsightsPage),
      },
      {
        path: 'einstellungen',
        title: 'Einstellungen – jobpilot',
        loadComponent: () => import('./settings/settings.page').then((m) => m.SettingsPage),
      },
      {
        path: 'bewerbung/neu',
        title: 'Neue Bewerbung – jobpilot',
        loadComponent: () =>
          import('./applications/form/application-form.page').then((m) => m.ApplicationFormPage),
      },
      {
        path: 'bewerbung/:id/bearbeiten',
        title: 'Bewerbung bearbeiten – jobpilot',
        loadComponent: () =>
          import('./applications/form/application-form.page').then((m) => m.ApplicationFormPage),
      },
      {
        path: 'bewerbung/:id/kontakt',
        title: 'Kontakt – jobpilot',
        loadComponent: () =>
          import('./applications/form/contact-form.page').then((m) => m.ContactFormPage),
      },
      {
        path: 'bewerbung/:id/termin',
        title: 'Termin – jobpilot',
        loadComponent: () =>
          import('./applications/form/appointment-form.page').then((m) => m.AppointmentFormPage),
      },
      {
        path: 'bewerbung/:id',
        title: 'Bewerbung – jobpilot',
        loadComponent: () =>
          import('./applications/detail/application-detail.page').then(
            (m) => m.ApplicationDetailPage,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
