import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface IgMedia {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    const token = Deno.env.get('INSTAGRAM_ACCESS_TOKEN');
    if (!token) throw new Error('INSTAGRAM_ACCESS_TOKEN not configured');

    // Try cache first (refresh if older than 30 minutes)
    const { data: cached } = await supabase
      .from('instagram_cache')
      .select('posts, fetched_at')
      .eq('id', 1)
      .maybeSingle();

    const force = new URL(req.url).searchParams.get('refresh') === '1';
    if (!force && cached && (Date.now() - new Date(cached.fetched_at).getTime() < 30 * 60 * 1000)) {
      return new Response(JSON.stringify({ posts: cached.posts, cached: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch latest media from Instagram Graph API
    const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
    const igResp = await fetch(
      `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${token}`,
    );
    const igJson = await igResp.json();
    if (!igResp.ok) throw new Error(`Instagram API error: ${JSON.stringify(igJson)}`);

    const posts: IgMedia[] = (igJson.data || []).slice(0, 12);

    await supabase.from('instagram_cache').upsert({ id: 1, posts, fetched_at: new Date().toISOString() });

    return new Response(JSON.stringify({ posts, cached: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    // Fallback to cache if available
    const { data: cached } = await supabase.from('instagram_cache').select('posts').eq('id', 1).maybeSingle();
    return new Response(JSON.stringify({ posts: cached?.posts ?? [], error: msg, fallback: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
