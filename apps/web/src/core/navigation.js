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

export function bindNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".view-section");
    navItems.forEach((item) => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            const targetId = normalizeViewTarget(item.getAttribute("data-target"));
            if (!targetId) return;
            navItems.forEach((entry) => entry.classList.remove("active"));
            item.classList.add("active");
            sections.forEach((section) => section.classList.toggle("active", section.id === targetId));
        });
    });

}

/**
 * Programmatically switch to a view by its section ID.
 * @param {string} viewId - The `id` of the target `.view-section` element.
 */
export function openView(viewId) {
    const targetId = normalizeViewTarget(viewId);
    if (!targetId) return;
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".view-section");
    navItems.forEach((item) => item.classList.toggle("active", item.getAttribute("data-target") === targetId));
    sections.forEach((section) => section.classList.toggle("active", section.id === targetId));
}
