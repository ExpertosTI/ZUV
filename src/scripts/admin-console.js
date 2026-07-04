/**
 * Hidden admin console (Moonshadows Sentinel pattern).
 * Type "ZAV" anywhere on the page → PIN pad → metrics.
 * PIN: 04J27
 */

const PIN_LENGTH = 5;
const ACTIVATION = 'zav';
const BUFFER_MS = 1800;

export function initAdminConsole() {
  if (document.getElementById('zav-adm')) return;

  const root = document.createElement('div');
  root.id = 'zav-adm';
  root.className = 'zav-adm';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="zav-adm__scrim" data-close></div>
    <div class="zav-adm__pinpad" role="dialog" aria-label="ZAV access" aria-modal="true">
      <div class="zav-adm__brand">ZAV · ACCESS</div>
      <div class="zav-adm__title">Enter PIN</div>
      <div class="zav-adm__dots">${'<span class="zav-adm__dot"></span>'.repeat(PIN_LENGTH)}</div>
      <div class="zav-adm__grid">
        ${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'J', '0', 'erase']
          .map((k) => `<button type="button" class="zav-adm__key" data-key="${k}">${k === 'erase' ? '←' : k}</button>`)
          .join('')}
      </div>
      <div class="zav-adm__hint">esc · close</div>
    </div>
    <div class="zav-adm__console" role="region" aria-label="ZAV metrics">
      <header class="zav-adm__head">
        <div class="zav-adm__head-brand">ZAV</div>
        <div class="zav-adm__head-title">Metrics dashboard</div>
        <div class="zav-adm__actions">
          <button type="button" class="zav-adm__btn" data-action="refresh">↻ Refresh</button>
          <button type="button" class="zav-adm__btn zav-adm__btn--danger" data-action="close">✕ Close</button>
        </div>
      </header>
      <main class="zav-adm__body">
        <div class="zav-adm__metrics">
          <article class="zav-adm__metric"><span>Visits</span><strong data-m="visits">—</strong></article>
          <article class="zav-adm__metric"><span>Quotes</span><strong data-m="quotes">—</strong></article>
          <article class="zav-adm__metric"><span>Unique</span><strong data-m="unique">—</strong></article>
        </div>
        <section class="zav-adm__panel">
          <h3>Recent quotes</h3>
          <div style="overflow:auto">
            <table class="zav-adm__table">
              <thead>
                <tr><th>When</th><th>Name</th><th>Service</th><th>Contact</th><th>Lang</th></tr>
              </thead>
              <tbody data-quotes></tbody>
            </table>
          </div>
        </section>
        <section class="zav-adm__panel">
          <h3>Add client to feed</h3>
          <form class="zav-adm__form" data-client-form>
            <input name="name" placeholder="Client name" required />
            <input name="city" placeholder="City" required />
            <input name="service" placeholder="Service" required />
            <input name="rating" type="number" min="1" max="5" value="5" />
            <textarea name="blurb" placeholder="Testimonial" required></textarea>
            <button type="submit">Publish to feed</button>
          </form>
          <p class="zav-adm__msg" data-client-msg></p>
        </section>
      </main>
      <footer class="zav-adm__foot">
        <span>Admin only · type ZAV to open</span>
        <span data-clock></span>
      </footer>
    </div>
  `;

  document.body.appendChild(root);

  const dots = [...root.querySelectorAll('.zav-adm__dot')];
  const quotesBody = root.querySelector('[data-quotes]');
  const clock = root.querySelector('[data-clock]');
  const clientForm = root.querySelector('[data-client-form]');
  const clientMsg = root.querySelector('[data-client-msg]');

  let pinBuf = '';
  let token = sessionStorage.getItem('zav_admin') || '';
  let typeBuf = '';
  let lastKey = 0;

  const setMode = (mode) => {
    root.classList.remove('is-active', 'is-pinpad', 'is-console');
    if (!mode) {
      root.setAttribute('aria-hidden', 'true');
      pinBuf = '';
      renderPin();
      return;
    }
    root.classList.add('is-active', mode);
    root.setAttribute('aria-hidden', 'false');
  };

  const renderPin = () => {
    dots.forEach((d, i) => {
      d.classList.toggle('is-on', i < pinBuf.length);
      d.classList.remove('is-error', 'is-ok');
    });
  };

  const openPinpad = () => {
    pinBuf = '';
    renderPin();
    setMode('is-pinpad');
  };

  const closeAll = () => setMode('');

  const openConsole = async () => {
    setMode('is-console');
    try {
      await loadMetrics();
    } catch {
      token = '';
      sessionStorage.removeItem('zav_admin');
      openPinpad();
    }
  };

  const tryPin = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinBuf }),
      });
      if (!res.ok) throw new Error('bad');
      const data = await res.json();
      token = data.token;
      sessionStorage.setItem('zav_admin', token);
      dots.forEach((d) => d.classList.add('is-ok'));
      setTimeout(openConsole, 280);
    } catch {
      dots.forEach((d) => d.classList.add('is-error'));
      setTimeout(() => {
        pinBuf = '';
        renderPin();
      }, 420);
    }
  };

  const pushKey = (k) => {
    if (k === 'erase') {
      pinBuf = pinBuf.slice(0, -1);
      renderPin();
      return;
    }
    if (!/^[0-9A-Za-z]$/.test(k) || pinBuf.length >= PIN_LENGTH) return;
    pinBuf += k.toUpperCase();
    renderPin();
    if (pinBuf.length === PIN_LENGTH) tryPin();
  };

  const escapeHtml = (s) =>
    String(s || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');

  async function loadMetrics() {
    const res = await fetch('/api/metrics', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('auth');
    const data = await res.json();
    root.querySelector('[data-m="visits"]').textContent = data.metrics.visits;
    root.querySelector('[data-m="quotes"]').textContent = data.metrics.quotes;
    root.querySelector('[data-m="unique"]').textContent = data.metrics.uniqueVisitors;
    quotesBody.innerHTML = (data.quotes || [])
      .slice(0, 40)
      .map(
        (q) => `<tr>
          <td>${new Date(q.createdAt).toLocaleString()}</td>
          <td>${escapeHtml(q.name)}<div style="opacity:.65">${escapeHtml(q.zip)}</div></td>
          <td>${escapeHtml(q.service)} · ${escapeHtml(q.size)}</td>
          <td>${escapeHtml(q.phone)}<div style="opacity:.65">${escapeHtml(q.email)}</div></td>
          <td>${escapeHtml(q.locale)}</td>
        </tr>`,
      )
      .join('');
  }

  const isTyping = (el) => {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!el.isContentEditable;
  };

  // Activation: type ZAV
  document.addEventListener('keydown', (e) => {
    if (root.classList.contains('is-pinpad')) {
      if (/^[0-9a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        pushKey(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        pushKey('erase');
      } else if (e.key === 'Escape') {
        closeAll();
      }
      return;
    }

    if (root.classList.contains('is-console') && e.key === 'Escape') {
      closeAll();
      return;
    }

    if (isTyping(e.target)) return;

    if (e.key === 'Escape' && root.classList.contains('is-active')) {
      closeAll();
      return;
    }

    if (e.key.length === 1) {
      const now = Date.now();
      if (now - lastKey > BUFFER_MS) typeBuf = '';
      lastKey = now;
      typeBuf = (typeBuf + e.key.toLowerCase()).slice(-ACTIVATION.length);
      if (typeBuf === ACTIVATION) {
        typeBuf = '';
        if (token) openConsole();
        else openPinpad();
      }
    }
  });

  root.querySelector('.zav-adm__pinpad')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-key]');
    if (!btn) return;
    pushKey(btn.getAttribute('data-key'));
  });

  root.querySelector('[data-close]')?.addEventListener('click', closeAll);
  root.querySelector('[data-action="close"]')?.addEventListener('click', closeAll);
  root.querySelector('[data-action="refresh"]')?.addEventListener('click', () => {
    loadMetrics().catch(() => {
      token = '';
      sessionStorage.removeItem('zav_admin');
      openPinpad();
    });
  });

  clientForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(clientForm);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      if (clientMsg) clientMsg.textContent = 'Published.';
      clientForm.reset();
    } else if (res.status === 401) {
      token = '';
      sessionStorage.removeItem('zav_admin');
      openPinpad();
    } else if (clientMsg) {
      clientMsg.textContent = 'Could not publish.';
    }
  });

  // Mobile-friendly hash trigger
  const checkHash = () => {
    if (location.hash === '#zav' || location.hash === '#admin') {
      history.replaceState(null, '', location.pathname + location.search);
      if (token) openConsole();
      else openPinpad();
    }
  };
  checkHash();
  addEventListener('hashchange', checkHash);

  setInterval(() => {
    if (clock) clock.textContent = new Date().toLocaleTimeString();
  }, 1000);
}
