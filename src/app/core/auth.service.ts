import { computed, inject, Injectable, signal } from '@angular/core';
import type { AuthError, Session } from '@supabase/supabase-js';

import { SUPABASE } from './supabase';

/**
 * Session und Anmeldeaktionen für die ganze App. Zuerst wird die gespeicherte Session gelesen,
 * danach hält der Listener den Zustand aktuell – auch wenn sie abläuft oder anderswo endet.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SUPABASE);

  readonly session = signal<Session | null>(null);
  readonly email = computed(() => this.session()?.user.email);

  /** Erfüllt, sobald die gespeicherte Session gelesen ist – darauf wartet der Guard */
  readonly ready: Promise<void>;

  constructor() {
    this.ready = this.supabase.auth.getSession().then(
      ({ data }) => this.session.set(data.session),
      () => this.session.set(null),
    );
    this.supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }

  /** Gibt den Fehler von Supabase zurück, damit die Anmeldemaske ihn übersetzen kann */
  async signIn(email: string, password: string): Promise<AuthError | null> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    return error;
  }

  /** Die Session verschwindet über den Listener */
  async signOut(): Promise<AuthError | null> {
    const { error } = await this.supabase.auth.signOut();
    return error;
  }
}
