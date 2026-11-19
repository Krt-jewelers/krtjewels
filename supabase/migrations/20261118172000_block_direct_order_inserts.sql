-- Orders are created only by the place-order edge function.
--
-- Until now any signed-in customer could insert an order row with any total
-- and status straight from the browser. Apply this after the storefront that
-- calls place-order is live: the old checkout page inserts orders directly
-- and stops working once these policies are gone.
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create order items" ON public.order_items;

-- Check the result. This database has tables that no migration file creates,
-- so its rules may differ from the files too: a rule under another name would
-- keep letting customers insert orders, and this step would only look done.
-- If one is left, stop here (nothing above is kept) and name it.
--
-- A rule counts as admin-only when it tests the admin role and nothing about
-- who owns the row.
DO $$
DECLARE
  v_left text;
BEGIN
  SELECT string_agg(format('"%s" on %s', p.policyname, p.tablename), ', ' ORDER BY p.tablename, p.policyname)
    INTO v_left
  FROM (
    SELECT policyname, tablename, concat_ws(' ', qual, with_check) AS rule
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('orders', 'order_items')
      AND cmd IN ('INSERT', 'ALL')
      AND roles && ARRAY['public', 'anon', 'authenticated']::name[]
  ) p
  WHERE NOT (
    p.rule ~* '(has_role|user_roles)'
    AND p.rule ~ '''admin'''
    AND replace(p.rule, 'user_roles.user_id', '') !~* 'user_id'
  );

  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'Orders can still be inserted from the browser through: %. Drop these policies and run this migration again (if one is meant for admins only, drop it from this check instead).', v_left;
  END IF;
END $$;
