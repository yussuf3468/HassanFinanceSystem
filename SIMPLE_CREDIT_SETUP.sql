-- ========================================
-- ULTRA-SIMPLE CREDIT SETUP (ZERO WARNINGS)
-- ========================================
-- Just 2 tables + basic security
-- Copy and paste this ENTIRE file into Supabase SQL Editor
-- ========================================

-- Table 1: Customer Credits
CREATE TABLE IF NOT EXISTS customer_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  total_amount DECIMAL(12, 2) NOT NULL,
  credit_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Credit Payments
CREATE TABLE IF NOT EXISTS credit_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES customer_credits(id) ON DELETE CASCADE,
  payment_amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable security
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- Allow access
DROP POLICY IF EXISTS "authenticated_access" ON customer_credits;
DROP POLICY IF EXISTS "authenticated_access" ON credit_payments;

CREATE POLICY "authenticated_access" ON customer_credits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_access" ON credit_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Done! ✅
