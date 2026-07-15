/**
 * Soft floating motifs (desktop only).
 * Skipped on touch / reduced-motion to keep scroll smooth.
 */

const ICONS = [
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M28 10h8l2 6h6v6H20v-6h6l2-6z"/><path d="M22 22h20v30a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V22z"/><path d="M36 10c4-1 8 1 10 4"/><path d="M30 34h4M30 42h4"/></svg>`,
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="36" width="36" height="10" rx="2"/><rect x="16" y="26" width="32" height="10" rx="2"/><rect x="18" y="16" width="28" height="10" rx="2"/></svg>`,
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 28v-4a10 10 0 0 1 20 0v4"/><path d="M14 34h28v10H14z"/><path d="M12 30a6 6 0 0 0-4 5v9h6"/><path d="M44 30a6 6 0 0 1 4 5v9h-6"/></svg>`,
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 38h16l-2 16H26L24 38z"/><path d="M32 38V22"/><path d="M32 28c-6-2-10-8-8-14 6 2 10 8 8 14z"/><path d="M32 26c6-2 10-8 8-14-6 2-10 8-8 14z"/></svg>`,
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 8v12M32 44v12M8 32h12M44 32h12"/><circle cx="32" cy="32" r="4"/></svg>`,
];

const COLORS = ['#6b4538', '#c67a62', '#f5c84b', '#4a2f28', '#efa978'];
const FRAME_MS = 1000 / 30;

export function initFloatingLife() {
  const layer = document.getElementById('life-layer');
  if (!layer) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (matchMedia('(hover: none), (pointer: coarse)').matches) return;
  if (matchMedia('(max-width: 900px)').matches) return;

  const items = [];
  const freeCount = 5;

  for (let i = 0; i < freeCount; i++) {
    const el = document.createElement('div');
    el.className = 'float-life';
    el.style.color = COLORS[i % COLORS.length];
    el.style.width = `${40 + (i % 3) * 10}px`;
    el.style.opacity = String(0.18 + (i % 3) * 0.04);
    el.innerHTML = ICONS[i % ICONS.length];
    layer.appendChild(el);

    items.push({
      el,
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.14,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 0.1,
      phase: Math.random() * Math.PI * 2,
      drift: 0.04 + Math.random() * 0.06,
    });
  }

  const anchors = [
    { icon: 1, x: 0.08, y: 0.28, size: 48, color: '#c67a62' },
    { icon: 0, x: 0.9, y: 0.36, size: 44, color: '#6b4538' },
    { icon: 3, x: 0.88, y: 0.72, size: 42, color: '#f5c84b' },
  ];

  for (const a of anchors) {
    const el = document.createElement('div');
    el.className = 'float-life float-life--anchor';
    el.style.color = a.color;
    el.style.width = `${a.size}px`;
    el.innerHTML = ICONS[a.icon];
    layer.appendChild(el);
    items.push({
      el,
      x: a.x * innerWidth,
      y: a.y * innerHeight,
      vx: 0,
      vy: 0,
      rot: (Math.random() - 0.5) * 12,
      vr: 0,
      phase: Math.random() * Math.PI * 2,
      drift: 0.1,
      anchored: true,
      ax: a.x,
      ay: a.y,
    });
  }

  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  let scrollY = window.scrollY || 0;
  let raf = 0;
  let last = 0;

  addEventListener(
    'pointermove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
    },
    { passive: true },
  );

  addEventListener(
    'scroll',
    () => {
      scrollY = window.scrollY || 0;
    },
    { passive: true },
  );

  addEventListener(
    'resize',
    () => {
      for (const item of items) {
        if (item.anchored) {
          item.x = item.ax * innerWidth;
          item.y = item.ay * innerHeight;
        }
      }
    },
    { passive: true },
  );

  const tick = (now) => {
    raf = requestAnimationFrame(tick);
    if (now - last < FRAME_MS) return;
    last = now;

    const w = innerWidth;
    const h = innerHeight;
    const t = now * 0.001;

    for (const item of items) {
      if (item.anchored) {
        const bob = Math.sin(t * 0.7 + item.phase) * 8;
        const sway = Math.cos(t * 0.5 + item.phase) * 4;
        item.el.style.transform = `translate3d(${item.x + sway}px, ${item.y + bob}px, 0) rotate(${item.rot}deg)`;
        continue;
      }

      item.x += item.vx + Math.sin(t + item.phase) * item.drift;
      item.y += item.vy + Math.cos(t * 0.8 + item.phase) * (item.drift * 0.8);
      item.rot += item.vr;

      if (item.x < -60) item.x = w + 40;
      if (item.x > w + 60) item.x = -40;
      if (item.y < -60) item.y = h + 40;
      if (item.y > h + 60) item.y = -40;

      const dx = (mx - item.x) * 0.008;
      const dy = (my - item.y) * 0.008;
      const parallax = scrollY * 0.015 * ((item.phase % 1) + 0.2);

      item.el.style.transform = `translate3d(${item.x + dx}px, ${item.y + dy + parallax}px, 0) rotate(${item.rot}deg)`;
    }
  };

  raf = requestAnimationFrame(tick);

  addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  });
}
