import { defineMiddleware } from 'astro:middleware';

const STATIC_EXT = /\.(?:avif|webp|jpe?g|png|gif|svg|ico|css|js|woff2?|webmanifest)$/i;

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  const type = headers.get('content-type') || '';
  if (STATIC_EXT.test(context.url.pathname)) {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  } else if (type.includes('text/html')) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
