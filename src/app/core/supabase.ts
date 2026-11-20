import { InjectionToken } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { environment } from '../../environments/environment';
import type { Database } from './database.types';

export type Supabase = SupabaseClient<Database>;

/** Ein Client für die ganze App; Tests ersetzen ihn über den Token */
export const SUPABASE = new InjectionToken<Supabase>('SUPABASE', {
  providedIn: 'root',
  factory: () =>
    createClient<Database>(environment.supabaseUrl, environment.supabasePublishableKey),
});
