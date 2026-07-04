import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.ZAV_DATA_DIR || path.join(process.cwd(), 'data');

export type QuoteStatus = 'new' | 'viewed' | 'done';

export type Quote = {
  id: string;
  createdAt: string;
  service: string;
  size: string;
  frequency: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  notes?: string;
  locale: string;
  userAgent?: string;
  status?: QuoteStatus;
  completedAt?: string;
  invoiceId?: string;
};

export type BillingProfile = {
  businessName: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  taxId: string;
  website: string;
  invoicePrefix: string;
  defaultTaxRate: number;
  currency: string;
  notes: string;
};

export type Invoice = {
  id: string;
  quoteId: string;
  number: string;
  createdAt: string;
  status: 'draft' | 'sent' | 'paid';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  service: string;
  description: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  notes?: string;
  billingSnapshot: BillingProfile;
};

export type ClientWork = {
  id: string;
  name: string;
  city: string;
  service: string;
  blurb: string;
  rating: number;
  date: string;
  featured?: boolean;
};

export type Metrics = {
  visits: number;
  quotes: number;
  uniqueVisitors: number;
  lastVisitAt: string | null;
  lastQuoteAt: string | null;
};

const defaultMetrics: Metrics = {
  visits: 0,
  quotes: 0,
  uniqueVisitors: 0,
  lastVisitAt: null,
  lastQuoteAt: null,
};

