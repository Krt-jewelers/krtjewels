-- Server-side order placement (additive; safe to apply before the new
-- storefront is live).
--
--   * place-order (service role) prices the cart from the database and calls
--     create_order_with_items, which checks stock under a lock and saves the
--     order and its items in one transaction;
--   * cancelling an order puts back the stock it took;
--   * guests can look up their own order with its number and phone number;
--   * customers can no longer approve or publish their own reviews.
--
-- 20261118172000_block_direct_order_inserts.sql then stops browsers inserting
-- orders directly; apply it once the new storefront is live.

-- 1. Columns the order function uses -----------------------------------------
--   checkout_ref: one id per checkout attempt, so a retry after a lost reply
--                 returns the first order instead of creating a second one.
--   staff_alert:  something staff must check before confirming the order (the
--                 price moved while the customer was paying, or stock ran out).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS checkout_ref text,
  ADD COLUMN IF NOT EXISTS staff_alert text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_checkout_ref_key
  ON public.orders (checkout_ref)
  WHERE checkout_ref IS NOT NULL;

-- 2. Stock --------------------------------------------------------------------
-- An empty (NULL) stock means "not tracked". The storefront already treats
-- NULL as available, but the trigger turned it into 0 on the first sale, which
-- then blocked every later order.
--
-- Each order item also remembers how many pieces it took (stock_taken), so a
-- cancelled order can put back exactly that many. Items saved before this
-- change have no stock_taken and are left alone, as before.
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS stock_taken integer;

CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_stock integer;
  v_taken integer;
BEGIN
  SELECT stock_quantity INTO v_stock
  FROM public.products
  WHERE id = NEW.product_id
  FOR UPDATE;

  -- No such product, or its stock is not tracked.
  IF v_stock IS NULL THEN
    RETURN NEW;
  END IF;

  v_taken := GREATEST(0, LEAST(v_stock, NEW.quantity));
  UPDATE public.products SET stock_quantity = v_stock - v_taken WHERE id = NEW.product_id;
  UPDATE public.order_items SET stock_taken = v_taken WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- The order function below checks stock and leaves lowering it to this
-- trigger. It should already be there; create it if it is not, so stock cannot
-- silently stop going down.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    WHERE t.tgrelid = 'public.order_items'::regclass
      AND t.tgfoid = 'public.decrease_stock_on_order()'::regprocedure
      AND NOT t.tgisinternal
  ) THEN
    CREATE TRIGGER trigger_decrease_stock_on_order
      AFTER INSERT ON public.order_items
      FOR EACH ROW
      EXECUTE FUNCTION public.decrease_stock_on_order();
  END IF;
END $$;

-- Cancelling an order puts back the pieces it took; moving it out of
-- "cancelled" takes them again (as many as are left).
CREATE OR REPLACE FUNCTION public.restock_on_order_cancel()
RETURNS TRIGGER AS $$
DECLARE
  r record;
  v_stock integer;
  v_taken integer;
BEGIN
  IF NEW.status = 'cancelled' THEN
    FOR r IN
      SELECT oi.id, oi.product_id, oi.stock_taken
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.stock_taken > 0
      ORDER BY oi.product_id
    LOOP
      UPDATE public.products
      SET stock_quantity = stock_quantity + r.stock_taken
      WHERE id = r.product_id AND stock_quantity IS NOT NULL;
      UPDATE public.order_items SET stock_taken = 0 WHERE id = r.id;
    END LOOP;
  ELSIF OLD.status = 'cancelled' THEN
    FOR r IN
      SELECT oi.id, oi.product_id, oi.quantity
      FROM public.order_items oi
      WHERE oi.order_id = NEW.id AND oi.stock_taken = 0
      ORDER BY oi.product_id
    LOOP
      SELECT stock_quantity INTO v_stock
      FROM public.products
      WHERE id = r.product_id
      FOR UPDATE;
      IF v_stock IS NOT NULL THEN
        v_taken := GREATEST(0, LEAST(v_stock, r.quantity));
        UPDATE public.products SET stock_quantity = v_stock - v_taken WHERE id = r.product_id;
        UPDATE public.order_items SET stock_taken = v_taken WHERE id = r.id;
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_restock_on_order_cancel ON public.orders;
CREATE TRIGGER trigger_restock_on_order_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.restock_on_order_cancel();

