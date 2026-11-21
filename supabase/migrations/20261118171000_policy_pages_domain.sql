-- The policy pages were written while the site lived at krtgold.lovable.app
-- and still name that address. Point them at the live domain.
UPDATE public.site_pages
SET content = replace(content, 'krtgold.lovable.app', 'www.krtjewellers.com')
WHERE content LIKE '%krtgold.lovable.app%';
