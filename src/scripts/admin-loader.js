/**
 * Lazy-loads the admin console only when activated (type "ZAV" or #zav / #admin).
 * Keeps ~37 kB of JS and admin CSS off the critical path for normal visitors.
 */

const ACTIVATION = 'zav';
const BUFFER_MS = 1800;
const ADMIN_CSS_V = '5';

let typeBuf = '';
let lastKey = 0;
let loading = false;
let loaded = false;

function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    document.querySelectorAll('link[href*="admin-console.css"]').forEach((el) => el.remove());
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('admin-console.css failed to load'));
    document.head.appendChild(link);
  });
}

function isTyping(el) {
  if (!el) return false;
  const tag = (el.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return !!el.isContentEditable;
}

async function loadAdminConsole() {
  if (loaded || loading) return;
  loading = true;

  try {
    await loadStylesheet(`/admin-console.css?v=${ADMIN_CSS_V}`);

    const { initAdminConsole } = await import('./admin-console.js');
    initAdminConsole();
    loaded = true;
  } finally {
    loading = false;
  }
}

function onActivation() {
  typeBuf = '';
  loadAdminConsole();
}

function checkHash() {
  const hash = location.hash;
  if (hash === '#zav' || hash === '#admin') onActivation();
}

export function initAdminLoader() {
  checkHash();
  addEventListener('hashchange', checkHash);

  document.addEventListener('keydown', (e) => {
    if (isTyping(e.target)) return;
    if (e.key.length !== 1) return;

    const now = Date.now();
    if (now - lastKey > BUFFER_MS) typeBuf = '';
    lastKey = now;
    typeBuf = (typeBuf + e.key.toLowerCase()).slice(-ACTIVATION.length);
    if (typeBuf === ACTIVATION) onActivation();
  });
}
