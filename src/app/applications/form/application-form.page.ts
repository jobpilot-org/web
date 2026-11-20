import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  APPLICATION_STATUSES,
  PRIORITIES,
  PRIORITY_LABELS,
  SOURCE_SUGGESTIONS,
  STATUS_LABELS,
  toLocalIsoDate,
  WORK_MODE_LABELS,
  WORK_MODES,
} from '@/domain/application';
import {
  applicationToForm,
  emptyApplicationForm,
  parseApplicationForm,
  type ApplicationFormField,
  type ApplicationFormValues,
} from '@/domain/forms';

import { ApplicationsRepository } from '../../data/applications.repository';

/**
 * Ein Formular für „Neu“ und „Bearbeiten“ wie application-form.tsx der mobile-app. Geprüft wird
 * mit `parseApplicationForm` aus `domain/forms.ts`; Meldungen erscheinen am jeweiligen Feld.
 */
@Component({
  selector: 'app-application-form-page',
  imports: [RouterLink],
  templateUrl: './application-form.page.html',
})
export class ApplicationFormPage {
  /** Aus der Route `bewerbung/:id/bearbeiten`; fehlt beim Anlegen */
  readonly id = input<string>();

  private readonly applications = inject(ApplicationsRepository);
  private readonly router = inject(Router);

  protected readonly values = signal<ApplicationFormValues>(
    emptyApplicationForm(toLocalIsoDate(new Date())),
  );
  protected readonly errors = signal<Partial<Record<ApplicationFormField, string>>>({});
  protected readonly loadState = signal<'loading' | 'ready' | 'missing'>('ready');
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly statuses = APPLICATION_STATUSES;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly workModes = [
    { value: '' as const, label: 'Offen' },
    ...WORK_MODES.map((value) => ({ value, label: WORK_MODE_LABELS[value] })),
  ];
  protected readonly sourceSuggestions = SOURCE_SUGGESTIONS;

  async ngOnInit() {
    const id = this.id();
    if (!id) return;
    this.loadState.set('loading');
    try {
      const application = await this.applications.get(id);
      if (!application) {
        this.loadState.set('missing');
        return;
      }
      this.values.set(applicationToForm(application));
      this.loadState.set('ready');
    } catch {
      this.loadState.set('missing');
    }
  }

  protected set<F extends ApplicationFormField>(field: F, value: ApplicationFormValues[F]) {
    this.values.update((values) => ({ ...values, [field]: value }));
    // Eine korrigierte Eingabe soll nicht weiter als Fehler markiert sein
    if (this.errors()[field]) this.errors.update(({ [field]: _, ...rest }) => rest);
  }

  protected text(event: Event) {
    return (event.target as HTMLInputElement | HTMLTextAreaElement).value;
  }

  protected hasErrors() {
    return Object.keys(this.errors()).length > 0;
  }

  protected cancelLink() {
    const id = this.id();
    return id ? ['/bewerbung', id] : ['/bewerbungen'];
  }

  protected async submit() {
    if (this.isSaving()) return;
    const result = parseApplicationForm(this.values());
    if (!result.ok) {
      this.errors.set(result.errors);
      return;
    }
    this.isSaving.set(true);
    this.saveError.set(null);
    try {
      const id = this.id();
      if (id) {
        await this.applications.update(id, result.value);
        await this.router.navigate(['/bewerbung', id]);
      } else {
        const created = await this.applications.create(result.value);
        // Direkt zur neuen Bewerbung, damit man Kontakte und Termine ergänzen kann
        await this.router.navigate(['/bewerbung', created.id], { replaceUrl: true });
      }
    } catch {
      this.saveError.set('Speichern hat nicht geklappt. Bitte prüfe deine Verbindung.');
    } finally {
      this.isSaving.set(false);
    }
  }
}
