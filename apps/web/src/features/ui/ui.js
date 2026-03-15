const DEFAULT_THEME_KEY = "animex_theme";

function initToast({ root = document.body } = {}) {
  let container = null;
  const timeoutIds = new Set();

  function ensureContainer() {
    if (container && container.isConnected) return container;
    container = document.createElement("div");
    container.id = "animex-toast-root";
    Object.assign(container.style, {
      position: "fixed",
      right: "16px",
      top: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      zIndex: "9999"
    });
    root.appendChild(container);
    return container;
  }

  function show(message, type = "info", durationMs = 2200) {
    const host = ensureContainer();
    const node = document.createElement("div");
    node.textContent = String(message || "");
    Object.assign(node.style, {
      padding: "10px 14px",
      borderRadius: "10px",
      fontSize: "13px",
      fontWeight: "600",
      color: "#e2e8f0",
      background: type === "error" ? "rgba(185,28,28,.92)" : "rgba(15,23,42,.92)",
      border: "1px solid rgba(148,163,184,.35)",
      boxShadow: "0 10px 25px rgba(0,0,0,.25)",
      opacity: "0",
      transform: "translateY(8px)",
      transition: "all .2s ease"
    });
    host.appendChild(node);
    requestAnimationFrame(() => {
      node.style.opacity = "1";
      node.style.transform = "translateY(0)";
    });

    const hideId = setTimeout(() => {
      node.style.opacity = "0";
      node.style.transform = "translateY(8px)";
      const removeId = setTimeout(() => {
        node.remove();
        timeoutIds.delete(removeId);
      }, 220);
      timeoutIds.add(removeId);
      timeoutIds.delete(hideId);
    }, Math.max(500, Number(durationMs) || 2200));
    timeoutIds.add(hideId);
  }

  return Object.freeze({
    render() {},
    show,
    destroy() {
      timeoutIds.forEach((id) => clearTimeout(id));
      timeoutIds.clear();
      if (container) container.remove();
      container = null;
    }
  });
}

function initTheme({
  storage = globalThis.localStorage,
  storageKey = DEFAULT_THEME_KEY,
  root = document.body,
  toggleTarget = document.querySelector(".profile-img-container"),
  toast = null
} = {}) {
  let bound = false;

  function applyStoredTheme() {
    const stored = storage?.getItem?.(storageKey);
    if (stored === "light") root.classList.remove("dark");
    else root.classList.add("dark");
  }

  function toggleTheme() {
    const isDark = root.classList.toggle("dark");
    storage?.setItem?.(storageKey, isDark ? "dark" : "light");
    if (toast?.show) toast.show(isDark ? "Dark mode enabled" : "Light mode enabled");
  }

  function bind() {
    if (!toggleTarget || bound) return;
    toggleTarget.title = "Double-click to toggle theme";
    toggleTarget.addEventListener("dblclick", toggleTheme);
    bound = true;
  }

  function unbind() {
    if (!toggleTarget || !bound) return;
    toggleTarget.removeEventListener("dblclick", toggleTheme);
    bound = false;
  }

  applyStoredTheme();
  bind();

  return Object.freeze({
    render: applyStoredTheme,
    toggleTheme,
    destroy() {
      unbind();
    }
  });
}

function initChartTooltips({ tooltipId = "chart-tooltip" } = {}) {
  const tooltip = document.getElementById(tooltipId);
  if (!tooltip) return { destroy() {} };

  function onMouseMove(e) {
    const target = e.target.closest(".donut-slice, .genre-bar-item, .insight-legend-item, .si-legend-item, .legend-item");
    if (!target) {
      tooltip.classList.remove("active");
      return;
    }

    const text = target.getAttribute("data-tooltip");
    if (!text) {
      tooltip.classList.remove("active");
      return;
    }

    tooltip.textContent = text;
    tooltip.classList.add("active");

    const x = e.clientX + 15;
    const y = e.clientY - 35;

    const width = tooltip.offsetWidth;
    const height = tooltip.offsetHeight;
    const maxX = window.innerWidth - width - 20;
    const minY = 20;

    tooltip.style.left = `${Math.min(x, maxX)}px`;
    tooltip.style.top = `${Math.max(y, minY)}px`;
  }

  function onMouseLeave() {
    tooltip.classList.remove("active");
  }

  document.addEventListener("mousemove", onMouseMove);
  document.addEventListener("mouseleave", onMouseLeave);

  return Object.freeze({
    destroy() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      tooltip.classList.remove("active");
    }
  });
}

function initUI({
  toastOptions = {},
  themeOptions = {}
} = {}) {
  const toast = initToast(toastOptions);
  const theme = initTheme({ ...themeOptions, toast });
  const chartTooltips = initChartTooltips();

  return Object.freeze({
    toast,
    theme,
    chartTooltips,
    destroy() {
      theme?.destroy?.();
      toast?.destroy?.();
      chartTooltips?.destroy?.();
    }
  });
}

export { DEFAULT_THEME_KEY, initUI };
