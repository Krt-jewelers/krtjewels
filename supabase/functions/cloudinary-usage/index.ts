import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    if (!API_SECRET) {
      throw new Error('CLOUDINARY_API_SECRET not configured');
    }

    // Fetch usage from Cloudinary Admin API
    const auth = btoa(`${API_KEY}:${API_SECRET}`);
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/usage`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch Cloudinary usage');
    }

    const result = {
      storage_used_bytes: data.storage?.used_bytes || 0,
      storage_limit_bytes: data.storage?.limit || 0,
      bandwidth_used_bytes: data.bandwidth?.used_bytes || 0,
      bandwidth_limit_bytes: data.bandwidth?.limit || 0,
      transformations_used: data.transformations?.usage || 0,
      transformations_limit: data.transformations?.limit || 0,
      resources: data.resources || 0,
      plan: data.plan || 'Free',
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
