
-- UPI Payment Settings table (admin-managed QR codes)
CREATE TABLE public.upi_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upi_id text,
  qr_code_url text,
  merchant_name text DEFAULT 'KRT Jewels',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.upi_payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage upi settings"
  ON public.upi_payment_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active upi settings"
  ON public.upi_payment_settings FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Add UPI payment proof columns to orders
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_utr text,
  ADD COLUMN IF NOT EXISTS upi_phone text,
  ADD COLUMN IF NOT EXISTS upi_provider text,
  ADD COLUMN IF NOT EXISTS payment_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_verified_by uuid;
