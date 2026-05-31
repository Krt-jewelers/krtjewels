
-- 1. Set search_path on trigger functions to fix mutable search_path warnings
ALTER FUNCTION public.update_megamenu_items_updated_at() SET search_path = public;
ALTER FUNCTION public.update_megamenu_categories_updated_at() SET search_path = public;
ALTER FUNCTION public.update_megamenu_sections_updated_at() SET search_path = public;
ALTER FUNCTION public.update_megamenu_item_rules_updated_at() SET search_path = public;
ALTER FUNCTION public.update_megamenu_item_products_updated_at() SET search_path = public;
ALTER FUNCTION public.update_menu_categories_updated_at() SET search_path = public;
ALTER FUNCTION public.update_product_categories_updated_at() SET search_path = public;
ALTER FUNCTION public.update_megamenu_settings_updated_at() SET search_path = public;
ALTER FUNCTION public.update_megamenu_featured_products_updated_at() SET search_path = public;
ALTER FUNCTION public.update_menu_subcategories_updated_at() SET search_path = public;
ALTER FUNCTION public.update_product_subcategories_updated_at() SET search_path = public;

-- 2. Restrict low_stock_products view to admins only via security_invoker + admin gate
DROP VIEW IF EXISTS public.low_stock_products;
CREATE VIEW public.low_stock_products
WITH (security_invoker = true) AS
SELECT id, name, sku, stock_quantity, low_stock_threshold, category, is_active
FROM public.products p
WHERE stock_quantity IS NOT NULL
  AND low_stock_threshold IS NOT NULL
  AND stock_quantity <= low_stock_threshold
  AND is_active = true
  AND public.has_role(auth.uid(), 'admin'::public.app_role);

REVOKE ALL ON public.low_stock_products FROM anon;
GRANT SELECT ON public.low_stock_products TO authenticated;
GRANT ALL ON public.low_stock_products TO service_role;
