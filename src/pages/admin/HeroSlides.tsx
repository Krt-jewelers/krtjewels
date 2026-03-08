import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, ImageIcon, Loader2, Eye, EyeOff } from 'lucide-react';

interface HeroSlide {
  id: string;
  title: string | null;
  desktop_image_url: string;
  mobile_image_url: string | null;
  alt_text: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

const emptySlide = {
  title: '',
  desktop_image_url: '',
  mobile_image_url: '',
  alt_text: '',
  link_url: '/shop',
  is_active: true,
};

export default function AdminHeroSlides() {
  const { toast } = useToast();
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState(emptySlide);
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

  useEffect(() => { fetchSlides(); }, []);

  const fetchSlides = async () => {
    const { data, error } = await supabase
      .from('hero_slides')
      .select('*')
      .order('display_order', { ascending: true });
    if (!error) setSlides((data as unknown as HeroSlide[]) || []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptySlide });
    setModalOpen(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setEditing(slide);
    setForm({
      title: slide.title || '',
      desktop_image_url: slide.desktop_image_url,
      mobile_image_url: slide.mobile_image_url || '',
      alt_text: slide.alt_text || '',
      link_url: slide.link_url || '/shop',
      is_active: slide.is_active,
    });
    setModalOpen(true);
  };

  const handleUpload = async (file: File, type: 'desktop' | 'mobile') => {
    const setUploading = type === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'hero-slides');
      setForm(prev => ({
        ...prev,
        [type === 'desktop' ? 'desktop_image_url' : 'mobile_image_url']: url,
      }));
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.desktop_image_url) {
      toast({ title: 'Desktop image is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('hero_slides')
          .update({
            title: form.title || null,
            desktop_image_url: form.desktop_image_url,
            mobile_image_url: form.mobile_image_url || null,
            alt_text: form.alt_text || null,
            link_url: form.link_url || '/shop',
            is_active: form.is_active,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast({ title: 'Slide updated' });
      } else if (slides.length >= 5) {
        toast({ title: 'Maximum 5 slides allowed', variant: 'destructive' });
        setSaving(false);
        return;
      } else {
        const { error } = await supabase
          .from('hero_slides')
          .insert({
            title: form.title || null,
            desktop_image_url: form.desktop_image_url,
            mobile_image_url: form.mobile_image_url || null,
            alt_text: form.alt_text || null,
            link_url: form.link_url || '/shop',
            is_active: form.is_active,
            display_order: slides.length,
          });
        if (error) throw error;
        toast({ title: 'Slide added' });
      }
      setModalOpen(false);
      fetchSlides();
    } catch (err) {
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this slide?')) return;
    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Slide deleted' });
      fetchSlides();
    }
  };

  const handleToggleActive = async (slide: HeroSlide) => {
    await supabase.from('hero_slides').update({ is_active: !slide.is_active }).eq('id', slide.id);
    fetchSlides();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = slides.findIndex(s => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= slides.length) return;

    const updates = [
      { id: slides[idx].id, display_order: slides[swapIdx].display_order },
      { id: slides[swapIdx].id, display_order: slides[idx].display_order },
    ];

    for (const u of updates) {
      await supabase.from('hero_slides').update({ display_order: u.display_order }).eq('id', u.id);
    }
    fetchSlides();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-semibold">Hero Slides</h1>
            <p className="text-muted-foreground">Manage homepage banner images</p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="w-4 h-4" /> Add Slide
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : slides.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium text-lg">No slides yet</h3>
              <p className="text-muted-foreground mb-4">Add your first hero banner slide</p>
              <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> Add Slide</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {slides.map((slide, idx) => (
              <Card key={slide.id} className={`overflow-hidden ${!slide.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Reorder */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorder(slide.id, 'up')}
                        disabled={idx === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                      >▲</button>
                      <GripVertical className="w-4 h-4 text-muted-foreground" />
                      <button
                        onClick={() => handleReorder(slide.id, 'down')}
                        disabled={idx === slides.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs"
                      >▼</button>
                    </div>

                    {/* Preview */}
                    <img
                      src={slide.desktop_image_url}
                      alt={slide.alt_text || 'Slide'}
                      className="w-40 h-20 object-cover rounded-lg border bg-muted"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{slide.title || `Slide ${idx + 1}`}</p>
                      <p className="text-xs text-muted-foreground truncate">{slide.link_url}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {slide.is_active ? (
                          <span className="text-xs text-green-600 flex items-center gap-1"><Eye className="w-3 h-3" /> Active</span>
                        ) : (
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><EyeOff className="w-3 h-3" /> Hidden</span>
                        )}
                        {slide.mobile_image_url && (
                          <span className="text-xs text-primary">📱 Mobile</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Switch checked={slide.is_active} onCheckedChange={() => handleToggleActive(slide)} />
                      <Button variant="outline" size="icon" onClick={() => openEdit(slide)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(slide.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit Slide' : 'Add New Slide'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Title (optional)</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Diamond Collection" />
              </div>

              {/* Desktop Image */}
              <div className="space-y-1.5">
                <Label>Desktop Image *</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.desktop_image_url}
                    onChange={e => setForm(p => ({ ...p, desktop_image_url: e.target.value }))}
                    placeholder="Paste image URL or upload"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'desktop')}
                    />
                    <Button variant="outline" size="icon" asChild disabled={uploadingDesktop}>
                      <span>{uploadingDesktop ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}</span>
                    </Button>
                  </label>
                </div>
                {form.desktop_image_url && (
                  <img src={form.desktop_image_url} alt="Desktop preview" className="w-full h-32 object-cover rounded-lg border mt-2" />
                )}
              </div>

              {/* Mobile Image */}
              <div className="space-y-1.5">
                <Label>Mobile Image (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.mobile_image_url}
                    onChange={e => setForm(p => ({ ...p, mobile_image_url: e.target.value }))}
                    placeholder="Paste image URL or upload"
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'mobile')}
                    />
                    <Button variant="outline" size="icon" asChild disabled={uploadingMobile}>
                      <span>{uploadingMobile ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}</span>
                    </Button>
                  </label>
                </div>
                {form.mobile_image_url && (
                  <img src={form.mobile_image_url} alt="Mobile preview" className="w-full h-48 object-cover rounded-lg border mt-2" />
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Alt Text</Label>
                <Input value={form.alt_text} onChange={e => setForm(p => ({ ...p, alt_text: e.target.value }))} placeholder="Image description for SEO" />
              </div>

              <div className="space-y-1.5">
                <Label>Link URL</Label>
                <Input value={form.link_url} onChange={e => setForm(p => ({ ...p, link_url: e.target.value }))} placeholder="/shop" />
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({ ...p, is_active: v }))} />
                <Label>Active</Label>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Update Slide' : 'Add Slide'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
