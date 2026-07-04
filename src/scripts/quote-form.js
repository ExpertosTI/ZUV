const WA_PHONE = '17174156171';

const SERVICE = {
  en: { home: 'Home cleaning', deep: 'Deep cleaning', move: 'Move-in / move-out', interior: 'Interior refresh' },
  es: { home: 'Limpieza del hogar', deep: 'Limpieza profunda', move: 'Mudanza', interior: 'Refresco de interiores' },
  pt: { home: 'Limpeza residencial', deep: 'Limpeza profunda', move: 'Mudança', interior: 'Refresh de interiores' },
};

const SIZE = {
  en: { studio: 'Studio / 1 bed', small: '2 bedrooms', medium: '3 bedrooms', large: '4+ bedrooms' },
  es: { studio: 'Estudio / 1 hab', small: '2 habitaciones', medium: '3 habitaciones', large: '4+ habitaciones' },
  pt: { studio: 'Studio / 1 quarto', small: '2 quartos', medium: '3 quartos', large: '4+ quartos' },
};

const FREQ = {
  en: { once: 'One-time', biweekly: 'Every 2 weeks', weekly: 'Weekly', monthly: 'Monthly' },
  es: { once: 'Una vez', biweekly: 'Cada 2 semanas', weekly: 'Semanal', monthly: 'Mensual' },
  pt: { once: 'Uma vez', biweekly: 'A cada 2 semanas', weekly: 'Semanal', monthly: 'Mensal' },
};

