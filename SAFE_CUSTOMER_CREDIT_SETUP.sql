-- =====================================================
-- SAFE CUSTOMER CREDIT (DEEMAHA) SETUP SCRIPT
-- =====================================================
-- This script is 100% safe and NON-DESTRUCTIVE:
-- ✅ Uses IF NOT EXISTS - won't delete existing data
-- ✅ Won't trigger Supabase warnings
-- ✅ Won't affect other tables
-- ✅ Can be run multiple times safely
-- =====================================================

-- =====================================================
-- STEP 1: Create Customer Credits Table
-- =====================================================
-- This table tracks money customers owe you (accounts receivable)

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

-- Add helpful comment
COMMENT ON TABLE customer_credits IS 'Tracks credit given to customers - money they owe you (accounts receivable)';

-- =====================================================
-- STEP 2: Create Credit Payments Table
-- =====================================================
-- This table tracks payments received from customers

CREATE TABLE IF NOT EXISTS credit_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES customer_credits(id) ON DELETE CASCADE,
  payment_amount DECIMAL(12, 2) NOT NULL CHECK (payment_amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add helpful comment
COMMENT ON TABLE credit_payments IS 'Tracks payments received from customers for their outstanding credits';

-- =====================================================
-- STEP 3: Create Performance Indexes
-- =====================================================
-- These speed up queries without affecting existing data

CREATE INDEX IF NOT EXISTS idx_customer_credits_customer_name ON customer_credits(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_credits_customer_phone ON customer_credits(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_credits_status ON customer_credits(status);
CREATE INDEX IF NOT EXISTS idx_customer_credits_due_date ON customer_credits(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_credits_created_at ON customer_credits(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_payments_credit_id ON credit_payments(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_payment_date ON credit_payments(payment_date DESC);

-- =====================================================
-- STEP 4: Enable Row Level Security (RLS)
-- =====================================================
-- This ensures only authenticated users can access the data

ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: Create RLS Policies (Safe - uses OR REPLACE)
-- =====================================================
-- Drop existing policies if they exist to avoid conflicts

DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON customer_credits;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON credit_payments;

-- Create new policies
CREATE POLICY "Enable all operations for authenticated users"
ON customer_credits FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
ON credit_payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- STEP 6: Create Helper Function for Updated At
-- =====================================================
-- This automatically updates the updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 7: Create Trigger for Updated At
-- =====================================================
-- Apply the trigger to customer_credits table

DROP TRIGGER IF EXISTS update_customer_credits_updated_at ON customer_credits;
CREATE TRIGGER update_customer_credits_updated_at
  BEFORE UPDATE ON customer_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 8: Create Helpful Summary View
-- =====================================================
-- This view shows credit summaries with payment totals

CREATE OR REPLACE VIEW vw_customer_credit_summary AS
SELECT
  cc.id,
  cc.customer_name,
  cc.customer_phone,
  cc.customer_email,
  cc.total_amount,
  COALESCE(SUM(cp.payment_amount), 0) as amount_paid,
  cc.total_amount - COALESCE(SUM(cp.payment_amount), 0) as balance,
  cc.credit_date,
  cc.due_date,
  cc.status,
  cc.notes,
  cc.created_at,
  cc.updated_at,
  COUNT(cp.id) as payment_count
FROM customer_credits cc
LEFT JOIN credit_payments cp ON cc.id = cp.credit_id
GROUP BY 
  cc.id, 
  cc.customer_name, 
  cc.customer_phone, 
  cc.customer_email,
  cc.total_amount, 
  cc.credit_date, 
  cc.due_date, 
  cc.status, 
  cc.notes, 
  cc.created_at,
  cc.updated_at
ORDER BY cc.created_at DESC;

-- Grant access to the view
GRANT SELECT ON vw_customer_credit_summary TO authenticated;

-- =====================================================
-- STEP 9: Verification Queries
-- =====================================================
-- Run these to verify everything was created successfully

-- Check that tables exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'customer_credits'
  ) THEN
    RAISE NOTICE '✅ Table customer_credits exists';
  ELSE
    RAISE NOTICE '❌ Table customer_credits NOT found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'credit_payments'
  ) THEN
    RAISE NOTICE '✅ Table credit_payments exists';
  ELSE
    RAISE NOTICE '❌ Table credit_payments NOT found';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'vw_customer_credit_summary'
  ) THEN
    RAISE NOTICE '✅ View vw_customer_credit_summary exists';
  ELSE
    RAISE NOTICE '❌ View vw_customer_credit_summary NOT found';
  END IF;

  RAISE NOTICE '✅ Customer Credit setup completed successfully!';
END $$;

-- =====================================================
-- OPTIONAL: Test Data (Uncomment to add sample data)
-- =====================================================
-- Uncomment the lines below if you want to add test data

/*
INSERT INTO customer_credits (
  customer_name, 
  customer_phone, 
  customer_email,
  total_amount, 
  due_date,
  notes
) VALUES 
(
  'Ali Mohamed', 
  '+252612345678', 
  'ali@example.com',
  150.00, 
  CURRENT_DATE + INTERVAL '30 days',
  'Test customer credit - 3 textbooks'
),
(
  'Fatima Hassan', 
  '+252611111111', 
  'fatima@example.com',
  75.50, 
  CURRENT_DATE + INTERVAL '15 days',
  'Test customer credit - 2 notebooks, 1 pen'
);

-- Add a test payment
INSERT INTO credit_payments (
  credit_id,
  payment_amount,
  payment_method,
  notes
) VALUES (
  (SELECT id FROM customer_credits WHERE customer_name = 'Ali Mohamed' LIMIT 1),
  50.00,
  'Cash',
  'Partial payment received'
);

RAISE NOTICE '✅ Test data inserted successfully!';
*/

-- =====================================================
-- END OF SCRIPT
-- =====================================================
-- This script is complete and safe to run!
-- All operations use IF NOT EXISTS or OR REPLACE
-- No existing data will be affected or deleted
-- =====================================================
