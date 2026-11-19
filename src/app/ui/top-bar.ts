import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../core/auth.service';

/**
 * Kopfzeile wie in der Web-Version der mobile-app (app-tabs.web.tsx): Wortmarke links, daneben
 * die Bereiche. Nur Bereiche, die es in der web-app schon gibt, erscheinen als Tab.
 */
@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="jp-topbar">
      <nav class="jp-topbar__inner" aria-label="Hauptnavigation">
        <a class="jp-brand" routerLink="/">jobpilot<span class="jp-brand__dot">.</span></a>
        <a
          class="jp-tab"
          routerLink="/"
          routerLinkActive="is-active"
          [routerLinkActiveOptions]="{ exact: false }"
          ariaCurrentWhenActive="page"
          >Bewerbungen</a
        >
        <button
          type="button"
          class="jp-button jp-button--secondary jp-button--compact account"
          [title]="auth.email() ?? ''"
          (click)="auth.signOut()"
        >
          Abmelden
        </button>
      </nav>
    </header>
  `,
  styles: `
    .account {
      margin-left: 10px;
    }
  `,
})
export class TopBar {
  protected readonly auth = inject(AuthService);
}
