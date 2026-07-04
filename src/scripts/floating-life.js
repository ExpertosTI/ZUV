/**
 * Living thematic elements: soft particles + drifting line-art icons
 * (spray, cloth, chair, lamp) that react to pointer and scroll.
 */

const ICONS = [
  // spray bottle
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M28 10h8l2 6h6v6H20v-6h6l2-6z"/><path d="M22 22h20v30a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V22z"/><path d="M36 10c4-1 8 1 10 4"/><path d="M30 34h4M30 42h4"/></svg>`,
  // cloth
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c8-8 32-8 40 0-4 10-8 28-12 34-8-4-16-4-24 0-2-8-6-24-4-34z"/><path d="M20 30c6 2 18 2 24 0"/></svg>`,
  // armchair
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 28v-4a10 10 0 0 1 20 0v4"/><path d="M14 34h28v10H14z"/><path d="M12 30a6 6 0 0 0-4 5v9h6"/><path d="M44 30a6 6 0 0 1 4 5v9h-6"/><path d="M18 44v8M38 44v8"/></svg>`,
  // floor lamp
  `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24 14h16l-4 12H28L24 14z"/><path d="M32 26v24"/><path d="M22 50h20"/><path d="M28 14V10h8v4"/></svg>`,
];

export function initFloatingLife() {
  const layer = document.getElementById('life-layer');
  if (!layer) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const count = isTouch ? 4 : 7;
  const items = [];

  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'float-life';
    el.style.color = i % 2 === 0 ? '#1b3a5c' : '#c9a227';
    el.style.width = `${42 + (i % 3) * 10}px`;
    el.innerHTML = ICONS[i % ICONS.length];
    layer.appendChild(el);

    items.push({
      el,
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.2,
      rot: Math.random() * 360,
      vr: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
    });
  }

  for (let i = 0; i < 12; i++) {
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

  let raf = 0;
  const tick = () => {
    const w = innerWidth;
    const h = innerHeight;
    const t = performance.now() * 0.001;

    for (const item of items) {
      item.x += item.vx + Math.sin(t + item.phase) * 0.08;
      item.y += item.vy + Math.cos(t * 0.8 + item.phase) * 0.06;
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
