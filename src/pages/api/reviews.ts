import type { APIRoute } from 'astro';
import { publicError, publicJson, rateLimit } from '../../lib/security';
import { addPublicReview } from '../../lib/store';

export const prerender = false;

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const ip = clientAddress || request.headers.get('x-forwarded-for') || 'unknown';
  if (!rateLimit(`review:${ip}`, 4, 60 * 60_000)) {
    return publicError('Too many reviews. Try again later.', 429);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return publicError('Invalid request', 400);
  }

  const name = String(body.name || '').trim().slice(0, 80);
  const city = String(body.city || '').trim().slice(0, 80);
  const service = String(body.service || '').trim().slice(0, 80);
  const blurb = String(body.blurb || '').trim().slice(0, 500);
  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5));

  if (!name || name.length < 2) return publicError('Name is required', 400);
  if (!city || city.length < 2) return publicError('City is required', 400);
  if (!blurb || blurb.length < 12) return publicError('Please write a longer review', 400);
  if (!service || service.length < 2) return publicError('Service is required', 400);

  // Light spam guard
  if (/https?:\/\/|www\.|<script/i.test(`${name} ${city} ${blurb}`)) {
    return publicError('Links are not allowed in reviews', 400);
  }

  const review = await addPublicReview({ name, city, service, blurb, rating });

  return publicJson(
    {
      ok: true,
      review: {
        id: review.id,
        name: review.name,
        city: review.city,
        service: review.service,
        blurb: review.blurb,
        rating: review.rating,
        date: review.date,
      },
    },
    201,
  );
};
