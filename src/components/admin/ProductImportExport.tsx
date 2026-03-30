import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Download, Upload, Loader2, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProductImportExportProps {
  onImportComplete?: () => void;
}

const EXPORT_COLUMNS = [
  'name', 'slug', 'description', 'short_description', 'sku',
  'metal_type', 'weight_grams', 'making_charge_percent',
  'diamond_cost', 'stone_cost', 'stock_quantity',
  'is_featured', 'is_bestseller', 'is_new_arrival', 'is_bridal', 'is_active',
  'images', 'tags', 'category_name', 'subcategory_name',
  'pricing_metals', 'pricing_metal_weights',
];

export function ProductImportExport({ onImportComplete }: ProductImportExportProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setIsExporting(true);
    try {
      // Fetch all products with categories
      const { data: products, error } = await supabase
        .from('products')
        .select('*, product_categories:product_category_id(name), product_subcategories:product_subcategory_id(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch variations
      const productIds = (products || []).map(p => p.id);
      const { data: variations } = await supabase
        .from('product_variations')
        .select('*')
        .in('product_id', productIds.length > 0 ? productIds : ['none']);

      // Build export rows
      const rows = (products || []).map((p: any) => {
        const pricingOptions = (p.specifications || {})?.pricing_options || {};
        const pricingMetalsRaw = Array.isArray(pricingOptions.metals) ? pricingOptions.metals : [];
        const pricingMetals = pricingMetalsRaw
          .map((m: any) => {
            if (typeof m === 'string') return m;
            if (m && typeof m.slug === 'string') return m.slug;
            if (m && typeof m.metal_type === 'string') return m.metal_type;
            return null;
          })
          .filter(Boolean) as string[];
        const pricingMetalWeights = pricingMetalsRaw
          .map((m: any) => {
            if (!m || typeof m !== 'object') return null;
            const slug = m.slug || m.metal_type;
            const weight = Number(m.weight_grams);
            if (!slug || !Number.isFinite(weight) || weight <= 0) return null;
            return `${slug}:${weight}`;
          })
          .filter(Boolean) as string[];

        return {
          name: p.name,
          slug: p.slug,
          description: p.description || '',
          short_description: p.short_description || '',
          sku: p.sku || '',
          metal_type: p.metal_type,
          weight_grams: p.weight_grams,
          making_charge_percent: p.making_charge_percent || '',
          diamond_cost: p.diamond_cost || 0,
          stone_cost: p.stone_cost || 0,
          stock_quantity: p.stock_quantity || 0,
          is_featured: p.is_featured ? 'yes' : 'no',
          is_bestseller: p.is_bestseller ? 'yes' : 'no',
          is_new_arrival: p.is_new_arrival ? 'yes' : 'no',
          is_bridal: p.is_bridal ? 'yes' : 'no',
          is_active: p.is_active ? 'yes' : 'no',
          images: (p.images || []).join(' | '),
          tags: (p.tags || []).join(', '),
          category_name: p.product_categories?.name || '',
          subcategory_name: p.product_subcategories?.name || '',
          pricing_metals: pricingMetals.join(' | '),
          pricing_metal_weights: pricingMetalWeights.join(' | '),
          variations: (variations || [])
            .filter(v => v.product_id === p.id)
            .map(v => `${v.variation_type}:${v.size_value || v.metal_label || v.size_label || ''}:${v.price_adjustment}:${v.weight_adjustment}`)
            .join(' | '),
        };
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Products');

      // Also add a template sheet
      const templateRow = [{
        name: 'Example Necklace',
        slug: 'example-necklace-krt',
        description: 'A beautiful necklace',
        short_description: 'Beautiful necklace',
        sku: 'KRT-001',
        metal_type: 'gold_22k',
        weight_grams: 10.5,
        making_charge_percent: 12,
        diamond_cost: 0,
        stone_cost: 0,
        stock_quantity: 5,
        is_featured: 'yes',
        is_bestseller: 'no',
        is_new_arrival: 'yes',
        is_bridal: 'no',
        is_active: 'yes',
        images: 'https://example.com/img1.jpg | https://example.com/img2.jpg',
        tags: 'temple, traditional',
        category_name: 'Necklaces',
        subcategory_name: '',
        pricing_metals: 'gold_22k | gold_18k',
        pricing_metal_weights: 'gold_22k:10.5 | gold_18k:9.8',
        variations: 'size:16":0:0 | size:18":500:1.5 | metal_type:24K Gold:0:0',
      }];
      const templateWs = XLSX.utils.json_to_sheet(templateRow);
      XLSX.utils.book_append_sheet(wb, templateWs, 'Template');

      if (format === 'csv') {
        XLSX.writeFile(wb, 'products-export.csv', { bookType: 'csv' });
      } else {
        XLSX.writeFile(wb, 'products-export.xlsx');
      }

      toast({ title: 'Exported!', description: `${rows.length} products exported as ${format.toUpperCase()}` });
    } catch (err: any) {
      toast({ title: 'Export Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet) as any[];

      if (rows.length === 0) {
        toast({ title: 'Empty file', description: 'No data found in the file', variant: 'destructive' });
        return;
      }

      // Validate required fields
      const errors: string[] = [];
      rows.forEach((row, idx) => {
        if (!row.name) errors.push(`Row ${idx + 2}: Missing product name`);
        if (!row.weight_grams && row.weight_grams !== 0) errors.push(`Row ${idx + 2}: Missing weight`);
      });

      setImportPreview(rows);
      setImportErrors(errors);
      setImportDialogOpen(true);
    } catch (err: any) {
      toast({ title: 'Parse Error', description: err.message, variant: 'destructive' });
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processImport = async () => {
    setIsImporting(true);
    setImportProgress(0);

    try {
      // Fetch categories for mapping
      const { data: categories } = await supabase.from('product_categories').select('id, name');
      const { data: subcategories } = await supabase.from('product_subcategories').select('id, name, product_category_id');
      const { data: metalTypes } = await supabase.from('metal_types').select('id, slug, name');

      const categoryMap = new Map((categories || []).map(c => [c.name.toLowerCase(), c.id]));
      const subcategoryMap = new Map((subcategories || []).map(s => [s.name.toLowerCase(), s.id]));
      const metalTypeMap = new Map((metalTypes || []).map(m => [m.slug, m.id]));

      const total = importPreview.length;
      let success = 0;
      let failed = 0;

      for (let i = 0; i < total; i++) {
        const row = importPreview[i];
        try {
          const generateSlug = (name: string) =>
            name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-krt';

          const boolVal = (v: any) => {
            if (typeof v === 'boolean') return v;
            if (typeof v === 'string') return v.toLowerCase() === 'yes' || v === '1' || v.toLowerCase() === 'true';
            return !!v;
          };

          const parseList = (value: any, separator = '|') =>
            value
              ? String(value).split(separator).map((s: string) => s.trim()).filter(Boolean)
              : [];

          const parseMetalWeights = (value: any) => {
            const entries = parseList(value, '|');
            const map: Record<string, number> = {};
            entries.forEach((entry: string) => {
              const normalized = entry.replace('=', ':');
              const [slug, weightRaw] = normalized.split(':').map((s) => s.trim());
              if (!slug) return;
              const weight = parseFloat(weightRaw);
              if (Number.isFinite(weight) && weight > 0) {
                map[slug] = weight;
              }
            });
            return map;
          };

          const pricingMetals = parseList(row.pricing_metals, '|');
          const pricingMetalWeights = parseMetalWeights(row.pricing_metal_weights);
          const metalsFromWeights = Object.keys(pricingMetalWeights);
          const resolvedPricingMetals = pricingMetals.length > 0
            ? pricingMetals
            : metalsFromWeights;

          const productData: any = {
            name: row.name,
            slug: row.slug || generateSlug(row.name),
            description: row.description || null,
            short_description: row.short_description || null,
            sku: row.sku || null,
            metal_type: row.metal_type || 'gold_22k',
            weight_grams: parseFloat(row.weight_grams) || 0,
            making_charge_percent: row.making_charge_percent ? parseFloat(row.making_charge_percent) : null,
            diamond_cost: parseFloat(row.diamond_cost) || 0,
            stone_cost: parseFloat(row.stone_cost) || 0,
            stock_quantity: parseInt(row.stock_quantity) || 1,
            is_featured: boolVal(row.is_featured),
            is_bestseller: boolVal(row.is_bestseller),
            is_new_arrival: boolVal(row.is_new_arrival),
            is_bridal: boolVal(row.is_bridal),
            is_active: row.is_active !== undefined ? boolVal(row.is_active) : true,
            images: parseList(row.images, '|'),
            tags: parseList(row.tags, ','),
          };

          // Map category
          if (row.category_name) {
            const catId = categoryMap.get(row.category_name.toLowerCase());
            if (catId) productData.product_category_id = catId;
          }

          // Map subcategory
          if (row.subcategory_name) {
            const subId = subcategoryMap.get(row.subcategory_name.toLowerCase());
            if (subId) productData.product_subcategory_id = subId;
          }

          // Map metal_type_id
          if (row.metal_type) {
            const mtId = metalTypeMap.get(row.metal_type);
            if (mtId) productData.metal_type_id = mtId;
          }

          // Check if product with same slug exists (upsert)
          const { data: existing } = await supabase
            .from('products')
            .select('id, specifications')
            .eq('slug', productData.slug)
            .maybeSingle();

          if (resolvedPricingMetals.length > 0) {
            const baseSpecs = (existing?.specifications as any) || {};
            const basePricingOptions = baseSpecs.pricing_options || {};
            const metalsPayload = resolvedPricingMetals.map((slug) => ({
              slug,
              weight_grams: Number.isFinite(pricingMetalWeights[slug]) ? pricingMetalWeights[slug] : null,
            }));
            productData.specifications = {
              ...baseSpecs,
              pricing_options: {
                ...basePricingOptions,
                metals: metalsPayload,
              },
            };
          }

          let productId: string;
          if (existing) {
            const { error } = await supabase
              .from('products')
              .update(productData)
              .eq('id', existing.id);
            if (error) throw error;
            productId = existing.id;
          } else {
            const { data: newProduct, error } = await supabase
              .from('products')
              .insert(productData)
              .select('id')
              .single();
            if (error) throw error;
            productId = newProduct.id;
          }

          // Parse and create variations
          if (row.variations && typeof row.variations === 'string') {
            const variationStrings = row.variations.split('|').map((s: string) => s.trim()).filter(Boolean);
            const variationsToInsert = variationStrings.map((vs: string) => {
              const parts = vs.split(':');
              const type = parts[0];
              const value = parts[1] || '';
              const priceAdj = parseFloat(parts[2]) || 0;
              const weightAdj = parseFloat(parts[3]) || 0;

              return {
                product_id: productId,
                variation_type: type,
                size_value: type === 'size' ? value : null,
                size_label: type === 'size' ? value : null,
                metal_type: type === 'metal_type' ? (row.metal_type || null) : null,
                metal_label: type === 'metal_type' ? value : null,
                price_adjustment: priceAdj,
                weight_adjustment: weightAdj,
                stock_quantity: 1,
                is_available: true,
                is_default: false,
              };
            });

            if (variationsToInsert.length > 0) {
              // Remove existing variations for this product first if updating
              if (existing) {
                await supabase.from('product_variations').delete().eq('product_id', productId);
              }
              await supabase.from('product_variations').insert(variationsToInsert);
            }
          }

          success++;
        } catch (err) {
          failed++;
          console.error(`Failed to import row ${i + 1}:`, err);
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      toast({
        title: 'Import Complete',
        description: `${success} products imported, ${failed} failed`,
      });

      setImportDialogOpen(false);
      setImportPreview([]);
      onImportComplete?.();
    } catch (err: any) {
      toast({ title: 'Import Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateRow = [{
      name: 'Example Gold Necklace',
      slug: '',
      description: 'A beautiful 22K gold necklace with traditional design',
      short_description: 'Traditional gold necklace',
      sku: 'KRT-001',
      metal_type: 'gold_22k',
      weight_grams: 10.5,
      making_charge_percent: 12,
      diamond_cost: 0,
      stone_cost: 0,
      stock_quantity: 5,
      is_featured: 'yes',
      is_bestseller: 'no',
      is_new_arrival: 'yes',
      is_bridal: 'no',
      is_active: 'yes',
      images: '',
      tags: 'temple, traditional, gold',
      category_name: 'Necklaces',
      subcategory_name: '',
      pricing_metals: 'gold_22k | gold_18k',
      pricing_metal_weights: 'gold_22k:10.5 | gold_18k:9.8',
      variations: 'size:18":0:0 | size:20":500:1.5',
    }];

    const ws = XLSX.utils.json_to_sheet(templateRow);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'product-import-template.xlsx');
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={downloadTemplate}>
        <FileSpreadsheet className="w-4 h-4 mr-1" />
        Template
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={isExporting}>
        {isExporting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
        Export Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleExport('csv')} disabled={isExporting}>
        <Download className="w-4 h-4 mr-1" />
        Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
        <Upload className="w-4 h-4 mr-1" />
        Import
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              {importPreview.length} products found in the file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {importErrors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-destructive font-medium text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  {importErrors.length} validation warnings
                </div>
                <div className="text-xs text-destructive/80 max-h-32 overflow-y-auto space-y-1">
                  {importErrors.slice(0, 10).map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                  {importErrors.length > 10 && <p>...and {importErrors.length - 10} more</p>}
                </div>
              </div>
            )}

            <div className="text-sm space-y-1">
              <p><strong>Products to import:</strong> {importPreview.length}</p>
              <p className="text-muted-foreground text-xs">
                Products with matching slugs will be updated. New slugs will be created.
              </p>
            </div>

            {isImporting && (
              <div className="space-y-2">
                <Progress value={importProgress} />
                <p className="text-xs text-muted-foreground text-center">{importProgress}% complete</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button className="btn-premium" onClick={processImport} disabled={isImporting}>
              {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {isImporting ? 'Importing...' : `Import ${importPreview.length} Products`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
