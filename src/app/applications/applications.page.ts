import { Component, inject, resource } from '@angular/core';

import { formatSalary, STATUS_LABELS } from '@/domain/application';

import { AuthService } from '../core/auth.service';
import { ApplicationsRepository } from '../data/applications.repository';

/** Erste Ansicht: alle laufenden Bewerbungen des angemeldeten Nutzers */
@Component({
  selector: 'app-applications-page',
  templateUrl: './applications.page.html',
  styleUrl: './applications.page.scss',
})
export class ApplicationsPage {
  protected readonly auth = inject(AuthService);
  private readonly repository = inject(ApplicationsRepository);

  protected readonly applications = resource({ loader: () => this.repository.listActive() });
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly formatSalary = formatSalary;
}
