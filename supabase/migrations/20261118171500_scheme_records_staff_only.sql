-- Savings-scheme records: staff only.
--
-- Staff read these in the admin panel. Members use the "My scheme" page, which
-- goes through the chit-fund-lookup function. Nothing in the storefront reads
-- them as a signed-in customer.
--
-- The rules replaced here also let any signed-in account read the schemes
-- whose email matched the account's email. Sign-up does not confirm email
-- addresses, so anyone could register with a member's address and read that
-- member's scheme and payment history. Staff access stays; the email match
-- goes. Safe to apply at any time.
DROP POLICY IF EXISTS "Authenticated users can view own chit funds" ON public.chit_funds;
DROP POLICY IF EXISTS "Admins can view chit funds" ON public.chit_funds;
CREATE POLICY "Admins can view chit funds"
ON public.chit_funds FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view own chit payments" ON public.chit_payments;
DROP POLICY IF EXISTS "Admins can view chit payments" ON public.chit_payments;
CREATE POLICY "Admins can view chit payments"
ON public.chit_payments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Check the result (this database's rules may differ from the migration
-- files): stop, changing nothing, if another rule still lets someone who is
-- not an admin read these tables, and name it.
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
      AND tablename IN ('chit_funds', 'chit_payments')
      AND cmd IN ('SELECT', 'ALL')
      AND roles && ARRAY['public', 'anon', 'authenticated']::name[]
  ) p
  WHERE NOT (
    p.rule ~* '(has_role|user_roles)'
    AND p.rule ~ '''admin'''
    AND replace(p.rule, 'user_roles.user_id', '') !~* '(user_id|email|phone)'
  );

  IF v_left IS NOT NULL THEN
    RAISE EXCEPTION 'Savings-scheme records can still be read by non-admins through: %. Drop these policies and run this migration again (if one is meant for admins only, drop it from this check instead).', v_left;
  END IF;
END $$;
