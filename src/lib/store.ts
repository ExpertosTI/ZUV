import { promises as fs } from 'node:fs';
import path from 'node:path';

const DATA_DIR = process.env.ZAV_DATA_DIR || path.join(process.cwd(), 'data');

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

export async function getQuotes(): Promise<Quote[]> {
  return readJson<Quote[]>('quotes.json', []);
}

export async function addQuote(input: Omit<Quote, 'id' | 'createdAt'>): Promise<Quote> {
  const quotes = await getQuotes();
  const quote: Quote = {
    ...input,
    id: `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  };
  quotes.unshift(quote);
  await writeJson('quotes.json', quotes.slice(0, 2000));

  const metrics = await getMetrics();
  metrics.quotes = quotes.length;
  metrics.lastQuoteAt = quote.createdAt;
  await writeJson('metrics.json', metrics);

  return quote;
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
  const [metrics, quotes, clients] = await Promise.all([
    getMetrics(),
    getQuotes(),
    getClients(),
  ]);

  const now = Date.now();
  const day = startOfDay().getTime();
  const week = daysAgo(7).getTime();
  const month = daysAgo(30).getTime();

  const leadsToday = quotes.filter((q) => new Date(q.createdAt).getTime() >= day).length;
  const leadsWeek = quotes.filter((q) => new Date(q.createdAt).getTime() >= week).length;
  const leadsMonth = quotes.filter((q) => new Date(q.createdAt).getTime() >= month).length;

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
    generatedAt: new Date(now).toISOString(),
  };
}
