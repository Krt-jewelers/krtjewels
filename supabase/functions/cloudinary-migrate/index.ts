import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLOUD_NAME = 'dy6mjjky3';
    const API_KEY = '144956732892888';
    const API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!API_SECRET) {
      throw new Error('CLOUDINARY_API_SECRET not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const auth = btoa(`${API_KEY}:${API_SECRET}`);

    const results: { table: string; field: string; migrated: number; errors: string[] }[] = [];

    // Helper to upload image to Cloudinary
    async function migrateImage(imageUrl: string, folder: string): Promise<string | null> {
      if (!imageUrl) return null;
      
      // Skip if already on Cloudinary
      if (imageUrl.includes('cloudinary.com') || imageUrl.includes('res.cloudinary')) {
        return imageUrl;
      }

      try {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const paramsToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(paramsToSign);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const formData = new FormData();
        formData.append('file', imageUrl);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
          { method: 'POST', body: formData }
        );

        const result = await response.json();
        if (!response.ok) {
          console.error('Cloudinary upload error:', result);
          return null;
        }

        return result.secure_url;
      } catch (e) {
        console.error('Migration error:', e);
        return null;
      }
    }

    // 1. Migrate product images
    const { data: products } = await supabase.from('products').select('id, images');
    let productsMigrated = 0;
    const productErrors: string[] = [];

    for (const product of (products || [])) {
      if (!product.images || product.images.length === 0) continue;
      
      const newImages: string[] = [];
      let hasChanges = false;

      for (const img of product.images) {
        if (img.includes('cloudinary.com')) {
          newImages.push(img);
        } else {
          const newUrl = await migrateImage(img, 'products');
          if (newUrl) {
            newImages.push(newUrl);
            hasChanges = true;
          } else {
            newImages.push(img);
            productErrors.push(`Product ${product.id}: Failed to migrate ${img}`);
          }
        }
      }

      if (hasChanges) {
        await supabase.from('products').update({ images: newImages }).eq('id', product.id);
        productsMigrated++;
      }
    }
    results.push({ table: 'products', field: 'images', migrated: productsMigrated, errors: productErrors });

    // 2. Migrate carousel_categories images
    const { data: carousels } = await supabase.from('carousel_categories').select('id, image_url');
    let carouselMigrated = 0;
    const carouselErrors: string[] = [];

    for (const item of (carousels || [])) {
      if (!item.image_url || item.image_url.includes('cloudinary.com')) continue;
      
      const newUrl = await migrateImage(item.image_url, 'carousel');
      if (newUrl) {
        await supabase.from('carousel_categories').update({ image_url: newUrl }).eq('id', item.id);
        carouselMigrated++;
      } else {
        carouselErrors.push(`Carousel ${item.id}: Failed`);
      }
    }
    results.push({ table: 'carousel_categories', field: 'image_url', migrated: carouselMigrated, errors: carouselErrors });

    // 3. Migrate product_variations images
    const { data: variations } = await supabase.from('product_variations').select('id, image_url');
    let variationsMigrated = 0;
    const variationErrors: string[] = [];

    for (const item of (variations || [])) {
      if (!item.image_url || item.image_url.includes('cloudinary.com')) continue;
      
      const newUrl = await migrateImage(item.image_url, 'variations');
      if (newUrl) {
        await supabase.from('product_variations').update({ image_url: newUrl }).eq('id', item.id);
        variationsMigrated++;
      } else {
        variationErrors.push(`Variation ${item.id}: Failed`);
      }
    }
    results.push({ table: 'product_variations', field: 'image_url', migrated: variationsMigrated, errors: variationErrors });

    // 4. Migrate attribute_template_options images
    const { data: attrOptions } = await supabase.from('attribute_template_options').select('id, image_url');
    let attrMigrated = 0;
    const attrErrors: string[] = [];

    for (const item of (attrOptions || [])) {
      if (!item.image_url || item.image_url.includes('cloudinary.com')) continue;
      
      const newUrl = await migrateImage(item.image_url, 'attributes');
      if (newUrl) {
        await supabase.from('attribute_template_options').update({ image_url: newUrl }).eq('id', item.id);
        attrMigrated++;
      } else {
        attrErrors.push(`Attribute ${item.id}: Failed`);
      }
    }
    results.push({ table: 'attribute_template_options', field: 'image_url', migrated: attrMigrated, errors: attrErrors });

    // 5. Migrate megamenu images
    const { data: menuItems } = await supabase.from('megamenu_item_products').select('id, product_image_url');
    let menuMigrated = 0;
    const menuErrors: string[] = [];

    for (const item of (menuItems || [])) {
      if (!item.product_image_url || item.product_image_url.includes('cloudinary.com')) continue;
      
      const newUrl = await migrateImage(item.product_image_url, 'megamenu');
      if (newUrl) {
        await supabase.from('megamenu_item_products').update({ product_image_url: newUrl }).eq('id', item.id);
        menuMigrated++;
      } else {
        menuErrors.push(`Menu ${item.id}: Failed`);
      }
    }
    results.push({ table: 'megamenu_item_products', field: 'product_image_url', migrated: menuMigrated, errors: menuErrors });

    // 6. Migrate megamenu_featured_products images
    const { data: featuredItems } = await supabase.from('megamenu_featured_products').select('id, product_image_url');
    let featuredMigrated = 0;
    const featuredErrors: string[] = [];

    for (const item of (featuredItems || [])) {
      if (!item.product_image_url || item.product_image_url.includes('cloudinary.com')) continue;
      
      const newUrl = await migrateImage(item.product_image_url, 'megamenu');
      if (newUrl) {
        await supabase.from('megamenu_featured_products').update({ product_image_url: newUrl }).eq('id', item.id);
        featuredMigrated++;
      } else {
        featuredErrors.push(`Featured ${item.id}: Failed`);
      }
    }
    results.push({ table: 'megamenu_featured_products', field: 'product_image_url', migrated: featuredMigrated, errors: featuredErrors });

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      summary: {
        total_migrated: results.reduce((sum, r) => sum + r.migrated, 0),
        total_errors: results.reduce((sum, r) => sum + r.errors.length, 0),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
