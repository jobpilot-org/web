import { Component, computed, inject, resource, signal } from '@angular/core';

import { STATUS_LABELS } from '@/domain/application';
import { bySource, funnel, responseStats, weeklyActivity } from '@/domain/insights';

import { ApplicationsRepository } from '../data/applications.repository';
import { reloadOnDataChange } from '../data/data-revision';

const formatDays = (days: number) =>
  `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(days)} ${days === 1 ? 'Tag' : 'Tage'}`;

const CHART_HEIGHT = 120;

const percent = (share: number) => `${Math.round(share * 100)} %`;

/**
 * Tab „Auswertung“ wie (tabs)/auswertung.tsx und features/insights/charts.tsx: Diagramme ohne
 * Bibliothek, eine Balkenfarbe, Werte in Textfarbe, dezente Hilfslinien.
 */
@Component({
  selector: 'app-insights-page',
  templateUrl: './insights.page.html',
  styleUrl: './insights.page.scss',
})
export class InsightsPage {
  private readonly applications = inject(ApplicationsRepository);

  protected readonly histories = resource({ loader: () => this.applications.histories() });

  protected readonly stats = computed(() => {
    const histories = this.histories.value();
    if (!histories) return undefined;
    const stages = funnel(histories);
    const responses = responseStats(histories);
    const weeks = weeklyActivity(histories);
    return {
      stages,
      maxStage: Math.max(1, ...stages.map((stage) => stage.count)),
      responses,
      sources: bySource(histories),
      weeks,
      // Saubere Obergrenze für die Achse: 1, 2, 5, 10, 20 …
      top:
        [1, 2, 5, 10, 20, 50, 100].find(
          (step) => step >= Math.max(1, ...weeks.map((week) => week.count)),
        ) ?? Math.max(...weeks.map((week) => week.count)),
      offers: stages.find((stage) => stage.stage === 'offer')?.count ?? 0,
    };
  });

  /** Gewählte Woche im Wochen-Diagramm; null = aktuelle Woche */
  protected readonly selectedWeek = signal<number | null>(null);

  protected readonly statusLabels = STATUS_LABELS;
  protected readonly percent = percent;
  protected readonly formatDays = formatDays;

  constructor() {
    reloadOnDataChange(this.histories);
  }

  /** Höhe einer Wochensäule im 120 px hohen Diagramm; kleine Werte bleiben sichtbar */
  protected barHeight(count: number, top: number) {
    return count ? Math.max(4, (count / top) * CHART_HEIGHT) : 0;
  }

  protected weekIndex(weeks: unknown[]) {
    return this.selectedWeek() ?? weeks.length - 1;
  }
}
