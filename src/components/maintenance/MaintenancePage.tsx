import { useEffect, useState } from 'react';
import { Construction, Clock } from 'lucide-react';
import type { MaintenanceSettings } from '@/hooks/useMaintenanceMode';

interface Props {
  settings: MaintenanceSettings;
  endsAtMs: number | null;
  now: number;
}

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d, h, m, s };
}

export function MaintenancePage({ settings, endsAtMs, now }: Props) {
  const remaining = endsAtMs ? endsAtMs - now : null;
  const t = remaining != null ? format(remaining) : null;

  useEffect(() => {
    const prev = document.title;
    document.title = `${settings.title} • KRT Jewellers`;
    return () => { document.title = prev; };
  }, [settings.title]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rich-black via-imli-brown to-rich-black text-ivory px-6 py-16 relative overflow-hidden">
      {/* Decorative gold orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative max-w-2xl text-center space-y-8 animate-fade-in">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/20 border border-gold/40 mx-auto">
          <Construction className="w-10 h-10 text-gold" />
        </div>

        <div className="space-y-3">
          <h1 className="font-serif text-4xl md:text-6xl text-gold leading-tight">
            {settings.title}
          </h1>
          <p className="text-base md:text-lg text-ivory/80 max-w-xl mx-auto">
            {settings.message}
          </p>
        </div>

        {t && (
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-sm text-ivory/70 uppercase tracking-widest">
              <Clock className="w-4 h-4" /> Returning in
            </div>
            <div className="flex justify-center gap-3 md:gap-5">
              {[
                { label: 'Days', value: t.d },
                { label: 'Hours', value: t.h },
                { label: 'Minutes', value: t.m },
                { label: 'Seconds', value: t.s },
              ].map((u) => (
                <div
                  key={u.label}
                  className="min-w-[64px] md:min-w-[88px] rounded-xl bg-ivory/5 border border-gold/30 backdrop-blur-sm px-3 py-4"
                >
                  <div className="font-serif text-3xl md:text-5xl text-gold">
                    {String(u.value).padStart(2, '0')}
                  </div>
                  <div className="text-[10px] md:text-xs uppercase tracking-widest text-ivory/60 mt-1">
                    {u.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 text-xs uppercase tracking-[0.3em] text-ivory/50">
          KRT Jewellers • Crafted with care
        </div>
      </div>
    </div>
  );
}
