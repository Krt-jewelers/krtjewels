import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMaintenanceMode, type MaintenanceSettings } from '@/hooks/useMaintenanceMode';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Clock, PartyPopper } from 'lucide-react';
import type { Json } from '@/integrations/supabase/types';

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function useLiveNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function CountdownTimer({ endsAtMs }: { endsAtMs: number | null }) {
  const now = useLiveNow();
  if (!endsAtMs) return null;
  const remaining = Math.max(0, endsAtMs - now);
  const total = Math.floor(remaining / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const units = [
    { label: 'Days', value: d },
    { label: 'Hours', value: h },
    { label: 'Minutes', value: m },
    { label: 'Seconds', value: s },
  ];

  return (
    <div className="flex items-center gap-2 pt-2">
      <Clock className="w-4 h-4 text-gold animate-pulse" />
      <div className="flex gap-1.5">
        {units.map((u) => (
          <div key={u.label} className="flex items-baseline gap-0.5">
            <span className="inline-block min-w-[22px] text-center font-mono text-sm font-semibold text-foreground bg-muted rounded px-1">
              {String(u.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{u.label.slice(0, 1)}</span>
          </div>
        ))}
      </div>
      <span className="text-xs text-muted-foreground">until auto-publish</span>
    </div>
  );
}

export default function AdminMaintenance() {
  const { settings, isActive, endsAtMs, now } = useMaintenanceMode();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<MaintenanceSettings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setForm(settings); }, [settings.enabled, settings.ends_at, settings.message, settings.title]);

  const save = async (next: MaintenanceSettings) => {
    setSaving(true);
    const value: Json = {
      enabled: next.enabled,
      ends_at: next.ends_at,
      message: next.message,
      title: next.title,
    };
    const { data: existing } = await supabase
      .from('site_settings').select('id').eq('key', 'maintenance_mode').maybeSingle();
    const res = existing
      ? await supabase.from('site_settings').update({ value, updated_at: new Date().toISOString() }).eq('key', 'maintenance_mode')
      : await supabase.from('site_settings').insert([{ key: 'maintenance_mode', value, description: 'Site maintenance mode' }]);
    setSaving(false);
    if (res.error) {
      toast({ title: 'Error', description: res.error.message, variant: 'destructive' });
      return;
    }
    qc.invalidateQueries({ queryKey: ['site-settings', 'maintenance_mode'] });
    toast({ title: 'Saved', description: next.enabled ? 'Maintenance mode is ON.' : 'Maintenance mode is OFF.' });
  };

  const handleToggle = (checked: boolean) => {
    const next = { ...form, enabled: checked };
    setForm(next);
    void save(next);
  };

  const handleSave = () => void save(form);

  const handleEndNow = () => {
    const next = { ...form, enabled: false };
    setForm(next);
    void save(next);
  };

  const remaining = endsAtMs ? Math.max(0, endsAtMs - now) : null;

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-rich-black">Maintenance Mode</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Take the storefront offline for visitors. Admins can still access the site & admin panel.
          </p>
        </div>

        <Card className={`p-6 border-2 ${isActive ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isActive ? <AlertTriangle className="w-5 h-5 text-destructive" /> : <PartyPopper className="w-5 h-5 text-gold" />}
                <h2 className="font-medium text-lg">
                  {isActive ? 'Site is currently OFFLINE' : 'Site is LIVE'}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isActive
                  ? 'Visitors see the maintenance page. Toggle off to publish immediately.'
                  : 'Visitors can browse the storefront normally.'}
              </p>
              {isActive && endsAtMs != null && (
                <CountdownTimer endsAtMs={endsAtMs} />
              )}
              {isActive && endsAtMs == null && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 pt-2">
                  <Clock className="w-4 h-4" /> No auto-publish timer set. Toggle off to publish manually.
                </p>
              )}
            </div>
            <Switch checked={form.enabled} onCheckedChange={handleToggle} />
          </div>
        </Card>

        <Card className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Headline</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="We will be right back"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ends">Auto-publish at (optional)</Label>
            <Input
              id="ends"
              type="datetime-local"
              value={toLocalInput(form.ends_at)}
              onChange={(e) => {
                const val = e.target.value;
                setForm({ ...form, ends_at: val ? new Date(val).toISOString() : null });
              }}
            />
            <p className="text-xs text-muted-foreground">
              When this time arrives, the storefront automatically goes live with a confetti celebration. Leave empty to disable timer.
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>Save changes</Button>
            {isActive && (
              <Button variant="outline" onClick={handleEndNow}>Publish now</Button>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
