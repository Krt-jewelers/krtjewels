/**
 * Retries backend requests that fail with a transient network error
 * ("Failed to fetch" on weak mobile connections) before giving up.
 * Only requests to the app's backend host are retried.
 */
export function installNetworkRetry() {
  if (typeof window === 'undefined' || (window as any).__krtFetchRetry) return;
  (window as any).__krtFetchRetry = true;

  const backendUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  if (!backendUrl) return;
  const backendHost = new URL(backendUrl).host;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    let isBackend = false;
    try { isBackend = new URL(url, window.location.href).host === backendHost; } catch { /* ignore */ }
    if (!isBackend) return originalFetch(input, init);

    // Request bodies (e.g. sign-in) must be re-creatable to retry.
    const canRetryBody = !init?.body || typeof init.body === 'string';
    const maxAttempts = canRetryBody && !(input instanceof Request) ? 3 : 1;

    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await originalFetch(input, init);
      } catch (err) {
        lastError = err;
        const aborted = init?.signal?.aborted || (err as Error)?.name === 'AbortError';
        if (aborted || attempt === maxAttempts - 1) break;
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      }
    }
    throw lastError;
  };
}
