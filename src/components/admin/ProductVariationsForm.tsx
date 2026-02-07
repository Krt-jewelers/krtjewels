import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Trash2, Edit, Loader2, Sparkles, ImageIcon } from 'lucide-react';
import { VariationImageUpload } from './VariationImageUpload';
import {
  useProductVariations,
  useCreateVariation,
  useUpdateVariation,
  useDeleteVariation,
  useBulkCreateVariations,
  type ProductVariation,
} from '@/hooks/useProductVariations';
import { METAL_TYPE_NAMES, type MetalType, type ProductCategory } from '@/lib/types';

// Size options by category
const SIZE_OPTIONS: Record<string, string[]> = {
  rings: ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'],
  bangles: ['2.2', '2.4', '2.6', '2.8', '3.0'],
  bracelets: ['6"', '6.5"', '7"', '7.5"', '8"', '8.5"'],
  necklaces: ['16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'],
  chains: ['16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"'],
};

const SIZE_LABELS: Record<string, string> = {
  rings: 'Ring Size',
  bangles: 'Bangle Size (inches)',
  bracelets: 'Bracelet Length',
  necklaces: 'Chain Length',
  chains: 'Chain Length',
};

interface ProductVariationsFormProps {
  productId: string;
  category: ProductCategory;
}

interface VariationFormData {
  variation_type: 'size' | 'metal_type';
  size_value: string;
  size_label: string;
  metal_type: MetalType | '';
  price_adjustment: number;
  weight_adjustment: number;
  stock_quantity: number;
  is_available: boolean;
  is_default: boolean;
  sku_suffix: string;
  image_url: string | null;
}

const defaultFormData: VariationFormData = {
  variation_type: 'size',
  size_value: '',
  size_label: '',
  metal_type: '',
  price_adjustment: 0,
  weight_adjustment: 0,
  stock_quantity: 1,
  is_available: true,
  is_default: false,
  sku_suffix: '',
  image_url: null,
};

