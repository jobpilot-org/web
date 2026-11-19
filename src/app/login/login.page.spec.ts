import { AuthError } from '@supabase/supabase-js';

import { signInMessage } from './login.page';

describe('signInMessage', () => {
  it('meldet abgelehnte Zugangsdaten als falsches Passwort', () => {
    expect(signInMessage(new AuthError('Invalid login', 400, 'invalid_credentials'))).toBe(
      'E-Mail oder Passwort falsch',
    );
  });

  it('meldet alles andere als Verbindungsproblem', () => {
    expect(signInMessage(new AuthError('Gateway', 502, 'unexpected_failure'))).toContain(
      'Verbindung',
    );
  });
});
