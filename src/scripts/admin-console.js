/**
 * Hidden admin console (Moonshadows Sentinel pattern).
 * Type "ZAV" anywhere → PIN pad → modern cleaning-ops dashboard.
 * PIN: 04J27
 */

import { initAdminShare } from './admin-share.js';

const PIN_LENGTH = 5;
const ACTIVATION = 'zav';
const BUFFER_MS = 1800;

/** Injected with the bundle — layout works even if admin-console.css is cached or missing */
const CRITICAL_CSS = `
#zav-adm,#zav-adm *{box-sizing:border-box}
#zav-adm{position:fixed;inset:0;z-index:2147483000;font-family:system-ui,sans-serif;color:#f7f4ef;font-size:14px}
#zav-adm svg{width:1em;height:1em;max-width:20px;max-height:20px;display:block;flex-shrink:0}
#zav-adm .zav-adm__motif{position:absolute;opacity:.14;pointer-events:none;font-size:32px;line-height:1}
#zav-adm .zav-adm__motif--1{top:8%;left:6%}
#zav-adm .zav-adm__motif--2{top:18%;right:8%}
#zav-adm .zav-adm__motif--3{bottom:14%;left:10%}
#zav-adm .zav-adm__motif--4{bottom:20%;right:12%}
#zav-adm .zav-adm__trend{display:flex;align-items:flex-end;gap:6px;height:120px;padding-top:8px}
#zav-adm .zav-adm__bar{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:6px;height:120px}
#zav-adm .zav-adm__bar-fill{width:100%;min-height:4px;border-radius:8px 8px 4px 4px;background:linear-gradient(180deg,#5eead4,rgba(94,234,212,.15))}
#zav-adm .zav-adm__tab-ico,#zav-adm .zav-adm__btn-ico{font-size:14px;line-height:1}
`;

