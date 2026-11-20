import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { APPOINTMENT_KIND_LABELS, APPOINTMENT_KINDS } from '@/domain/details';
import {
  appointmentToForm,
  emptyAppointmentForm,
  parseAppointmentForm,
  type AppointmentFormField,
  type AppointmentFormValues,
} from '@/domain/forms';

import { DetailsRepository } from '../../data/details.repository';

/** Wert für `<input type="datetime-local">` in lokaler Zeit */
export function toDateTimeLocal(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/** Termin anlegen oder bearbeiten – wie bewerbung/[id]/termin.tsx der mobile-app */
@Component({
  selector: 'app-appointment-form-page',
  imports: [RouterLink],
  template: `
    <main class="jp-page">
      <form class="jp-form" novalidate (submit)="$event.preventDefault(); save()">
        <header class="jp-page-header form-header">
          <div class="jp-page-header__copy">
            <p class="jp-eyebrow">Termin</p>
            <h1 class="jp-title">{{ terminId() ? 'Termin bearbeiten' : 'Neuer Termin' }}</h1>
          </div>
        </header>

        @if (loadState() === 'loading') {
          <p class="jp-muted">Lädt …</p>
        } @else if (loadState() === 'missing') {
          <p class="jp-muted">Diesen Termin gibt es nicht (mehr).</p>
          <a [routerLink]="['/bewerbung', id()]">Zur Bewerbung</a>
        } @else {
          @let v = values();
          <div class="jp-field">
            <span class="jp-field__label" id="kind-label">Art</span>
            <div class="jp-segmented" role="radiogroup" aria-labelledby="kind-label">
              @for (kind of kinds; track kind) {
                <button
                  type="button"
                  role="radio"
                  class="jp-segmented__option"
                  [class.is-selected]="v.kind === kind"
                  [attr.aria-checked]="v.kind === kind"
                  (click)="set('kind', kind)"
                >
                  {{ kindLabels[kind] }}
                </button>
              }
            </div>
          </div>

          <label class="jp-field">
            <span class="jp-field__label">Wann</span>
            <input
              class="jp-input"
              type="datetime-local"
              [value]="toDateTimeLocal(v.startsAt)"
              (input)="setStartsAt($any($event.target).value)"
              [attr.aria-invalid]="!!errors().startsAt"
            />
            @if (errors().startsAt; as message) {
              <span class="jp-field__message">{{ message }}</span>
            }
          </label>

          <label class="jp-field">
            <span class="jp-field__label">
              {{ v.kind === 'onsite' ? 'Adresse' : 'Link oder Telefonnummer' }}
            </span>
            <input
              class="jp-input"
              [value]="v.location"
              (input)="set('location', $any($event.target).value)"
              [placeholder]="
                v.kind === 'onsite' ? 'z. B. Hauptstraße 1, München' : 'z. B. https://meet…'
              "
            />
          </label>

          <label class="jp-field">
            <span class="jp-field__label">Notizen</span>
            <textarea
              class="jp-input"
              [value]="v.notes"
              (input)="set('notes', $any($event.target).value)"
              placeholder="Wer ist dabei? Was soll vorbereitet werden?"
            ></textarea>
          </label>

          @if (saveError(); as message) {
            <p class="jp-error summary" role="alert">{{ message }}</p>
          }

          <div class="jp-form-actions">
            <a class="jp-button jp-button--secondary" [routerLink]="['/bewerbung', id()]"
              >Abbrechen</a
            >
            <button class="jp-button" type="submit" [disabled]="isSaving()">Speichern</button>
          </div>

          @if (terminId()) {
            <button
              type="button"
              class="jp-button jp-button--danger delete"
              [disabled]="isSaving()"
              (click)="remove()"
            >
              Termin löschen
            </button>
          }
        }
      </form>
    </main>
  `,
  styles: `
    .delete {
      width: 100%;
      margin-top: 24px;
    }
  `,
})
export class AppointmentFormPage {
  /** Bewerbung aus der Route `bewerbung/:id/termin` */
  readonly id = input.required<string>();
  /** Query-Parameter beim Bearbeiten, wie in der mobile-app */
  readonly terminId = input<string>();

  private readonly details = inject(DetailsRepository);
  private readonly router = inject(Router);

  protected readonly kinds = APPOINTMENT_KINDS;
  protected readonly kindLabels = APPOINTMENT_KIND_LABELS;
  protected readonly toDateTimeLocal = toDateTimeLocal;

  protected readonly values = signal<AppointmentFormValues>(emptyAppointmentForm());
  protected readonly errors = signal<Partial<Record<AppointmentFormField, string>>>({});
  protected readonly loadState = signal<'loading' | 'ready' | 'missing'>('ready');
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  async ngOnInit() {
    const appointmentId = this.terminId();
    if (!appointmentId) return;
    this.loadState.set('loading');
    try {
      const appointment = await this.details.appointment(appointmentId);
      if (!appointment) {
        this.loadState.set('missing');
        return;
      }
      this.values.set(appointmentToForm(appointment));
      this.loadState.set('ready');
    } catch {
      this.loadState.set('missing');
    }
  }

  protected set<F extends AppointmentFormField>(field: F, value: AppointmentFormValues[F]) {
    this.values.update((values) => ({ ...values, [field]: value }));
    if (this.errors()[field]) this.errors.update(({ [field]: _, ...rest }) => rest);
  }

  /** Ein geleertes oder halb ausgefülltes Feld ergibt kein Datum – gemeldet wird beim Speichern */
  private readonly startsAtIncomplete = signal(false);

  protected setStartsAt(value: string) {
    const date = new Date(value);
    this.startsAtIncomplete.set(Number.isNaN(date.getTime()));
    if (!this.startsAtIncomplete()) this.set('startsAt', date);
  }

  private async run(action: () => Promise<unknown>) {
    this.isSaving.set(true);
    this.saveError.set(null);
    try {
      await action();
      await this.router.navigate(['/bewerbung', this.id()]);
    } catch {
      this.saveError.set('Speichern hat nicht geklappt. Bitte prüfe deine Verbindung.');
    } finally {
      this.isSaving.set(false);
    }
  }

  protected save() {
    if (this.isSaving()) return;
    if (this.startsAtIncomplete()) {
      this.errors.set({ startsAt: 'Bitte Datum und Uhrzeit wählen' });
      return;
    }
    const result = parseAppointmentForm(this.values());
    if (!result.ok) {
      this.errors.set(result.errors);
      return;
    }
    return this.run(() => this.details.saveAppointment(this.id(), result.value, this.terminId()));
  }

  protected remove() {
    const appointmentId = this.terminId();
    if (!appointmentId || !confirm('Termin löschen?')) return;
    return this.run(() => this.details.deleteAppointment(appointmentId));
  }
}
