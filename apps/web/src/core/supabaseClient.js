import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

let client;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Animex] Missing Supabase runtime config. Authentication and cloud sync will be disabled.');
  
  const dummyAuth = new Proxy({}, {
    get: (_, prop) => {
        if (prop === 'onAuthStateChange') return () => ({ data: { subscription: { unsubscribe: () => {} } } });
        return async () => ({ data: null, error: new Error('Supabase not configured') });
    }
  });

  client = new Proxy({ auth: dummyAuth }, {
    get: (target, prop) => {
      if (prop === 'auth') return target.auth;
      return () => ({ data: null, error: new Error('Supabase not configured') });
    }
  });
} else {
  client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const supabase = client;
