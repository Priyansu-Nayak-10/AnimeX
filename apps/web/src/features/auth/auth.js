import { supabase } from '../../core/supabaseClient.js';

// --- Validation Handlers ---
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
    return password && password.length >= 8;
};

export const showInlineError = (inputElement, message) => {
    const errorProp = inputElement.closest('.form-group')?.querySelector('.input-error');
    if (errorProp && errorProp.classList.contains('input-error')) {
        errorProp.innerText = message;
        errorProp.setAttribute('role', 'alert');
        errorProp.setAttribute('aria-live', 'polite');
        errorProp.classList.add('visible');
    }
    inputElement.classList.add('error');
};

export const clearInlineError = (inputElement) => {
    const errorProp = inputElement.closest('.form-group')?.querySelector('.input-error');
    if (errorProp && errorProp.classList.contains('input-error')) {
        errorProp.innerText = '';
        errorProp.classList.remove('visible');
    }
    inputElement.classList.remove('error');
};

// --- Animations & State ---
export const initAnimations = () => {
    // Input Focus Animations & Floating Labels
    const inputs = document.querySelectorAll('.auth-input');

    inputs.forEach(input => {
        const parent = input.closest('.form-group-minimal') || input.parentElement;
        if (input.value.trim() !== '') parent.classList.add('has-value');

        input.addEventListener('focus', () => parent.classList.add('focused'));

        input.addEventListener('blur', () => {
            parent.classList.remove('focused');
            if (input.value.trim() !== '') parent.classList.add('has-value');
            else parent.classList.remove('has-value');
        });

        input.addEventListener('input', () => {
            if (input.classList.contains('error')) {
                input.classList.remove('error');
                const errorProp = input.closest('.form-group')?.querySelector('.input-error');
                if (errorProp && errorProp.classList.contains('input-error')) {
                    errorProp.innerText = '';
                    errorProp.classList.remove('visible');
                }
            }
        });
    });

    // Password Visibility Toggle
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const input = document.getElementById(btn.dataset.target);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                btn.classList.add('showing');
                btn.setAttribute('aria-pressed', 'true');
                btn.innerHTML = '<i class="fas fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                btn.classList.remove('showing');
                btn.setAttribute('aria-pressed', 'false');
                btn.innerHTML = '<i class="fas fa-eye"></i>';
            }
        });
    });

    // Page Load Entry Animation
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        setTimeout(() => authCard.classList.add('animate-enter'), 100);
    }
};

export const setButtonLoading = (btn, isLoading) => {
    if (isLoading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
};

export const showBackendError = (container, message) => {
    let errorBox = container.querySelector('.backend-error');
    if (!errorBox) {
        errorBox = document.createElement('div');
        errorBox.className = 'backend-error';
        errorBox.setAttribute('role', 'alert');
        errorBox.setAttribute('aria-live', 'assertive');
        container.prepend(errorBox);
    }
    errorBox.innerText = message;
    errorBox.classList.add('shake-anim');
    setTimeout(() => errorBox.classList.remove('shake-anim'), 500);
};

export const clearBackendError = (container) => {
    const errorBox = container.querySelector('.backend-error');
    if (errorBox) errorBox.innerText = '';
};

async function startOAuth(provider, errorContainer) {
    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
            redirectTo: `${window.location.origin}/app.html`
        }
    });
    if (error) showBackendError(errorContainer, error.message || 'OAuth sign-in failed');
}

function bindAuxAuthActions({ emailInput, errorContainer }) {
    const forgotLink = document.querySelector('.forgot-link');
    const googleBtn = document.getElementById('btn-google');

    if (forgotLink) {
        forgotLink.addEventListener('click', async (event) => {
            event.preventDefault();
            clearBackendError(errorContainer);
            const email = String(emailInput?.value || '').trim();
            if (!validateEmail(email)) {
                showInlineError(emailInput, 'Enter your account email first');
                return;
            }
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            if (error) {
                showBackendError(errorContainer, error.message || 'Failed to send reset email');
                return;
            }
            showBackendError(errorContainer, 'Password reset link sent. Check your email inbox.');
        });
    }

    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            clearBackendError(errorContainer);
            void startOAuth('google', errorContainer);
        });
    }
}

function isSessionValid(session) {
    const exp = Number(session?.expires_at || 0);
    if (!session || !Number.isFinite(exp)) return false;
    // Consider token valid if it doesn't expire within 15 seconds
    return Date.now() < (exp * 1000 - 15000);
}

// --- Utils ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function checkUsernameAvailability(username, indicator) {
    if (!username || username.length < 3) {
        indicator.className = 'availability-indicator';
        return false;
    }
    indicator.className = 'availability-indicator loading';
    try {
        const { data, error } = await supabase
            .from('user_profiles')
            .select('name')
            .ilike('name', username)
            .maybeSingle();
            
        if (error) throw error;
        
        if (data) {
            indicator.className = 'availability-indicator error';
            indicator.title = 'Username is already taken';
            return false;
        } else {
            indicator.className = 'availability-indicator success';
            indicator.title = 'Username is available';
            return true;
        }
    } catch (err) {
        console.error('Check username auth error', err);
        indicator.className = 'availability-indicator';
        return true; 
    }
}

