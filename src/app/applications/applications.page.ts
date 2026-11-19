import { Component, computed, effect, inject, input, resource, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  countByFilter,
  FILTER_LABELS,
  filterApplications,
  isSortOrder,
  isStatusFilter,
  SORT_LABELS,
  SORT_ORDERS,
  sortApplications,
  STATUS_FILTERS,
  type SortOrder,
  type StatusFilter,
} from '@/domain/application';

import { ApplicationsRepository } from '../data/applications.repository';
import { reloadOnDataChange } from '../data/data-revision';
import { DetailsRepository } from '../data/details.repository';
import { SettingsRepository } from '../data/settings.repository';
import { ApplicationRow } from './application-row';
import { Board } from './board';

type View = 'list' | 'board';

/** Ab dieser Breite gibt es das Board – wie BOARD_MIN_WIDTH in der mobile-app */
const BOARD_MIN_WIDTH = 900;

/** Tab „Bewerbungen“ wie in der mobile-app: Suche, Filter, Sortierung, Liste oder Board */
@Component({
  selector: 'app-applications-page',
  imports: [RouterLink, ApplicationRow, Board],
  templateUrl: './applications.page.html',
  styleUrl: './applications.page.scss',
})
export class ApplicationsPage {
  /** `?filter=…` aus den Kennzahlen der Übersicht – hat Vorrang vor der gespeicherten Auswahl */
  readonly linkedFilter = input<string>(undefined, { alias: 'filter' });

  private readonly applicationsRepository = inject(ApplicationsRepository);
  private readonly details = inject(DetailsRepository);
  private readonly settings = inject(SettingsRepository);

  protected readonly data = resource({
    loader: async () => {
      const [applications, nextAppointments] = await Promise.all([
        this.applicationsRepository.listActive(),
        this.details.nextAppointmentByApplication(),
      ]);
      return { applications, nextAppointments };
    },
  });

  /** Gespeicherte Auswahl wie in der mobile-app – einmal beim Öffnen gelesen */
  private readonly saved = resource({ loader: () => this.settings.all() });

  protected readonly query = signal('');
  protected readonly filter = signal<StatusFilter>('all');
  protected readonly sort = signal<SortOrder>('newest');
  protected readonly view = signal<View>('list');
  protected readonly isWide = signal(this.matchesWide());

  protected readonly showBoard = computed(() => this.isWide() && this.view() === 'board');
  protected readonly counts = computed(() => countByFilter(this.data.value()?.applications ?? []));
  protected readonly visible = computed(() => {
    const data = this.data.value();
    if (!data) return [];
    return sortApplications(
      filterApplications(data.applications, {
        filter: this.showBoard() ? 'all' : this.filter(),
        query: this.query(),
      }),
      this.sort(),
      data.nextAppointments,
    );
  });

  protected readonly filters = STATUS_FILTERS;
  protected readonly filterLabels = FILTER_LABELS;
  protected readonly sortOrders = SORT_ORDERS;
  protected readonly sortLabels = SORT_LABELS;

  constructor() {
    reloadOnDataChange(this.data);

    let restored = false;
    effect(() => {
      const stored = this.saved.value();
      if (!stored || restored) return;
      restored = true;
      const filter = stored.get('applications.filter');
      const sort = stored.get('applications.sort');
      const view = stored.get('applications.view');
      const linked = this.linkedFilter();
      if (isStatusFilter(linked)) this.filter.set(linked);
      else if (isStatusFilter(filter)) this.filter.set(filter);
      if (isSortOrder(sort)) this.sort.set(sort);
      if (view === 'list' || view === 'board') this.view.set(view);
    });

    // Ein neuer Link aus der Übersicht, während die Liste schon offen ist
    effect(() => {
      const linked = this.linkedFilter();
      if (isStatusFilter(linked)) this.filter.set(linked);
    });

    if (typeof matchMedia === 'function') {
      const media = matchMedia(`(min-width: ${BOARD_MIN_WIDTH}px)`);
      media.addEventListener('change', (event) => this.isWide.set(event.matches));
    }
  }

  private matchesWide() {
    return (
      typeof matchMedia === 'function' && matchMedia(`(min-width: ${BOARD_MIN_WIDTH}px)`).matches
    );
  }

  protected setFilter(filter: StatusFilter) {
    this.filter.set(filter);
    void this.settings.set('applications.filter', filter).catch(() => undefined);
  }

  protected setSort(sort: SortOrder) {
    this.sort.set(sort);
    void this.settings.set('applications.sort', sort).catch(() => undefined);
  }

  protected setView(view: View) {
    this.view.set(view);
    void this.settings.set('applications.view', view).catch(() => undefined);
  }
}
