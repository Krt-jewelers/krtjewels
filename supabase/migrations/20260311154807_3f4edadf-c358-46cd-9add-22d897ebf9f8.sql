
-- Create metal_types table for dynamic metal type management
CREATE TABLE public.metal_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  rate_per_gram numeric NOT NULL DEFAULT 0,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.metal_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view metal types" ON public.metal_types FOR SELECT TO public USING (true);
CREATE POLICY "Admins can manage metal types" ON public.metal_types FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_metal_types_updated_at
  BEFORE UPDATE ON public.metal_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed with existing metal types
INSERT INTO public.metal_types (name, slug, rate_per_gram, display_order) VALUES
  ('22K Gold', 'gold_22k', 0, 1),
  ('24K Gold', 'gold_24k', 0, 2),
  ('18K Gold', 'gold_18k', 0, 3),
  ('Silver', 'silver', 0, 4),
  ('Platinum', 'platinum', 0, 5);

-- Add metal_type_id to products for dynamic metal type reference
ALTER TABLE public.products ADD COLUMN metal_type_id uuid REFERENCES public.metal_types(id);
