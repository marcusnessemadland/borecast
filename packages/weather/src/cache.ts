import type { DataState } from '@borecast/domain';

interface CacheEntry {
  body: string;
  expiresAt: number;
  fetchedAt: string;
  etag?: string;
  lastModified?: string;
}

export interface CachedText {
  body: string;
  fetchedAt: string;
  state: Extract<DataState, 'fresh' | 'cached' | 'stale'>;
}

const globalCache = globalThis as typeof globalThis & {
  __borecastProviderCache?: Map<string, CacheEntry>;
};
const cache = globalCache.__borecastProviderCache ?? new Map<string, CacheEntry>();
globalCache.__borecastProviderCache = cache;

function expiryFromHeaders(headers: Headers, fallbackSeconds: number): number {
  const cacheControl = headers.get('cache-control');
  const maxAge = cacheControl?.match(/max-age=(\d+)/i)?.[1];
  if (maxAge) return Date.now() + Number(maxAge) * 1000;
  const expires = headers.get('expires');
  const expiresAt = expires ? Date.parse(expires) : Number.NaN;
  return Number.isFinite(expiresAt) ? expiresAt : Date.now() + fallbackSeconds * 1000;
}

export async function fetchCachedText(
  key: string,
  url: URL,
  init: RequestInit,
  fallbackSeconds: number,
): Promise<CachedText> {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    return { body: existing.body, fetchedAt: existing.fetchedAt, state: 'cached' };
  }
  const headers = new Headers(init.headers);
  if (existing?.etag) headers.set('If-None-Match', existing.etag);
  if (existing?.lastModified) headers.set('If-Modified-Since', existing.lastModified);
  try {
    const response = await fetch(url, {
      ...init,
      headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    });
    if (response.status === 304 && existing) {
      existing.expiresAt = expiryFromHeaders(response.headers, fallbackSeconds);
      cache.set(key, existing);
      return { body: existing.body, fetchedAt: existing.fetchedAt, state: 'cached' };
    }
    if (!response.ok) throw new Error(`Upstream status ${response.status}`);
    const body = await response.text();
    const fetchedAt = new Date().toISOString();
    const entry: CacheEntry = {
      body,
      fetchedAt,
      expiresAt: expiryFromHeaders(response.headers, fallbackSeconds),
      ...(response.headers.get('etag') ? { etag: response.headers.get('etag')! } : {}),
      ...(response.headers.get('last-modified')
        ? { lastModified: response.headers.get('last-modified')! }
        : {}),
    };
    cache.set(key, entry);
    return { body, fetchedAt, state: 'fresh' };
  } catch (error) {
    if (existing) return { body: existing.body, fetchedAt: existing.fetchedAt, state: 'stale' };
    throw error;
  }
}
