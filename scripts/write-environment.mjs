// Erzeugt src/environments/environment.ts aus .env (Vorlage: .env.example) – wie die .env der
// desktop-app und die .env.local von admin. Ohne .env gilt die lokale Supabase aus ../backend.
// Läuft automatisch vor `npm start`, `npm run build` und `npm test` (prestart/prebuild/pretest).
import { existsSync, writeFileSync } from 'node:fs';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';

const envFile = new URL('../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

const url = process.env.SUPABASE_URL || LOCAL_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || LOCAL_KEY;

writeFileSync(
  new URL('../src/environments/environment.ts', import.meta.url),
  `// Erzeugt von scripts/write-environment.mjs aus .env – nicht von Hand ändern.
// Der Publishable Key ist öffentlich; er gibt nur das frei, was RLS dem Aufrufer erlaubt.
export const environment = {
  supabaseUrl: ${JSON.stringify(url)},
  supabasePublishableKey: ${JSON.stringify(key)},
};
`,
);
console.log(`Supabase: ${url}`);
