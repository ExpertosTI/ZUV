/**
 * Admin Share tab — QR codes and share actions for ZAV links.
 */

const WA_PHONE = '17174156171';
const EMAIL = 'hello@zavinteriorclean.com';
const INSTAGRAM = 'https://instagram.com/zavinteriorclean';

const COPY = {
  home: {
    label: 'Sitio web',
    hint: 'Página principal — ideal para tarjetas y volantes',
    message:
      'ZAV Interior & Clean — professional house & office cleaning in Orlando and Central Florida. Visit:',
  },
  quote: {
    label: 'Cotización gratis',
    hint: 'Directo al formulario — el mejor para captar leads',
    message:
      'Pide tu cotización gratis de limpieza con ZAV Interior & Clean. 10% en tu primera limpieza:',
  },
  whatsapp: {
    label: 'WhatsApp',
    hint: 'Abre chat con mensaje prellenado al escanear',
    message:
      'Hola, me interesa una cotización de limpieza con ZAV Interior & Clean en Orlando / Central Florida.',
  },
};

function siteBase() {
  const origin = window.location.origin.replace(/\/$/, '');
  if (origin && origin !== 'null' && !origin.startsWith('file:')) return origin;
  return 'https://zavinteriorclean.com';
}

function buildTarget(id) {
  const base = siteBase();
  if (id === 'home') return { id, url: `${base}/`, ...COPY.home };
  if (id === 'quote') return { id, url: `${base}/#quote`, ...COPY.quote };
  const text = COPY.whatsapp.message;
  return {
    id: 'whatsapp',
    url: `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`,
    ...COPY.whatsapp,
  };
}

function flashMsg(el, text, ok = true) {
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('is-ok', ok);
  el.classList.toggle('is-err', !ok);
  clearTimeout(flashMsg._t);
  flashMsg._t = setTimeout(() => {
    el.textContent = '';
    el.classList.remove('is-ok', 'is-err');
  }, 2200);
}

async function copyText(text, msgEl) {
  try {
    await navigator.clipboard.writeText(text);
    flashMsg(msgEl, 'Copiado al portapapeles');
    return true;
  } catch {
    flashMsg(msgEl, 'No se pudo copiar', false);
    return false;
  }
}

let qrLib = null;

async function drawQr(canvas, url) {
  if (!qrLib) qrLib = await import('qrcode');
  await qrLib.toCanvas(canvas, url, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#1b3a5c', light: '#ffffff' },
  });
}