// --- Main Auth Logic (SignIn & SignUp) ---
document.addEventListener('DOMContentLoaded', async () => {
    // Prevent redirect loops with a short-lived lock
    const lockTs = Number(sessionStorage.getItem('animex:redirectLock') || 0);
    const lockActive = (Date.now() - lockTs) < 3000;

    // Redirect if already authenticated with a valid (non-expiring) token
    const { data: { session } } = await supabase.auth.getSession();
    if (!lockActive && isSessionValid(session)) {
        sessionStorage.setItem('animex:redirectLock', String(Date.now()));
        window.location.replace('/pages/app.html'); // Or dashboard
        return;
    }

    initAnimations();

    const signInForm = document.getElementById('signin-form');
    const signUpForm = document.getElementById('signup-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorContainer = document.querySelector('.auth-form-body');
    bindAuxAuthActions({ emailInput, errorContainer });

    // Sign In Logic
    if (signInForm) {
        const submitBtn = document.getElementById('signin-btn');
        signInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearBackendError(errorContainer);

            let isValid = true;
            if (!validateEmail(emailInput.value)) {
                showInlineError(emailInput, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearInlineError(emailInput);
            }

            if (!passwordInput.value) {
                showInlineError(passwordInput, 'Password is required');
                isValid = false;
            } else {
                clearInlineError(passwordInput);
            }

            if (!isValid) return;

            setButtonLoading(submitBtn, true);
            try {
                const { error } = await supabase.auth.signInWithPassword({
                    email: emailInput.value,
                    password: passwordInput.value
                });
                if (error) throw error;
                setTimeout(() => window.location.href = '/pages/app.html', 600);
            } catch (error) {
                showBackendError(errorContainer, error.message || 'Login failed');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }

    // Sign Up Logic
    if (signUpForm) {
        const submitBtn = document.getElementById('signup-btn');
        const usernameInput = document.getElementById('username');
        const indicator = document.getElementById('username-indicator');
        
        let isUsernameAvailable = false;
        let lastCheckedUsername = '';
        
        if (usernameInput && indicator) {
            usernameInput.addEventListener('input', debounce(async (e) => {
                const val = e.target.value.trim();
                if (val === lastCheckedUsername) return;
                lastCheckedUsername = val;
                
                if (val.length < 3) {
                    showInlineError(usernameInput, 'Username must be at least 3 characters');
                    indicator.className = 'availability-indicator error';
                    isUsernameAvailable = false;
                    return;
                }
                clearInlineError(usernameInput);
                isUsernameAvailable = await checkUsernameAvailability(val, indicator);
                if (!isUsernameAvailable) {
                     showInlineError(usernameInput, 'Username is unavailable');
                }
            }, 500));
        }

        signUpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearBackendError(errorContainer);

            let isValid = true;
            
            if (usernameInput) {
                const uname = usernameInput.value.trim();
                if (uname.length < 3) {
                    showInlineError(usernameInput, 'Username is required');
                    isValid = false;
                } else if (!isUsernameAvailable && uname === lastCheckedUsername) {
                    showInlineError(usernameInput, 'Please choose an available username');
                    isValid = false;
                } else {
                    clearInlineError(usernameInput);
                }
            }
            
            if (!validateEmail(emailInput.value)) {
                showInlineError(emailInput, 'Please enter a valid email address');
                isValid = false;
            } else {
                clearInlineError(emailInput);
            }

            if (!validatePassword(passwordInput.value)) {
                showInlineError(passwordInput, 'Password must be at least 8 characters long');
                isValid = false;
            } else {
                clearInlineError(passwordInput);
            }

            // --- Terms of Service Validation ---
            const termsCheckbox = document.getElementById('terms');
            if (termsCheckbox && !termsCheckbox.checked) {
                showBackendError(errorContainer, 'You must agree to the Terms of Service and Privacy Policy');
                isValid = false;
            }

            if (!isValid) return;

            setButtonLoading(submitBtn, true);
            try {
                const { data, error } = await supabase.auth.signUp({
                    email: emailInput.value,
                    password: passwordInput.value
                });
                if (error) throw error;
                
                // Immediately create a profile if successful and session is given (no email confirmation needed)
                if (data?.user && usernameInput && data.session) {
                   await supabase.from('user_profiles').insert([{
                       user_id: data.user.id,
                       name: usernameInput.value.trim()
                   }]);
                }
                
                if (data?.user && !data.session) {
                    showBackendError(errorContainer, 'Registration successful. Please check your email inbox to confirm your account.');
                    return;
                }
                setTimeout(() => window.location.href = '/pages/app.html', 600);
            } catch (error) {
                showBackendError(errorContainer, error.message || 'Registration failed');
            } finally {
                setButtonLoading(submitBtn, false);
            }
        });
    }
});
