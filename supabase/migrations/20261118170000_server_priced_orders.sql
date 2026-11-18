-- Server-side order placement (additive; safe to apply before the new
-- storefront is live).
--
--   * place-order (service role) prices the cart from the database and calls
--     create_order_with_items, which checks stock under a lock and saves the
--     order and its items in one transaction;
--   * guests can look up their own order with its number and phone number;
--   * customers can no longer approve or publish their own reviews.
--
-- 20261118172000_block_direct_order_inserts.sql then stops browsers inserting
-- orders directly; apply it once the new storefront is live.

-- 1. Atomic order creation (service role only) -------------------------------
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
  r record;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'EMPTY_ORDER';
  END IF;

  -- Lock each product being bought, then check there is enough stock.
  -- A NULL stock_quantity means stock is not tracked for that product.
  FOR r IN
    SELECT (i->>'product_id')::uuid AS product_id, SUM((i->>'quantity')::int) AS qty
    FROM jsonb_array_elements(p_items) AS i
    GROUP BY 1
    ORDER BY 1
  LOOP
    PERFORM 1 FROM public.products p
      WHERE p.id = r.product_id AND COALESCE(p.is_active, false)
      FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUCT_UNAVAILABLE:%', r.product_id;
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = r.product_id AND p.stock_quantity IS NOT NULL AND p.stock_quantity < r.qty
    ) THEN
      RAISE EXCEPTION 'OUT_OF_STOCK:%', r.product_id;
    END IF;
  END LOOP;

  -- Order numbers: KRT + YYMM (India time) + 6 random digits, retried on clash.
  LOOP
    v_attempt := v_attempt + 1;
    v_order_number := 'KRT'
      || to_char(now() AT TIME ZONE 'Asia/Kolkata', 'YYMM')
      || lpad(floor(random() * 1000000)::int::text, 6, '0');
    BEGIN
      INSERT INTO public.orders (
        user_id, order_number, status, subtotal, gst_amount, total_amount,
        gold_rate_at_order, shipping_address, payment_method, payment_utr,
        upi_phone, upi_provider, notes, payment_verified
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
        false
      )
      RETURNING id, created_at INTO v_order_id, v_created_at;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      IF v_attempt >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  -- trigger_decrease_stock_on_order lowers stock for each inserted item.
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
    'created_at', v_created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_order_with_items(jsonb, jsonb) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_items(jsonb, jsonb) TO service_role;

-- 2. Order lookup by order number + phone (guests and the success page) -----
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
    'id', v_order.id,
    'order_number', v_order.order_number,
    'status', v_order.status,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'subtotal', v_order.subtotal,
    'gst_amount', v_order.gst_amount,
    'total_amount', v_order.total_amount,
    'payment_method', v_order.payment_method,
    'payment_verified', v_order.payment_verified,
    'shipping_address', v_order.shipping_address,
    'order_items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'product_image', oi.product_image,
        'quantity', oi.quantity,
        'weight_grams', oi.weight_grams,
        'unit_price', oi.unit_price,
        'total_price', oi.total_price,
        'selected_variations', oi.selected_variations
      ) ORDER BY oi.product_name)
      FROM public.order_items oi
      WHERE oi.order_id = v_order.id
    ), '[]'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.lookup_order(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_order(text, text) TO anon, authenticated;

-- 3. Reviews: customers cannot approve or publish their own -----------------
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
CREATE POLICY "Users can update own unapproved reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND COALESCE(is_approved, false) = false
  AND COALESCE(is_published, false) = false
);

CREATE POLICY "Admins can update reviews"
ON public.reviews FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
