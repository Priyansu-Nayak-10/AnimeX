"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const passwordInput = document.getElementById("password");
    const togglePasswordBtn = document.getElementById("togglePassword");
    const signinBtn = document.querySelector(".btn-signin");

    // Toggle Password Visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener("click", () => {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);

            // Toggle Icon
            const icon = togglePasswordBtn.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-eye");
                icon.classList.toggle("fa-eye-slash");
            }

            // Subtle feedback animation
            togglePasswordBtn.style.transform = "scale(1.2)";
            setTimeout(() => {
                togglePasswordBtn.style.transform = "scale(1)";
            }, 150);
        });
    }

    // Form Submission Handling
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // Show loading state on button
            if (signinBtn) {
                const originalContent = signinBtn.innerHTML;
                signinBtn.disabled = true;
                signinBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> &nbsp; Authenticating...';

                const email = document.getElementById("email").value.trim();
                const password = passwordInput.value;

                // Execute Supabase Sign In
                const performLogin = async () => {
                    try {
                        const { data, error } = await supabaseClient.auth.signInWithPassword({
                            email,
                            password
                        });

                        if (error) throw error;

                        if (data.user) {
                            localStorage.setItem("animex_authenticated", "true");
                            localStorage.removeItem("activeDashboardTab");
                            window.location.href = "index.html";
                        }
                    } catch (err) {
                        signinBtn.disabled = false;
                        signinBtn.innerHTML = originalContent;

                        // Create or show error message
                        let errorEl = document.getElementById("loginError");
                        if (!errorEl) {
                            errorEl = document.createElement("p");
                            errorEl.id = "loginError";
                            errorEl.className = "validation-text text-error";
                            errorEl.style.marginTop = "1rem";
                            errorEl.style.textAlign = "center";
                            loginForm.appendChild(errorEl);
                        }
                        errorEl.textContent = err.message || "Login failed. Please check your credentials.";
                    }
                };

                performLogin();
            }
        });
    }

    // Detect Email Confirmation Redirect
    const detectEmailConfirmation = () => {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        const banner = document.getElementById("verificationBanner");

        // Supabase sends confirmation in hash (access_token) or query (type=signup/recovery)
        const isConfirmed = hash.includes("access_token") ||
            params.get("type") === "signup" ||
            params.get("type") === "recovery";

        if (isConfirmed && banner) {
            banner.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                <span>Email successfully verified. You can now log in.</span>
            `;
            banner.classList.remove("hidden");

            // Clean URL without reloading
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);

            // Auto-dismiss after 5 seconds
            setTimeout(() => {
                banner.classList.add("fade-out");
                setTimeout(() => {
                    banner.classList.add("hidden");
                }, 500);
            }, 5000);
        }
    };

    detectEmailConfirmation();
});
