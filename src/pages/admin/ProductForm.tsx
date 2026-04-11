import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { METAL_TYPE_NAMES, MetalType } from '@/lib/types';
import { useMetalTypes } from '@/hooks/useMetalTypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { ProductVariationsForm } from '@/components/admin/ProductVariationsForm';
import { listCloudinaryImages, type CloudinaryImage, uploadToCloudinary } from '@/lib/cloudinary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ArrowLeft, Save, Loader2, Package, Settings, Sparkles, Image as ImageIcon, Plus, Search, CheckCircle, GripVertical, Wand2 } from 'lucide-react';

interface MenuCategory {
  id: string;
  name: string;
  slug: string;
}

interface MenuSubcategory {
  id: string;
  product_category_id: string;
  name: string;
  slug: string;
}

interface CertificateItem {
  title: string;
  desc: string;
}

interface ManufacturerItem {
  label: string;
  value: string;
}

interface StoneItem {
  name: string;
  shape: string;
  carat_weight: number;
  per_carat_price: number;
  quantity: number;
}

interface PricingMetalItem {
  slug: string;
  weight_grams?: number | null;
}

interface DiamondQualityItem {
  label: string;
  subtitle: string;
  rate_per_carat: number;
  is_default: boolean;
}

interface CaratWeightItem {
  value: number;
  is_default: boolean;
}

interface AttributeOptionItem {
  label: string;
  price: number;
  is_default: boolean;
}

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: string;
  subcategory_id: string;
  metal_type: MetalType;
  metal_type_id: string | null;
  weight_grams: number;
  making_charge_percent: number | null;
  diamond_cost: number;
  stone_cost: number;
  stones: StoneItem[];
  pricing_metals: string[];
  pricing_metal_weights: Record<string, number>;
  diamond_qualities: DiamondQualityItem[];
  carat_weights: CaratWeightItem[];
  attributes: AttributeOptionItem[];
  images: string[];
  sku: string;
  stock_quantity: number;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_bridal: boolean;
  is_active: boolean;
  certificate_items: CertificateItem[];
  manufacturer_info: ManufacturerItem[];
}

const defaultCertificateItems: CertificateItem[] = [
  { title: 'BIS Hallmark Certified', desc: 'Guaranteeing purity and authenticity of the gold.' },
  { title: 'Certificate of Authenticity', desc: 'Includes weight, purity, and making charges.' },
  { title: 'Detailed Invoice', desc: 'Itemized breakdown for gold, making charges, and taxes.' },
  { title: 'Lifetime Exchange', desc: '100% gold value buyback and lifetime exchange.' },
];

const defaultManufacturerInfo: ManufacturerItem[] = [
  { label: 'Manufacturer', value: 'KRT Jewels' },
  { label: 'Country', value: 'India' },
  { label: 'Imported By', value: 'N/A (Domestic)' },
  { label: 'Packer', value: 'KRT Jewels' },
];

const defaultFormData: ProductFormData = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  category_id: '',
  subcategory_id: '',
  metal_type: 'gold_22k',
  metal_type_id: null,
  weight_grams: 0,
  making_charge_percent: null,
  diamond_cost: 0,
  stone_cost: 0,
  stones: [],
  pricing_metals: ['gold_22k'],
  pricing_metal_weights: {},
  diamond_qualities: [],
  carat_weights: [],
  attributes: [],
  images: [],
  sku: '',
  stock_quantity: 1,
  is_featured: false,
  is_bestseller: false,
  is_new_arrival: false,
  is_bridal: false,
  is_active: true,
  certificate_items: defaultCertificateItems,
  manufacturer_info: defaultManufacturerInfo,
};

