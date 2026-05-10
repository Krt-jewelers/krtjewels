UPDATE public.blog_posts SET cover_image_url = 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1600&q=85&auto=format&fit=crop' WHERE slug IN (SELECT slug FROM public.blog_posts ORDER BY display_order LIMIT 1 OFFSET 0);

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY display_order) AS rn FROM public.blog_posts
)
UPDATE public.blog_posts b
SET cover_image_url = c.url
FROM (VALUES
  (1, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1600&q=85&auto=format&fit=crop'),
  (2, 'https://images.unsplash.com/photo-1583937443566-6fe1a1c0e3a4?w=1600&q=85&auto=format&fit=crop'),
  (3, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1600&q=85&auto=format&fit=crop'),
  (4, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&q=85&auto=format&fit=crop'),
  (5, 'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=1600&q=85&auto=format&fit=crop'),
  (6, 'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1600&q=85&auto=format&fit=crop'),
  (7, 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1600&q=85&auto=format&fit=crop'),
  (8, 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=1600&q=85&auto=format&fit=crop'),
  (9, 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1600&q=85&auto=format&fit=crop'),
  (10, 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&q=85&auto=format&fit=crop')
) AS c(rn, url)
JOIN ordered o ON o.rn = c.rn
WHERE b.id = o.id;

CREATE TABLE IF NOT EXISTS public.instagram_cache (
  id INT PRIMARY KEY DEFAULT 1,
  posts JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT instagram_cache_singleton CHECK (id = 1)
);
ALTER TABLE public.instagram_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read instagram cache" ON public.instagram_cache FOR SELECT USING (true);