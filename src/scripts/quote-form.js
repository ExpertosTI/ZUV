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
    card.addEventListener('click', () => {
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
  }

  btnBack?.addEventListener('click', () => go(step - 1));
  btnNext?.addEventListener('click', () => {
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

    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('fail');

      form.classList.add('hidden');
      successEl?.classList.remove('hidden');
      root.querySelector('.step-dot')?.parentElement?.classList.add('hidden');
      stepLabel?.classList.add('hidden');
      document.dispatchEvent(new CustomEvent('zav:quote-submitted'));
    } catch {
      setError(
        locale === 'es'
          ? 'Algo salió mal. Inténtalo de nuevo.'
          : locale === 'pt'
            ? 'Algo deu errado. Tente novamente.'
            : 'Something went wrong. Please try again.',
      );
    } finally {
      if (btnSubmit instanceof HTMLButtonElement) btnSubmit.disabled = false;
      if (label) label.textContent = defaultLabel;
    }
  });

  btnAgain?.addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.choice-card').forEach((c) => c.classList.remove('is-selected'));
    form.classList.remove('hidden');
    successEl?.classList.add('hidden');
    root.querySelector('.step-dot')?.parentElement?.classList.remove('hidden');
    stepLabel?.classList.remove('hidden');
    go(1);
  });

  render();
}
