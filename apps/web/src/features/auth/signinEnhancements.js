function initParticles() {
  const canvas = document.getElementById("auth-particles");
  if (!canvas) return () => {};

  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducedMotion) return () => {};

  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let width = 0;
  let height = 0;
  let rafId = 0;
  let particles = [];

  function resize() {
    width = canvas.width = canvas.offsetWidth;
    height = canvas.height = canvas.offsetHeight;
  }

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createParticle() {
    return {
      x: random(0, width),
      y: random(0, height),
      r: random(1, 2.5),
      dx: random(-0.3, 0.3),
      dy: random(-0.6, -0.15),
      alpha: random(0.2, 0.7),
      color: Math.random() > 0.5 ? "168,85,247" : "6,182,212"
    };
  }

  function renderFrame() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle) => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particle.color},${particle.alpha})`;
      ctx.fill();
      particle.x += particle.dx;
      particle.y += particle.dy;
      if (particle.y < -5 || particle.x < -5 || particle.x > width + 5) {
        Object.assign(particle, createParticle(), { y: height + 5 });
      }
    });
    rafId = requestAnimationFrame(renderFrame);
  }

  function onResize() {
    resize();
  }

  function onVisibilityChange() {
    if (document.hidden && rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
      return;
    }
    if (!document.hidden && !rafId) {
      rafId = requestAnimationFrame(renderFrame);
    }
  }

  resize();
  particles = Array.from({ length: 60 }, createParticle);
  rafId = requestAnimationFrame(renderFrame);
  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

function initFormEntrance() {
  const inner = document.getElementById("auth-form-inner");
  if (!inner) return;
  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reducedMotion) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => inner.classList.add("animate-enter"));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initFormEntrance();
  initParticles();
});