-- 3. Atomic order creation (service role only) -------------------------------
-- p_order keys besides the order columns:
--   checkout_ref            see above
--   allow_backorder         true for UPI orders: the customer has already paid,
--                           so the order is always recorded and staff are told
--                           when stock ran out or the product was withdrawn
--   requested_order_number  old storefront code shows its own order number to
--                           the customer; it is kept when it is free
CREATE OR REPLACE FUNCTION public.create_order_with_items(p_order jsonb, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_created_at timestamptz;
  v_attempt int := 0;
  v_ref text := NULLIF(p_order->>'checkout_ref', '');
  v_requested text := NULLIF(p_order->>'requested_order_number', '');
  v_allow_short boolean := COALESCE((p_order->>'allow_backorder')::boolean, false);
  v_alert text := NULLIF(p_order->>'staff_alert', '');
  v_short text[] := ARRAY[]::text[];
  v_name text;
  v_stock int;
  v_active boolean;
  r record;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ORDER';
  END IF;

  -- The same checkout sent twice returns the order already saved.
  IF v_ref IS NOT NULL THEN
    SELECT o.id, o.order_number, o.created_at INTO v_order_id, v_order_number, v_created_at
    FROM public.orders o WHERE o.checkout_ref = v_ref;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number,
                                'created_at', v_created_at, 'existing', true, 'short', '[]'::jsonb);
    END IF;
  END IF;

  -- Lock each product being bought (in id order, so two orders cannot
  -- deadlock), then check it is on sale and there is enough stock.
  FOR r IN
    SELECT (i->>'product_id')::uuid AS product_id, SUM((i->>'quantity')::int) AS qty
    FROM jsonb_array_elements(p_items) AS i
    GROUP BY 1
    ORDER BY 1
  LOOP
    SELECT p.name, p.stock_quantity, COALESCE(p.is_active, false)
      INTO v_name, v_stock, v_active
    FROM public.products p
    WHERE p.id = r.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE:%', r.product_id;
    END IF;

    IF NOT v_active OR (v_stock IS NOT NULL AND v_stock < r.qty) THEN
      IF v_allow_short THEN
        v_short := v_short || v_name;
      ELSIF NOT v_active THEN
        RAISE EXCEPTION 'PRODUCT_UNAVAILABLE:%', r.product_id;
      ELSE
        RAISE EXCEPTION 'OUT_OF_STOCK:%', r.product_id;
      END IF;
    END IF;
  END LOOP;

  -- A twin request may have saved the order while this one waited for locks.
  IF v_ref IS NOT NULL THEN
    SELECT o.id, o.order_number, o.created_at INTO v_order_id, v_order_number, v_created_at
    FROM public.orders o WHERE o.checkout_ref = v_ref;
    IF FOUND THEN
      RETURN jsonb_build_object('id', v_order_id, 'order_number', v_order_number,
                                'created_at', v_created_at, 'existing', true, 'short', '[]'::jsonb);
    END IF;
  END IF;

  IF cardinality(v_short) > 0 THEN
    v_alert := concat_ws(' ', v_alert,
      'Not available when the customer paid: ' || array_to_string(v_short, ', ')
      || '. Contact the customer before confirming.');
  END IF;

  -- Order numbers: KRT + YYMM (India time) + 8 digits from the database's
  -- secure random source, so they cannot be guessed or predicted.
  LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt = 1 AND v_requested ~ '^KRT[0-9]{8}$' THEN
      v_order_number := v_requested;
    ELSE
      v_order_number := 'KRT'
        || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYMM')
        || lpad(((('x' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))::bit(32)::bigint) % 100000000)::text, 8, '0');
    END IF;
    BEGIN
      INSERT INTO public.orders (
        user_id, order_number, status, subtotal, gst_amount, total_amount,
        gold_rate_at_order, shipping_address, payment_method, payment_utr,
        upi_phone, upi_provider, notes, payment_verified, checkout_ref, staff_alert
      ) VALUES (
        NULLIF(p_order->>'user_id', '')::uuid,
        v_order_number,
        'pending',
        (p_order->>'subtotal')::numeric,
        (p_order->>'gst_amount')::numeric,
        (p_order->>'total_amount')::numeric,
        (p_order->>'gold_rate_at_order')::numeric,
        p_order->'shipping_address',
        p_order->>'payment_method',
        NULLIF(p_order->>'payment_utr', ''),
        NULLIF(p_order->>'upi_phone', ''),
        NULLIF(p_order->>'upi_provider', ''),
        NULLIF(p_order->>'notes', ''),
        false,
        v_ref,
        v_alert
      )
      RETURNING id, created_at INTO v_order_id, v_created_at;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  -- trigger_decrease_stock_on_order lowers stock for each inserted item and
  -- records how many pieces it took.
  INSERT INTO public.order_items (
    order_id, product_id, product_name, product_image, quantity, weight_grams,
    gold_rate_applied, making_charges, diamond_cost, stone_cost, unit_price,
    total_price, selected_variations, variation_price_adjustment,
    variation_weight_adjustment
  )
  SELECT
    v_order_id,
    (i->>'product_id')::uuid,
    i->>'product_name',
    NULLIF(i->>'product_image', ''),
    (i->>'quantity')::int,
    (i->>'weight_grams')::numeric,
    (i->>'gold_rate_applied')::numeric,
    (i->>'making_charges')::numeric,
    COALESCE((i->>'diamond_cost')::numeric, 0),
    COALESCE((i->>'stone_cost')::numeric, 0),
    (i->>'unit_price')::numeric,
    (i->>'total_price')::numeric,
    COALESCE(i->'selected_variations', '{}'::jsonb),
    COALESCE((i->>'variation_price_adjustment')::numeric, 0),
    COALESCE((i->>'variation_weight_adjustment')::numeric, 0)
  FROM jsonb_array_elements(p_items) AS i;

  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'created_at', v_created_at,
    'existing', false,
    'short', to_jsonb(v_short)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;

