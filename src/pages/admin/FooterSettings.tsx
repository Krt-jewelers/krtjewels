import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Save, Plus, X } from 'lucide-react';
import { useFooterContact, type FooterContact } from '@/hooks/useFooterContact';

export default function AdminFooterSettings() {
  const qc = useQueryClient();
  const { data } = useFooterContact();
  const [form, setForm] = useState<FooterContact | null>(null);

  useEffect(() => {
    if (data && !form) setForm({ ...data });
  }, [data]);

  const save = useMutation({
    mutationFn: async (v: FooterContact) => {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: v as any, updated_at: new Date().toISOString() })
        .eq('key', 'footer_contact');
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Footer updated — live on website');
      qc.invalidateQueries({ queryKey: ['site-settings', 'footer_contact'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!form) return <AdminLayout><div className="p-6">Loading…</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-5">
        <div>
          <h1 className="text-3xl font-serif">Footer & Contact</h1>
          <p className="text-sm text-muted-foreground">
            Edit the store address, phone numbers, and Google Maps link shown across the entire site footer. Changes are pushed live in real-time.
          </p>
        </div>

        <div>
          <Label>Address line 1</Label>
          <Input
            value={form.address_line1}
            onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
          />
        </div>
        <div>
          <Label>Address line 2</Label>
          <Input
            value={form.address_line2}
            onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
          />
        </div>

        <div>
          <Label>Phone numbers</Label>
          <div className="space-y-2">
            {form.phones.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={p}
                  onChange={(e) => {
                    const next = [...form.phones];
                    next[i] = e.target.value;
                    setForm({ ...form, phones: next });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setForm({ ...form, phones: form.phones.filter((_, x) => x !== i) })
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForm({ ...form, phones: [...form.phones, ''] })}
            >
              <Plus className="w-4 h-4 mr-1" /> Add phone
            </Button>
          </div>
        </div>

        <div>
          <Label>Email</Label>
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div>
          <Label>Google Maps share link (opens when address / map is clicked)</Label>
          <Input
            value={form.map_share_url}
            placeholder="https://share.google/…"
            onChange={(e) => setForm({ ...form, map_share_url: e.target.value })}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Tip: open your store on Google Maps → Share → Copy link, then paste here.
          </p>
        </div>

        <div>
          <Label>Google Place ID (optional, for SEO)</Label>
          <Input
            value={form.place_id ?? ''}
            onChange={(e) => setForm({ ...form, place_id: e.target.value })}
          />
        </div>

        <Button
          onClick={() => save.mutate({ ...form, phones: form.phones.filter((p) => p.trim()) })}
          disabled={save.isPending}
          size="lg"
        >
          <Save className="w-4 h-4 mr-2" />
          {save.isPending ? 'Publishing…' : 'Save & publish live'}
        </Button>
      </div>
    </AdminLayout>
  );
}