export function initAdminShare(root) {
  const mount = root.querySelector('[data-share-root]');
  if (!mount || mount.dataset.ready) return;
  mount.dataset.ready = '1';

  mount.innerHTML = `
    <div class="zav-adm__share-layout">
      <section class="zav-adm__panel zav-adm__share-picker">
        <h3>📣 ¿Qué compartir? <span>elige el destino del QR</span></h3>
        <div class="zav-adm__share-targets" data-share-targets></div>
      </section>

      <section class="zav-adm__panel zav-adm__share-qr">
        <h3>📱 Código QR <span>listo para imprimir o guardar</span></h3>
        <div class="zav-adm__qr-wrap">
          <canvas data-share-canvas width="280" height="280" aria-label="Código QR"></canvas>
        </div>
        <p class="zav-adm__share-url" data-share-url></p>
        <p class="zav-adm__share-hint" data-share-hint></p>
      </section>

      <section class="zav-adm__panel zav-adm__share-actions">
        <h3>🚀 Compartir <span>copiar, enviar o descargar</span></h3>
        <div class="zav-adm__share-grid">
          <button type="button" class="zav-adm__share-btn" data-share-action="copy-link">🔗 Copiar enlace</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="copy-message">📋 Copiar mensaje</button>
          <button type="button" class="zav-adm__share-btn zav-adm__share-btn--accent" data-share-action="whatsapp">💬 WhatsApp</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="email">✉️ Email</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="sms">📱 SMS</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="native" hidden data-share-native>📤 Compartir…</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="facebook">📘 Facebook</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="instagram">📸 Instagram</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="download">⬇️ Descargar QR</button>
          <button type="button" class="zav-adm__share-btn" data-share-action="print">🖨️ Imprimir QR</button>
        </div>
        <p class="zav-adm__msg" data-share-msg></p>
      </section>
    </div>
  `;

  const targetsEl = mount.querySelector('[data-share-targets]');
  const canvas = mount.querySelector('[data-share-canvas]');
  const urlEl = mount.querySelector('[data-share-url]');
  const hintEl = mount.querySelector('[data-share-hint]');
  const msgEl = mount.querySelector('[data-share-msg]');
  const nativeBtn = mount.querySelector('[data-share-native]');

  if (navigator.share) nativeBtn.hidden = false;

  const targetIds = ['quote', 'home', 'whatsapp'];
  const targetEmoji = { quote: '📝', home: '🏠', whatsapp: '💬' };
  let activeId = 'quote';
  let active = buildTarget(activeId);
  let qrBusy = false;

  targetsEl.innerHTML = targetIds
    .map((id) => {
      const t = buildTarget(id);
      return `<button type="button" class="zav-adm__share-target" data-share-id="${id}">
        <strong>${targetEmoji[id] || '✨'} ${t.label}</strong>
        <span>${t.hint}</span>
      </button>`;
    })
    .join('');

  const renderTargets = () => {
    targetsEl.querySelectorAll('[data-share-id]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute('data-share-id') === activeId);
    });
  };

  const fullMessage = () => {
    if (activeId === 'whatsapp') return active.message;
    return `${active.message}\n${active.url}`;
  };

  const refreshQr = async () => {
    if (qrBusy || !canvas) return;
    qrBusy = true;
    canvas.classList.add('is-loading');
    try {
      await drawQr(canvas, active.url);
      if (urlEl) urlEl.textContent = active.url;
      if (hintEl) hintEl.textContent = active.hint;
    } catch {
      flashMsg(msgEl, 'No se pudo generar el QR', false);
    } finally {
      canvas.classList.remove('is-loading');
      qrBusy = false;
    }
  };

  const selectTarget = (id) => {
    activeId = id;
    active = buildTarget(id);
    renderTargets();
    refreshQr();
  };

  targetsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-share-id]');
    if (!btn) return;
    selectTarget(btn.getAttribute('data-share-id'));
  });

  mount.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-share-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-share-action');

    if (action === 'copy-link') {
      await copyText(active.url, msgEl);
      return;
    }
    if (action === 'copy-message') {
      await copyText(fullMessage(), msgEl);
      return;
    }
    if (action === 'whatsapp') {
      const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(fullMessage())}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action === 'email') {
      const subject = encodeURIComponent('ZAV Interior & Clean — cotización gratis');
      const body = encodeURIComponent(fullMessage());
      window.location.href = `mailto:${EMAIL}?subject=${subject}&body=${body}`;
      return;
    }
    if (action === 'sms') {
      const body = encodeURIComponent(fullMessage());
      window.location.href = `sms:+${WA_PHONE}?body=${body}`;
      return;
    }
    if (action === 'native') {
      try {
        await navigator.share({
          title: 'ZAV Interior & Clean',
          text: fullMessage(),
          url: activeId === 'whatsapp' ? active.url : active.url,
        });
        flashMsg(msgEl, 'Compartido');
      } catch (err) {
        if (err?.name !== 'AbortError') flashMsg(msgEl, 'No se pudo compartir', false);
      }
      return;
    }
    if (action === 'facebook') {
      const shareUrl = activeId === 'whatsapp' ? siteBase() : active.url;
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        '_blank',
        'noopener,noreferrer,width=600,height=520',
      );
      return;
    }
    if (action === 'instagram') {
      window.open(INSTAGRAM, '_blank', 'noopener,noreferrer');
      flashMsg(msgEl, 'Perfil de Instagram abierto — pega el enlace en tu bio o stories');
      return;
    }
    if (action === 'download') {
      try {
        const link = document.createElement('a');
        link.download = `zav-qr-${activeId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        flashMsg(msgEl, 'QR descargado');
      } catch {
        flashMsg(msgEl, 'No se pudo descargar', false);
      }
      return;
    }
    if (action === 'print') {
      const dataUrl = canvas.toDataURL('image/png');
      const w = window.open('', '_blank', 'noopener,noreferrer,width=480,height=640');
      if (!w) {
        flashMsg(msgEl, 'Permite ventanas emergentes para imprimir', false);
        return;
      }
      w.document.write(`<!DOCTYPE html><html><head><title>ZAV QR</title>
        <style>body{font-family:system-ui,sans-serif;text-align:center;padding:24px}
        img{width:280px;height:280px}p{color:#444;font-size:13px;word-break:break-all}</style></head>
        <body><h1>ZAV Interior &amp; Clean</h1><img src="${dataUrl}" alt="QR" />
        <p>${active.label}</p><p>${active.url}</p>
        <script>window.onload=function(){window.print();}</script></body></html>`);
      w.document.close();
    }
  });

  renderTargets();
  refreshQr();

  return {
    refresh: refreshQr,
    open: () => refreshQr(),
  };
}
