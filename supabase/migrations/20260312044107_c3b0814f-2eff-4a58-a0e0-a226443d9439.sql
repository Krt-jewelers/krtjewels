
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stones jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.products.stones IS 'Array of stone details: [{name, carat_weight, per_carat_price, quantity, shape}]';
