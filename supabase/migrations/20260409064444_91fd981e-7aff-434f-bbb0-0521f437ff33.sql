
CREATE TABLE public.size_charts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  chart_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  column_headers JSONB NOT NULL DEFAULT '["Size", "Circumference (mm)", "Diameter (mm)"]'::jsonb,
  instructions TEXT DEFAULT '',
  guide_image_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.size_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view size charts"
ON public.size_charts FOR SELECT USING (true);

CREATE POLICY "Admins can manage size charts"
ON public.size_charts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_size_charts_updated_at
BEFORE UPDATE ON public.size_charts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
