/** Shared schedule helpers for quotes and reminders. */

export const SLOT_HOURS: Record<string, number> = {
  morning: 9,
  midday: 12,
  afternoon: 15,
  evening: 18,
};

export const SLOT_LABELS: Record<string, Record<string, string>> = {
  en: {
    morning: 'Morning · 9:00 AM',
    midday: 'Midday · 12:00 PM',
    afternoon: 'Afternoon · 3:00 PM',
    evening: 'Evening · 6:00 PM',
  },
  es: {
    morning: 'Mañana · 9:00 AM',
    midday: 'Mediodía · 12:00 PM',
    afternoon: 'Tarde · 3:00 PM',
    evening: 'Noche · 6:00 PM',
  },
  pt: {
    morning: 'Manhã · 9:00 AM',
    midday: 'Meio-dia · 12:00 PM',
    afternoon: 'Tarde · 3:00 PM',
    evening: 'Noite · 6:00 PM',
  },
};

export function buildScheduledAt(date: string, slot: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const hour = SLOT_HOURS[slot];
  if (hour === undefined) return null;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d, hour, 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  // Must be at least ~12h in the future
  if (dt.getTime() < Date.now() + 6 * 60 * 60 * 1000) return null;
  return dt.toISOString();
}

export function formatSchedule(date: string, slot: string, locale = 'en') {
  const labels = SLOT_LABELS[locale] || SLOT_LABELS.en;
  const slotLabel = labels[slot] || slot;
  try {
    const pretty = new Date(`${date}T12:00:00`).toLocaleDateString(
      locale === 'es' ? 'es-US' : locale === 'pt' ? 'pt-BR' : 'en-US',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    );
    return `${pretty} · ${slotLabel}`;
  } catch {
    return `${date} · ${slotLabel}`;
  }
}

/** Reminders fire when appointment is within this window (default 24h). */
export const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;
