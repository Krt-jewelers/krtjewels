import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './AuthProvider';

/**
 * Shared auth state. Backed by a single <AuthProvider> so every page and the
 * admin panel see the same session instantly (no per-page re-checks/flashes).
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
