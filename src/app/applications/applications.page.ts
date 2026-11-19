import { Component, inject, resource } from '@angular/core';
import { RouterLink } from '@angular/router';

import { STATUS_LABELS } from '@/domain/application';

import { ApplicationsRepository } from '../data/applications.repository';
import { reloadOnDataChange } from '../data/data-revision';
import { avatarVariant, formatShortDay, placeLabel } from './presentation';

/** Alle laufenden Bewerbungen des angemeldeten Nutzers – aufgebaut wie der Tab „Bewerbungen“ */
@Component({
  selector: 'app-applications-page',
  imports: [RouterLink],
  templateUrl: './applications.page.html',
  styleUrl: './applications.page.scss',
})
export class ApplicationsPage {
  private readonly repository = inject(ApplicationsRepository);

  protected readonly applications = resource({ loader: () => this.repository.listActive() });
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly placeLabel = placeLabel;
  protected readonly formatShortDay = formatShortDay;
  protected readonly avatarVariant = avatarVariant;

  constructor() {
    reloadOnDataChange(this.applications);
  }
}
