import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { CATEGORY_NAMES, METAL_TYPE_NAMES, ProductCategory, MetalType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { ProductVariationsForm } from '@/components/admin/ProductVariationsForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Save, Loader2, Package, Settings, Sparkles, Image as ImageIcon } from 'lucide-react';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category: ProductCategory;
  metal_type: MetalType;
  weight_grams: number;
  making_charge_percent: number | null;
  diamond_cost: number;
  stone_cost: number;
  images: string[];
  sku: string;
  stock_quantity: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_bridal: boolean;
  is_active: boolean;
}

const defaultFormData: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  category: 'necklaces',
  metal_type: 'gold_22k',
  weight_grams: 0,
  making_charge_percent: null,
  diamond_cost: 0,
  stone_cost: 0,
  images: [],
  sku: '',
  stock_quantity: 1,
  is_featured: false,
  is_bestseller: false,
  is_new_arrival: false,
  is_bridal: false,
  is_active: true,
};

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        short_description: data.short_description || '',
        category: data.category as ProductCategory,
        metal_type: data.metal_type as MetalType,
        weight_grams: data.weight_grams,
        making_charge_percent: data.making_charge_percent,
        diamond_cost: data.diamond_cost || 0,
        stone_cost: data.stone_cost || 0,
        images: data.images || [],
        sku: data.sku || '',
        stock_quantity: data.stock_quantity || 1,
        is_featured: data.is_featured || false,
        is_bestseller: data.is_bestseller || false,
        is_new_arrival: data.is_new_arrival || false,
        is_bridal: data.is_bridal || false,
        is_active: data.is_active ?? true,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load product',
        variant: 'destructive',
      });
      navigate('/admin/products');
    } finally {
      setIsFetching(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-krt';
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: isEditing ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        short_description: formData.short_description || null,
        category: formData.category,
        metal_type: formData.metal_type,
        weight_grams: formData.weight_grams,
        making_charge_percent: formData.making_charge_percent,
        diamond_cost: formData.diamond_cost,
        stone_cost: formData.stone_cost,
        images: formData.images,
        sku: formData.sku || null,
        stock_quantity: formData.stock_quantity,
        is_featured: formData.is_featured,
        is_bestseller: formData.is_bestseller,
        is_new_arrival: formData.is_new_arrival,
        is_bridal: formData.is_bridal,
        is_active: formData.is_active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(productData);

        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast({
        title: 'Success',
        description: `Product ${isEditing ? 'updated' : 'created'} successfully`,
      });

      navigate('/admin/products');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => navigate('/admin/products')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Button>

        <h1 className="font-serif text-3xl font-semibold mb-6">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="details" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="details" className="gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Details</span>
            </TabsTrigger>
            <TabsTrigger value="pricing" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Pricing</span>
            </TabsTrigger>
            <TabsTrigger value="images" className="gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Images</span>
            </TabsTrigger>
            {isEditing && (
              <TabsTrigger value="variations" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Variations</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Temple Gold Necklace"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slug">URL Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                        placeholder="temple-gold-necklace-krt"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_description">Short Description</Label>
                    <Input
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, short_description: e.target.value }))
                      }
                      placeholder="Brief one-line description for cards"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Full Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Detailed product description..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value: ProductCategory) =>
                          setFormData((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Metal Type *</Label>
                      <Select
                        value={formData.metal_type}
                        onValueChange={(value: MetalType) =>
                          setFormData((prev) => ({ ...prev, metal_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(METAL_TYPE_NAMES).map(([key, name]) => (
                            <SelectItem key={key} value={key}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Active</Label>
                      <p className="text-xs text-muted-foreground">Visible on store</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_active: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Featured</Label>
                      <p className="text-xs text-muted-foreground">Show on homepage</p>
                    </div>
                    <Switch
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_featured: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bestseller</Label>
                      <p className="text-xs text-muted-foreground">Mark as popular</p>
                    </div>
                    <Switch
                      checked={formData.is_bestseller}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_bestseller: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Arrival</Label>
                      <p className="text-xs text-muted-foreground">Show new badge</p>
                    </div>
                    <Switch
                      checked={formData.is_new_arrival}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_new_arrival: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Bridal Collection</Label>
                      <p className="text-xs text-muted-foreground">Wedding jewellery</p>
                    </div>
                    <Switch
                      checked={formData.is_bridal}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, is_bridal: checked }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing & Stock</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight_grams">Weight (grams) *</Label>
                    <Input
                      id="weight_grams"
                      type="number"
                      step="0.01"
                      value={formData.weight_grams || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, weight_grams: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="making_charge_percent">Making Charge %</Label>
                    <Input
                      id="making_charge_percent"
                      type="number"
                      step="0.1"
                      value={formData.making_charge_percent ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          making_charge_percent: e.target.value ? parseFloat(e.target.value) : null,
                        }))
                      }
                      placeholder="Category default"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank to use category default</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Stock</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="diamond_cost">Diamond Cost (₹)</Label>
                    <Input
                      id="diamond_cost"
                      type="number"
                      value={formData.diamond_cost || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, diamond_cost: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stone_cost">Stone Cost (₹)</Label>
                    <Input
                      id="stone_cost"
                      type="number"
                      value={formData.stone_cost || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, stone_cost: parseFloat(e.target.value) || 0 }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                      placeholder="KRT-001"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                  maxImages={10}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variations Tab - Only for editing */}
          {isEditing && id && (
            <TabsContent value="variations" className="space-y-6">
              <ProductVariationsForm productId={id} category={formData.category} />
            </TabsContent>
          )}
        </Tabs>

        {/* Submit */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>
            Cancel
          </Button>
          <Button type="submit" className="btn-premium gap-2 min-w-[140px]" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEditing ? 'Update Product' : 'Create Product'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  </AdminLayout>
);
}
