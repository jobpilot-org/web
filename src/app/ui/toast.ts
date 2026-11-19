import { Component, inject } from '@angular/core';

import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast',
  template: `
    @if (toasts.current(); as toast) {
      <div class="jp-toast" role="status">
        <span>{{ toast.message }}</span>
        @if (toast.action; as action) {
          <button
            type="button"
            class="jp-button jp-button--secondary jp-button--compact"
            (click)="run(action.run)"
          >
            {{ action.label }}
          </button>
        }
      </div>
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
