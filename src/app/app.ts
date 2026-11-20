import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth.service';
import { ReminderSyncService } from './reminders/reminder-sync.service';
import { ToastOutlet } from './ui/toast';
import { TopBar } from './ui/top-bar';

@Component({
  imports: [RouterOutlet, ToastOutlet, TopBar],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly auth = inject(AuthService);

  constructor() {
    // Startet den Erinnerungs-Abgleich für die ganze Sitzung
    inject(ReminderSyncService);
  }
}
