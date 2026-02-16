-- Secure payments schema additions for M-Pesa Paybill/Till flow

-- Add secure payment metadata to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_reference text UNIQUE,
  ADD COLUMN IF NOT EXISTS payment_channel text, -- mpesa_paybill | mpesa_till
  ADD COLUMN IF NOT EXISTS payment_phone text,
  ADD COLUMN IF NOT EXISTS payment_amount decimal(10,2),
  ADD COLUMN IF NOT EXISTS payment_receipt_code text,
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz;

-- Ensure payment reference is generated alongside order number
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;

  IF NEW.payment_reference IS NULL OR NEW.payment_reference = '' THEN
    NEW.payment_reference := 'PM' || TO_CHAR(NOW(), 'YYMMDD') || '-' || NEW.order_number || '-' || LPAD((FLOOR(RANDOM() * 10000))::int::text, 4, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Payments confirmation table
CREATE TABLE IF NOT EXISTS payment_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  payment_reference text NOT NULL,
  customer_phone text NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  receipt_code text NOT NULL,
  proof_url text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  verified_at timestamptz,
  verified_by text,
  raw_data jsonb
);

-- Prevent duplicate M-Pesa receipt codes
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_confirmations_receipt_code ON payment_confirmations(receipt_code);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_order_id ON payment_confirmations(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_status ON payment_confirmations(status);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_submitted_at ON payment_confirmations(submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Allow public to submit confirmation if order number + phone match
CREATE POLICY "Allow public to submit payment confirmation"
  ON payment_confirmations
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_confirmations.order_id
        AND orders.order_number = payment_confirmations.order_number
        AND orders.customer_phone = payment_confirmations.customer_phone
    )
  );

-- Allow authenticated users to view and update confirmations
CREATE POLICY "Allow authenticated to view payment confirmations"
  ON payment_confirmations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to update payment confirmations"
  ON payment_confirmations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Optional: log payment events
CREATE TABLE IF NOT EXISTS payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_data jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at DESC);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated to view payment events"
  ON payment_events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated to insert payment events"
  ON payment_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
