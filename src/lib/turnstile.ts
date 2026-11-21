// Cloudflare Turnstile in the browser. Cloudflare's script is loaded only on
// pages that need it (checkout), and only when the server says the check is on.

export interface TurnstileRenderOptions {
  sitekey: string;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'flexible' | 'compact';
  appearance?: 'always' | 'execute' | 'interaction-only';
  execution?: 'render' | 'execute';
  'refresh-expired'?: 'auto' | 'manual' | 'never';
  callback?: (token: string) => void;
  'error-callback'?: (code: string) => boolean | void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
}

export interface TurnstileApi {
  render(container: HTMLElement | string, options: TurnstileRenderOptions): string | null | undefined;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
  getResponse(widgetId?: string): string | undefined;
  isExpired(widgetId?: string): boolean;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let loading: Promise<TurnstileApi> | null = null;

export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile did not start')));
    script.onerror = () => {
      // Allow a later attempt (for example after the connection comes back).
      loading = null;
      script.remove();
      reject(new Error('Turnstile could not be loaded'));
    };
    document.head.appendChild(script);
  });
  return loading;
}
