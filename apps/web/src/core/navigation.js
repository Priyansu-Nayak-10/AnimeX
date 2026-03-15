/**
 * navigation.js — SPA Navigation Utilities
 *
 * Extracted from app.js to keep bootstrap logic thin.
 * Handles nav-item click binding and programmatic view switching.
 */

/**
 * Bind click handlers to all .nav-item elements to show/hide .view-section elements.
 */
function normalizeViewTarget(viewId) {
    const targetId = String(viewId || "");
    if (targetId === "library-view") return "watchlist-view";
    return targetId;
}

function setSidebarOpen(isOpen) {
    document.body.classList.toggle("sidebar-open", Boolean(isOpen));
    const toggleBtn = document.querySelector("[data-sidebar-toggle]");
    if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }
}

function closeSidebarForMobile() {
    if (window.matchMedia("(max-width: 1023px)").matches) {
        setSidebarOpen(false);
    }
}

function activateView(targetId) {
    if (!targetId) return;
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".view-section");
    navItems.forEach((item) => item.classList.toggle("active", item.getAttribute("data-target") === targetId));
    sections.forEach((section) => section.classList.toggle("active", section.id === targetId));
    const scrollContainer = document.querySelector(".page-content") || document.querySelector(".view-container") || document.querySelector(".main-viewport");
    scrollContainer?.scrollTo({ top: 0, behavior: "smooth" });
}

export function bindNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            const targetId = normalizeViewTarget(item.getAttribute("data-target"));
            if (!targetId) return;
            activateView(targetId);
            closeSidebarForMobile();
        });
    });

    document.querySelector("[data-sidebar-toggle]")?.addEventListener("click", () => {
        setSidebarOpen(!document.body.classList.contains("sidebar-open"));
    });

    document.querySelectorAll("[data-sidebar-close]").forEach((element) => {
        element.addEventListener("click", () => {
            setSidebarOpen(false);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setSidebarOpen(false);
        }
    });

    window.addEventListener("resize", () => {
        if (!window.matchMedia("(max-width: 1023px)").matches) {
            setSidebarOpen(false);
        }
    });
}

/**
 * Programmatically switch to a view by its section ID.
 * @param {string} viewId - The `id` of the target `.view-section` element.
 */
export function openView(viewId) {
    const targetId = normalizeViewTarget(viewId);
    if (!targetId) return;
    activateView(targetId);
    closeSidebarForMobile();
}