const seedClients: ClientWork[] = [
  {
    id: 'c1',
    name: 'Maria G.',
    city: 'Harrisburg, PA',
    service: 'Deep cleaning',
    blurb: 'My home finally feels like a boutique hotel. Spotless and calm.',
    rating: 5,
    date: '2026-05-12',
    featured: true,
  },
  {
    id: 'c2',
    name: 'James & Ana',
    city: 'Lancaster, PA',
    service: 'Home cleaning',
    blurb: 'Weekly service that never misses a detail. Highly recommend.',
    rating: 5,
    date: '2026-04-28',
    featured: true,
  },
  {
    id: 'c3',
    name: 'Sofia R.',
    city: 'York, PA',
    service: 'Move-out',
    blurb: 'Got our full deposit back. Professional and on time.',
    rating: 5,
    date: '2026-03-19',
  },
  {
    id: 'c4',
    name: 'Daniel K.',
    city: 'Carlisle, PA',
    service: 'Interior refresh',
    blurb: 'They reset the whole living room vibe. Clean architecture energy.',
    rating: 5,
    date: '2026-02-08',
  },
];

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const full = path.join(DATA_DIR, file);
  try {
    const raw = await fs.readFile(full, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    await fs.writeFile(full, JSON.stringify(fallback, null, 2), 'utf8');
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureDataDir();
  const full = path.join(DATA_DIR, file);
  const tmp = `${full}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmp, full);
}

export async function getMetrics(): Promise<Metrics> {
  return readJson<Metrics>('metrics.json', defaultMetrics);
}

export async function trackVisit(visitorKey?: string | null): Promise<Metrics> {
  const metrics = await getMetrics();
  metrics.visits += 1;
  metrics.lastVisitAt = new Date().toISOString();

  if (visitorKey) {
    const visitors = await readJson<string[]>('visitors.json', []);
    if (!visitors.includes(visitorKey)) {
      visitors.push(visitorKey);
      // keep last 50k keys
      const trimmed = visitors.slice(-50_000);
      await writeJson('visitors.json', trimmed);
      metrics.uniqueVisitors = trimmed.length;
    } else {
      metrics.uniqueVisitors = visitors.length;
    }
  }

  await writeJson('metrics.json', metrics);
  return metrics;
}

const defaultBilling: BillingProfile = {
  businessName: 'ZAV Interior & Clean',
  legalName: 'ZAV Interior & Clean',
  email: 'hello@zavinteriorclean.com',
  phone: '(717) 415-6171',
  address: '',
  city: '',
  taxId: '',
  website: 'https://zavinteriorclean.com',
  invoicePrefix: 'ZAV',
  defaultTaxRate: 0,
  currency: 'USD',
  notes: 'Thank you for trusting ZAV Interior & Clean.',
};

export async function getQuotes(): Promise<Quote[]> {
  const quotes = await readJson<Quote[]>('quotes.json', []);
  return quotes.map((q) => ({
    ...q,
    status: q.status || 'new',
  }));
}

export async function addQuote(input: Omit<Quote, 'id' | 'createdAt' | 'status'>): Promise<Quote> {
  const quotes = await getQuotes();
  const quote: Quote = {
    ...input,
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  quotes.unshift(quote);
  await writeJson('quotes.json', quotes.slice(0, 2000));

  const metrics = await getMetrics();
  metrics.quotes = quotes.length;
  metrics.lastQuoteAt = quote.createdAt;
  await writeJson('metrics.json', metrics);

  // Best-effort Insforge sync
  try {
    const { insforgeUpsert, quoteToInsforgeRow } = await import('./insforge');
    await insforgeUpsert('zav_quotes', quoteToInsforgeRow(quote as unknown as Record<string, unknown>));
  } catch {
    /* offline ok */
  }

  return quote;
}

export async function updateQuote(
  id: string,
  patch: Partial<Pick<Quote, 'status' | 'completedAt' | 'invoiceId' | 'notes'>>,
): Promise<Quote | null> {
  const quotes = await getQuotes();
  const idx = quotes.findIndex((q) => q.id === id);
  if (idx < 0) return null;
  quotes[idx] = { ...quotes[idx], ...patch };
  await writeJson('quotes.json', quotes);

  try {
    const { insforgeUpsert, quoteToInsforgeRow } = await import('./insforge');
    await insforgeUpsert('zav_quotes', quoteToInsforgeRow(quotes[idx] as unknown as Record<string, unknown>));
  } catch {
    /* offline ok */
  }

  return quotes[idx];
}

export async function getBilling(): Promise<BillingProfile> {
  return readJson<BillingProfile>('billing.json', defaultBilling);
}

export async function saveBilling(profile: BillingProfile): Promise<BillingProfile> {
  const next = { ...defaultBilling, ...profile };
  await writeJson('billing.json', next);
  try {
    const { insforgeUpsert } = await import('./insforge');
    await insforgeUpsert('zav_billing', {
      id: 'default',
      business_name: next.businessName,
      legal_name: next.legalName,
      email: next.email,
      phone: next.phone,
      address: next.address,
      city: next.city,
      tax_id: next.taxId,
      website: next.website,
      invoice_prefix: next.invoicePrefix,
      default_tax_rate: next.defaultTaxRate,
      currency: next.currency,
      notes: next.notes,
      updated_at: new Date().toISOString(),
    });
  } catch {
    /* offline ok */
  }
  return next;
}

export async function getInvoices(): Promise<Invoice[]> {
  return readJson<Invoice[]>('invoices.json', []);
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const invoices = await getInvoices();
  return invoices.find((i) => i.id === id) || null;
}

export async function createInvoiceFromQuote(
  quoteId: string,
  overrides: Partial<{
    amount: number;
    taxRate: number;
    description: string;
    clientAddress: string;
    notes: string;
  }> = {},
): Promise<Invoice | null> {
  const quotes = await getQuotes();
  const quote = quotes.find((q) => q.id === quoteId);
  if (!quote) return null;

  const billing = await getBilling();
  const invoices = await getInvoices();
  const seq = invoices.length + 1;
  const amount = Number(overrides.amount ?? 0);
  const taxRate = Number(overrides.taxRate ?? billing.defaultTaxRate ?? 0);
  const tax = Math.round(amount * (taxRate / 100) * 100) / 100;
  const total = Math.round((amount + tax) * 100) / 100;

  const invoice: Invoice = {
    id: `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    quoteId: quote.id,
    number: `${billing.invoicePrefix}-${String(seq).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
    status: 'draft',
    clientName: quote.name,
    clientEmail: quote.email,
    clientPhone: quote.phone,
    clientAddress: overrides.clientAddress || quote.zip,
    service: quote.service,
    description:
      overrides.description ||
      `${quote.service} · ${quote.size} · ${quote.frequency}`,
    amount,
    tax,
    total,
    currency: billing.currency || 'USD',
    notes: overrides.notes || billing.notes,
    billingSnapshot: billing,
  };

  invoices.unshift(invoice);
  await writeJson('invoices.json', invoices.slice(0, 2000));

  await updateQuote(quote.id, {
    status: 'done',
    completedAt: new Date().toISOString(),
    invoiceId: invoice.id,
  });

  try {
    const { insforgeUpsert, invoiceToInsforgeRow } = await import('./insforge');
    await insforgeUpsert('zav_invoices', invoiceToInsforgeRow(invoice as unknown as Record<string, unknown>));
  } catch {
    /* offline ok */
  }

  return invoice;
}

export async function updateInvoice(
  id: string,
  patch: Partial<Invoice>,
): Promise<Invoice | null> {
  const invoices = await getInvoices();
  const idx = invoices.findIndex((i) => i.id === id);
  if (idx < 0) return null;

  const current = invoices[idx];
  const amount = patch.amount ?? current.amount;
  const tax = patch.tax ?? current.tax;
  const total =
    patch.total ??
    Math.round((Number(amount) + Number(tax)) * 100) / 100;

  invoices[idx] = {
    ...current,
    ...patch,
    amount: Number(amount),
    tax: Number(tax),
    total,
  };
  await writeJson('invoices.json', invoices);

  try {
    const { insforgeUpsert, invoiceToInsforgeRow } = await import('./insforge');
    await insforgeUpsert(
      'zav_invoices',
      invoiceToInsforgeRow(invoices[idx] as unknown as Record<string, unknown>),
    );
  } catch {
    /* offline ok */
  }

  return invoices[idx];
}

export async function getClients(): Promise<ClientWork[]> {
  return readJson<ClientWork[]>('clients.json', seedClients);
}

export async function saveClients(clients: ClientWork[]) {
  await writeJson('clients.json', clients);
}

export async function getPublicStats() {
  const [metrics, clients] = await Promise.all([getMetrics(), getClients()]);
  return {
    visits: metrics.visits,
    quotes: metrics.quotes,
    clients: clients.length,
    uniqueVisitors: metrics.uniqueVisitors,
  };
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const d = startOfDay();
  d.setDate(d.getDate() - n);
  return d;
}

function countBy(items: Quote[], key: keyof Quote) {
  const map: Record<string, number> = {};
  for (const item of items) {
    const k = String(item[key] || 'unknown');
    map[k] = (map[k] || 0) + 1;
  }
  return Object.entries(map)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

function leadsPerDay(quotes: Quote[], days = 14) {
  const buckets: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = daysAgo(i);
    const key = d.toISOString().slice(0, 10);
    buckets.push({ date: key, count: 0 });
  }
  const index = Object.fromEntries(buckets.map((b, i) => [b.date, i]));
  for (const q of quotes) {
    const key = q.createdAt.slice(0, 10);
    if (key in index) buckets[index[key]].count += 1;
  }
  return buckets;
}

export async function getDashboard() {
  const [metrics, quotes, clients, invoices, billing] = await Promise.all([
    getMetrics(),
    getQuotes(),
    getClients(),
    getInvoices(),
    getBilling(),
  ]);

  let insforge = {
    enabled: false,
    connected: false,
    endpoint: '',
    error: 'unchecked',
    checkedAt: new Date().toISOString(),
  };
  try {
    const { probeInsforge } = await import('./insforge');
    insforge = await probeInsforge();
  } catch {
    /* ignore */
  }

  const now = Date.now();
  const day = startOfDay().getTime();
  const week = daysAgo(7).getTime();
  const month = daysAgo(30).getTime();

  const leadsToday = quotes.filter((q) => new Date(q.createdAt).getTime() >= day).length;
  const leadsWeek = quotes.filter((q) => new Date(q.createdAt).getTime() >= week).length;
  const leadsMonth = quotes.filter((q) => new Date(q.createdAt).getTime() >= month).length;

  const inboxNew = quotes.filter((q) => (q.status || 'new') === 'new').length;
  const inboxViewed = quotes.filter((q) => q.status === 'viewed').length;
  const inboxDone = quotes.filter((q) => q.status === 'done').length;

  const visits = metrics.visits || 0;
  const leads = quotes.length;
  const conversion = visits > 0 ? Math.round((leads / visits) * 1000) / 10 : 0;

  return {
    metrics,
    kpis: {
      visits,
      uniqueVisitors: metrics.uniqueVisitors,
      leads,
      leadsToday,
      leadsWeek,
      leadsMonth,
      homes: clients.length,
      conversion,
      lastVisitAt: metrics.lastVisitAt,
      lastLeadAt: metrics.lastQuoteAt,
      inboxNew,
      inboxViewed,
      inboxDone,
      invoices: invoices.length,
    },
    breakdown: {
      service: countBy(quotes, 'service'),
      size: countBy(quotes, 'size'),
      frequency: countBy(quotes, 'frequency'),
      locale: countBy(quotes, 'locale'),
    },
    trend: leadsPerDay(quotes, 14),
    quotes,
    clients,
    invoices,
    billing,
    insforge,
    generatedAt: new Date(now).toISOString(),
  };
}
