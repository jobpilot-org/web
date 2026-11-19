import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { AuthError } from '@supabase/supabase-js';

import { AuthService } from '../core/auth.service';

const CREDENTIALS_MESSAGE = 'E-Mail oder Passwort falsch';
const UNREACHABLE_MESSAGE = 'Anmeldung gerade nicht möglich. Bitte prüfe deine Verbindung.';

export function signInMessage(error: AuthError): string {
  const rejected = error.code === 'invalid_credentials' || error.code === 'invalid_grant';
  return rejected ? CREDENTIALS_MESSAGE : UNREACHABLE_MESSAGE;
}

/** Anmeldung mit E-Mail und Passwort; Konten werden in Supabase angelegt, es gibt keine Registrierung */
@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  protected readonly isSubmitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async submit() {
    if (this.isSubmitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    this.error.set(null);
    try {
      const { email, password } = this.form.getRawValue();
      const error = await this.auth.signIn(email.trim(), password);
      if (error) {
        this.error.set(signInMessage(error));
        return;
      }
      const next = this.route.snapshot.queryParamMap.get('weiter');
      await this.router.navigateByUrl(next?.startsWith('/') ? next : '/');
    } catch {
      this.error.set(UNREACHABLE_MESSAGE);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
