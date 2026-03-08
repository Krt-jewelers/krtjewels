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

    const auth = btoa(`${API_KEY}:${API_SECRET}`);

    // Try usage endpoint first
    let usageData: any = null;
    try {
      const usageRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/usage`,
        { headers: { 'Authorization': `Basic ${auth}` } }
      );
      if (usageRes.ok) {
        usageData = await usageRes.json();
      }
    } catch (_) {
      // Usage API may not be available on all plans
    }

    // Fallback: get resource count via resources endpoint
    let resourceCount = 0;
    try {
      const resRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?max_results=1`,
        { headers: { 'Authorization': `Basic ${auth}` } }
      );
      if (resRes.ok) {
        const resData = await resRes.json();
        resourceCount = resData.total_count || resData.resources?.length || 0;
      }
    } catch (_) {
      // Ignore
    }

    if (usageData) {
      const result = {
        storage_used_bytes: usageData.storage?.used_bytes || usageData.storage?.usage || 0,
        storage_limit_bytes: usageData.storage?.limit || 0,
        bandwidth_used_bytes: usageData.bandwidth?.used_bytes || usageData.bandwidth?.usage || 0,
        bandwidth_limit_bytes: usageData.bandwidth?.limit || 0,
        transformations_used: usageData.transformations?.usage || 0,
        transformations_limit: usageData.transformations?.limit || 0,
        resources: usageData.resources || resourceCount,
        plan: usageData.plan || 'Free',
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If usage API is not available, return minimal data
    const result = {
      storage_used_bytes: 0,
      storage_limit_bytes: 0,
      bandwidth_used_bytes: 0,
      bandwidth_limit_bytes: 0,
      transformations_used: 0,
      transformations_limit: 0,
      resources: resourceCount,
      plan: 'Free',
      limited: true,
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
