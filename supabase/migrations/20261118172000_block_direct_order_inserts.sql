-- Orders are created only by the place-order edge function.
--
-- Until now any signed-in customer could insert an order row with any total
-- and status straight from the browser. Apply this after the storefront that
-- calls place-order is live: the old checkout page inserts orders directly
-- and stops working once these policies are gone.
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;
