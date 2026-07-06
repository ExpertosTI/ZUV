/** Fire-and-forget visit ping — keeps SSR free of blocking file I/O. */
export function trackPageVisit() {
  const body = JSON.stringify({});

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon('/api/visit', blob)) return;
  }

  fetch('/api/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
