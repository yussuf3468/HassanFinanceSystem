-- =====================================================
-- MINIMAL CUSTOMER CREDIT SETUP (NO WARNINGS!)
-- =====================================================
-- This creates ONLY what your app needs
-- NO views, NO extra features, NO warnings!
-- =====================================================

-- =====================================================
-- STEP 1: Create Customer Credits Table
-- =====================================================

CREATE TABLE IF NOT EXISTS customer_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'partial')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: Create Credit Payments Table
-- =====================================================

CREATE TABLE IF NOT EXISTS credit_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES customer_credits(id) ON DELETE CASCADE,
  payment_amount DECIMAL(12, 2) NOT NULL CHECK (payment_amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Create Indexes (Optional but recommended)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_customer_credits_customer_name ON customer_credits(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_credits_status ON customer_credits(status);
CREATE INDEX IF NOT EXISTS idx_credit_payments_credit_id ON credit_payments(credit_id);

-- =====================================================
-- STEP 4: Enable RLS
-- =====================================================

ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create RLS Policies
-- =====================================================

DROP POLICY IF EXISTS "Allow authenticated users full access" ON customer_credits;
DROP POLICY IF EXISTS "Allow authenticated users full access" ON credit_payments;

CREATE POLICY "Allow authenticated users full access"
ON customer_credits FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users full access"
ON credit_payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- STEP 6: Auto-update trigger
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_customer_credits_updated_at ON customer_credits;
CREATE TRIGGER update_customer_credits_updated_at
  BEFORE UPDATE ON customer_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DONE! ✅
-- =====================================================
-- That's it! Just 2 tables, 3 indexes, 2 policies, 1 trigger
-- Your CustomerCredit.tsx component will work perfectly
-- =====================================================
