import { defineMiddleware } from 'astro:middleware';

const STATIC_EXT = /\.(?:avif|webp|jpe?g|png|gif|svg|ico|css|js|woff2?|webmanifest)$/i;

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  const headers = new Headers(response.headers);
  const type = (headers.get('content-type') || '').toLowerCase();
  const ok = response.status >= 200 && response.status < 300;
  const isStaticPath = STATIC_EXT.test(context.url.pathname);

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  // Never long-cache miss/HTML responses for asset URLs — a deploy race can
  // pin a 404 HTML body under a .css/.js URL for a year (breaks the site).
  if (isStaticPath) {
    const looksLikeHtml = type.includes('text/html');
    if (!ok || looksLikeHtml) {
      headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
      headers.set('Pragma', 'no-cache');
      headers.set('Expires', '0');
      headers.set('Surrogate-Control', 'no-store');
    } else if (context.url.pathname.endsWith('admin-console.css')) {
      headers.set('Cache-Control', 'public, max-age=300');
    } else {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    }
  } else if (type.includes('text/html')) {
    headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate, max-age=0');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');
    headers.set('Surrogate-Control', 'no-store');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
});
