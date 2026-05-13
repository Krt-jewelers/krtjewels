ALTER TABLE public.site_settings REPLICA IDENTITY FULL;
ALTER TABLE public.site_pages REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.site_pages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;