-- 4. Order tracking by order number + phone ----------------------------------
-- Returns only what the tracking page shows: no address, name, phone or
-- payment details.
CREATE OR REPLACE FUNCTION public.lookup_order(p_order_number text, p_phone text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text := right(regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g'), 10);
  v_order public.orders%ROWTYPE;
BEGIN
  IF length(v_phone) <> 10 OR COALESCE(trim(p_order_number), '') = '' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_order
  FROM public.orders o
  WHERE o.order_number = upper(trim(p_order_number))
    AND right(regexp_replace(COALESCE(o.shipping_address->>'phone', ''), '\D', '', 'g'), 10) = v_phone
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'total_amount', v_order.total_amount,
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'product_image', oi.product_image,
        'quantity', oi.quantity,
        'total_price', oi.total_price
      ) ORDER BY oi.product_name)
      FROM public.order_items oi
      WHERE oi.order_id = v_order.id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order(text, text) TO anon, authenticated;

-- 5. Reviews: customers cannot approve or publish their own ------------------
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.reviews;
CREATE POLICY "Authenticated users can create reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(is_approved, false) = false
  AND COALESCE(is_published, false) = false
);

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own unapproved reviews" ON public.reviews;
CREATE POLICY "Users can update own unapproved reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(is_approved, false) = false
  AND COALESCE(is_published, false) = false
);

DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;
CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
