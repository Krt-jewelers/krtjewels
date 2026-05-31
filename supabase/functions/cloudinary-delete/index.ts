import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin } from "../_shared/admin-auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_CLOUD_NAME = 'dhaglwzta';
const DEFAULT_API_KEY = '312797188237582';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const denied = await requireAdmin(req, corsHeaders);
  if (denied) return denied;

  try {
    const CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME') || DEFAULT_CLOUD_NAME;
    const API_KEY = Deno.env.get('CLOUDINARY_API_KEY') || DEFAULT_API_KEY;
    const API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!API_SECRET) {
      throw new Error('CLOUDINARY_API_SECRET not configured');
    }

    const { public_ids } = await req.json();

    if (!public_ids || !Array.isArray(public_ids) || public_ids.length === 0) {
      throw new Error('public_ids array is required');
    }

    if (public_ids.length > 100) {
      throw new Error('Maximum 100 images can be deleted at once');
    }

    const auth = btoa(`${API_KEY}:${API_SECRET}`);
    const deleted: string[] = [];
    const failed: { public_id: string; error: string }[] = [];

    // Cloudinary supports bulk delete via the delete_resources endpoint
    // Process in batches of 100 (API limit)
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Build the params string for signature
    const publicIdsParam = public_ids.sort().join(',');
    const paramsToSign = `public_ids[]=${public_ids.sort().map(encodeURIComponent).join('&public_ids[]=')}&timestamp=${timestamp}${API_SECRET}`;

    // Use Admin API for bulk delete
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image/upload`;
    
    // Delete individually for reliability
    for (const publicId of public_ids) {
      try {
        const deleteTimestamp = Math.floor(Date.now() / 1000).toString();
        const signString = `public_id=${publicId}&timestamp=${deleteTimestamp}${API_SECRET}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(signString);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('api_key', API_KEY);
        formData.append('timestamp', deleteTimestamp);
        formData.append('signature', signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`,
          { method: 'POST', body: formData }
        );

        const result = await response.json();
        
        if (result.result === 'ok' || result.result === 'not found') {
          deleted.push(publicId);
        } else {
          failed.push({ public_id: publicId, error: result.result || 'Unknown error' });
        }
      } catch (e) {
        failed.push({ public_id: publicId, error: e.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      deleted,
      failed,
      summary: {
        total_requested: public_ids.length,
        total_deleted: deleted.length,
        total_failed: failed.length,
      },
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