const EMOJI = {
  service: { home: '🏠', deep: '🫧', move: '📦', interior: '✨' },
  size: { studio: '🛏️', small: '🏡', medium: '🏘️', large: '🏰' },
  freq: { once: '1️⃣', biweekly: '🔄', weekly: '📅', monthly: '🗓️' },
  status: { new: '✨', viewed: '👀', done: '✅', draft: '📝', sent: '📤', paid: '💰' },
  filter: { all: '📋', new: '✨', viewed: '👀', done: '✅' },
  locale: { en: '🇺🇸', es: '🇪🇸', pt: '🇧🇷' },
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

  if (!document.getElementById('zav-adm-critical')) {
    const style = document.createElement('style');
    style.id = 'zav-adm-critical';
    style.textContent = CRITICAL_CSS;
    document.head.appendChild(style);
  }

  const root = document.createElement('div');
  root.id = 'zav-adm';
  root.className = 'zav-adm';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="zav-adm__scrim" data-close></div>
    <div class="zav-adm__bubbles" aria-hidden="true"></div>
    <div class="zav-adm__motif zav-adm__motif--1" aria-hidden="true">🧴</div>
    <div class="zav-adm__motif zav-adm__motif--2" aria-hidden="true">✨</div>
    <div class="zav-adm__motif zav-adm__motif--3" aria-hidden="true">🧽</div>
    <div class="zav-adm__motif zav-adm__motif--4" aria-hidden="true">🏠</div>

    <div class="zav-adm__pinpad" role="dialog" aria-label="ZAV access" aria-modal="true">
      <div class="zav-adm__brand">✨ ZAV · CLEAN OPS</div>
      <div class="zav-adm__title">🔐 Enter PIN</div>
      <p class="zav-adm__subtitle">✨ Metrics · leads · homes cared for</p>
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
        <div class="zav-adm__head-brand">✨ ZAV OPS</div>
        <div class="zav-adm__head-title">
          🧼 Cleaning command center
          <small>✨ Live leads &amp; performance</small>
        </div>
        <nav class="zav-adm__tabs" role="tablist">
          <button type="button" class="zav-adm__tab is-active" data-tab="inbox">
            <span class="zav-adm__tab-ico">📬</span> Inbox
            <span class="zav-adm__tab-badge" data-m="inbox-badge" hidden>0</span>
          </button>
          <button type="button" class="zav-adm__tab" data-tab="overview"><span class="zav-adm__tab-ico">📊</span> Overview</button>
          <button type="button" class="zav-adm__tab" data-tab="invoices"><span class="zav-adm__tab-ico">🧾</span> Invoices</button>
          <button type="button" class="zav-adm__tab" data-tab="billing"><span class="zav-adm__tab-ico">💳</span> Billing</button>
          <button type="button" class="zav-adm__tab" data-tab="clients"><span class="zav-adm__tab-ico">👥</span> Clients</button>
          <button type="button" class="zav-adm__tab" data-tab="share"><span class="zav-adm__tab-ico">🔗</span> Share</button>
        </nav>
        <div class="zav-adm__actions">
          <button type="button" class="zav-adm__btn" data-action="refresh"><span class="zav-adm__btn-ico">🔄</span> Refresh</button>
          <button type="button" class="zav-adm__btn zav-adm__btn--danger" data-action="close">✕ Close</button>
        </div>
      </header>

      <main class="zav-adm__body">
        <section class="zav-adm__pane is-active" data-pane="inbox">
          <div class="zav-adm__kpis">
            <article class="zav-adm__kpi zav-adm__kpi--new">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">📬</span>
              <div class="zav-adm__kpi-label">New</div>
              <strong data-m="inbox-new">—</strong><em>unread requests</em>
            </article>
            <article class="zav-adm__kpi zav-adm__kpi--viewed">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">👀</span>
              <div class="zav-adm__kpi-label">In progress</div>
              <strong data-m="inbox-viewed">—</strong><em>viewed</em>
            </article>
            <article class="zav-adm__kpi zav-adm__kpi--done">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">✅</span>
              <div class="zav-adm__kpi-label">Done</div>
              <strong data-m="inbox-done">—</strong><em>jobs completed</em>
            </article>
            <article class="zav-adm__kpi zav-adm__kpi--invoice">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">🧾</span>
              <div class="zav-adm__kpi-label">Invoices</div>
              <strong data-m="invoices-count">—</strong><em>generated</em>
            </article>
          </div>
          <div class="zav-adm__filters">
            <button type="button" class="zav-adm__chip is-active" data-filter="all">${EMOJI.filter.all} All</button>
            <button type="button" class="zav-adm__chip" data-filter="new">${EMOJI.filter.new} New</button>
            <button type="button" class="zav-adm__chip" data-filter="viewed">${EMOJI.filter.viewed} In progress</button>
            <button type="button" class="zav-adm__chip" data-filter="done">${EMOJI.filter.done} Done</button>
          </div>
          <div class="zav-adm__inbox" data-inbox></div>
        </section>

        <section class="zav-adm__pane" data-pane="overview">
          <div class="zav-adm__kpis">
            <article class="zav-adm__kpi zav-adm__kpi--visits">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">👁️</span>
              <div class="zav-adm__kpi-label">Visits</div>
              <strong data-m="visits">—</strong>
              <em data-m="unique">— unique</em>
            </article>
            <article class="zav-adm__kpi zav-adm__kpi--leads">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">📈</span>
              <div class="zav-adm__kpi-label">Leads</div>
              <strong data-m="leads">—</strong>
              <em data-m="leads-today">— today</em>
            </article>
            <article class="zav-adm__kpi zav-adm__kpi--conv">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">🎯</span>
              <div class="zav-adm__kpi-label">Conversion</div>
              <strong data-m="conversion">—</strong>
              <em>leads / visits</em>
            </article>
            <article class="zav-adm__kpi zav-adm__kpi--homes">
              <span class="zav-adm__kpi-emoji" aria-hidden="true">🏡</span>
              <div class="zav-adm__kpi-label">Homes</div>
              <strong data-m="homes">—</strong>
              <em data-m="leads-week">— leads / 7d</em>
            </article>
          </div>

          <div class="zav-adm__grid-2">
            <section class="zav-adm__panel">
              <h3>📊 Lead trend <span>last 14 days</span></h3>
              <div class="zav-adm__trend" data-trend></div>
            </section>
            <section class="zav-adm__panel">
              <h3>🫧 Top services</h3>
              <div class="zav-adm__rows" data-top-services></div>
            </section>
          </div>

          <section class="zav-adm__panel">
            <h3>✨ Latest leads <span>fresh requests</span></h3>
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

        <section class="zav-adm__pane" data-pane="invoices">
          <section class="zav-adm__panel">
            <h3>🧾 Invoices <span>recurring cycles are manual &amp; secure</span></h3>
            <div class="zav-adm__table-wrap">
              <table class="zav-adm__table">
                <thead>
                  <tr><th>#</th><th>Client</th><th>Plan</th><th>Total</th><th>Status</th><th>Next</th><th></th></tr>
                </thead>
                <tbody data-invoices></tbody>
              </table>
            </div>
          </section>
        </section>

        <section class="zav-adm__pane" data-pane="billing">
          <section class="zav-adm__panel">
            <h3>📧 Mail notifications <span>outbound alerts</span></h3>
            <p class="zav-adm__lead-meta" data-mail-status>Checking mail…</p>
            <div class="zav-adm__card-actions" style="margin-top:10px">
              <button type="button" class="zav-adm__btn" data-mail-check>🔌 Check connection</button>
              <button type="button" class="zav-adm__btn zav-adm__btn--accent" data-mail-test>✉️ Send test email</button>
            </div>
            <p class="zav-adm__msg" data-mail-msg></p>
          </section>
          <section class="zav-adm__panel">
            <h3>💳 Billing profile <span>used on invoices</span></h3>
            <form class="zav-adm__form" data-billing-form>
              <input name="businessName" placeholder="Business name" required />
              <input name="legalName" placeholder="Legal name" />
              <input name="email" placeholder="Billing email" type="email" required />
              <input name="phone" placeholder="Phone" />
              <input name="address" placeholder="Address" />
              <input name="city" placeholder="City" />
              <input name="taxId" placeholder="Tax ID / EIN" />
              <input name="website" placeholder="Website" />
              <input name="invoicePrefix" placeholder="Invoice prefix (ZAV)" />
              <input name="defaultTaxRate" type="number" min="0" step="0.01" placeholder="Default tax %" />
              <input name="currency" placeholder="Currency (USD)" />
              <textarea name="notes" placeholder="Invoice footer notes"></textarea>
              <button type="submit">Save billing data</button>
            </form>
            <p class="zav-adm__msg" data-billing-msg></p>
          </section>
        </section>

        <section class="zav-adm__pane" data-pane="clients">
          <section class="zav-adm__panel">
            <h3>🏡 Homes in feed <span data-m="homes-2">—</span></h3>
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
            <h3>⭐ Publish client story</h3>
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

        <section class="zav-adm__pane" data-pane="share">
          <div data-share-root></div>
        </section>
      </main>

      <footer class="zav-adm__foot">
        <span class="zav-adm__live"><i data-live-dot class="is-on"></i> <span data-live-status>Live ops</span></span>
        <span data-clock></span>
      </footer>
    </div>

    <div class="zav-adm__modal" data-invoice-modal hidden>
      <div class="zav-adm__modal-card">
        <h3>🧾 Generate invoice</h3>
        <p class="zav-adm__lead-meta" data-invoice-client></p>
        <form data-invoice-form class="zav-adm__form">
          <input type="hidden" name="quoteId" />
          <input name="amount" type="number" min="0" step="0.01" placeholder="Amount" required />
          <input name="taxRate" type="number" min="0" step="0.01" placeholder="Tax %" />
          <input name="clientAddress" placeholder="Client address" />
          <textarea name="description" placeholder="Description"></textarea>
          <textarea name="notes" placeholder="Notes"></textarea>
          <div class="zav-adm__modal-actions">
            <button type="button" class="zav-adm__btn" data-invoice-cancel>Cancel</button>
            <button type="submit">Create invoice</button>
          </div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(root);

  const sharePanel = initAdminShare(root);

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
      document.body.classList.remove('admin-open');
      pinBuf = '';
      renderPin();
      return;
    }
    // Disable public-site custom cursor / floating effects while admin is open
    document.body.classList.add('admin-open');
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

  const emoji = (map, key) => map[key] || '✨';

  const renderBars = (selector, items, labelMap = {}, emojiMap = {}) => {
    const el = root.querySelector(selector);
    if (!el) return;
    if (!items?.length) {
      el.innerHTML = `<div class="zav-adm__empty">🫧 No data yet — waiting for leads.</div>`;
      return;
    }
    const max = Math.max(...items.map((i) => i.count), 1);
    el.innerHTML = items
      .slice(0, 6)
      .map((item) => {
        const pct = Math.round((item.count / max) * 100);
        const e = emoji(emojiMap, item.name);
        return `<div class="zav-adm__row">
          <div class="zav-adm__row-label">${e} ${escapeHtml(label(labelMap, item.name))}</div>
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
    const barMaxPx = 100;
    el.innerHTML = trend
      .map((t) => {
        const h = Math.max(4, Math.round((t.count / max) * barMaxPx));
        const day = t.date.slice(5);
        const tip = t.count > 0 ? '✨' : '';
        return `<div class="zav-adm__bar" title="${t.date}: ${t.count} leads">
          <div class="zav-adm__bar-fill" style="height:${h}px"></div>
          <small>${day}${tip}</small>
        </div>`;
      })
      .join('');
  };

  let inboxFilter = 'all';

  const invoiceHref = (invoiceId) => {
    const inv = (dashboard?.invoices || []).find((i) => i.id === invoiceId);
    if (!inv) return '#';
    const t = inv.accessToken ? `?t=${encodeURIComponent(inv.accessToken)}` : '';
    return `/invoice/${encodeURIComponent(inv.id)}${t}`;
  };

  const statusBadge = (status) => {
    const s = status || 'new';
    const cls =
      s === 'done' || s === 'paid'
        ? 'zav-adm__badge'
        : s === 'viewed' || s === 'sent'
          ? 'zav-adm__badge zav-adm__badge--gold'
          : 'zav-adm__badge zav-adm__badge--sky';
    const e = emoji(EMOJI.status, s);
    const text = s === 'viewed' ? 'in progress' : s;
    return `<span class="${cls}">${e} ${escapeHtml(text)}</span>`;
  };

  const leadRow = (q) => {
    const when = new Date(q.createdAt).toLocaleString();
    const service = label(SERVICE_LABEL, q.service);
    const freq = label(FREQ_LABEL, q.frequency);
    const loc = emoji(EMOJI.locale, q.locale) || '🌐';
    return `<tr>
      <td>🕐 ${escapeHtml(when)}</td>
      <td><div class="zav-adm__lead-name">👤 ${escapeHtml(q.name)}</div>
          <div class="zav-adm__lead-meta">📍 ${escapeHtml(q.zip || '')}</div></td>
      <td><span class="zav-adm__badge">${emoji(EMOJI.service, q.service)} ${escapeHtml(service)}</span></td>
      <td><span class="zav-adm__badge zav-adm__badge--gold">${emoji(EMOJI.freq, q.frequency)} ${escapeHtml(freq)}</span></td>
      <td>📞 ${escapeHtml(q.phone)}<div class="zav-adm__lead-meta">✉️ ${escapeHtml(q.email)}</div></td>
      <td><span class="zav-adm__badge zav-adm__badge--sky">${loc} ${escapeHtml(q.locale)}</span></td>
    </tr>`;
  };

  const inboxCard = (q) => {
    const service = label(SERVICE_LABEL, q.service);
    const size = label(SIZE_LABEL, q.size);
    const freq = label(FREQ_LABEL, q.frequency);
    const status = q.status || 'new';
    return `<article class="zav-adm__card zav-adm__card--${escapeHtml(status)}" data-status="${escapeHtml(status)}">
      <div class="zav-adm__card-top">
        <div>
          <div class="zav-adm__lead-name">👤 ${escapeHtml(q.name)}</div>
          <div class="zav-adm__lead-meta">🕐 ${new Date(q.createdAt).toLocaleString()} · 📍 ${escapeHtml(q.zip || '')}</div>
        </div>
        ${statusBadge(status)}
      </div>
      <div class="zav-adm__card-meta">
        <span class="zav-adm__badge">${emoji(EMOJI.service, q.service)} ${escapeHtml(service)}</span>
        <span class="zav-adm__badge zav-adm__badge--gold">${emoji(EMOJI.size, q.size)} ${escapeHtml(size)}</span>
        <span class="zav-adm__badge zav-adm__badge--sky">${emoji(EMOJI.freq, q.frequency)} ${escapeHtml(freq)}</span>
      </div>
      ${q.preferredDate ? `<p class="zav-adm__card-notes zav-adm__card-schedule">📅 ${escapeHtml(q.preferredDate)} · ${escapeHtml(q.preferredSlot || '')}</p>` : ''}
      <p class="zav-adm__card-notes">${q.notes ? `💬 ${escapeHtml(q.notes)}` : '💬 No notes'}</p>
      <div class="zav-adm__card-contact">
        <a class="zav-adm__contact-pill" href="tel:${escapeHtml(q.phone)}">📞 ${escapeHtml(q.phone)}</a>
        <a class="zav-adm__contact-pill" href="mailto:${escapeHtml(q.email)}">✉️ ${escapeHtml(q.email)}</a>
        <a class="zav-adm__contact-pill zav-adm__contact-pill--wa" href="https://wa.me/${escapeHtml(String(q.phone).replace(/\D/g, ''))}" target="_blank" rel="noopener">💬 WhatsApp</a>
      </div>
      <div class="zav-adm__card-actions">
        ${status === 'new' ? `<button type="button" class="zav-adm__btn" data-act="viewed" data-id="${escapeHtml(q.id)}">👀 Mark viewed</button>` : ''}
        ${status !== 'done' ? `<button type="button" class="zav-adm__btn" data-act="done" data-id="${escapeHtml(q.id)}">✅ Work done</button>` : ''}
        <button type="button" class="zav-adm__btn zav-adm__btn--accent" data-act="invoice" data-id="${escapeHtml(q.id)}">🧾 Generate invoice</button>
        ${q.invoiceId ? `<a class="zav-adm__btn" href="${invoiceHref(q.invoiceId)}" target="_blank">📄 Open invoice</a>` : ''}
      </div>
    </article>`;
  };

  const renderInbox = (quotes) => {
    const el = root.querySelector('[data-inbox]');
    if (!el) return;
    const list = (quotes || []).filter((q) => inboxFilter === 'all' || (q.status || 'new') === inboxFilter);
    el.innerHTML = list.length
      ? list.map(inboxCard).join('')
      : `<div class="zav-adm__empty">📭 No requests in this tray.</div>`;
  };

  const fillBillingForm = (billing) => {
    const form = root.querySelector('[data-billing-form]');
    if (!form || !billing) return;
    for (const [key, value] of Object.entries(billing)) {
      setFormValue(form, key, value);
    }
  };

  function renderDashboard(data) {
    dashboard = data;
    const k = data.kpis || {};
    setText('[data-m="visits"]', k.visits ?? 0);
    setText('[data-m="unique"]', `${k.uniqueVisitors ?? 0} unique`);
    setText('[data-m="leads"]', k.leads ?? 0);
    setText('[data-m="leads-today"]', `${k.leadsToday ?? 0} today`);
    setText('[data-m="leads-week"]', `${k.leadsWeek ?? 0} leads / 7d`);
    setText('[data-m="conversion"]', `${k.conversion ?? 0}%`);
    setText('[data-m="homes"]', k.homes ?? 0);
    setText('[data-m="homes-2"]', `${k.homes ?? 0} published`);
    setText('[data-m="inbox-new"]', k.inboxNew ?? 0);
    setText('[data-m="inbox-viewed"]', k.inboxViewed ?? 0);
    setText('[data-m="inbox-done"]', k.inboxDone ?? 0);
    setText('[data-m="invoices-count"]', k.invoices ?? 0);

    renderTrend(data.trend || []);
    renderBars('[data-top-services]', data.breakdown?.service || [], SERVICE_LABEL, EMOJI.service);
    renderInbox(data.quotes || []);
    fillBillingForm(data.billing);

    const badge = root.querySelector('[data-m="inbox-badge"]');
    const newCount = k.inboxNew ?? 0;
    if (badge) {
      if (newCount > 0) {
        badge.hidden = false;
        badge.textContent = String(newCount);
      } else {
        badge.hidden = true;
      }
    }

    const liveStatus = root.querySelector('[data-live-status]');
    if (liveStatus) {
      liveStatus.textContent = newCount > 0
        ? `🔔 ${newCount} new notification${newCount === 1 ? '' : 's'}`
        : '✨ Live ops';
    }

    const preview = root.querySelector('[data-quotes-preview]');
    if (preview) {
      const quotes = data.quotes || [];
      preview.innerHTML = quotes.length
        ? quotes.slice(0, 8).map((q) => leadRow(q)).join('')
        : `<tr><td colspan="6" class="zav-adm__empty">📭 No leads yet.</td></tr>`;
    }

    const invBody = root.querySelector('[data-invoices]');
    if (invBody) {
      const invoices = data.invoices || [];
      invBody.innerHTML = invoices.length
        ? invoices
            .map((inv) => {
              const plan = inv.recurring
                ? `${label(FREQ_LABEL, inv.frequency)} · C${inv.cycle || 1}`
                : 'One-time';
              const next = inv.nextInvoiceAt
                ? new Date(inv.nextInvoiceAt).toLocaleDateString()
                : '—';
              const due = inv.recurring && inv.nextInvoiceAt && new Date(inv.nextInvoiceAt).getTime() <= Date.now();
              return `<tr>
                <td>🧾 ${escapeHtml(inv.number)}${inv.recurring ? ' <span class="zav-adm__badge">🔁 REC</span>' : ''}</td>
                <td>👤 ${escapeHtml(inv.clientName)}</td>
                <td><span class="zav-adm__badge zav-adm__badge--gold">${emoji(EMOJI.freq, inv.frequency)} ${escapeHtml(plan)}</span></td>
                <td>💵 ${escapeHtml(String(inv.total))} ${escapeHtml(inv.currency || '')}</td>
                <td>${statusBadge(inv.status)}</td>
                <td>📅 ${escapeHtml(next)}${due ? ' <span class="zav-adm__badge zav-adm__badge--sky">⏰ DUE</span>' : ''}</td>
                <td class="zav-adm__card-actions">
                  <a class="zav-adm__btn" href="${invoiceHref(inv.id)}" target="_blank">📄 Open</a>
                  ${inv.recurring && inv.nextInvoiceAt ? `<button type="button" class="zav-adm__btn zav-adm__btn--accent" data-act="next-cycle" data-id="${escapeHtml(inv.id)}">🔁 Next cycle</button>` : ''}
                </td>
              </tr>`;
            })
            .join('')
        : `<tr><td colspan="7" class="zav-adm__empty">🧾 No invoices yet. Generate from Inbox.</td></tr>`;
    }

    const clientsBody = root.querySelector('[data-clients]');
    if (clientsBody) {
      const clients = data.clients || [];
      clientsBody.innerHTML = clients.length
        ? clients
            .map(
              (c) => `<tr>
                <td class="zav-adm__lead-name">⭐ ${escapeHtml(c.name)}</td>
                <td>📍 ${escapeHtml(c.city)}</td>
                <td><span class="zav-adm__badge">🫧 ${escapeHtml(c.service)}</span></td>
                <td>${'⭐'.repeat(c.rating || 5)}</td>
                <td>📅 ${escapeHtml(c.date)}</td>
                <td>💬 ${escapeHtml(c.blurb)}</td>
              </tr>`,
            )
            .join('')
        : `<tr><td colspan="6" class="zav-adm__empty">🏡 No client stories yet.</td></tr>`;
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
    refreshMailStatus().catch(() => {});
  }

  const setTab = (id) => {
    root.querySelectorAll('.zav-adm__tab').forEach((t) => {
      t.classList.toggle('is-active', t.getAttribute('data-tab') === id);
    });
    root.querySelectorAll('.zav-adm__pane').forEach((p) => {
      p.classList.toggle('is-active', p.getAttribute('data-pane') === id);
    });
    if (id === 'share') sharePanel?.open?.();
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

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const patchQuote = async (id, status) => {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('patch');
    await loadMetrics();
  };

  const invoiceModal = root.querySelector('[data-invoice-modal]');
  const invoiceForm = root.querySelector('[data-invoice-form]');
  const invoiceClient = root.querySelector('[data-invoice-client]');

  const setFormValue = (form, name, value) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (el) el.value = value ?? '';
  };

  const openInvoiceModal = (quoteId) => {
    const quote = (dashboard?.quotes || []).find((q) => q.id === quoteId);
    if (!quote || !invoiceForm) return;
    setFormValue(invoiceForm, 'quoteId', quoteId);
    setFormValue(
      invoiceForm,
      'description',
      `${label(SERVICE_LABEL, quote.service)} · ${label(SIZE_LABEL, quote.size)} · ${label(FREQ_LABEL, quote.frequency)}`,
    );
    setFormValue(invoiceForm, 'clientAddress', quote.zip || '');
    setFormValue(invoiceForm, 'taxRate', dashboard?.billing?.defaultTaxRate ?? 0);
    setFormValue(invoiceForm, 'amount', '');
    setFormValue(invoiceForm, 'notes', '');
    if (invoiceClient) invoiceClient.textContent = `${quote.name} · ${quote.email} · ${quote.phone}`;
    invoiceModal?.removeAttribute('hidden');
  };

  const closeInvoiceModal = () => invoiceModal?.setAttribute('hidden', '');

  root.querySelector('[data-invoice-cancel]')?.addEventListener('click', closeInvoiceModal);

  invoiceForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(invoiceForm);
    const payload = {
      quoteId: String(fd.get('quoteId') || ''),
      amount: Number(fd.get('amount') || 0),
      taxRate: Number(fd.get('taxRate') || 0),
      description: String(fd.get('description') || ''),
      clientAddress: String(fd.get('clientAddress') || ''),
      notes: String(fd.get('notes') || ''),
      notifyClient: true,
    };
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) return;
    const data = await res.json();
    closeInvoiceModal();
    await loadMetrics();
    if (data.invoice?.id) {
      const t = data.invoice.accessToken ? `?t=${encodeURIComponent(data.invoice.accessToken)}` : '';
      window.open(`/invoice/${data.invoice.id}${t}`, '_blank', 'noopener');
    }
  });

  root.querySelector('[data-invoices]')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act="next-cycle"]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (!id) return;
    btn.setAttribute('disabled', 'true');
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ action: 'next_cycle', invoiceId: id, notifyClient: true }),
      });
      const data = await res.json();
      await loadMetrics();
      if (data.invoice?.id) {
        const t = data.invoice.accessToken ? `?t=${encodeURIComponent(data.invoice.accessToken)}` : '';
        window.open(`/invoice/${data.invoice.id}${t}`, '_blank', 'noopener');
      }
    } catch {
      /* ignore */
    } finally {
      btn.removeAttribute('disabled');
    }
  });

  root.querySelector('[data-inbox]')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const act = btn.getAttribute('data-act');
    if (!id || !act) return;
    try {
      if (act === 'viewed') await patchQuote(id, 'viewed');
      if (act === 'done') await patchQuote(id, 'done');
      if (act === 'invoice') openInvoiceModal(id);
    } catch {
      /* ignore */
    }
  });

  root.querySelectorAll('[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => {
      inboxFilter = chip.getAttribute('data-filter') || 'all';
      root.querySelectorAll('[data-filter]').forEach((c) => {
        c.classList.toggle('is-active', c === chip);
      });
      renderInbox(dashboard?.quotes || []);
    });
  });

  const billingForm = root.querySelector('[data-billing-form]');
  const billingMsg = root.querySelector('[data-billing-msg]');
  billingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(billingForm);
    const payload = Object.fromEntries(fd.entries());
    payload.defaultTaxRate = Number(payload.defaultTaxRate || 0);
    const res = await fetch('/api/billing', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    if (billingMsg) {
      billingMsg.textContent = res.ok ? 'Billing data saved.' : 'Could not save billing data.';
    }
    if (res.ok) loadMetrics().catch(() => {});
  });

  const mailStatusEl = root.querySelector('[data-mail-status]');
  const mailMsgEl = root.querySelector('[data-mail-msg]');

  const refreshMailStatus = async () => {
    try {
      const res = await fetch('/api/mail/test', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!mailStatusEl) return;
      if (data.verify?.ok) {
        const from = data.status?.from ? ` · from ${data.status.from}` : '';
        const host = data.status?.host ? ` (${data.status.provider || 'smtp'}:${data.status.port})` : '';
        mailStatusEl.textContent = `✅ Mail active${from}${host}`;
        mailStatusEl.classList.add('is-ok');
        mailStatusEl.classList.remove('is-err');
      } else {
        const hint = data.verify?.hint || data.verify?.error || 'Check server mail settings.';
        mailStatusEl.textContent = `⚠️ ${hint}`;
        mailStatusEl.classList.add('is-err');
        mailStatusEl.classList.remove('is-ok');
      }
    } catch {
      if (mailStatusEl) {
        mailStatusEl.textContent = '⚠️ Mail status unavailable.';
        mailStatusEl.classList.add('is-err');
      }
    }
  };

  root.querySelector('[data-mail-check]')?.addEventListener('click', () => {
    if (mailMsgEl) mailMsgEl.textContent = 'Checking…';
    refreshMailStatus().then(() => {
      if (mailMsgEl) mailMsgEl.textContent = '';
    });
  });

  root.querySelector('[data-mail-test]')?.addEventListener('click', async () => {
    if (mailMsgEl) mailMsgEl.textContent = 'Sending test…';
    const res = await fetch('/api/mail/test', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (mailMsgEl) {
      mailMsgEl.textContent = data.ok
        ? `✅ Test sent to ${data.to || 'admin'}`
        : `❌ ${data.error || 'Test failed'}`;
      mailMsgEl.classList.toggle('is-ok', Boolean(data.ok));
      mailMsgEl.classList.toggle('is-err', !data.ok);
    }
    refreshMailStatus();
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
