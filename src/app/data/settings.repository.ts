import { inject, Injectable } from '@angular/core';

import { SUPABASE } from '../core/supabase';
import { unwrap } from './applications.repository';
import { DataRevision } from './data-revision';

/** Schlüssel wie in der mobile-app (`db/repositories/settings.ts`) – geteilt mit allen Apps */
export type SettingKey =
  | 'applications.filter'
  | 'applications.sort'
  | 'applications.view'
  | 'reminders.followUpDays'
  | 'reminders.appointments'
  | 'reminders.thankYou'
  /** Lebenslauf bzw. Kurzprofil für den KI-Assistenten */
  | 'profile.text';

/** Kleine Schlüssel-Wert-Einstellungen je Nutzer */
@Injectable({ providedIn: 'root' })
export class SettingsRepository {
  private readonly supabase = inject(SUPABASE);
  private readonly revision = inject(DataRevision);

  async all(): Promise<Map<string, string>> {
    const rows = unwrap(await this.supabase.from('settings').select('key, value'));
    return new Map((rows ?? []).map((row) => [row.key, row.value]));
  }

  async get(key: SettingKey): Promise<string | undefined> {
    const row = unwrap(
      await this.supabase.from('settings').select('value').eq('key', key).maybeSingle(),
    );
    return row?.value;
  }

  /** `user_id` füllt die Datenbank (auth.uid()), deshalb genügt der Schlüssel im Konflikt */
  async set(key: SettingKey, value: string): Promise<void> {
    unwrap(
      await this.supabase.from('settings').upsert({ key, value }, { onConflict: 'user_id,key' }),
    );
    this.revision.bump();
  }
}