export function ProductVariationsForm({ productId, category }: ProductVariationsFormProps) {
  const { toast } = useToast();
  const { data: variations = [], isLoading } = useProductVariations(productId);
  const createVariation = useCreateVariation();
  const updateVariation = useUpdateVariation();
  const deleteVariation = useDeleteVariation();
  const bulkCreate = useBulkCreateVariations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<VariationFormData>(defaultFormData);

  const hasSizes = SIZE_OPTIONS[category] !== undefined;
  const sizeOptions = SIZE_OPTIONS[category] || [];
  const sizeLabel = SIZE_LABELS[category] || 'Size';

  // Group variations by type
  const sizeVariations = variations.filter(v => v.variation_type === 'size');
  const metalVariations = variations.filter(v => v.variation_type === 'metal_type');

  const handleOpenDialog = (variation?: ProductVariation) => {
    if (variation) {
      setEditingId(variation.id);
      setFormData({
        variation_type: variation.variation_type as 'size' | 'metal_type',
        size_value: variation.size_value || '',
        size_label: variation.size_label || '',
        metal_type: (variation.metal_type as MetalType) || '',
        price_adjustment: variation.price_adjustment || 0,
        weight_adjustment: variation.weight_adjustment || 0,
        stock_quantity: variation.stock_quantity || 1,
        is_available: variation.is_available ?? true,
        is_default: variation.is_default ?? false,
        sku_suffix: variation.sku_suffix || '',
        image_url: variation.image_url || null,
      });
    } else {
      setEditingId(null);
      setFormData({
        ...defaultFormData,
        variation_type: hasSizes ? 'size' : 'metal_type',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const variationData = {
        product_id: productId,
        variation_type: formData.variation_type,
        size_value: formData.variation_type === 'size' ? formData.size_value : null,
        size_label: formData.variation_type === 'size' ? (formData.size_label || sizeLabel) : null,
        metal_type: formData.variation_type === 'metal_type' ? formData.metal_type as MetalType : null,
        price_adjustment: formData.price_adjustment,
        weight_adjustment: formData.weight_adjustment,
        stock_quantity: formData.stock_quantity,
        is_available: formData.is_available,
        is_default: formData.is_default,
        sku_suffix: formData.sku_suffix || null,
        image_url: formData.image_url,
      };

      if (editingId) {
        await updateVariation.mutateAsync({
          id: editingId,
          productId,
          ...variationData,
        });
        toast({ title: 'Success', description: 'Variation updated successfully' });
      } else {
        await createVariation.mutateAsync(variationData);
        toast({ title: 'Success', description: 'Variation added successfully' });
      }

      setIsDialogOpen(false);
      setFormData(defaultFormData);
      setEditingId(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save variation',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVariation.mutateAsync({ id, productId });
      toast({ title: 'Success', description: 'Variation deleted' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete variation',
        variant: 'destructive',
      });
    }
  };

  const handleQuickAddSizes = async () => {
    if (!hasSizes) return;
    
    const existingSizes = sizeVariations.map(v => v.size_value);
    const newSizes = sizeOptions.filter(s => !existingSizes.includes(s));
    
    if (newSizes.length === 0) {
      toast({ title: 'Info', description: 'All sizes already added' });
      return;
    }

    try {
      const variationsToCreate = newSizes.map(size => ({
        product_id: productId,
        variation_type: 'size' as const,
        size_value: size,
        size_label: sizeLabel,
        metal_type: null,
        price_adjustment: 0,
        weight_adjustment: 0,
        stock_quantity: 1,
        is_available: true,
        is_default: false,
        sku_suffix: `-${size.replace(/"/g, '')}`,
        image_url: null,
      }));

      await bulkCreate.mutateAsync(variationsToCreate);
      toast({ title: 'Success', description: `Added ${newSizes.length} size variations` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add sizes',
        variant: 'destructive',
      });
    }
  };

  const handleQuickAddMetals = async () => {
    const metalTypes: MetalType[] = ['gold_22k', 'gold_24k', 'gold_18k'];
    const existingMetals = metalVariations.map(v => v.metal_type);
    const newMetals = metalTypes.filter(m => !existingMetals.includes(m));

    if (newMetals.length === 0) {
      toast({ title: 'Info', description: 'All metal types already added' });
      return;
    }

    try {
      const variationsToCreate = newMetals.map(metal => ({
        product_id: productId,
        variation_type: 'metal_type' as const,
        size_value: null,
        size_label: null,
        metal_type: metal,
        price_adjustment: 0,
        weight_adjustment: 0,
        stock_quantity: 1,
        is_available: true,
        is_default: metal === 'gold_22k',
        sku_suffix: `-${metal.replace('gold_', '')}`,
        image_url: null,
      }));

      await bulkCreate.mutateAsync(variationsToCreate);
      toast({ title: 'Success', description: `Added ${newMetals.length} metal variations` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add metals',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Product Variations
            </CardTitle>
            <CardDescription>
              Add size, metal type variations with price adjustments
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {hasSizes && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleQuickAddSizes}
                disabled={bulkCreate.isPending}
              >
                Quick Add All Sizes
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleQuickAddMetals}
              disabled={bulkCreate.isPending}
            >
              Quick Add Metal Types
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-premium" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Variation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Edit Variation' : 'Add Variation'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Variation Type</Label>
                    <Select
                      value={formData.variation_type}
                      onValueChange={(value: 'size' | 'metal_type') =>
                        setFormData(prev => ({ ...prev, variation_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hasSizes && <SelectItem value="size">{sizeLabel}</SelectItem>}
                        <SelectItem value="metal_type">Metal Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.variation_type === 'size' && hasSizes && (
                    <div className="space-y-2">
                      <Label>{sizeLabel}</Label>
                      <Select
                        value={formData.size_value}
                        onValueChange={(value) =>
                          setFormData(prev => ({ ...prev, size_value: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          {sizeOptions.map(size => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {formData.variation_type === 'metal_type' && (
                    <div className="space-y-2">
                      <Label>Metal Type</Label>
                      <Select
                        value={formData.metal_type}
                        onValueChange={(value: MetalType) =>
                          setFormData(prev => ({ ...prev, metal_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select metal" />
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
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price Adjustment (₹)</Label>
                      <Input
                        type="number"
                        value={formData.price_adjustment}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            price_adjustment: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Use negative for discount
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Weight Adjustment (g)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.weight_adjustment}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            weight_adjustment: parseFloat(e.target.value) || 0,
                          }))
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Stock Quantity</Label>
                      <Input
                        type="number"
                        value={formData.stock_quantity}
                        onChange={(e) =>
                          setFormData(prev => ({
                            ...prev,
                            stock_quantity: parseInt(e.target.value) || 0,
                          }))
                        }
                        placeholder="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU Suffix</Label>
                      <Input
                        value={formData.sku_suffix}
                        onChange={(e) =>
                          setFormData(prev => ({ ...prev, sku_suffix: e.target.value }))
                        }
                        placeholder="-S10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_available}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, is_available: checked }))
                        }
                      />
                      <Label>Available</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.is_default}
                        onCheckedChange={(checked) =>
                          setFormData(prev => ({ ...prev, is_default: checked }))
                        }
                      />
                      <Label>Default Selection</Label>
                    </div>
                  </div>

                  {/* Variation Image Upload */}
                  <div className="space-y-2">
                    <Label>Variation Image (optional)</Label>
                    <p className="text-xs text-muted-foreground">Upload an image showing the product in this variation (e.g., different metal color)</p>
                    <VariationImageUpload
                      imageUrl={formData.image_url}
                      onImageChange={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="btn-premium"
                    onClick={handleSubmit}
                    disabled={createVariation.isPending || updateVariation.isPending}
                  >
                    {(createVariation.isPending || updateVariation.isPending) && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {editingId ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {variations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No variations added yet.</p>
            <p className="text-sm">Add sizes, metal types, or other options for this product.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Price Adj.</TableHead>
                <TableHead>Weight Adj.</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variations.map((variation) => (
                <TableRow key={variation.id}>
                  <TableCell>
                    {variation.image_url ? (
                      <img src={variation.image_url} alt="" className="w-10 h-10 rounded object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-secondary flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {variation.variation_type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {variation.variation_type === 'size'
                      ? variation.size_value
                      : METAL_TYPE_NAMES[variation.metal_type as MetalType] || variation.metal_type}
                  </TableCell>
                  <TableCell>
                    {variation.price_adjustment > 0 && '+'}
                    ₹{variation.price_adjustment.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell>
                    {variation.weight_adjustment > 0 && '+'}
                    {variation.weight_adjustment}g
                  </TableCell>
                  <TableCell>{variation.stock_quantity}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {variation.is_default && (
                        <Badge className="bg-primary/20 text-primary text-xs">
                          Default
                        </Badge>
                      )}
                      {!variation.is_available && (
                        <Badge variant="secondary" className="text-xs">
                          Unavailable
                        </Badge>
                      )}
                      {variation.is_available && !variation.is_default && (
                        <Badge variant="outline" className="text-xs text-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(variation)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(variation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
