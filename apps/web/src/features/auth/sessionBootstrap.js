import { supabase } from '../../core/supabaseClient.js';

function setOverlayHidden() {
  const overlay = document.getElementById('auth-loading-overlay');
  if (!overlay) return;
  overlay.classList.add('hidden');
  setTimeout(() => overlay.remove(), 400);
}

function persistSession(session) {
  const email = session?.user?.email || '';
  const displayName = email.split('@')[0] || 'Otaku';
  const userState = {
    id: session.user.id,
    email,
    name: displayName,
    accessToken: session.access_token
  };
  localStorage.setItem('animex:currentUser', JSON.stringify(userState));

  const headerName = document.getElementById('header-username');
  if (headerName) headerName.textContent = displayName;
  const profileName = document.getElementById('profile-display-name');
  if (profileName) profileName.textContent = displayName;
}

async function initializeAuth() {
  try {
    // Timeout guard — if Supabase hangs, don't leave the overlay stuck
    const SESSION_TIMEOUT_MS = 5000;
    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve({ data: null, error: new Error('Auth timeout') }), SESSION_TIMEOUT_MS)
    );
    const result = await Promise.race([supabase.auth.getSession(), timeout]);
    const session = result?.data?.session ?? null;

    if (!session) {
      // Prevent redirect loops: only redirect if we're not already on signin page
      if (!window.location.pathname.endsWith('/pages/signin.html')) {
        sessionStorage.setItem('animex:redirectLock', String(Date.now()));
        window.location.replace('/pages/signin.html');
      }
      return;
    }

    persistSession(session);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.warn('SW registration failed:', error);
      });
    }

    // Keep session in sync on future auth changes (token refresh or sign-out)
    supabase.auth.onAuthStateChange((event, nextSession) => {
      if (nextSession) {
        persistSession(nextSession);
      } else {
        localStorage.removeItem('animex:currentUser');
        if (!window.location.pathname.endsWith('/pages/signin.html')) {
          sessionStorage.setItem('animex:redirectLock', String(Date.now()));
          window.location.replace('/pages/signin.html');
        }
      }
    });

    setOverlayHidden();
  } catch (err) {
    // Never leave the overlay stuck — always hide it even on unexpected errors
    console.error('[Animex] Auth initialization error:', err);
    setOverlayHidden();
    // Redirect to signin as fallback only if not already there
    if (!window.location.pathname.endsWith('/pages/signin.html')) {
      sessionStorage.setItem('animex:redirectLock', String(Date.now()));
      window.location.replace('/pages/signin.html');
    }
  }
}

function bindLogout() {
  const logoutBtn = document.querySelector('.logout-btn');
  if (!logoutBtn) return;
  logoutBtn.addEventListener('click', async () => {
    logoutBtn.disabled = true;
    logoutBtn.style.opacity = '0.6';
    localStorage.removeItem('animex:currentUser');
    await supabase.auth.signOut();
    window.location.href = '/pages/signin.html';
  });
}

window.__ANIMEX_AUTH_READY = initializeAuth();
document.addEventListener('DOMContentLoaded', bindLogout);
