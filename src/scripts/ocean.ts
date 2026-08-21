/**
 * Scroll-Engine fuer den Ozean-Hintergrund.
 *
 * Zwei Regeln, die den Ruckler aus dem Claude-Design-Export beheben:
 *
 * 1. Strikte Trennung von Lesen und Schreiben. Erst werden ALLE benoetigten
 *    Geometrien eingesammelt, danach wird geschrieben. Der Export hat
 *    getBoundingClientRect() und element.style abwechselnd aufgerufen; jeder
 *    Read nach einem Write zwingt den Browser zu einem synchronen Re-Layout.
 *
 * 2. So wenige Writes wie moeglich. Der globale Tiefenzustand sind drei
 *    Custom Properties auf <html>; alle Ebenen leiten sich in CSS daraus ab.
 *    Frueher waren das ~20 einzelne element.style-Zuweisungen pro Frame.
 *
 * Sichtbarwerden von Text laeuft ueber IntersectionObserver statt ueber eine
 * Messung pro Frame – das kostet im Scroll-Pfad exakt nichts.
 */

const root = document.documentElement;

let vh = window.innerHeight || 800;
let ticking = false;
let observer: IntersectionObserver | null = null;
let diveEl: HTMLElement | null = null;
let timelineEl: HTMLElement | null = null;

// Letzte geschriebene Werte – erspart Style-Invalidierungen im Stillstand.
let lastSy = -1;
let lastDepth = -1;
let lastDive = -1;
let lastTl = -1;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const near = (a: number, b: number, eps = 0.001) => Math.abs(a - b) < eps;

function frame() {
  ticking = false;

  // ── Lesephase: nichts hier drin darf schreiben ──────────────────────
  const sy = window.scrollY || root.scrollTop || 0;
  const diveRect = diveEl ? diveEl.getBoundingClientRect() : null;
  const tlRect = timelineEl ? timelineEl.getBoundingClientRect() : null;

  // ── Rechnen ─────────────────────────────────────────────────────────
  const travel = vh * 2.2;
  const depth = clamp01(Math.min(sy * 0.4, travel) / travel);

  let dive = 0;
  if (diveRect) {
    const span = diveRect.height - vh;
    if (span > 0) dive = clamp01(-diveRect.top / span);
  }

  let tl = -1;
  if (tlRect) {
    tl = clamp01((vh * 0.72 - tlRect.top) / Math.max(1, tlRect.height - vh * 0.28));
  }

  // ── Schreibphase ────────────────────────────────────────────────────
  if (sy !== lastSy) {
    root.style.setProperty('--sy', String(Math.round(sy)));
    lastSy = sy;
  }
  if (!near(depth, lastDepth)) {
    root.style.setProperty('--depth', depth.toFixed(4));
    lastDepth = depth;
  }
  if (!near(dive, lastDive)) {
    root.style.setProperty('--dive', dive.toFixed(4));
    lastDive = dive;
  }
  if (tl >= 0 && !near(tl, lastTl) && timelineEl) {
    timelineEl.style.setProperty('--tl', tl.toFixed(4));
    lastTl = tl;
  }
}

function request() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(frame);
}

function onResize() {
  vh = window.innerHeight || 800;
  root.style.setProperty('--vhpx', String(Math.round(vh)));
  // Erzwingt eine Neuberechnung trotz Gleichstand-Kurzschluss.
  lastDepth = lastDive = lastTl = -1;
  request();
}

/** Einmaliges Einblenden. Nach dem Zeigen wird nicht weiter beobachtet. */
function setupReveals() {
  observer?.disconnect();

  const targets = document.querySelectorAll<HTMLElement>('[data-reveal]:not([data-shown])');

  if (!('IntersectionObserver' in window)) {
    targets.forEach((el) => el.setAttribute('data-shown', ''));
    return;
  }

  observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        (entry.target as HTMLElement).setAttribute('data-shown', '');
        obs.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
  );

  targets.forEach((el) => observer!.observe(el));
}

/** Nach jeder Navigation neu verdrahten – der Ozean selbst bleibt bestehen. */
export function initOcean() {
  diveEl = document.querySelector<HTMLElement>('[data-dive-root]');
  timelineEl = document.querySelector<HTMLElement>('[data-timeline]');

  lastSy = lastDepth = lastDive = lastTl = -1;

  onResize();
  setupReveals();
  frame();
}

let bound = false;
export function bindOcean() {
  if (bound) return;
  bound = true;
  root.classList.add('js');
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });
}
