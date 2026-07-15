import type { Locale } from '../i18n/messages';
import { EMAIL, INSTAGRAM, PHONE_DISPLAY, PHONE_E164 } from './contact';

export const SITE_URL = (process.env.PUBLIC_SITE_URL || 'https://zavinteriorclean.com').replace(
  /\/$/,
  '',
);

export const SITE_NAME = 'ZAV Interior & Clean';

export const SEO_COPY: Record<
  Locale,
  { title: string; description: string; keywords: string; ogLocale: string }
> = {
  en: {
    title: 'ZAV Interior & Clean | House Cleaning in Orlando, FL',
    description:
      'House, office, deep, and move-out cleaning in Orlando, FL. Free online estimate. 10% off your first cleaning.',
    keywords:
      'house cleaning Orlando FL, office cleaning Orlando, move out cleaning Orlando, deep cleaning Orlando, free cleaning estimate, ZAV Interior Clean',
    ogLocale: 'en_US',
  },
  es: {
    title: 'ZAV Interior & Clean | Limpieza del hogar en Orlando, FL',
    description:
      'Limpieza de hogar, oficinas, profunda y mudanzas en Orlando, FL. Cotización gratis en línea. 10% en la primera limpieza.',
    keywords:
      'limpieza del hogar Orlando FL, limpieza de oficinas Orlando, limpieza mudanza Orlando, cotización gratis limpieza, ZAV Interior Clean',
    ogLocale: 'es_US',
  },
  pt: {
    title: 'ZAV Interior & Clean | Limpeza residencial em Orlando, FL',
    description:
      'Limpeza residencial, escritórios, profunda e mudança em Orlando, FL. Orçamento grátis online. 10% na primeira limpeza.',
    keywords:
      'limpeza residencial Orlando FL, limpeza de escritório Orlando, limpeza de mudança Orlando, orçamento grátis limpeza, ZAV Interior Clean',
    ogLocale: 'pt_BR',
  },
};

export function absoluteUrl(path = '/') {
  if (path.startsWith('http')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildLocalBusinessJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    alternateName: 'ZAV Interior Clean',
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    image: [absoluteUrl('/logo.png'), absoluteUrl('/hero-bedroom.jpg')],
    description: SEO_COPY.en.description,
    telephone: PHONE_E164,
    email: EMAIL,
    priceRange: '$$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'Cash, Credit Card',
    areaServed: [
      { '@type': 'City', name: 'Orlando' },
      { '@type': 'State', name: 'Florida' },
    ],
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Orlando',
      addressRegion: 'FL',
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: PHONE_E164,
        contactType: 'customer service',
        areaServed: 'US-FL',
        availableLanguage: ['English', 'Spanish', 'Portuguese'],
      },
    ],
    sameAs: [INSTAGRAM],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cleaning services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'House cleaning' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Office cleaning' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Move-in / move-out cleaning' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Deep cleaning' } },
      ],
    },
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SEO_COPY.en.description,
    publisher: { '@id': `${SITE_URL}/#business` },
    inLanguage: ['en', 'es', 'pt'],
    potentialAction: {
      '@type': 'ReserveAction',
      target: `${SITE_URL}/#quote`,
      name: 'Request free estimate',
    },
  };
}

export function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do you offer free estimates in Orlando?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Yes. Request a free estimate online at ${SITE_URL} or call ${PHONE_DISPLAY}.`,
        },
      },
      {
        '@type': 'Question',
        name: 'What cleaning services do you provide?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'House cleaning, office cleaning, deep cleaning, and move-in/move-out cleaning in Orlando, FL.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a discount for first-time customers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. 10% off your first home cleaning.',
        },
      },
    ],
  };
}
