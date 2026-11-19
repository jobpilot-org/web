import { Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  template: `
    @if (toasts.current(); as toast) {
      <div class="toast" role="status">
        <span>{{ toast.message }}</span>
        @if (toast.action; as action) {
          <button type="button" class="secondary" (click)="run(action.run)">
            {{ action.label }}
          </button>
        }
      </div>
    }
  `,
  styles: `
    .toast {
      position: fixed;
      left: 50%;
      bottom: 24px;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 10px 12px 10px 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--background);
      box-shadow: 0 4px 16px rgb(0 0 0 / 0.15);
    }
  `,
})
export class ToastOutlet {
  protected readonly toasts = inject(ToastService);

  protected run(action: () => unknown) {
    this.toasts.dismiss();
    action();
  }
}
