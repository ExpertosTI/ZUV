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
    title: 'ZAV Interior & Clean | House Cleaning in Orlando & Central Florida',
    description:
      'Professional house, office, deep, and move-in/out cleaning across Orlando and Central Florida. Free online estimates. 10% off your first cleaning. Call (717) 415-6171.',
    keywords:
      'house cleaning Orlando, home cleaning Central Florida, office cleaning Orlando FL, move out cleaning Orlando, deep cleaning Florida, free cleaning estimate Orlando, ZAV Interior Clean, residential cleaning Central Florida',
    ogLocale: 'en_US',
  },
  es: {
    title: 'ZAV Interior & Clean | Limpieza del hogar en Orlando y Central Florida',
    description:
      'Limpieza profesional del hogar, oficinas, profunda y mudanzas en Orlando y Central Florida. Cotización gratis en línea. 10% en tu primera limpieza. (717) 415-6171.',
    keywords:
      'limpieza del hogar Orlando, limpieza Central Florida, limpieza de oficinas Orlando, limpieza mudanza Florida, cotización gratis limpieza, ZAV Interior Clean',
    ogLocale: 'es_US',
  },
  pt: {
    title: 'ZAV Interior & Clean | Limpeza residencial em Orlando e Central Florida',
    description:
      'Limpeza residencial, escritórios, profunda e mudança em Orlando e Central Florida. Orçamento grátis online. 10% na primeira limpeza. (717) 415-6171.',
    keywords:
      'limpeza residencial Orlando, limpeza Central Florida, limpeza de escritório Orlando, limpeza de mudança Florida, orçamento grátis limpeza, ZAV Interior Clean',
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
      { '@type': 'AdministrativeArea', name: 'Central Florida' },
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
        areaServed: ['US-FL', 'Orlando', 'Central Florida'],
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
          text: `Yes. Request a free estimate online at ${SITE_URL} or call ${PHONE_DISPLAY}. We serve Orlando and Central Florida.`,
        },
      },
      {
        '@type': 'Question',
        name: 'What areas of Central Florida do you cover?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ZAV Interior & Clean serves Orlando and surrounding Central Florida communities with residential and office cleaning.',
        },
      },
      {
        '@type': 'Question',
        name: 'What cleaning services do you provide?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'House cleaning, office cleaning, deep cleaning, and move-in/move-out cleaning across Central Florida.',
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
