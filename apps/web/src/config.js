const env = window.__ENV || {};

let backendUrl = String(env.BACKEND_URL || '/api').trim();
if (!backendUrl.startsWith('http') && !backendUrl.startsWith('/')) {
  console.error(`[Animex Config] Invalid BACKEND_URL ("${backendUrl}") configured. It must be an absolute URL or an absolute path starting with '/'. Falling back to '/api'.`);
  backendUrl = '/api';
}
const normalizedBackendUrl = backendUrl.endsWith('/') && backendUrl.length > 1 ? backendUrl.slice(0, -1) : backendUrl;

export const CONFIG = Object.freeze({
  backendUrl: normalizedBackendUrl,
  supabaseUrl: String(env.SUPABASE_URL || ''),
  supabaseAnonKey: String(env.SUPABASE_ANON_KEY || '')
});

export const BACKEND_URL = CONFIG.backendUrl;
export const BACKEND_ORIGIN = new URL(BACKEND_URL, window.location.origin).origin;
export const SUPABASE_URL = CONFIG.supabaseUrl;
export const SUPABASE_ANON_KEY = CONFIG.supabaseAnonKey;

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('animex:currentUser') || 'null');
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getCurrentUser()?.accessToken || '';
}

export function withAuthHeaders(headers = {}) {
  const merged = { ...headers };
  const token = getAccessToken();
  if (token && !merged.Authorization) merged.Authorization = `Bearer ${token}`;
  return merged;
}

export async function authFetch(input, init = {}) {
  const nextInit = {
    ...init,
    headers: withAuthHeaders(init.headers || {})
  };
  const res = await fetch(input, nextInit);
  if (res.status === 401) {
    try {
      localStorage.removeItem('animex:currentUser');
    } catch (_) { /* ignore */ }
    if (!window.location.pathname.endsWith('/pages/signin.html')) {
      window.location.href = '/pages/signin.html';
    }
  }
  return res;
}

export function apiUrl(path) {
  const safePath = String(path || '');
  if (/^https?:\/\//i.test(safePath)) return safePath;
  if (safePath.startsWith('/')) return `${BACKEND_URL}${safePath}`;
  return `${BACKEND_URL}/${safePath}`;
}