function buildWhatsAppMessage(payload, locale) {
  const L = SERVICE[locale] || SERVICE.en;
  const S = SIZE[locale] || SIZE.en;
  const F = FREQ[locale] || FREQ.en;
  const intro =
    locale === 'es'
      ? '¡Hola ZAV Interior & Clean! Quiero una cotización gratis:'
      : locale === 'pt'
        ? 'Olá ZAV Interior & Clean! Quero um orçamento grátis:'
        : 'Hi ZAV Interior & Clean! I would like a free estimate:';

  return [
    intro,
    '',
    `• ${locale === 'es' ? 'Servicio' : locale === 'pt' ? 'Serviço' : 'Service'}: ${L[payload.service] || payload.service}`,
    `• ${locale === 'es' ? 'Hogar' : locale === 'pt' ? 'Lar' : 'Home'}: ${S[payload.size] || payload.size}`,
    `• ${locale === 'es' ? 'Frecuencia' : locale === 'pt' ? 'Frequência' : 'Frequency'}: ${F[payload.frequency] || payload.frequency}`,
    `• ${locale === 'es' ? 'Nombre' : locale === 'pt' ? 'Nome' : 'Name'}: ${payload.name}`,
    `• ${locale === 'es' ? 'Teléfono' : locale === 'pt' ? 'Telefone' : 'Phone'}: ${payload.phone}`,
    `• Email: ${payload.email}`,
    `• ZIP: ${payload.zip}`,
    payload.notes ? `• Notes: ${payload.notes}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function whatsappQuoteUrl(payload, locale) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(buildWhatsAppMessage(payload, locale))}`;
}

export function initQuoteWizard() {
  const root = document.getElementById('quote-wizard');
  const form = document.getElementById('quote-form');
  if (!root || !(form instanceof HTMLFormElement)) return;

  const total = Number(root.dataset.total || 4);
  const locale = root.dataset.locale || 'en';
  const panels = [...form.querySelectorAll('.step-panel')];
  const dots = [...root.querySelectorAll('[data-step-dot]')];
  const stepLabel = document.getElementById('step-label');
  const btnBack = document.getElementById('btn-back');
  const btnNext = document.getElementById('btn-next');
  const btnSubmit = document.getElementById('btn-submit');
  const btnAgain = document.getElementById('btn-again');
  const btnWaQuote = document.getElementById('btn-wa-quote');
  const errorEl = document.getElementById('form-error');
  const successEl = document.getElementById('quote-success');

  let step = 1;

  const templates = {
    en: 'Step {n} of {total}',
    es: 'Paso {n} de {total}',
    pt: 'Passo {n} de {total}',
  };

  form.querySelectorAll('.choice-card').forEach((card) => {
    const input = card.querySelector('input[type="radio"]');
    if (!(input instanceof HTMLInputElement)) return;

    const sync = () => {
      const name = input.name;
      form.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
        radio.closest('.choice-card')?.classList.toggle('is-selected', radio.checked);
      });
    };

    input.addEventListener('change', sync);
    card.addEventListener('click', (e) => {
      e.preventDefault();
      input.checked = true;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (step < total) {
        setTimeout(() => go(step + 1), 180);
      }
    });
  });

  function setError(msg) {
    if (!errorEl) return;
    if (!msg) {
      errorEl.classList.add('hidden');
      errorEl.textContent = '';
      return;
    }
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }

  function validateStep(n) {
    const panel = panels.find((p) => p.getAttribute('data-step') === String(n));
    if (!panel) return true;

    const required = [...panel.querySelectorAll('[required]')];
    for (const field of required) {
      if (field instanceof HTMLInputElement && field.type === 'radio') {
        const group = form.querySelector(`input[name="${field.name}"]:checked`);
        if (!group) {
          setError(locale === 'es' ? 'Elige una opción' : locale === 'pt' ? 'Escolha uma opção' : 'Please choose an option');
          return false;
        }
        continue;
      }
      if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
        if (!field.value.trim()) {
          field.focus();
          setError(locale === 'es' ? 'Este campo es obligatorio' : locale === 'pt' ? 'Este campo é obrigatório' : 'This field is required');
          return false;
        }
        if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
          field.focus();
          setError(locale === 'es' ? 'Correo inválido' : locale === 'pt' ? 'E-mail inválido' : 'Invalid email');
          return false;
        }
      }
    }
    setError('');
    return true;
  }

  function render() {
    panels.forEach((panel) => {
      const n = Number(panel.getAttribute('data-step'));
      panel.classList.toggle('hidden', n !== step);
    });

    dots.forEach((dot) => {
      const n = Number(dot.getAttribute('data-step-dot'));
      dot.classList.toggle('is-active', n === step);
      dot.classList.toggle('is-done', n < step);
    });

    if (stepLabel) {
      const tpl = templates[locale] || templates.en;
      stepLabel.textContent = tpl.replace('{n}', String(step)).replace('{total}', String(total));
    }

    btnBack?.classList.toggle('hidden', step === 1);
    btnNext?.classList.toggle('hidden', step === total);
    btnSubmit?.classList.toggle('hidden', step !== total);
  }

  function go(n) {
    step = Math.min(Math.max(n, 1), total);
    render();
    // keep actions above the WhatsApp FAB
    root.querySelector('.quote-actions')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function showSuccess(payload) {
    const wa = whatsappQuoteUrl(payload, locale);
    if (btnWaQuote instanceof HTMLAnchorElement) {
      btnWaQuote.href = wa;
    }
    form.classList.add('hidden');
    successEl?.classList.remove('hidden');
    root.querySelector('.step-dot')?.parentElement?.classList.add('hidden');
    stepLabel?.classList.add('hidden');
    document.dispatchEvent(new CustomEvent('zav:quote-submitted'));

    // Prefer WhatsApp app / web for the lead
    try {
      const opened = window.open(wa, '_blank', 'noopener,noreferrer');
      if (!opened) {
        // Popup blocked — keep the on-page WhatsApp button as primary CTA
        btnWaQuote?.focus();
      }
    } catch {
      btnWaQuote?.focus();
    }
  }

  btnBack?.addEventListener('click', (e) => {
    e.preventDefault();
    go(step - 1);
  });

  btnNext?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    go(step + 1);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(step)) return;

    const data = new FormData(form);
    const payload = {
      service: String(data.get('service') || ''),
      size: String(data.get('size') || ''),
      frequency: String(data.get('frequency') || ''),
      name: String(data.get('name') || '').trim(),
      phone: String(data.get('phone') || '').trim(),
      email: String(data.get('email') || '').trim(),
      zip: String(data.get('zip') || '').trim(),
      notes: String(data.get('notes') || '').trim(),
      locale,
    };

    const label = btnSubmit?.querySelector('[data-label-default]');
    const loading = label?.getAttribute('data-label-loading') || '…';
    const defaultLabel = label?.getAttribute('data-label-default') || 'Submit';

    if (btnSubmit instanceof HTMLButtonElement) btnSubmit.disabled = true;
    if (label) label.textContent = loading;
    setError('');

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // Even if API fails, still route the lead through WhatsApp
      if (!res.ok) {
        console.warn('[quote] API status', res.status);
      }
    } catch (err) {
      console.warn('[quote] API error', err);
    } finally {
      if (btnSubmit instanceof HTMLButtonElement) btnSubmit.disabled = false;
      if (label) label.textContent = defaultLabel;
      showSuccess(payload);
    }
  });

  btnAgain?.addEventListener('click', (e) => {
    e.preventDefault();
    form.reset();
    form.querySelectorAll('.choice-card').forEach((c) => c.classList.remove('is-selected'));
    form.classList.remove('hidden');
    successEl?.classList.add('hidden');
    root.querySelector('.step-dot')?.parentElement?.classList.remove('hidden');
    stepLabel?.classList.remove('hidden');
    if (btnWaQuote instanceof HTMLAnchorElement) btnWaQuote.href = '#';
    go(1);
  });

  render();
}
