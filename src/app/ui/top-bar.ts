import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';

type Tab = { path: string; label: string; also?: string };

const TABS: Tab[] = [
  { path: '/', label: 'Übersicht' },
  // Detailseite und Formulare (/bewerbung/…) gehören zum Tab „Bewerbungen“
  { path: '/bewerbungen', label: 'Bewerbungen', also: '/bewerbung/' },
  { path: '/auswertung', label: 'Auswertung' },
  { path: '/einstellungen', label: 'Einstellungen' },
];

/** Pfad ohne Query und Fragment, z. B. „/bewerbungen?filter=offer“ → „/bewerbungen“ */
const pathOf = (url: string) => url.split(/[?#]/)[0];

/** Ist `tab` für die URL aktiv? Übersicht nur exakt, sonst auch Unterseiten */
export function isTabActive(tab: Tab, url: string) {
  const path = pathOf(url);
  if (tab.path === '/') return path === '/';
  return (
    path === tab.path ||
    path.startsWith(`${tab.path}/`) ||
    (tab.also !== undefined && path.startsWith(tab.also))
  );
}

/** Kopfzeile wie in der Web-Version der mobile-app (app-tabs.web.tsx): Wortmarke, dann die Tabs */
@Component({
  selector: 'app-top-bar',
  imports: [RouterLink],
  template: `
    <header class="jp-topbar">
      <nav class="jp-topbar__inner" aria-label="Hauptnavigation">
        <a class="jp-brand" routerLink="/">jobpilot<span class="jp-brand__dot">.</span></a>
        @for (tab of tabs; track tab.path) {
          @let active = isTabActive(tab, url());
          <a
            class="jp-tab"
            [class.is-active]="active"
            [attr.aria-current]="active ? 'page' : null"
            [routerLink]="tab.path"
            >{{ tab.label }}</a
          >
        }
      </nav>
    </header>
  `,
})
export class TopBar {
  private readonly router = inject(Router);

  /** Aktuelle URL als Signal, damit die Markierung nach jeder Navigation neu berechnet wird */
  protected readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly tabs = TABS;
  protected readonly isTabActive = isTabActive;
}
