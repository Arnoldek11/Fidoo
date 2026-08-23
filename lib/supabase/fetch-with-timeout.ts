/**
 * Supabase's auth endpoint has been observed hanging for 60s+ with no
 * response on flaky connections. Every Supabase client in this app is on
 * the request path for a page load (middleware, Server Components, Server
 * Actions), so an unbounded call anywhere freezes that load rather than
 * just failing one request. Pass as `global.fetch` to createServerClient /
 * createBrowserClient so a network blip degrades to a fast failure instead
 * of an indefinite hang.
 */
export function fetchWithTimeout(url: RequestInfo | URL, options?: RequestInit) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
}
