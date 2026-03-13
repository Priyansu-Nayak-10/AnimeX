/**
 * sectionReveal.js — Intersection Observer-based Reveal Animations
 *
 * Extracted from app.js to keep bootstrap logic thin.
 * Adds .animex-reveal / .animex-reveal-visible CSS classes to cards
 * as they scroll into view, respecting prefers-reduced-motion.
 */

/**
 * Initialise reveal animations for matching DOM nodes.
 *
 * @param {{ root?: Document, selectors?: string }} options
 * @returns {{ destroy: () => void }}
 */
export function initSectionReveal({
    root = document,
    selectors = ".card, .kpi-card, .insight-panel, .profile-hero-card, .profile-glass-card"
} = {}) {
    const nodes = new Set();
    const revealed = new WeakSet();
    const prefersReducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReducedMotion) return Object.freeze({ destroy() { } });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const node = entry.target;
            if (!entry.isIntersecting || revealed.has(node)) return;
            node.classList.add("animex-reveal-visible");
            revealed.add(node);
            observer.unobserve(node);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    function registerNode(node) {
        if (!(node instanceof HTMLElement) || nodes.has(node)) return;
        if (node.classList.contains("animex-reveal-skip")) return;
        node.classList.add("animex-reveal");
        nodes.add(node);
        observer.observe(node);
    }

    function registerAll() {
        root.querySelectorAll(selectors).forEach(registerNode);
    }

    const mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((addedNode) => {
                if (!(addedNode instanceof HTMLElement)) return;
                if (addedNode.matches?.(selectors)) registerNode(addedNode);
                addedNode.querySelectorAll?.(selectors).forEach(registerNode);
            });
        });
    });

    registerAll();
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return Object.freeze({
        destroy() {
            mutationObserver.disconnect();
            observer.disconnect();
            nodes.clear();
        }
    });
}
