
-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can lookup chit funds by phone or id" ON public.chit_funds;

-- Create a restrictive policy: only admins and the chit fund owner (matched by auth email) can read
CREATE POLICY "Authenticated users can view own chit funds"
  ON public.chit_funds
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT auth.email())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Also fix chit_payments: drop the open SELECT policy and restrict
DROP POLICY IF EXISTS "Anyone can view payments for accessible chit funds" ON public.chit_payments;

CREATE POLICY "Authenticated users can view own chit payments"
  ON public.chit_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chit_funds cf
      WHERE cf.id = chit_payments.chit_fund_id
      AND (
        cf.email = (SELECT auth.email())
        OR has_role(auth.uid(), 'admin'::app_role)
      )
    )
  );
