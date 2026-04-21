import { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Loader2, BookOpen, Save } from 'lucide-react';
import { useBlogPosts, useUpsertBlogPost, useDeleteBlogPost, type BlogPost } from '@/hooks/useBlogPosts';

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

const empty: Partial<BlogPost> = {
  title: '', slug: '', excerpt: '', content: '', cover_image_url: '',
  author: 'KRT Jewellers', category: '', is_published: true, display_order: 0,
};

export default function AdminBlog() {
  const { data: posts = [], isLoading } = useBlogPosts();
  const upsert = useUpsertBlogPost();
  const del = useDeleteBlogPost();
  const [editing, setEditing] = useState<Partial<BlogPost> | null>(null);

  const handleSave = () => {
    if (!editing?.title) return;
    upsert.mutate(
      { ...editing, title: editing.title!, slug: editing.slug || slugify(editing.title!) } as any,
      { onSuccess: () => setEditing(null) }
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Blog / Journal</h1>
          </div>
          <Button onClick={() => setEditing({ ...empty })}>
            <Plus className="w-4 h-4 mr-2" /> New Post
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
        ) : (
          <div className="grid gap-3">
            {posts.length === 0 ? (
              <Card><CardContent className="py-10 text-center text-muted-foreground text-sm">No posts yet. Create your first journal post.</CardContent></Card>
            ) : posts.map(p => (
              <Card key={p.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt={p.title} className="w-20 h-20 object-cover rounded" />
                  ) : (
                    <div className="w-20 h-20 bg-secondary rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{p.title}</h3>
                      {!p.is_published && <span className="text-[10px] bg-muted px-2 py-0.5 rounded uppercase">Draft</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">/{p.slug} · {p.category || 'Uncategorized'}</p>
                    {p.excerpt && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{p.excerpt}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(p)}><Edit className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete this post?')) del.mutate(p.id); }}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing?.id ? 'Edit Post' : 'New Post'}</DialogTitle></DialogHeader>
            {editing && (
              <div className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={editing.title || ''}
                    onChange={e => setEditing({ ...editing, title: e.target.value, slug: editing.slug || slugify(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Slug</Label>
                    <Input value={editing.slug || ''} onChange={e => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Input placeholder="Style, Care, Stories..." value={editing.category || ''} onChange={e => setEditing({ ...editing, category: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Cover Image URL</Label>
                  <Input value={editing.cover_image_url || ''} onChange={e => setEditing({ ...editing, cover_image_url: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <Label>Excerpt</Label>
                  <Textarea rows={2} value={editing.excerpt || ''} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} />
                </div>
                <div>
                  <Label>Content</Label>
                  <Textarea rows={8} value={editing.content || ''} onChange={e => setEditing({ ...editing, content: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Author</Label>
                    <Input value={editing.author || ''} onChange={e => setEditing({ ...editing, author: e.target.value })} />
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input type="number" value={editing.display_order ?? 0} onChange={e => setEditing({ ...editing, display_order: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_published ?? true} onCheckedChange={v => setEditing({ ...editing, is_published: v })} />
                  <Label>Published (visible on homepage)</Label>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={upsert.isPending || !editing.title}>
                    {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Post
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
