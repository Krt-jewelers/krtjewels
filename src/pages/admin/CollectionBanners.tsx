import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Save, Loader2 } from 'lucide-react';

interface CategoryBanner {
  id: string;
  name: string;
  slug: string;
  banner_image_url: string | null;
}

const defaultBannerMap: Record<string, string> = {
  necklaces: '/collection-banners/necklaces.jpg',
  earrings: '/collection-banners/earrings.jpg',
  rings: '/collection-banners/rings.jpg',
  bangles: '/collection-banners/bangles.jpg',
  bracelets: '/collection-banners/bracelets.jpg',
  chains: '/collection-banners/chains.jpg',
  pendants: '/collection-banners/pendants.jpg',
  wedding_sets: '/collection-banners/wedding-sets.jpg',
  diamond_jewellery: '/collection-banners/diamond-jewellery.jpg',
  mens_jewellery: '/collection-banners/mens-jewellery.jpg',
};

export default function AdminCollectionBanners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bannerUrls, setBannerUrls] = useState<Record<string, string>>({});

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-collection-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name, slug, banner_image_url')
        .order('display_order');
      if (error) throw error;
      return (data || []) as CategoryBanner[];
    },
    meta: {
      onSuccess: (data: CategoryBanner[]) => {
        const urls: Record<string, string> = {};
        data.forEach((cat) => {
          urls[cat.id] = cat.banner_image_url || '';
        });
        setBannerUrls(urls);
      },
    },
  });

  // Initialize bannerUrls from fetched data
  const getUrl = (cat: CategoryBanner) => {
    if (bannerUrls[cat.id] !== undefined) return bannerUrls[cat.id];
    return cat.banner_image_url || '';
  };

  const saveMutation = useMutation({
    mutationFn: async ({ id, url }: { id: string; url: string }) => {
      const { error } = await supabase
        .from('product_categories')
        .update({ banner_image_url: url || null } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collection-banners'] });
      queryClient.invalidateQueries({ queryKey: ['collection-banner'] });
      toast({ title: 'Banner Updated', description: 'Collection banner image saved.' });
      setSavingId(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setSavingId(null);
    },
  });

  const handleSave = (cat: CategoryBanner) => {
    setSavingId(cat.id);
    saveMutation.mutate({ id: cat.id, url: getUrl(cat) });
  };

  const handleImageUpload = (catId: string, images: string[]) => {
    if (images.length > 0) {
      setBannerUrls((prev) => ({ ...prev, [catId]: images[0] }));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold mb-1">Collection Banners</h1>
          <p className="text-muted-foreground">Manage hero banner images for each collection page</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((cat) => {
              const currentUrl = getUrl(cat);
              const previewUrl = currentUrl || defaultBannerMap[cat.slug] || '/collection-banners/necklaces.jpg';

              return (
                <Card key={cat.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                    <CardDescription>/{cat.slug}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Preview */}
                    <div className="relative h-32 rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={previewUrl}
                        alt={cat.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-rich-black/70 to-transparent flex items-center px-4">
                        <span className="text-ivory font-serif text-xl font-semibold">{cat.name}</span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <div className="space-y-2">
                      <Label>Banner Image URL</Label>
                      <Input
                        value={currentUrl}
                        onChange={(e) =>
                          setBannerUrls((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        placeholder="Paste image URL or upload below"
                      />
                    </div>

                    {/* Upload */}
                    <div className="space-y-2">
                      <Label>Or Upload Image</Label>
                      <ImageUpload
                        images={currentUrl ? [currentUrl] : []}
                        onImagesChange={(imgs) => handleImageUpload(cat.id, imgs)}
                        maxImages={1}
                      />
                    </div>

                    <Button
                      onClick={() => handleSave(cat)}
                      disabled={savingId === cat.id}
                      className="btn-premium gap-2 w-full"
                    >
                      {savingId === cat.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save Banner
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}