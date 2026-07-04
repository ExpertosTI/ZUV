const INTERACTIVE =
  'a, button, [role="button"], .interactive, .magnet, .tilt-card, .choice-card, .btn-wa, .wa-fab, .nav-link, input, textarea, select, label[for]';

export function initInteract() {
  const prefersReduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const root = document.documentElement;
  const body = document.body;
  const ring = document.getElementById('cursor-ring');

  initSmoothAnchors();
  initReveals();
  initRipples();

  if (isTouch || prefersReduce) {
    body.classList.add('is-touch');
    return;
  }

  body.classList.add('has-custom-cursor');
  initCursor(root, body, ring);
  initMagnets();
  initTiltCards();
}

function initSmoothAnchors() {
  document.addEventListener('click', (e) => {
    const link = e.target instanceof Element ? e.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const id = link.getAttribute('href');
    if (!id || id === '#') return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const header = document.getElementById('site-header');
    const offset = (header?.offsetHeight || 72) + 8;
    const top = target.getBoundingClientRect().top + scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
    history.pushState(null, '', id);
  });
}

function initCursor(root, body, ring) {
  if (!ring) return;

  let raf = 0;
  let mx = innerWidth / 2;
  let my = innerHeight / 2;

  const tick = () => {
    root.style.setProperty('--mx', `${mx}px`);
    root.style.setProperty('--my', `${my}px`);
    raf = 0;
  };

  addEventListener(
    'pointermove',
    (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );

  addEventListener('pointerdown', () => body.classList.add('cursor-press'));
  addEventListener('pointerup', () => body.classList.remove('cursor-press'));
  addEventListener('blur', () => body.classList.add('cursor-out'));
  addEventListener('focus', () => body.classList.remove('cursor-out'));

  const setHover = (on) => body.classList.toggle('cursor-hover', on);

  document.addEventListener('pointerover', (e) => {
    const target = e.target instanceof Element ? e.target.closest(INTERACTIVE) : null;
    setHover(Boolean(target));
  });

  document.addEventListener('pointerout', (e) => {
    const related =
      e.relatedTarget instanceof Element ? e.relatedTarget.closest(INTERACTIVE) : null;
    if (!related) setHover(false);
  });
}

function initMagnets() {
  document.querySelectorAll('.magnet').forEach((el) => {
    const inner = el.querySelector('.magnet__inner') || el;

    el.addEventListener(
      'pointermove',
      (e) => {
        const b = el.getBoundingClientRect();
        const x = e.clientX - b.left - b.width / 2;
        const y = e.clientY - b.top - b.height / 2;
        inner.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
        el.style.transform = `translate(${x * 0.05}px, ${y * 0.06}px)`;
      },
      { passive: true },
    );

    el.addEventListener('pointerleave', () => {
      inner.style.transform = '';
      el.style.transform = '';
    });
  });
}

function initTiltCards() {
  document.querySelectorAll('.tilt-card').forEach((card) => {
    card.addEventListener(
      'pointermove',
      (e) => {
        const b = card.getBoundingClientRect();
        const px = (e.clientX - b.left) / b.width - 0.5;
        const py = (e.clientY - b.top) / b.height - 0.5;
        card.style.transform = `perspective(900px) rotateY(${px * 8}deg) rotateX(${-py * 8}deg) translateY(-2px)`;
      },
      { passive: true },
    );

    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
    });
  });
}

function initRipples() {
  document.addEventListener('click', (e) => {
    const target =
      e.target instanceof Element
        ? e.target.closest('button, .magnet, .choice-card, .interactive')
        : null;
    if (!target || target.closest('input, textarea, select')) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'click-ripple';
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

    const style = getComputedStyle(target);
    if (style.position === 'static') target.style.position = 'relative';
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });
}

function initReveals() {
  const els = [...document.querySelectorAll('.reveal')];
  if (!els.length) return;

  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );

  els.forEach((el) => io.observe(el));
}
