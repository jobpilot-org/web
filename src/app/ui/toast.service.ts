import { Injectable, signal } from '@angular/core';

export type Toast = { message: string; action?: { label: string; run: () => unknown } };

/** Ein Hinweis über allen Seiten, z. B. „gelöscht – Rückgängig“; verschwindet nach ein paar Sekunden */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private timer: ReturnType<typeof setTimeout> | undefined;
  readonly current = signal<Toast | null>(null);

  show(toast: Toast, durationMs = 6000) {
    clearTimeout(this.timer);
    this.current.set(toast);
    this.timer = setTimeout(() => this.current.set(null), durationMs);
  }

  dismiss() {
    clearTimeout(this.timer);
    this.current.set(null);
  }
}
