export type Locale = 'en' | 'es' | 'pt';

export const LOCALES: Locale[] = ['en', 'es', 'pt'];
export const DEFAULT_LOCALE: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
  pt: 'PT',
};

const messages = {
  en: {
    brand: 'ZAV Interior & Clean',
    tagline: 'Homes that feel alive — and stay immaculate.',
    offer: 'Enjoy 10% off your first home cleaning',
    navQuote: 'Free estimate',
    navWork: 'Our work',
    navMetrics: 'Live stats',
    navMenu: 'Menu',
    navClose: 'Close',
    whatsapp: 'WhatsApp',
    whatsappCta: 'Chat on WhatsApp',
    whatsappMsg:
      'Hi ZAV Interior & Clean! I would like a free estimate for home cleaning.',
    heroTitle: 'Your one-stop home care shop',
    heroSub:
      'See how easy it is to quote, book, and love a cleaner, calmer home.',
    heroCta: 'Get my free estimate',
    heroPhone: 'Or call',
    heroBadge: 'Spotless living',
    heroCardTitle: 'Interior & Clean',
    heroCardBody: 'Architecture of calm, details that move.',
    heroFloat: 'Free estimates',
    formTitle: 'Get a free estimate',
    formSub: 'A few quick steps — no commitment.',
    stepOf: 'Step {n} of {total}',
    step1Title: 'What do you need?',
    step2Title: 'How big is your home?',
    step3Title: 'How often?',
    step4Title: 'Where can we reach you?',
    services: {
      home: 'Home cleaning',
      deep: 'Deep cleaning',
      move: 'Move-in / move-out',
      interior: 'Interior refresh',
    },
    sizes: {
      studio: 'Studio / 1 bed',
      small: '2 bedrooms',
      medium: '3 bedrooms',
      large: '4+ bedrooms',
    },
    frequencies: {
      once: 'One-time',
      biweekly: 'Every 2 weeks',
      weekly: 'Weekly',
      monthly: 'Monthly',
    },
    fields: {
      name: 'Full name',
      phone: 'Phone',
      email: 'Email',
      zip: 'ZIP code',
      notes: 'Anything we should know? (optional)',
    },
    placeholders: {
      name: 'Alex Rivera',
      phone: '(717) 555-0100',
      email: 'you@email.com',
      zip: '17000',
      notes: 'Pets, access codes, focus areas…',
    },
    back: 'Back',
    next: 'Continue',
    submit: 'Request free estimate',
    submitting: 'Sending…',
    successTitle: 'You are on the list!',
    successBody:
      'Thanks — send your request on WhatsApp so we can reply faster.',
    successWhatsapp: 'Send on WhatsApp',
    successAgain: 'Request another estimate',
    metricsTitle: 'Trusted in real homes',
    metricsVisits: 'Visits',
    metricsQuotes: 'Quotes requested',
    metricsClients: 'Homes we have cared for',
    feedTitle: 'Homes we have transformed',
    feedSub: 'Real clients. Real results.',
    feedEmpty: 'New transformations coming soon.',
    contactTitle: 'Free estimates',
    contactPhone: '(717) 415-6171',
    contactIg: '@ZAVINTERIORCLEAN',
    contactEmail: 'HELLO@ZAVINTERIORCLEAN.COM',
    footerRights: 'All rights reserved.',
    langLabel: 'Language',
    errorGeneric: 'Something went wrong. Please try again.',
    required: 'This field is required',
  },
  es: {
    brand: 'ZAV Interior & Clean',
    tagline: 'Hogares que se sienten vivos — e impecables.',
    offer: 'Disfruta 10% de descuento en tu primera limpieza',
    navQuote: 'Cotización gratis',
    navWork: 'Nuestro trabajo',
    navMetrics: 'Estadísticas',
    navMenu: 'Menú',
    navClose: 'Cerrar',
    whatsapp: 'WhatsApp',
    whatsappCta: 'Escribir por WhatsApp',
    whatsappMsg:
      '¡Hola ZAV Interior & Clean! Quiero una cotización gratis de limpieza.',
    heroTitle: 'Tu hogar, en un solo lugar',
    heroSub:
      'Cotiza, agenda y enamórate de un hogar más limpio y en calma.',
    heroCta: 'Quiero mi cotización gratis',
    heroPhone: 'O llama al',
    heroBadge: 'Vivir impecable',
    heroCardTitle: 'Interior & Clean',
    heroCardBody: 'Arquitectura de calma, detalles que se mueven.',
    heroFloat: 'Estimados gratis',
    formTitle: 'Cotización gratis',
    formSub: 'Unos pasos rápidos — sin compromiso.',
    stepOf: 'Paso {n} de {total}',
    step1Title: '¿Qué necesitas?',
    step2Title: '¿Qué tan grande es tu hogar?',
    step3Title: '¿Con qué frecuencia?',
    step4Title: '¿Cómo te contactamos?',
    services: {
      home: 'Limpieza del hogar',
      deep: 'Limpieza profunda',
      move: 'Mudanza (entrada / salida)',
      interior: 'Refresco de interiores',
    },
    sizes: {
      studio: 'Estudio / 1 habitación',
      small: '2 habitaciones',
      medium: '3 habitaciones',
      large: '4+ habitaciones',
    },
    frequencies: {
      once: 'Una vez',
      biweekly: 'Cada 2 semanas',
      weekly: 'Semanal',
      monthly: 'Mensual',
    },
    fields: {
      name: 'Nombre completo',
      phone: 'Teléfono',
      email: 'Correo',
      zip: 'Código postal',
      notes: '¿Algo que debamos saber? (opcional)',
    },
    placeholders: {
      name: 'Alex Rivera',
      phone: '(717) 555-0100',
      email: 'tu@email.com',
      zip: '17000',
      notes: 'Mascotas, códigos de acceso, áreas prioritarias…',
    },
    back: 'Atrás',
    next: 'Continuar',
    submit: 'Pedir cotización gratis',
    submitting: 'Enviando…',
    successTitle: '¡Listo!',
    successBody:
      'Gracias — envía tu solicitud por WhatsApp para responderte más rápido.',
    successWhatsapp: 'Enviar por WhatsApp',
    successAgain: 'Pedir otra cotización',
    metricsTitle: 'Confianza en hogares reales',
    metricsVisits: 'Visitas',
    metricsQuotes: 'Cotizaciones',
    metricsClients: 'Hogares atendidos',
    feedTitle: 'Hogares que transformamos',
    feedSub: 'Clientes reales. Resultados reales.',
    feedEmpty: 'Pronto nuevas transformaciones.',
    contactTitle: 'Estimados gratis',
    contactPhone: '(717) 415-6171',
    contactIg: '@ZAVINTERIORCLEAN',
    contactEmail: 'HELLO@ZAVINTERIORCLEAN.COM',
    footerRights: 'Todos los derechos reservados.',
    langLabel: 'Idioma',
    errorGeneric: 'Algo salió mal. Inténtalo de nuevo.',
    required: 'Este campo es obligatorio',
  },
  pt: {
    brand: 'ZAV Interior & Clean',
    tagline: 'Lares que parecem vivos — e impecáveis.',
    offer: 'Aproveite 10% de desconto na sua primeira limpeza',
    navQuote: 'Orçamento grátis',
    navWork: 'Nosso trabalho',
    navMetrics: 'Estatísticas',
    navMenu: 'Menu',
    navClose: 'Fechar',
    whatsapp: 'WhatsApp',
    whatsappCta: 'Falar no WhatsApp',
    whatsappMsg:
      'Olá ZAV Interior & Clean! Quero um orçamento grátis de limpeza.',
    heroTitle: 'Tudo para o seu lar, em um só lugar',
    heroSub:
      'Veja como é fácil orçar, agendar e amar um lar mais limpo e calmo.',
    heroCta: 'Quero meu orçamento grátis',
    heroPhone: 'Ou ligue',
    heroBadge: 'Viver impecável',
    heroCardTitle: 'Interior & Clean',
    heroCardBody: 'Arquitetura de calma, detalhes que se movem.',
    heroFloat: 'Orçamentos grátis',
    formTitle: 'Orçamento grátis',
    formSub: 'Poucos passos — sem compromisso.',
    stepOf: 'Passo {n} de {total}',
    step1Title: 'Do que você precisa?',
    step2Title: 'Qual o tamanho do seu lar?',
    step3Title: 'Com que frequência?',
    step4Title: 'Como podemos falar com você?',
    services: {
      home: 'Limpeza residencial',
      deep: 'Limpeza profunda',
      move: 'Mudança (entrada / saída)',
      interior: 'Refresh de interiores',
    },
    sizes: {
      studio: 'Studio / 1 quarto',
      small: '2 quartos',
      medium: '3 quartos',
      large: '4+ quartos',
    },
    frequencies: {
      once: 'Uma vez',
      biweekly: 'A cada 2 semanas',
      weekly: 'Semanal',
      monthly: 'Mensal',
    },
    fields: {
      name: 'Nome completo',
      phone: 'Telefone',
      email: 'E-mail',
      zip: 'CEP / ZIP',
      notes: 'Algo que devemos saber? (opcional)',
    },
    placeholders: {
      name: 'Alex Rivera',
      phone: '(717) 555-0100',
      email: 'voce@email.com',
      zip: '17000',
      notes: 'Pets, códigos de acesso, áreas prioritárias…',
    },
    back: 'Voltar',
    next: 'Continuar',
    submit: 'Pedir orçamento grátis',
    submitting: 'Enviando…',
    successTitle: 'Pronto!',
    successBody:
      'Obrigado — envie seu pedido no WhatsApp para respondermos mais rápido.',
    successWhatsapp: 'Enviar no WhatsApp',
    successAgain: 'Pedir outro orçamento',
    metricsTitle: 'Confiança em lares reais',
    metricsVisits: 'Visitas',
    metricsQuotes: 'Orçamentos',
    metricsClients: 'Lares atendidos',
    feedTitle: 'Lares que transformamos',
    feedSub: 'Clientes reais. Resultados reais.',
    feedEmpty: 'Novas transformações em breve.',
    contactTitle: 'Orçamentos grátis',
    contactPhone: '(717) 415-6171',
    contactIg: '@ZAVINTERIORCLEAN',
    contactEmail: 'HELLO@ZAVINTERIORCLEAN.COM',
    footerRights: 'Todos os direitos reservados.',
    langLabel: 'Idioma',
    errorGeneric: 'Algo deu errado. Tente novamente.',
    required: 'Este campo é obrigatório',
  },
} as const;

export type Messages = (typeof messages)['en'];

export function t(locale: Locale): Messages {
  return messages[locale] ?? messages.en;
}

export function detectLocale(header?: string | null, cookie?: string | null): Locale {
  if (cookie && LOCALES.includes(cookie as Locale)) return cookie as Locale;

  const raw = (header || '').toLowerCase();
  if (raw.startsWith('es')) return 'es';
  if (raw.startsWith('pt')) return 'pt';
  if (raw.startsWith('en')) return 'en';

  const parts = raw.split(',');
  for (const part of parts) {
    const code = part.trim().slice(0, 2);
    if (code === 'es') return 'es';
    if (code === 'pt') return 'pt';
    if (code === 'en') return 'en';
  }

  return DEFAULT_LOCALE;
}

export function formatStep(template: string, n: number, total: number) {
  return template.replace('{n}', String(n)).replace('{total}', String(total));
}
