"use strict";

const PROFILE_DATA_KEY = "profileData";

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");
    const toggleBtns = document.querySelectorAll(".toggle-btn");
    const signupBtn = document.querySelector(".btn-signin");

    const strengthBar = document.getElementById("strengthBar");
    const strengthText = document.getElementById("strengthText");
    const matchText = document.getElementById("matchText");

    // Toggle Password Visibility
    toggleBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const input = btn.previousElementSibling;
            const type = input.getAttribute("type") === "password" ? "text" : "password";
            input.setAttribute("type", type);

            const icon = btn.querySelector("i");
            if (icon) {
                icon.classList.toggle("fa-eye");
                icon.classList.toggle("fa-eye-slash");
            }
        });
    });

    // Password Strength Logic
    passwordInput.addEventListener("input", () => {
        const val = passwordInput.value;
        let strength = 0;
        let status = "";
        let className = "";

        if (val.length < 6) {
            status = "Too short";
            className = "strength-weak";
        } else {
            strength++;
            if (/[A-Z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;

            if (strength <= 2) {
                status = "Weak";
                className = "strength-weak";
            } else if (strength === 3) {
                status = "Medium";
                className = "strength-medium";
            } else {
                status = "Strong";
                className = "strength-strong";
            }
        }

        strengthText.textContent = `Strength: ${status}`;
        strengthText.className = "strength-text " + (className === "strength-strong" ? "text-success" : "text-error");
        strengthBar.className = "strength-bar " + className;

        checkMatch();
    });

    // Password Match Check
    const checkMatch = () => {
        if (!confirmPasswordInput.value) {
            matchText.textContent = "";
            return;
        }

        if (passwordInput.value === confirmPasswordInput.value) {
            matchText.textContent = "Passwords match";
            matchText.className = "validation-text text-success";
        } else {
            matchText.textContent = "Passwords do not match";
            matchText.className = "validation-text text-error";
        }
    };

    confirmPasswordInput.addEventListener("input", checkMatch);

    // Form Submission
    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();

            if (passwordInput.value !== confirmPasswordInput.value) {
                matchText.textContent = "Please fix password mismatch";
                matchText.className = "validation-text text-error";
                return;
            }

            if (signupBtn) {
                signupBtn.disabled = true;
                signupBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> &nbsp; Creating Profile...';

                const username = document.getElementById("username").value.trim();
                const email = document.getElementById("email").value.trim();
                const password = passwordInput.value;

                // Execute Supabase Sign Up
                const performSignup = async () => {
                    try {
                        const { data, error } = await supabaseClient.auth.signUp({
                            email,
                            password
                        });

                        if (error) throw error;

                        if (data.user) {
                            const profileRecord = {
                                username: username || "Shadow",
                                email,
                                bio: "",
                                avatar: "",
                                bannerType: "",
                                bannerData: "",
                                bannerHeight: 240
                            };

                            try {
                                localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profileRecord));
                            } catch (error) {
                                console.warn("Unable to persist profile locally:", error);
                            }

                            localStorage.setItem("animex_authenticated", "true");
                            localStorage.removeItem("activeDashboardTab");
                            window.location.href = "index.html";
                        }
                    } catch (err) {
                        signupBtn.disabled = false;
                        signupBtn.innerHTML = 'Create Account';
                        matchText.textContent = err.message || "Sign up failed. Please try again.";
                        matchText.className = "validation-text text-error";
                    }
                };

                performSignup();
            }
        });
    }
});
