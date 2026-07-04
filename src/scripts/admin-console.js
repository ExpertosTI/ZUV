/**
 * Hidden admin console (Moonshadows Sentinel pattern).
 * Type "ZAV" anywhere → PIN pad → modern cleaning-ops dashboard.
 * PIN: 04J27
 */

const PIN_LENGTH = 5;
const ACTIVATION = 'zav';
const BUFFER_MS = 1800;

const ICONS = {
  spray: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M9 4h4l1 3h3v3H7V7h3L9 4z"/><path d="M8 10h8v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9z"/><path d="M14 4c2 0 4 1 5 3"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 2l1.2 6.2L19 9l-5 3.2L15.5 19 12 15.8 8.5 19 10 12.2 5 9l5.8-.8L12 2z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3"/><path d="M20 21v-2a3.5 3.5 0 0 0-2.5-3.3"/><path d="M16 4.2a3 3 0 0 1 0 5.6"/></svg>`,
  lead: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 19h16"/><path d="M7 16V9"/><path d="M12 16V5"/><path d="M17 16v-4"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5z"/></svg>`,
  cloth: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8c3-3 13-3 16 0-1 4-3 11-4 13-4-2-8-2-12 0-1-3-2-9 0-13z"/></svg>`,
};

const SERVICE_LABEL = {
  home: 'Home cleaning',
  deep: 'Deep cleaning',
  move: 'Move-in / out',
  interior: 'Interior refresh',
};

const SIZE_LABEL = {
  studio: 'Studio / 1 bed',
  small: '2 bedrooms',
  medium: '3 bedrooms',
  large: '4+ bedrooms',
};