export default function AdminProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: metalTypes = [] } = useMetalTypes();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(defaultFormData);
  const [productCategories, setProductCategories] = useState<MenuCategory[]>([]);
  const [productSubcategories, setProductSubcategories] = useState<MenuSubcategory[]>([]);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<string>>(new Set());
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [metalDragIdx, setMetalDragIdx] = useState<number | null>(null);
  const [cadImage, setCadImage] = useState<string>('');
  const [isCadUploading, setIsCadUploading] = useState(false);
  const cadInputRef = useRef<HTMLInputElement>(null);

  const metalOptions = metalTypes.length > 0
    ? metalTypes.map(mt => ({ id: mt.id, slug: mt.slug, name: mt.name }))
    : Object.entries(METAL_TYPE_NAMES).map(([slug, name]) => ({ id: slug, slug, name }));

  const normalizeMetalToken = (value: string) =>
    value.toLowerCase().replace(/\s+/g, '').replace(/gold/g, '');

  const resolveMetalSlug = (value?: string | null) => {
    if (!value) return null;
    const direct = metalOptions.find(m => m.slug.toLowerCase() === value.toLowerCase());
    if (direct) return direct.slug;
    const normalizedValue = normalizeMetalToken(value);
    const byName = metalOptions.find(m => normalizeMetalToken(m.name) === normalizedValue);
    if (byName) return byName.slug;
    return value;
  };

  const normalizePricingMetals = (metals: string[], weights: Record<string, number>) => {
    const resolvedWeights: Record<string, number> = {};
    metals.forEach((slug) => {
      const resolvedSlug = resolveMetalSlug(slug);
      if (!resolvedSlug) return;
      if (Number.isFinite(weights[slug])) {
        resolvedWeights[resolvedSlug] = weights[slug];
      }
      if (Number.isFinite(weights[resolvedSlug])) {
        resolvedWeights[resolvedSlug] = weights[resolvedSlug];
      }
    });

    const normalizedMetals = metals
      .map((slug) => resolveMetalSlug(slug))
      .filter(Boolean) as string[];
    const uniqueMetals = Array.from(new Set(normalizedMetals));
    return { metals: uniqueMetals, weights: resolvedWeights };
  };

  const togglePricingMetal = (slug: string) => {
    setFormData((prev) => {
      const resolvedSlug = resolveMetalSlug(slug) || slug;
      const exists = prev.pricing_metals.includes(resolvedSlug);
      const nextMetals = exists
        ? prev.pricing_metals.filter((m) => m !== resolvedSlug)
        : Array.from(new Set([...prev.pricing_metals, resolvedSlug]));
      const nextWeights = { ...prev.pricing_metal_weights };
      if (exists) {
        delete nextWeights[resolvedSlug];
      } else if (resolvedSlug !== prev.metal_type && !Number.isFinite(nextWeights[resolvedSlug])) {
        nextWeights[resolvedSlug] = prev.weight_grams || 0;
      }

      let nextMetalTypeId = prev.metal_type_id;
      let nextMetalType = prev.metal_type;

      if (nextMetals.length > 0 && !nextMetals.includes(prev.metal_type)) {
        const preferredSlug = nextMetals[0];
        const mt = metalTypes.find(m => m.slug === preferredSlug);
        if (mt) {
          nextMetalTypeId = mt.id;
        }
        if (Object.prototype.hasOwnProperty.call(METAL_TYPE_NAMES, preferredSlug)) {
          nextMetalType = preferredSlug as MetalType;
        }
      }

      return {
        ...prev,
        pricing_metals: nextMetals,
        pricing_metal_weights: nextWeights,
        metal_type_id: nextMetalTypeId,
        metal_type: nextMetalType,
      };
    });
  };

  const { data: mediaLibrary, isLoading: isMediaLoading } = useQuery({
    queryKey: ['media-library-products'],
    queryFn: () => listCloudinaryImages('products'),
    enabled: mediaDialogOpen,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    fetchProductCategories();
  }, []);

  useEffect(() => {
    if (metalTypes.length === 0) return;

    if (formData.pricing_metals.length > 0) {
      const preferredSlug = formData.pricing_metals[0];
      const preferred = metalTypes.find(m => m.slug === preferredSlug);
      if (preferred) {
        setFormData((prev) => ({
          ...prev,
          metal_type_id: preferred.id,
          metal_type: Object.prototype.hasOwnProperty.call(METAL_TYPE_NAMES, preferred.slug)
            ? (preferred.slug as MetalType)
            : prev.metal_type,
        }));
        return;
      }
    }

    if (!formData.metal_type_id) {
      const mt = metalTypes.find(m => m.slug === formData.metal_type);
      if (mt) {
        setFormData((prev) => ({ ...prev, metal_type_id: mt.id }));
      }
    }
  }, [metalTypes, formData.metal_type, formData.metal_type_id, formData.pricing_metals]);

  useEffect(() => {
    if (metalOptions.length === 0) return;
    setFormData((prev) => {
      const normalized = normalizePricingMetals(prev.pricing_metals, prev.pricing_metal_weights);
      const sameMetals = normalized.metals.join('|') === prev.pricing_metals.join('|');
      const sameWeights = JSON.stringify(normalized.weights) === JSON.stringify(prev.pricing_metal_weights);
      if (sameMetals && sameWeights) return prev;
      return {
        ...prev,
        pricing_metals: normalized.metals,
        pricing_metal_weights: normalized.weights,
      };
    });
  }, [metalOptions.length, metalOptions.map(m => m.slug).join('|')]);

  const fetchProductCategories = async () => {
    const { data: categories, error: catError } = await supabase
      .from('product_categories')
      .select('id, name, slug')
      .order('display_order');

    if (!catError) {
      setProductCategories(categories || []);
    }

    const { data: subcategories, error: subError } = await supabase
      .from('product_subcategories')
      .select('id, product_category_id, name, slug')
      .order('display_order');

    if (!subError) {
      setProductSubcategories(subcategories || []);
    }
  };

  const fetchProduct = async () => {
    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const specs = (data.specifications || {}) as Record<string, any>;
      const pricingOptions = (specs.pricing_options || {}) as Record<string, any>;
      const pricingMetalsRaw = Array.isArray(pricingOptions.metals)
        ? pricingOptions.metals
        : [];
      const resolvedPricingMetals: string[] = [];
      const resolvedMetalWeights: Record<string, number> = {};
      pricingMetalsRaw.forEach((m: any) => {
        if (typeof m === 'string') {
          resolvedPricingMetals.push(m);
          return;
        }
        if (m && typeof m.slug === 'string') {
          resolvedPricingMetals.push(m.slug);
          if (Number.isFinite(m.weight_grams)) {
            resolvedMetalWeights[m.slug] = Number(m.weight_grams);
          }
          return;
        }
        if (m && typeof m.metal_type === 'string') {
          resolvedPricingMetals.push(m.metal_type);
          if (Number.isFinite(m.weight_grams)) {
            resolvedMetalWeights[m.metal_type] = Number(m.weight_grams);
          }
        }
      });
      const fallbackMetals = [data.metal_type].filter(Boolean);
      const normalizedPricingMetals = resolvedPricingMetals.length > 0
        ? resolvedPricingMetals
        : fallbackMetals;
      const normalized = normalizePricingMetals(normalizedPricingMetals, resolvedMetalWeights);
      const diamondQualities = Array.isArray(pricingOptions.diamond_qualities)
        ? pricingOptions.diamond_qualities
            .filter((q: any) => q && typeof q.label === 'string')
            .map((q: any) => ({
              label: q.label,
              subtitle: typeof q.subtitle === 'string' ? q.subtitle : '',
              rate_per_carat: Number(q.rate_per_carat) || 0,
              is_default: !!q.is_default,
            }))
        : [];
      const caratWeights = Array.isArray(pricingOptions.carat_weights)
        ? pricingOptions.carat_weights
            .map((w: any) => {
              if (typeof w === 'number') return { value: w, is_default: false };
              if (w && typeof w.value === 'number') {
                return { value: Number(w.value) || 0, is_default: !!w.is_default };
              }
              return null;
            })
            .filter((w: any) => w && Number.isFinite(w.value) && w.value > 0)
        : [];
      const attributes = Array.isArray(pricingOptions.attributes)
        ? pricingOptions.attributes
            .filter((c: any) => c && typeof c.label === 'string')
            .map((c: any) => ({
              label: c.label,
              price: Number(c.price) || 0,
              is_default: !!c.is_default,
            }))
        : [];
      setFormData({
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        short_description: data.short_description || '',
        category_id: data.product_category_id || '',
        subcategory_id: data.product_subcategory_id || '',
        metal_type: data.metal_type as MetalType,
        metal_type_id: data.metal_type_id || null,
        weight_grams: data.weight_grams,
        making_charge_percent: data.making_charge_percent,
        diamond_cost: data.diamond_cost || 0,
        stone_cost: data.stone_cost || 0,
        stones: Array.isArray((data as any).stones) ? (data as any).stones : [],
        pricing_metals: normalized.metals,
        pricing_metal_weights: normalized.weights,
        diamond_qualities: diamondQualities,
        carat_weights: caratWeights,
        attributes,
        images: data.images || [],
        sku: data.sku || '',
        stock_quantity: data.stock_quantity || 1,
        is_featured: data.is_featured || false,
        is_bestseller: data.is_bestseller || false,
        is_new_arrival: data.is_new_arrival || false,
        is_bridal: data.is_bridal || false,
        is_active: data.is_active ?? true,
        certificate_items: Array.isArray(specs.certificate_items) && specs.certificate_items.length > 0
          ? specs.certificate_items
          : defaultCertificateItems,
        manufacturer_info: Array.isArray(specs.manufacturer_info) && specs.manufacturer_info.length > 0
          ? specs.manufacturer_info
          : defaultManufacturerInfo,
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
      // Auto-calculate stone_cost from stones array
      const calculatedStoneCost = formData.stones.reduce((sum, s) => sum + (s.carat_weight * s.per_carat_price * s.quantity), 0);
      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        short_description: formData.short_description || null,
        product_category_id: formData.category_id || null,
        product_subcategory_id: formData.subcategory_id || null,
        metal_type: formData.metal_type,
        metal_type_id: formData.metal_type_id,
        weight_grams: formData.weight_grams,
        making_charge_percent: formData.making_charge_percent,
        diamond_cost: formData.diamond_cost,
        stone_cost: calculatedStoneCost || formData.stone_cost,
        stones: formData.stones as unknown as Json,
        images: formData.images,
        sku: formData.sku || null,
        stock_quantity: formData.stock_quantity,
        is_featured: formData.is_featured,
        is_bestseller: formData.is_bestseller,
        is_new_arrival: formData.is_new_arrival,
        is_bridal: formData.is_bridal,
        is_active: formData.is_active,
        specifications: {
          certificate_items: formData.certificate_items.map(i => ({ title: i.title, desc: i.desc })),
          manufacturer_info: formData.manufacturer_info.map(i => ({ label: i.label, value: i.value })),
          pricing_options: {
            metals: formData.pricing_metals.map((slug) => ({
              slug,
              weight_grams: Number.isFinite(formData.pricing_metal_weights[slug]) && formData.pricing_metal_weights[slug] > 0
                ? formData.pricing_metal_weights[slug]
                : null,
            })) as PricingMetalItem[],
            diamond_qualities: formData.diamond_qualities
              .filter(q => q.label.trim() !== '' && Number.isFinite(q.rate_per_carat))
              .map(q => ({
                label: q.label.trim(),
                subtitle: q.subtitle?.trim() || '',
                rate_per_carat: q.rate_per_carat,
                is_default: q.is_default,
              })),
            carat_weights: formData.carat_weights
              .map(w => ({ value: Number(w.value), is_default: w.is_default }))
              .filter(w => Number.isFinite(w.value) && w.value > 0),
            attributes: formData.attributes
              .filter(c => c.label.trim() !== '' && Number.isFinite(c.price))
              .map(c => ({ label: c.label.trim(), price: c.price, is_default: c.is_default })),
          },
        } as unknown as Json,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;

        
        queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });

        toast({
          title: 'Success',
          description: 'Product updated successfully',
        });

        navigate('/admin/products');
      } else {
        const { data, error } = await supabase.from('products').insert(productData).select('id').single();

        if (error) throw error;


        queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
        queryClient.invalidateQueries({ queryKey: ['products'] });

        toast({
          title: 'Success',
          description: 'Product created successfully.',
        });

        navigate(`/admin/products/${data.id}`);
      }
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

  const toggleMediaSelect = (publicId: string) => {
    setSelectedMediaIds((prev) => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  };

  const addSelectedMedia = () => {
    const selectedUrls = (mediaLibrary?.resources || [])
      .filter((img) => selectedMediaIds.has(img.public_id))
      .map((img) => img.secure_url);
    if (selectedUrls.length === 0) {
      setMediaDialogOpen(false);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      images: Array.from(new Set([...prev.images, ...selectedUrls])),
    }));
    setSelectedMediaIds(new Set());
    setMediaDialogOpen(false);
  };

  const handleCadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsCadUploading(true);
    try {
      const url = await uploadToCloudinary(file, 'cad-images');
      setCadImage(url);
      toast({ title: 'CAD image uploaded', description: 'Now click "AI Auto-Fill" to extract details.' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsCadUploading(false);
      if (cadInputRef.current) cadInputRef.current.value = '';
    }
  };

  const handleAiScan = async () => {
    if (formData.images.length === 0 && !cadImage) {
      toast({ title: 'No images', description: 'Upload product images or a CAD image first.', variant: 'destructive' });
      return;
    }
    setIsAiScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-scan', {
        body: {
          imageUrls: formData.images.slice(0, 5),
          cadImageUrl: cadImage || null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setFormData((prev) => {
        const updates: Partial<ProductFormData> = {};

        // Text fields from product images
        if (data.name) updates.name = data.name;
        if (data.slug) updates.slug = data.slug;
        if (data.short_description) updates.short_description = data.short_description;
        if (data.description) updates.description = data.description;

        // Metal weights from CAD image
        if (Array.isArray(data.metal_weights) && data.metal_weights.length > 0) {
          const newPricingMetals: string[] = [];
          const newWeights: Record<string, number> = {};

          data.metal_weights.forEach((mw: { metal_slug: string; weight_grams: number }) => {
            const resolvedSlug = resolveMetalSlug(mw.metal_slug) || mw.metal_slug;
            if (resolvedSlug && mw.weight_grams > 0) {
              newPricingMetals.push(resolvedSlug);
              newWeights[resolvedSlug] = mw.weight_grams;
            }
          });

          if (newPricingMetals.length > 0) {
            updates.pricing_metals = Array.from(new Set(newPricingMetals));
            updates.pricing_metal_weights = newWeights;
            // Set gross weight to first metal's weight
            updates.weight_grams = newWeights[newPricingMetals[0]] || prev.weight_grams;

            // Set primary metal type
            const firstSlug = newPricingMetals[0];
            const mt = metalTypes.find(m => m.slug === firstSlug);
            if (mt) {
              updates.metal_type_id = mt.id;
            }
            if (Object.prototype.hasOwnProperty.call(METAL_TYPE_NAMES, firstSlug)) {
              updates.metal_type = firstSlug as MetalType;
            }
          }
        }

        // Carat weight from CAD image
        if (data.total_carat_weight && data.total_carat_weight > 0) {
          const existingValues = prev.carat_weights.map(w => w.value);
          if (!existingValues.includes(data.total_carat_weight)) {
            updates.carat_weights = [
              ...prev.carat_weights,
              { value: data.total_carat_weight, is_default: prev.carat_weights.length === 0 },
            ];
          }
        }

        return { ...prev, ...updates };
      });

      const parts: string[] = [];
      if (data.name) parts.push('name, slug, descriptions');
      if (data.metal_weights?.length > 0) parts.push('metal weights');
      if (data.total_carat_weight > 0) parts.push('carat weight');
      toast({ title: '✨ AI Generated!', description: `Auto-filled: ${parts.join(', ')}. Review and adjust.` });
    } catch (err: any) {
      toast({ title: 'AI Scan Failed', description: err.message || 'Could not analyze images', variant: 'destructive' });
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleMetalWeightDragStart = (e: React.DragEvent, idx: number) => {
    setMetalDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleMetalWeightDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault();
    const fromIdx = metalDragIdx ?? parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIdx === toIdx || isNaN(fromIdx)) return;
    setFormData((prev) => {
      const next = [...prev.pricing_metals];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return { ...prev, pricing_metals: next };
    });
    setMetalDragIdx(null);
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
            <TabsTrigger value="variations" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Variations</span>
            </TabsTrigger>
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
                        value={formData.category_id}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            category_id: value,
                            subcategory_id: '',
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose category" />
                        </SelectTrigger>
                        <SelectContent>
                          {productCategories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
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

            <Card>
              <CardHeader>
                <CardTitle>Subcategory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={formData.subcategory_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, subcategory_id: value }))
                  }
                  disabled={!formData.category_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {productSubcategories
                      .filter((sub) => sub.product_category_id === formData.category_id)
                      .map((sub) => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Certificate & Authenticity */}
            <Card>
              <CardHeader>
                <CardTitle>Certificate & Authenticity</CardTitle>
                <CardDescription>Edit the certification badges shown on product page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.certificate_items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-2 items-start">
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...formData.certificate_items];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setFormData((prev) => ({ ...prev, certificate_items: updated }));
                      }}
                      placeholder="Title"
                    />
                    <Input
                      value={item.desc}
                      onChange={(e) => {
                        const updated = [...formData.certificate_items];
                        updated[idx] = { ...updated[idx], desc: e.target.value };
                        setFormData((prev) => ({ ...prev, certificate_items: updated }));
                      }}
                      placeholder="Description"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        const updated = formData.certificate_items.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, certificate_items: updated }));
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      certificate_items: [...prev.certificate_items, { title: '', desc: '' }],
                    }))
                  }
                >
                  + Add Item
                </Button>
              </CardContent>
            </Card>

            {/* Manufacturer & Origin */}
            <Card>
              <CardHeader>
                <CardTitle>Manufacturer & Origin</CardTitle>
                <CardDescription>Edit manufacturer details shown on product page</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formData.manufacturer_info.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-start">
                    <Input
                      value={item.label}
                      onChange={(e) => {
                        const updated = [...formData.manufacturer_info];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setFormData((prev) => ({ ...prev, manufacturer_info: updated }));
                      }}
                      placeholder="Label (e.g. Manufacturer)"
                    />
                    <Input
                      value={item.value}
                      onChange={(e) => {
                        const updated = [...formData.manufacturer_info];
                        updated[idx] = { ...updated[idx], value: e.target.value };
                        setFormData((prev) => ({ ...prev, manufacturer_info: updated }));
                      }}
                      placeholder="Value (e.g. KRT Jewels)"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => {
                        const updated = formData.manufacturer_info.filter((_, i) => i !== idx);
                        setFormData((prev) => ({ ...prev, manufacturer_info: updated }));
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      manufacturer_info: [...prev.manufacturer_info, { label: '', value: '' }],
                    }))
                  }
                >
                  + Add Row
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            {/* Pricing Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary text-sm uppercase tracking-wide">Pricing Options</CardTitle>
                <CardDescription>Configure metals, diamond qualities, and carat weights shown on the product page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Available Metals</Label>
                  <div className="flex flex-wrap gap-2">
                    {metalOptions.map((metal) => {
                      const selected = formData.pricing_metals.includes(metal.slug);
                      return (
                        <Button
                          key={metal.slug}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => togglePricingMetal(metal.slug)}
                          className={selected ? 'btn-premium' : ''}
                        >
                          {metal.name}
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If empty, the product will fall back to its default metal only.
                  </p>
                </div>

                {formData.pricing_metals.length > 0 && (
                  <div className="space-y-2">
                    <Label>Metal Weights (g) <span className="text-xs text-muted-foreground font-normal ml-1">— drag to reorder</span></Label>
                    <div className="space-y-1">
                      {formData.pricing_metals.map((slug, idx) => {
                        const metalLabel = metalOptions.find(m => m.slug === slug)?.name || slug;
                        const weightValue = Number.isFinite(formData.pricing_metal_weights[slug])
                          ? formData.pricing_metal_weights[slug]
                          : '';
                        const defaultMetalSlug = formData.pricing_metals[0] || formData.metal_type;
                        const defaultMetalWeight = Number.isFinite(formData.pricing_metal_weights[defaultMetalSlug])
                          ? formData.pricing_metal_weights[defaultMetalSlug]
                          : formData.weight_grams;
                        return (
                          <div
                            key={slug}
                            draggable
                            onDragStart={(e) => handleMetalWeightDragStart(e, idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleMetalWeightDrop(e, idx)}
                            className={`grid grid-cols-1 md:grid-cols-[auto_2fr_1fr_auto] gap-2 items-center p-2 rounded-md border border-transparent transition-colors ${metalDragIdx === idx ? 'opacity-50 border-dashed border-primary' : 'hover:bg-muted/50'}`}
                          >
                            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
                            <span className="text-sm text-muted-foreground">{metalLabel}</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={weightValue}
                              onChange={(e) => {
                                const next = parseFloat(e.target.value);
                                setFormData((prev) => {
                                  const nextWeights = { ...prev.pricing_metal_weights };
                                  if (!Number.isFinite(next) || next <= 0) {
                                    delete nextWeights[slug];
                                  } else {
                                    nextWeights[slug] = next;
                                  }
                                  return { ...prev, pricing_metal_weights: nextWeights };
                                });
                              }}
                              placeholder={String(defaultMetalWeight || 0)}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => togglePricingMetal(slug)}
                            >
                              ✕
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Leave a weight blank to use the default metal weight.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Diamond Quality (₹ per carat)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          diamond_qualities: [...prev.diamond_qualities, { label: '', subtitle: '', rate_per_carat: 0, is_default: false }],
                        }))
                      }
                    >
                      + Add Quality
                    </Button>
                  </div>
                  {formData.diamond_qualities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No diamond qualities added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.diamond_qualities.map((quality, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_auto_auto] gap-2 items-center">
                          <Input
                            value={quality.label}
                            onChange={(e) => {
                              const updated = [...formData.diamond_qualities];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setFormData((prev) => ({ ...prev, diamond_qualities: updated }));
                            }}
                            placeholder="e.g. VVS1 EF"
                          />
                          <Input
                            value={quality.subtitle}
                            onChange={(e) => {
                              const updated = [...formData.diamond_qualities];
                              updated[idx] = { ...updated[idx], subtitle: e.target.value };
                              setFormData((prev) => ({ ...prev, diamond_qualities: updated }));
                            }}
                            placeholder="e.g. Best Quality"
                          />
                          <Input
                            type="number"
                            value={quality.rate_per_carat || ''}
                            onChange={(e) => {
                              const updated = [...formData.diamond_qualities];
                              updated[idx] = { ...updated[idx], rate_per_carat: parseFloat(e.target.value) || 0 };
                              setFormData((prev) => ({ ...prev, diamond_qualities: updated }));
                            }}
                            placeholder="₹/ct"
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={quality.is_default}
                              onCheckedChange={(checked) => {
                                const updated = formData.diamond_qualities.map((q, qIdx) => ({
                                  ...q,
                                  is_default: qIdx === idx ? checked : false,
                                }));
                                setFormData((prev) => ({ ...prev, diamond_qualities: updated }));
                              }}
                            />
                            <span className="text-xs text-muted-foreground">Default</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              const updated = formData.diamond_qualities.filter((_, i) => i !== idx);
                              setFormData((prev) => ({ ...prev, diamond_qualities: updated }));
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Total Carat Weights</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          carat_weights: [
                            ...prev.carat_weights,
                            { value: 0, is_default: prev.carat_weights.length === 0 },
                          ],
                        }))
                      }
                    >
                      + Add Carat
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[0.25, 0.5, 0.75, 1, 1.5, 2].map((preset) => {
                      const selected = formData.carat_weights.some((w) => w.value === preset);
                      return (
                        <Button
                          key={preset}
                          type="button"
                          variant={selected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              carat_weights: selected
                                ? prev.carat_weights.filter((w) => w.value !== preset)
                                : [...prev.carat_weights, { value: preset, is_default: prev.carat_weights.length === 0 }],
                            }))
                          }
                          className={selected ? 'btn-premium' : ''}
                        >
                          {preset} ct
                        </Button>
                      );
                    })}
                  </div>
                  {formData.carat_weights.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No carat weights added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.carat_weights.map((carat, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-center">
                          <Input
                            type="number"
                            step="0.01"
                            value={carat.value || ''}
                            onChange={(e) => {
                              const updated = [...formData.carat_weights];
                              updated[idx] = { ...updated[idx], value: parseFloat(e.target.value) || 0 };
                              setFormData((prev) => ({ ...prev, carat_weights: updated }));
                            }}
                            placeholder="e.g. 0.50"
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={carat.is_default}
                              onCheckedChange={(checked) => {
                                const updated = formData.carat_weights.map((w, wIdx) => ({
                                  ...w,
                                  is_default: wIdx === idx ? checked : false,
                                }));
                                setFormData((prev) => ({ ...prev, carat_weights: updated }));
                              }}
                            />
                            <span className="text-xs text-muted-foreground">Default</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              const updated = formData.carat_weights.filter((_, i) => i !== idx);
                              setFormData((prev) => ({ ...prev, carat_weights: updated }));
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Attributes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          attributes: [...prev.attributes, { label: '', price: 0, is_default: false }],
                        }))
                      }
                    >
                      + Add Attribute
                    </Button>
                  </div>
                  {formData.attributes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No attributes added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {formData.attributes.map((attr, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto_auto] gap-2 items-center">
                          <Input
                            value={attr.label}
                            onChange={(e) => {
                              const updated = [...formData.attributes];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setFormData((prev) => ({ ...prev, attributes: updated }));
                            }}
                            placeholder="e.g. IGI Certificate"
                          />
                          <Input
                            type="number"
                            value={attr.price || ''}
                            onChange={(e) => {
                              const updated = [...formData.attributes];
                              updated[idx] = { ...updated[idx], price: parseFloat(e.target.value) || 0 };
                              setFormData((prev) => ({ ...prev, attributes: updated }));
                            }}
                            placeholder="₹"
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={attr.is_default}
                              onCheckedChange={(checked) => {
                                const updated = formData.attributes.map((a, aIdx) => ({
                                  ...a,
                                  is_default: aIdx === idx ? checked : false,
                                }));
                                setFormData((prev) => ({ ...prev, attributes: updated }));
                              }}
                            />
                            <span className="text-xs text-muted-foreground">Default</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => {
                              const updated = formData.attributes.filter((_, i) => i !== idx);
                              setFormData((prev) => ({ ...prev, attributes: updated }));
                            }}
                          >
                            ✕
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Metal Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-primary text-sm uppercase tracking-wide">Metal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Metal Weight (g)</Label>
                    <Input
                      type="number" step="0.01"
                      value={formData.weight_grams || ''}
                      onChange={(e) => {
                        const nextWeight = parseFloat(e.target.value) || 0;
                        setFormData((prev) => {
                          const nextWeights = { ...prev.pricing_metal_weights };
                          const baseSlug = prev.metal_type;
                          if (prev.pricing_metals.includes(baseSlug)) {
                            const existing = nextWeights[baseSlug];
                            if (!Number.isFinite(existing) || existing === prev.weight_grams) {
                              if (nextWeight > 0) {
                                nextWeights[baseSlug] = nextWeight;
                              } else {
                                delete nextWeights[baseSlug];
                              }
                            }
                          }
                          return { ...prev, weight_grams: nextWeight, pricing_metal_weights: nextWeights };
                        });
                      }}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Making Charge / Wastage %</Label>
                    <Input
                      type="number" step="0.1"
                      value={formData.making_charge_percent ?? ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, making_charge_percent: e.target.value ? parseFloat(e.target.value) : null }))}
                      placeholder="Category default"
                    />
                    <p className="text-xs text-muted-foreground">Leave blank for category default</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Base Diamond Cost (₹)</Label>
                    <Input
                      type="number"
                      value={formData.diamond_cost || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, diamond_cost: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">Leave 0 if using diamond quality + carat options above</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stones Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-primary text-sm uppercase tracking-wide">Stones</CardTitle>
                <Button
                  type="button" variant="outline" size="sm"
                  onClick={() => setFormData((prev) => ({
                    ...prev,
                    stones: [...prev.stones, { name: '', shape: '', carat_weight: 0, per_carat_price: 0, quantity: 1 }],
                  }))}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add Stone
                </Button>
              </CardHeader>
              <CardContent>
                {formData.stones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No stones added. Click "Add Stone" to add gemstone details.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground uppercase">
                      <span>Stone Name</span>
                      <span>Shape</span>
                      <span>Carat Wt</span>
                      <span>₹/Carat</span>
                      <span>Qty</span>
                      <span></span>
                    </div>
                    {formData.stones.map((stone, idx) => (
                      <div key={idx} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                        <Input
                          value={stone.name}
                          onChange={(e) => {
                            const updated = [...formData.stones];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setFormData((prev) => ({ ...prev, stones: updated }));
                          }}
                          placeholder="e.g. Heart Pink Sapphire"
                          className="h-9"
                        />
                        <Input
                          value={stone.shape}
                          onChange={(e) => {
                            const updated = [...formData.stones];
                            updated[idx] = { ...updated[idx], shape: e.target.value };
                            setFormData((prev) => ({ ...prev, stones: updated }));
                          }}
                          placeholder="Round"
                          className="h-9"
                        />
                        <Input
                          type="number" step="0.01"
                          value={stone.carat_weight || ''}
                          onChange={(e) => {
                            const updated = [...formData.stones];
                            updated[idx] = { ...updated[idx], carat_weight: parseFloat(e.target.value) || 0 };
                            setFormData((prev) => ({ ...prev, stones: updated }));
                          }}
                          placeholder="0.80"
                          className="h-9"
                        />
                        <Input
                          type="number" step="1"
                          value={stone.per_carat_price || ''}
                          onChange={(e) => {
                            const updated = [...formData.stones];
                            updated[idx] = { ...updated[idx], per_carat_price: parseFloat(e.target.value) || 0 };
                            setFormData((prev) => ({ ...prev, stones: updated }));
                          }}
                          placeholder="₹/ct"
                          className="h-9"
                        />
                        <Input
                          type="number" step="1" min="1"
                          value={stone.quantity || ''}
                          onChange={(e) => {
                            const updated = [...formData.stones];
                            updated[idx] = { ...updated[idx], quantity: parseInt(e.target.value) || 1 };
                            setFormData((prev) => ({ ...prev, stones: updated }));
                          }}
                          placeholder="1"
                          className="h-9"
                        />
                        <Button
                          type="button" variant="ghost" size="icon" className="text-destructive h-9 w-9"
                          onClick={() => {
                            const updated = formData.stones.filter((_, i) => i !== idx);
                            setFormData((prev) => ({ ...prev, stones: updated }));
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                    {formData.stones.length > 0 && (
                      <div className="flex justify-end pt-2 border-t">
                        <p className="text-sm font-medium">
                          Stones Total: <span className="text-primary">₹{Math.round(formData.stones.reduce((sum, s) => sum + (s.carat_weight * s.per_carat_price * s.quantity), 0)).toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stock & SKU */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wide">Stock & Identification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Stock Quantity</Label>
                    <Input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                      placeholder="KRT-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Legacy Stone Cost (₹)</Label>
                    <Input
                      type="number"
                      value={formData.stone_cost || ''}
                      onChange={(e) => setFormData((prev) => ({ ...prev, stone_cost: parseFloat(e.target.value) || 0 }))}
                      placeholder="Auto-calculated from stones"
                    />
                    <p className="text-xs text-muted-foreground">Override if not using stone entries above</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Product Images</span>
                  {formData.images.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAiScan}
                      disabled={isAiScanning}
                      className="gap-2"
                    >
                      {isAiScanning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      {isAiScanning ? 'Scanning...' : 'AI Auto-Fill Details'}
                    </Button>
                  )}
                </CardTitle>
                {formData.images.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Upload images then click "AI Auto-Fill Details" to auto-generate product name, slug, and descriptions.
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Button type="button" variant="outline" onClick={() => setMediaDialogOpen(true)}>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Add From Media Library
                  </Button>
                </div>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                  maxImages={20}
                />
              </CardContent>
            </Card>

            <Dialog open={mediaDialogOpen} onOpenChange={(open) => {
              setMediaDialogOpen(open);
              if (!open) setSelectedMediaIds(new Set());
            }}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Select Images From Media Library</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search images..."
                      value={mediaSearch}
                      onChange={(e) => setMediaSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {isMediaLoading ? (
                    <div className="text-sm text-muted-foreground">Loading images...</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[420px] overflow-y-auto pr-1">
                      {(mediaLibrary?.resources || [])
                        .filter((img: CloudinaryImage) =>
                          mediaSearch === '' || img.public_id.toLowerCase().includes(mediaSearch.toLowerCase())
                        )
                        .map((img: CloudinaryImage) => {
                          const isSelected = selectedMediaIds.has(img.public_id);
                          return (
                            <div
                              key={img.public_id}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${
                                isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() => toggleMediaSelect(img.public_id)}
                            >
                              <img src={img.secure_url} alt={img.public_id} className="w-full h-full object-cover" />
                              {isSelected && (
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-1">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setMediaDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" className="btn-premium" onClick={addSelectedMedia}>
                    Add Selected
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Variations Tab */}
          <TabsContent value="variations" className="space-y-6">
            {isEditing && id ? (
              <div className="space-y-6">
                {(() => {
                  const selectedCategory = productCategories.find(c => c.id === formData.category_id)?.slug as any;
                  if (!selectedCategory) {
                    return (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                          <p className="text-muted-foreground font-medium">Select a category first</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Variations depend on the product category.
                          </p>
                        </CardContent>
                      </Card>
                    );
                  }
                  return (
                    <ProductVariationsForm
                      productId={id}
                      category={selectedCategory}
                      productImages={formData.images}
                    />
                  );
                })()}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  <p className="text-muted-foreground font-medium">Save the product first</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You can add variations after creating the product.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

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
