import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  folder: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CLOUD_NAME = 'dhaglwzta';
    const API_KEY = '312797188237582';
    const API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET');

    if (!API_SECRET) {
      throw new Error('CLOUDINARY_API_SECRET not configured');
    }

    const url = new URL(req.url);
    const folder = url.searchParams.get('folder') || '';
    const nextCursor = url.searchParams.get('next_cursor') || '';
    const maxResults = url.searchParams.get('max_results') || '50';

    const auth = btoa(`${API_KEY}:${API_SECRET}`);
    
    let apiUrl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/resources/image?max_results=${maxResults}`;
    
    if (folder) {
      apiUrl += `&prefix=${folder}/&type=upload`;
    }
    if (nextCursor) {
      apiUrl += `&next_cursor=${nextCursor}`;
    }

    const response = await fetch(apiUrl, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to fetch images');
    }

    const resources: CloudinaryResource[] = (data.resources || []).map((r: any) => ({
      public_id: r.public_id,
      secure_url: r.secure_url,
      format: r.format,
      width: r.width,
      height: r.height,
      bytes: r.bytes,
      created_at: r.created_at,
      folder: r.folder || '',
    }));

    return new Response(JSON.stringify({
      resources,
      next_cursor: data.next_cursor || null,
      total_count: data.total_count || resources.length,
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
