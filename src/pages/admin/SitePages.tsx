import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Eye, Plus } from 'lucide-react';

interface SitePageRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  is_published: boolean;
}

export default function AdminSitePages() {
  const qc = useQueryClient();
  const { data: pages = [] } = useQuery({
    queryKey: ['admin_site_pages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_pages').select('*').order('slug');
      if (error) throw error;
      return data as SitePageRow[];
    },
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [form, setForm] = useState<SitePageRow | null>(null);

  useEffect(() => {
    if (!activeId && pages.length) setActiveId(pages[0].id);
  }, [pages, activeId]);

  useEffect(() => {
    const p = pages.find((p) => p.id === activeId);
    if (p) setForm({ ...p });
  }, [activeId, pages]);

  const save = useMutation({
    mutationFn: async (row: SitePageRow) => {
      const { error } = await supabase
        .from('site_pages')
        .update({
          title: row.title,
          slug: row.slug,
          content: row.content,
          meta_description: row.meta_description,
          is_published: row.is_published,
        })
        .eq('id', row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Page saved & live');
      qc.invalidateQueries({ queryKey: ['admin_site_pages'] });
      qc.invalidateQueries({ queryKey: ['site_page'] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const create = useMutation({
    mutationFn: async () => {
      const slug = prompt('New page slug (e.g. about-us):')?.trim();
      if (!slug) throw new Error('cancelled');
      const { data, error } = await supabase
        .from('site_pages')
        .insert({ slug, title: slug, content: `# ${slug}\n\nEdit this page in admin.` })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['admin_site_pages'] });
      setActiveId(d.id);
    },
    onError: (e: any) => e.message !== 'cancelled' && toast.error(e.message),
  });

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif">Site Pages</h1>
            <p className="text-muted-foreground text-sm">Edit footer pages — Privacy, Terms, FAQ, Shipping, Returns. Changes go live instantly.</p>
          </div>
          <Button onClick={() => create.mutate()} variant="outline">
            <Plus className="w-4 h-4 mr-2" /> New page
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 md:col-span-3 space-y-1">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveId(p.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm border ${
                  activeId === p.id ? 'bg-primary/10 border-primary' : 'border-transparent hover:bg-muted'
                }`}
              >
                <div className="font-medium">{p.title}</div>
                <div className="text-xs text-muted-foreground">/{p.slug} {p.is_published ? '' : '· draft'}</div>
              </button>
            ))}
          </div>

          {form && (
            <div className="col-span-12 md:col-span-9 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Meta description (SEO)</Label>
                <Input
                  value={form.meta_description ?? ''}
                  onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
                  maxLength={160}
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.is_published}
                  onCheckedChange={(v) => setForm({ ...form, is_published: v })}
                />
                <span className="text-sm">{form.is_published ? 'Published' : 'Draft'}</span>
                <a
                  href={`/${form.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-sm text-primary inline-flex items-center gap-1"
                >
                  <Eye className="w-4 h-4" /> View live
                </a>
              </div>

              <Tabs defaultValue="edit">
                <TabsList>
                  <TabsTrigger value="edit">Edit (Markdown)</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="edit">
                  <Textarea
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={24}
                    className="font-mono text-sm"
                  />
                </TabsContent>
                <TabsContent value="preview">
                  <div className="prose prose-lg max-w-none border rounded p-6 bg-card">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.content}</ReactMarkdown>
                  </div>
                </TabsContent>
              </Tabs>

              <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
                <Save className="w-4 h-4 mr-2" /> {save.isPending ? 'Saving…' : 'Save & publish'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
