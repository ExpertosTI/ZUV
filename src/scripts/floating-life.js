/**
 * Living thematic elements from the ZAV logo:
 * towels, spray, cloth, armchair, lamp, plant, bubbles…
 */

const ICONS = [
  // spray bottle
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M28 10h8l2 6h6v6H20v-6h6l2-6z"/><path d="M22 22h20v30a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V22z"/><path d="M36 10c4-1 8 1 10 4"/><path d="M30 34h4M30 42h4"/></svg>`,
  // folded towels stack
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="14" y="36" width="36" height="10" rx="2"/><rect x="16" y="26" width="32" height="10" rx="2"/><rect x="18" y="16" width="28" height="10" rx="2"/><path d="M18 21h28M16 31h32M14 41h36"/></svg>`,
  // hanging towel
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 12h28"/><path d="M22 12v8c0 4-2 8-2 14v18h8V34c0-4 2-8 2-12V12"/><path d="M34 12v10c0 3 2 6 2 12v18h8V34c0-5-2-9-2-14V12"/></svg>`,
  // cleaning cloth / rag
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c8-8 32-8 40 0-4 10-8 28-12 34-8-4-16-4-24 0-2-8-6-24-4-34z"/><path d="M20 30c6 2 18 2 24 0"/><path d="M18 40c5 1 14 1 20 0"/></svg>`,
  // armchair
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 28v-4a10 10 0 0 1 20 0v4"/><path d="M14 34h28v10H14z"/><path d="M12 30a6 6 0 0 0-4 5v9h6"/><path d="M44 30a6 6 0 0 1 4 5v9h-6"/><path d="M18 44v8M38 44v8"/></svg>`,
  // floor lamp
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 14h16l-4 12H28L24 14z"/><path d="M32 26v24"/><path d="M22 50h20"/><path d="M28 14V10h8v4"/></svg>`,
  // potted plant
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M24 38h16l-2 16H26L24 38z"/><path d="M32 38V22"/><path d="M32 28c-6-2-10-8-8-14 6 2 10 8 8 14z"/><path d="M32 26c6-2 10-8 8-14-6 2-10 8-8 14z"/><path d="M32 24c0-6 4-12 10-12-2 6-6 10-10 12z"/></svg>`,
  // bucket
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22h28l-3 28a4 4 0 0 1-4 4H25a4 4 0 0 1-4-4L18 22z"/><path d="M16 22h32"/><path d="M24 22c0-6 4-10 8-10s8 4 8 10"/></svg>`,
  // sparkle / shine
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M32 8v12M32 44v12M8 32h12M44 32h12"/><path d="M16 16l8 8M40 40l8 8M48 16l-8 8M24 40l-8 8"/><circle cx="32" cy="32" r="4"/></svg>`,
  // soap bubbles
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="22" cy="34" r="10"/><circle cx="40" cy="24" r="7"/><circle cx="44" cy="42" r="5"/><path d="M18 30c2-1 4 0 5 2" stroke-linecap="round"/></svg>`,
];

const COLORS = ['#1b3a5c', '#c9a227', '#0f2438', '#a8841a', '#14304a'];

export function initFloatingLife() {
  const layer = document.getElementById('life-layer');
  if (!layer) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const count = isTouch ? 8 : 14;
  const items = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'float-life';
    el.style.color = COLORS[i % COLORS.length];
    el.style.width = `${36 + (i % 4) * 12}px`;
    el.style.opacity = String(0.28 + (i % 5) * 0.06);
    el.innerHTML = ICONS[i % ICONS.length];
    layer.appendChild(el);

    items.push({
      el,
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.22,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 0.18,
      phase: Math.random() * Math.PI * 2,
      drift: 0.05 + Math.random() * 0.1,
    });
  }

  // Extra towel / spray accents anchored near sections (gentle bob only)
  const anchors = [
    { icon: 1, x: 0.08, y: 0.22, size: 52, color: '#c9a227' },
    { icon: 0, x: 0.9, y: 0.3, size: 48, color: '#1b3a5c' },
    { icon: 2, x: 0.12, y: 0.62, size: 50, color: '#1b3a5c' },
    { icon: 6, x: 0.88, y: 0.7, size: 46, color: '#a8841a' },
    { icon: 3, x: 0.06, y: 0.85, size: 44, color: '#c9a227' },
    { icon: 9, x: 0.92, y: 0.48, size: 40, color: '#1b3a5c' },
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
      rot: (Math.random() - 0.5) * 20,
      vr: 0,
      phase: Math.random() * Math.PI * 2,
      drift: 0.12,
      anchored: true,
      ax: a.x,
      ay: a.y,
    });
  }

  for (let i = 0; i < 18; i++) {
    const spark = document.createElement('span');
    spark.className = 'life-spark';
    spark.style.left = `${Math.random() * 100}%`;
    spark.style.top = `${Math.random() * 100}%`;
    spark.style.setProperty('--dur', `${7 + Math.random() * 8}s`);
    spark.style.setProperty('--delay', `${Math.random() * 4}s`);
    spark.style.setProperty('--dx', `${(Math.random() - 0.5) * 60}px`);
    spark.style.setProperty('--dy', `${-20 - Math.random() * 40}px`);
    layer.appendChild(spark);
  }

  let mx = innerWidth / 2;
  let my = innerHeight / 2;
  let scrollY = scrollYSafe();

  if (!isTouch) {
    addEventListener(
      'pointermove',
      (e) => {
        mx = e.clientX;
        my = e.clientY;
      },
      { passive: true },
    );
  }

  addEventListener(
    'scroll',
    () => {
      scrollY = scrollYSafe();
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

  let raf = 0;
  const tick = () => {
    const w = innerWidth;
    const h = innerHeight;
    const t = performance.now() * 0.001;

    for (const item of items) {
      if (item.anchored) {
        const bob = Math.sin(t * 0.9 + item.phase) * 10;
        const sway = Math.cos(t * 0.6 + item.phase) * 6;
        const dx = (mx - item.x) * 0.008;
        const dy = (my - item.y) * 0.008;
        item.el.style.transform = `translate3d(${item.x + sway + dx}px, ${item.y + bob + dy}px, 0) rotate(${item.rot + Math.sin(t + item.phase) * 4}deg)`;
        continue;
      }

      item.x += item.vx + Math.sin(t + item.phase) * item.drift;
      item.y += item.vy + Math.cos(t * 0.8 + item.phase) * (item.drift * 0.8);
      item.rot += item.vr;

      if (item.x < -60) item.x = w + 40;
      if (item.x > w + 60) item.x = -40;
      if (item.y < -60) item.y = h + 40;
      if (item.y > h + 60) item.y = -40;

      const dx = (mx - item.x) * 0.012;
      const dy = (my - item.y) * 0.012;
      const parallax = scrollY * 0.02 * (item.phase % 1);

      item.el.style.transform = `translate3d(${item.x + dx}px, ${item.y + dy + parallax}px, 0) rotate(${item.rot}deg)`;
    }

    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      raf = requestAnimationFrame(tick);
    }
  });
}

function scrollYSafe() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}
