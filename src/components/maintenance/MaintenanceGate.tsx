import { ReactNode, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { MaintenancePage } from './MaintenancePage';

interface Props { children: ReactNode }

/** Paths that must always remain accessible even when maintenance is on. */
const ALWAYS_ALLOW = ['/admin', '/auth'];

export function MaintenanceGate({ children }: Props) {
  const { isAdmin, authReady } = useAuth();
  const location = useLocation();
  const { settings, isActive, expired, endsAtMs, now, isLoaded } = useMaintenanceMode();
  const wasActiveRef = useRef(false);

  const exempt = ALWAYS_ALLOW.some((p) => location.pathname.startsWith(p));

  // Track when we transition from active -> inactive (timer ended) to celebrate.
  useEffect(() => {
    if (isActive) {
      wasActiveRef.current = true;
      return;
    }
    if (wasActiveRef.current && expired && !exempt) {
      wasActiveRef.current = false;
      // Confetti burst!
      const fire = (ratio: number, opts: confetti.Options) => {
        confetti({
          particleCount: Math.floor(200 * ratio),
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#D4A84B', '#E8C57A', '#FFFFFF', '#7A3F2E'],
          ...opts,
        });
      };
      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.9 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [isActive, expired, exempt]);

  // While auth/maintenance settings haven't resolved yet, render children to avoid flash.
  if (!isLoaded || !authReady) return <>{children}</>;

  if (isActive && !isAdmin && !exempt) {
    return <MaintenancePage settings={settings} endsAtMs={endsAtMs} now={now} />;
  }

  return <>{children}</>;
}
