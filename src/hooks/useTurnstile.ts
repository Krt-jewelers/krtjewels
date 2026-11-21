import { useCallback, useEffect, useRef, useState } from 'react';
import { loadTurnstile, type TurnstileApi } from '@/lib/turnstile';

// off:         the check is switched off on the server
// loading:     the widget is starting or working in the background
// ready:       a token is waiting to be used
// interactive: Cloudflare wants the visitor to tick the box
// unavailable: Cloudflare's script could not be loaded
export type TurnstileState = 'off' | 'loading' | 'ready' | 'interactive' | 'unavailable';

// Renders a Turnstile widget into the element passed to `containerRef`. It is
// invisible unless Cloudflare needs the visitor to tick a box. Each token works
// once, so every token is handed out once and the widget then starts on the
// next one in the background.
export function useTurnstile(siteKey: string | null, action = 'checkout') {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [state, setStateValue] = useState<TurnstileState>(siteKey ? 'loading' : 'off');
  const stateRef = useRef<TurnstileState>(state);
  const api = useRef<TurnstileApi | null>(null);
  const widget = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiters = useRef<((value: string | null) => void)[]>([]);

  const setState = useCallback((next: TurnstileState) => {
    stateRef.current = next;
    setStateValue(next);
  }, []);

  const handOut = useCallback((value: string) => {
    token.current = null;
    if (stateRef.current === 'ready') setState('loading');
    // Start on the next token, after Turnstile has finished handing this one over.
    setTimeout(() => {
      if (api.current && widget.current) api.current.reset(widget.current);
    }, 0);
    return value;
  }, [setState]);

  useEffect(() => {
    if (!siteKey) {
      setState('off');
      return;
    }
    if (!container) return;
    let cancelled = false;
    setState('loading');
    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        api.current = turnstile;
        widget.current = turnstile.render(container, {
          sitekey: siteKey,
          action,
          theme: 'light',
          appearance: 'interaction-only',
          // "flexible" needs at least 300px.
          size: container.clientWidth >= 300 ? 'flexible' : 'compact',
          callback: (value) => {
            const next = waiters.current.shift();
            if (next) {
              next(handOut(value));
            } else {
              token.current = value;
              setState('ready');
            }
          },
          'expired-callback': () => {
            token.current = null;
            setState('loading');
          },
          // Turnstile retries on its own; a token may still come.
          'error-callback': () => {
            token.current = null;
            setState('loading');
          },
          'before-interactive-callback': () => setState('interactive'),
          'after-interactive-callback': () => setState('loading'),
        }) ?? null;
      })
      .catch(() => {
        if (!cancelled) setState('unavailable');
      });
    return () => {
      cancelled = true;
      if (api.current && widget.current) api.current.remove(widget.current);
      widget.current = null;
      token.current = null;
    };
  }, [siteKey, container, action, handOut, setState]);

  // A fresh token, or null if none came within `timeoutMs` (or the check is off).
  const getToken = useCallback(
    (timeoutMs = 30000): Promise<string | null> => {
      if (!siteKey) return Promise.resolve(null);
      const ready = token.current;
      if (ready && api.current && widget.current && !api.current.isExpired(widget.current)) {
        return Promise.resolve(handOut(ready));
      }
      return new Promise((resolve) => {
        // Called only later, from Turnstile's callback, once `timer` is set.
        const waiter = (value: string | null) => {
          clearTimeout(timer);
          resolve(value);
        };
        const timer = setTimeout(() => {
          waiters.current = waiters.current.filter((w) => w !== waiter);
          resolve(null);
        }, timeoutMs);
        waiters.current.push(waiter);
      });
    },
    [siteKey, handOut],
  );

  return {
    containerRef: setContainer,
    state,
    // The state right now (`state` above is as of the last render).
    currentState: () => stateRef.current,
    getToken,
  };
}
