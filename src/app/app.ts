import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastOutlet } from './ui/toast';

@Component({
  imports: [RouterOutlet, ToastOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