const FREQ_LABEL = {
  once: 'One-time',
  biweekly: 'Biweekly',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function initAdminConsole() {
  if (document.getElementById('zav-adm')) return;

  const root = document.createElement('div');
  root.id = 'zav-adm';
  root.className = 'zav-adm';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="zav-adm__scrim" data-close></div>
    <div class="zav-adm__bubbles" aria-hidden="true"></div>
    <div class="zav-adm__motif zav-adm__motif--1">${ICONS.spray}</div>
    <div class="zav-adm__motif zav-adm__motif--2">${ICONS.spark}</div>
    <div class="zav-adm__motif zav-adm__motif--3">${ICONS.cloth}</div>
    <div class="zav-adm__motif zav-adm__motif--4">${ICONS.home}</div>

    <div class="zav-adm__pinpad" role="dialog" aria-label="ZAV access" aria-modal="true">
      <div class="zav-adm__brand">ZAV · CLEAN OPS</div>
      <div class="zav-adm__title">Enter PIN</div>
      <p class="zav-adm__subtitle">Metrics · leads · homes cared for</p>
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
        <div class="zav-adm__head-brand">${ICONS.spark} ZAV OPS</div>
        <div class="zav-adm__head-title">
          Cleaning command center
          <small>Live leads &amp; performance</small>
        </div>
        <nav class="zav-adm__tabs" role="tablist">
          <button type="button" class="zav-adm__tab is-active" data-tab="overview">Overview</button>
          <button type="button" class="zav-adm__tab" data-tab="leads">Leads</button>
          <button type="button" class="zav-adm__tab" data-tab="insights">Insights</button>
          <button type="button" class="zav-adm__tab" data-tab="clients">Clients</button>
        </nav>
        <div class="zav-adm__actions">
          <button type="button" class="zav-adm__btn" data-action="refresh">↻ Refresh</button>
          <button type="button" class="zav-adm__btn zav-adm__btn--danger" data-action="close">✕ Close</button>
        </div>
      </header>

      <main class="zav-adm__body">
        <section class="zav-adm__pane is-active" data-pane="overview">
          <div class="zav-adm__kpis">
            <article class="zav-adm__kpi">
              <div class="zav-adm__kpi-label">${ICONS.users} Visits</div>
              <strong data-m="visits">—</strong>
              <em data-m="unique">— unique</em>
            </article>
            <article class="zav-adm__kpi">
              <div class="zav-adm__kpi-label">${ICONS.lead} Leads</div>
              <strong data-m="leads">—</strong>
              <em data-m="leads-today">— today</em>
            </article>
            <article class="zav-adm__kpi">
              <div class="zav-adm__kpi-label">${ICONS.spark} Conversion</div>
              <strong data-m="conversion">—</strong>
              <em>leads / visits</em>
            </article>
            <article class="zav-adm__kpi">
              <div class="zav-adm__kpi-label">${ICONS.home} Homes</div>
              <strong data-m="homes">—</strong>
              <em data-m="leads-week">— leads / 7d</em>
            </article>
          </div>

          <div class="zav-adm__grid-2">
            <section class="zav-adm__panel">
              <h3>${ICONS.lead} Lead trend <span>last 14 days</span></h3>
              <div class="zav-adm__trend" data-trend></div>
            </section>
            <section class="zav-adm__panel">
              <h3>${ICONS.spray} Top services</h3>
              <div class="zav-adm__rows" data-top-services></div>
            </section>
          </div>

          <section class="zav-adm__panel">
            <h3>${ICONS.cloth} Latest leads <span>fresh requests</span></h3>
            <div class="zav-adm__table-wrap">
              <table class="zav-adm__table">
                <thead>
                  <tr>
                    <th>When</th><th>Lead</th><th>Service</th><th>Plan</th><th>Contact</th><th>Lang</th>
                  </tr>
                </thead>
                <tbody data-quotes-preview></tbody>
              </table>
            </div>
          </section>
        </section>

        <section class="zav-adm__pane" data-pane="leads">
          <div class="zav-adm__kpis">
            <article class="zav-adm__kpi"><div class="zav-adm__kpi-label">Total leads</div><strong data-m="leads-2">—</strong><em>all time</em></article>
            <article class="zav-adm__kpi"><div class="zav-adm__kpi-label">Today</div><strong data-m="leads-today-2">—</strong><em>new requests</em></article>
            <article class="zav-adm__kpi"><div class="zav-adm__kpi-label">7 days</div><strong data-m="leads-week-2">—</strong><em>this week</em></article>
            <article class="zav-adm__kpi"><div class="zav-adm__kpi-label">30 days</div><strong data-m="leads-month">—</strong><em>this month</em></article>
          </div>
          <section class="zav-adm__panel">
            <h3>Lead pipeline</h3>
            <div class="zav-adm__table-wrap">
              <table class="zav-adm__table">
                <thead>
                  <tr>
                    <th>When</th><th>Lead</th><th>Service</th><th>Home</th><th>Frequency</th><th>Contact</th><th>ZIP</th><th>Lang</th><th>Notes</th>
                  </tr>
                </thead>
                <tbody data-quotes></tbody>
              </table>
            </div>
          </section>
        </section>

        <section class="zav-adm__pane" data-pane="insights">
          <div class="zav-adm__grid-2">
            <section class="zav-adm__panel">
              <h3>By service</h3>
              <div class="zav-adm__rows" data-by-service></div>
            </section>
            <section class="zav-adm__panel">
              <h3>By home size</h3>
              <div class="zav-adm__rows" data-by-size></div>
            </section>
          </div>
          <div class="zav-adm__grid-2">
            <section class="zav-adm__panel">
              <h3>By frequency</h3>
              <div class="zav-adm__rows" data-by-freq></div>
            </section>
            <section class="zav-adm__panel">
              <h3>By language</h3>
              <div class="zav-adm__rows" data-by-locale></div>
            </section>
          </div>
        </section>

        <section class="zav-adm__pane" data-pane="clients">
          <section class="zav-adm__panel">
            <h3>${ICONS.home} Homes in feed <span data-m="homes-2">—</span></h3>
            <div class="zav-adm__table-wrap">
              <table class="zav-adm__table">
                <thead>
                  <tr><th>Client</th><th>City</th><th>Service</th><th>Rating</th><th>Date</th><th>Quote</th></tr>
                </thead>
                <tbody data-clients></tbody>
              </table>
            </div>
          </section>
          <section class="zav-adm__panel">
            <h3>Publish client story</h3>
            <form class="zav-adm__form" data-client-form>
              <input name="name" placeholder="Client name" required />
              <input name="city" placeholder="City" required />
              <input name="service" placeholder="Service" required />
              <input name="rating" type="number" min="1" max="5" value="5" />
              <textarea name="blurb" placeholder="Testimonial (kept in original language)" required></textarea>
              <button type="submit">Publish to feed</button>
            </form>
            <p class="zav-adm__msg" data-client-msg></p>
          </section>
        </section>
      </main>

      <footer class="zav-adm__foot">
        <span class="zav-adm__live"><i></i> Live ops · type ZAV to open</span>
        <span data-clock></span>
      </footer>
    </div>
  `;

  document.body.appendChild(root);

  // bubbles
  const bubbles = root.querySelector('.zav-adm__bubbles');
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('span');
    b.className = 'zav-adm__bubble';
    b.style.setProperty('--x', `${6 + Math.random() * 88}%`);
    b.style.setProperty('--s', `${6 + Math.random() * 14}px`);
    b.style.setProperty('--dur', `${8 + Math.random() * 10}s`);
    b.style.setProperty('--delay', `${Math.random() * 6}s`);
    bubbles?.appendChild(b);
  }

  const dots = [...root.querySelectorAll('.zav-adm__dot')];
  const clock = root.querySelector('[data-clock]');
  const clientForm = root.querySelector('[data-client-form]');
  const clientMsg = root.querySelector('[data-client-msg]');

  let pinBuf = '';
  let token = sessionStorage.getItem('zav_admin') || '';
  let typeBuf = '';
  let lastKey = 0;
  let dashboard = null;

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

  const label = (map, key) => map[key] || key;

  const setText = (sel, value) => {
    root.querySelectorAll(sel).forEach((el) => {
      el.textContent = value;
    });
  };

  const renderBars = (selector, items, labelMap = {}) => {
    const el = root.querySelector(selector);
    if (!el) return;
    if (!items?.length) {
      el.innerHTML = `<div class="zav-adm__empty">No data yet — waiting for leads.</div>`;
      return;
    }
    const max = Math.max(...items.map((i) => i.count), 1);
    el.innerHTML = items
      .slice(0, 6)
      .map((item) => {
        const pct = Math.round((item.count / max) * 100);
        return `<div class="zav-adm__row">
          <div class="zav-adm__row-label">${escapeHtml(label(labelMap, item.name))}</div>
          <div class="zav-adm__row-track"><div class="zav-adm__row-fill" style="width:${pct}%"></div></div>
          <div class="zav-adm__row-count">${item.count}</div>
        </div>`;
      })
      .join('');
  };

  const renderTrend = (trend) => {
    const el = root.querySelector('[data-trend]');
    if (!el) return;
    const max = Math.max(...trend.map((t) => t.count), 1);
    el.innerHTML = trend
      .map((t) => {
        const h = Math.max(6, Math.round((t.count / max) * 100));
        const day = t.date.slice(5);
        return `<div class="zav-adm__bar" title="${t.date}: ${t.count}">
          <div class="zav-adm__bar-fill" style="height:${h}%"></div>
          <small>${day}</small>
        </div>`;
      })
      .join('');
  };

  const leadRow = (q, full = false) => {
    const when = new Date(q.createdAt).toLocaleString();
    const service = label(SERVICE_LABEL, q.service);
    const size = label(SIZE_LABEL, q.size);
    const freq = label(FREQ_LABEL, q.frequency);
    const base = `<tr>
      <td>${escapeHtml(when)}</td>
      <td><div class="zav-adm__lead-name">${escapeHtml(q.name)}</div>
          <div class="zav-adm__lead-meta">${escapeHtml(q.zip || '')}</div></td>
      <td><span class="zav-adm__badge">${escapeHtml(service)}</span></td>`;
    if (!full) {
      return `${base}
        <td><span class="zav-adm__badge zav-adm__badge--gold">${escapeHtml(freq)}</span></td>
        <td>${escapeHtml(q.phone)}<div class="zav-adm__lead-meta">${escapeHtml(q.email)}</div></td>
        <td><span class="zav-adm__badge zav-adm__badge--sky">${escapeHtml(q.locale)}</span></td>
      </tr>`;
    }
    return `${base}
      <td>${escapeHtml(size)}</td>
      <td><span class="zav-adm__badge zav-adm__badge--gold">${escapeHtml(freq)}</span></td>
      <td>${escapeHtml(q.phone)}<div class="zav-adm__lead-meta">${escapeHtml(q.email)}</div></td>
      <td>${escapeHtml(q.zip)}</td>
      <td><span class="zav-adm__badge zav-adm__badge--sky">${escapeHtml(q.locale)}</span></td>
      <td>${escapeHtml(q.notes || '—')}</td>
    </tr>`;
  };

  function renderDashboard(data) {
    dashboard = data;
    const k = data.kpis;
    setText('[data-m="visits"]', k.visits);
    setText('[data-m="unique"]', `${k.uniqueVisitors} unique`);
    setText('[data-m="leads"]', k.leads);
    setText('[data-m="leads-2"]', k.leads);
    setText('[data-m="leads-today"]', `${k.leadsToday} today`);
    setText('[data-m="leads-today-2"]', k.leadsToday);
    setText('[data-m="leads-week"]', `${k.leadsWeek} leads / 7d`);
    setText('[data-m="leads-week-2"]', k.leadsWeek);
    setText('[data-m="leads-month"]', k.leadsMonth);
    setText('[data-m="conversion"]', `${k.conversion}%`);
    setText('[data-m="homes"]', k.homes);
    setText('[data-m="homes-2"]', `${k.homes} published`);

    renderTrend(data.trend || []);
    renderBars('[data-top-services]', data.breakdown.service, SERVICE_LABEL);
    renderBars('[data-by-service]', data.breakdown.service, SERVICE_LABEL);
    renderBars('[data-by-size]', data.breakdown.size, SIZE_LABEL);
    renderBars('[data-by-freq]', data.breakdown.frequency, FREQ_LABEL);
    renderBars('[data-by-locale]', data.breakdown.locale);

    const quotes = data.quotes || [];
    const preview = root.querySelector('[data-quotes-preview]');
    const full = root.querySelector('[data-quotes]');
    if (preview) {
      preview.innerHTML = quotes.length
        ? quotes.slice(0, 8).map((q) => leadRow(q, false)).join('')
        : `<tr><td colspan="6" class="zav-adm__empty">No leads yet. New quote requests will appear here.</td></tr>`;
    }
    if (full) {
      full.innerHTML = quotes.length
        ? quotes.slice(0, 100).map((q) => leadRow(q, true)).join('')
        : `<tr><td colspan="9" class="zav-adm__empty">No leads yet.</td></tr>`;
    }

    const clientsBody = root.querySelector('[data-clients]');
    if (clientsBody) {
      const clients = data.clients || [];
      clientsBody.innerHTML = clients.length
        ? clients
            .map(
              (c) => `<tr>
                <td class="zav-adm__lead-name">${escapeHtml(c.name)}</td>
                <td>${escapeHtml(c.city)}</td>
                <td><span class="zav-adm__badge">${escapeHtml(c.service)}</span></td>
                <td>${'★'.repeat(c.rating || 5)}</td>
                <td>${escapeHtml(c.date)}</td>
                <td>${escapeHtml(c.blurb)}</td>
              </tr>`,
            )
            .join('')
        : `<tr><td colspan="6" class="zav-adm__empty">No client stories yet.</td></tr>`;
    }
  }

  async function loadMetrics() {
    const res = await fetch('/api/metrics', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('auth');
    const data = await res.json();
    // backward compat if old payload shape
    if (data.kpis) renderDashboard(data);
    else {
      renderDashboard({
        kpis: {
          visits: data.metrics?.visits || 0,
          uniqueVisitors: data.metrics?.uniqueVisitors || 0,
          leads: data.quotes?.length || 0,
          leadsToday: 0,
          leadsWeek: 0,
          leadsMonth: 0,
          homes: data.clients?.length || 0,
          conversion: 0,
        },
        breakdown: { service: [], size: [], frequency: [], locale: [] },
        trend: [],
        quotes: data.quotes || [],
        clients: data.clients || [],
      });
    }
  }

  const setTab = (id) => {
    root.querySelectorAll('.zav-adm__tab').forEach((t) => {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === id);
    });
    root.querySelectorAll('.zav-adm__pane').forEach((p) => {
      p.classList.toggle('is-active', p.getAttribute('data-pane') === id);
    });
  };

  root.querySelectorAll('.zav-adm__tab').forEach((tab) => {
    tab.addEventListener('click', () => setTab(tab.getAttribute('data-tab')));
  });

  const isTyping = (el) => {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return !!el.isContentEditable;
  };

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
      if (clientMsg) clientMsg.textContent = 'Published to feed.';
      clientForm.reset();
      loadMetrics().catch(() => {});
    } else if (res.status === 401) {
      token = '';
      sessionStorage.removeItem('zav_admin');
      openPinpad();
    } else if (clientMsg) {
      clientMsg.textContent = 'Could not publish.';
    }
  });

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

  // auto-refresh while open
  setInterval(() => {
    if (root.classList.contains('is-console') && token) {
      loadMetrics().catch(() => {});
    }
  }, 30000);
}
