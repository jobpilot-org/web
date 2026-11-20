import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  contactToForm,
  emptyContactForm,
  parseContactForm,
  type ContactFormField,
  type ContactFormValues,
} from '@/domain/forms';

import { DetailsRepository } from '../../data/details.repository';

/** Kontakt anlegen oder bearbeiten – wie bewerbung/[id]/kontakt.tsx der mobile-app */
@Component({
  selector: 'app-contact-form-page',
  imports: [RouterLink],
  template: `
    <main class="jp-page">
      <form class="jp-form" novalidate (submit)="$event.preventDefault(); save()">
        <header class="jp-page-header form-header">
          <div class="jp-page-header__copy">
            <p class="jp-eyebrow">Kontakt</p>
            <h1 class="jp-title">{{ kontaktId() ? 'Kontakt bearbeiten' : 'Neuer Kontakt' }}</h1>
          </div>
        </header>

        @if (loadState() === 'loading') {
          <p class="jp-muted">Lädt …</p>
        } @else if (loadState() === 'missing') {
          <p class="jp-muted">Diesen Kontakt gibt es nicht (mehr).</p>
          <a [routerLink]="['/bewerbung', id()]">Zur Bewerbung</a>
        } @else {
          @let v = values();
          @let e = errors();
          @for (field of fields; track field.key) {
            <label class="jp-field">
              <span class="jp-field__label">{{ field.label }}</span>
              <input
                class="jp-input"
                [type]="field.type"
                [value]="v[field.key]"
                (input)="set(field.key, $any($event.target).value)"
                [placeholder]="field.placeholder"
                [attr.autocomplete]="field.autocomplete"
                [attr.aria-invalid]="!!e[field.key]"
              />
              @if (e[field.key]; as message) {
                <span class="jp-field__message">{{ message }}</span>
              }
            </label>
          }

          @if (saveError(); as message) {
            <p class="jp-error summary" role="alert">{{ message }}</p>
          }

          <div class="jp-form-actions">
            <a class="jp-button jp-button--secondary" [routerLink]="['/bewerbung', id()]"
              >Abbrechen</a
            >
            <button class="jp-button" type="submit" [disabled]="isSaving()">Speichern</button>
          </div>

          @if (kontaktId()) {
            <button
              type="button"
              class="jp-button jp-button--danger delete"
              [disabled]="isSaving()"
              (click)="remove()"
            >
              Kontakt löschen
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
export class ContactFormPage {
  /** Bewerbung aus der Route `bewerbung/:id/kontakt` */
  readonly id = input.required<string>();
  /** Query-Parameter beim Bearbeiten, wie in der mobile-app */
  readonly kontaktId = input<string>();

  private readonly details = inject(DetailsRepository);
  private readonly router = inject(Router);

  protected readonly fields: {
    key: ContactFormField;
    label: string;
    type: string;
    placeholder: string;
    autocomplete?: string;
  }[] = [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      placeholder: 'z. B. Kim Muster',
      autocomplete: 'off',
    },
    { key: 'role', label: 'Rolle', type: 'text', placeholder: 'z. B. Recruiterin, Tech Lead' },
    {
      key: 'email',
      label: 'E-Mail',
      type: 'email',
      placeholder: 'name@firma.de',
      autocomplete: 'off',
    },
    { key: 'phone', label: 'Telefon', type: 'tel', placeholder: '+49 …', autocomplete: 'off' },
    { key: 'linkedinUrl', label: 'LinkedIn-Profil', type: 'url', placeholder: 'linkedin.com/in/…' },
  ];

  protected readonly values = signal<ContactFormValues>(emptyContactForm());
  protected readonly errors = signal<Partial<Record<ContactFormField, string>>>({});
  protected readonly loadState = signal<'loading' | 'ready' | 'missing'>('ready');
  protected readonly isSaving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  async ngOnInit() {
    const contactId = this.kontaktId();
    if (!contactId) return;
    this.loadState.set('loading');
    try {
      const contact = await this.details.contact(contactId);
      if (!contact) {
        this.loadState.set('missing');
        return;
      }
      this.values.set(contactToForm(contact));
      this.loadState.set('ready');
    } catch {
      this.loadState.set('missing');
    }
  }

  protected set(field: ContactFormField, value: string) {
    this.values.update((values) => ({ ...values, [field]: value }));
    if (this.errors()[field]) this.errors.update(({ [field]: _, ...rest }) => rest);
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
    const result = parseContactForm(this.values());
    if (!result.ok) {
      this.errors.set(result.errors);
      return;
    }
    return this.run(() => this.details.saveContact(this.id(), result.value, this.kontaktId()));
  }

  protected remove() {
    const contactId = this.kontaktId();
    if (!contactId || !confirm(`${this.values().name || 'Kontakt'} löschen?`)) return;
    return this.run(() => this.details.deleteContact(contactId));
  }
}
