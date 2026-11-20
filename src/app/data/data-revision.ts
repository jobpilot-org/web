import { effect, inject, Injectable, signal, untracked } from '@angular/core';

/**
 * Zähler für Schreibvorgänge der Repositories. Seiten laden darauf neu – wie `useLiveData` in der
 * mobile-app, nur ohne Tabellenfilter: Änderungen kommen hier selten und einzeln.
 */
@Injectable({ providedIn: 'root' })
export class DataRevision {
  private readonly value = signal(0);
  readonly current = this.value.asReadonly();

  bump() {
    this.value.update((value) => value + 1);
  }
}

/**
 * Lädt eine Resource nach jedem Schreibvorgang neu. `reload()` behält den bisherigen Wert bis zur
 * Antwort, die Seite flackert also nicht. Nur im Injection Context aufrufen.
 */
export function reloadOnDataChange(target: { reload(): boolean }) {
  const revision = inject(DataRevision);
  let initial = true;
  effect(() => {
    revision.current();
    if (initial) {
      initial = false;
      return;
    }
    untracked(() => target.reload());
  });
}
