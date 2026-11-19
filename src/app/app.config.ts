import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Routenparameter wie `:id` kommen als Inputs in die Seiten
    provideRouter(routes, withComponentInputBinding()),
  ],
};
