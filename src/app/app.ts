import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { ToastOutlet } from './ui/toast';
import { TopBar } from './ui/top-bar';

@Component({
  imports: [RouterOutlet, ToastOutlet, TopBar],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);
}
