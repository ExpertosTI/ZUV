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
    title: 'ZAV Interior & Clean | Home Cleaning & Free Estimates in Pennsylvania',
    description:
      'Professional home cleaning, deep cleaning, move-in/out, and interior refresh in Pennsylvania. Book a free estimate online. 10% off your first cleaning. Call (717) 415-6171.',
    keywords:
      'home cleaning Pennsylvania, house cleaning Harrisburg, deep cleaning PA, free cleaning estimate, move out cleaning, ZAV Interior Clean, residential cleaning',
    ogLocale: 'en_US',
  },
  es: {
    title: 'ZAV Interior & Clean | Limpieza del hogar y cotización gratis en Pennsylvania',
    description:
      'Limpieza profesional del hogar, limpieza profunda, mudanzas y refresco de interiores en Pennsylvania. Cotización gratis en línea. 10% en tu primera limpieza. (717) 415-6171.',
    keywords:
      'limpieza del hogar Pennsylvania, limpieza profunda, cotización gratis limpieza, mudanza limpieza, ZAV Interior Clean',
    ogLocale: 'es_US',
  },
  pt: {
    title: 'ZAV Interior & Clean | Limpeza residencial e orçamento grátis na Pennsylvania',
    description:
      'Limpeza residencial profissional, limpeza profunda, mudança e refresh de interiores na Pennsylvania. Orçamento grátis online. 10% na primeira limpeza. (717) 415-6171.',
    keywords:
      'limpeza residencial Pennsylvania, limpeza profunda, orçamento grátis limpeza, ZAV Interior Clean',
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
    areaServed: {
      '@type': 'State',
      name: 'Pennsylvania',
    },
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'PA',
      addressCountry: 'US',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: PHONE_E164,
        contactType: 'customer service',
        areaServed: 'US',
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
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Home cleaning' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Deep cleaning' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Move-in / move-out cleaning' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Interior refresh' } },
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
        name: 'Do you offer free estimates?',
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
          text: 'Home cleaning, deep cleaning, move-in/move-out cleaning, and interior refresh services across Pennsylvania.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a discount for first-time customers?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Enjoy 10% off your first home cleaning.',
        },
      },
    ],
  };
}
