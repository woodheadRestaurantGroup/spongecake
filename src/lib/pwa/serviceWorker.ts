/**
 * The service worker source, served by /sw.js with the deployment version
 * stamped in so every deploy installs a fresh worker.
 *
 * Caching rules (see PRD 8.4):
 * - Build assets and fonts: cache first.
 * - Images: stale-while-revalidate, capped.
 * - Pages and their RSC payloads: network first with a short timeout,
 *   falling back to the copy saved the last time they were opened, then to
 *   the offline page. Only recipes you have opened (or favourited) are saved.
 * - Admin, auth and API routes are never cached.
 */
export function buildServiceWorker(version: string): string {
  return `/* Spongecake service worker ${version} */
const VERSION = ${JSON.stringify(version)};
const SHELL = 'shell-' + VERSION;
const PAGES = 'pages-' + VERSION;
const RSC = 'rsc-' + VERSION;
const STATIC = 'static-v1';
const MEDIA = 'media-v1';
const OFFLINE_URL = '/offline';
const PAGE_TIMEOUT_MS = 3000;
const MEDIA_LIMIT = 300;
const BLOB_HOST = /\\.public\\.blob\\.vercel-storage\\.com$/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      await shell.add(new Request(OFFLINE_URL, { cache: 'reload' })).catch(() => {});
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, PAGES, RSC, STATIC, MEDIA]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'cache-recipes' && Array.isArray(data.urls)) {
    event.waitUntil(cacheRecipes(data.urls.slice(0, 50)));
  }
});

function stripRsc(url) {
  const u = new URL(url, self.location.origin);
  u.searchParams.delete('_rsc');
  return u.toString();
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

async function cacheRecipes(urls) {
  const pages = await caches.open(PAGES);
  const rsc = await caches.open(RSC);
  for (const url of urls) {
    try {
      const html = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'text/html' } });
      if (html.ok && !html.redirected) await pages.put(stripRsc(url), html.clone());
    } catch {}
    try {
      const payload = await fetch(url, { credentials: 'same-origin', headers: { RSC: '1' } });
      if (payload.ok && !payload.redirected) await rsc.put(stripRsc(url), payload.clone());
    } catch {}
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  const refresh = fetch(request)
    .then(async (res) => {
      if (res.ok || res.type === 'opaque') {
        await cache.put(request, res.clone());
        trim(cache, MEDIA_LIMIT);
      }
      return res;
    })
    .catch(() => undefined);
  return hit || (await refresh) || Response.error();
}

async function trim(cache, limit) {
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  for (const key of keys.slice(0, keys.length - limit)) await cache.delete(key);
}

async function networkFirst(request, cacheName, key, isPage) {
  const cache = await caches.open(cacheName);
  try {
    const res = await withTimeout(fetch(request), PAGE_TIMEOUT_MS);
    if (res.ok && !res.redirected) {
      cache.put(key, res.clone());
      return res;
    }
    if (res.status >= 500) {
      const hit = await cache.match(key, { ignoreVary: true });
      if (hit) return hit;
    }
    return res;
  } catch {
    const hit = await cache.match(key, { ignoreVary: true });
    if (hit) return hit;
    if (isPage) {
      const offline = await caches.match(OFFLINE_URL, { ignoreVary: true });
      if (offline) return offline;
    }
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (BLOB_HOST.test(url.hostname)) event.respondWith(staleWhileRevalidate(request, MEDIA));
    return;
  }

  const p = url.pathname;
  if (p === '/sw.js' || p.startsWith('/admin') || p.startsWith('/auth/') || p.startsWith('/sign-in')) return;
  if (p.startsWith('/api/') && !p.startsWith('/api/media/')) return;
  if (p.startsWith('/manifest.webmanifest') || p.startsWith('/pwa/')) return;

  if (p.startsWith('/_next/static/') || p.startsWith('/fonts/')) {
    event.respondWith(cacheFirst(request, STATIC));
    return;
  }
  if (p.startsWith('/api/media/') || p.startsWith('/_next/image')) {
    event.respondWith(staleWhileRevalidate(request, MEDIA));
    return;
  }
  if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
    event.respondWith(networkFirst(request, RSC, stripRsc(request.url), false));
    return;
  }
  const accept = request.headers.get('accept') || '';
  if (request.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(networkFirst(request, PAGES, stripRsc(request.url), true));
  }
});
`
}
