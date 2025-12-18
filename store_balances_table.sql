-- ============================================================================
-- Store Balances Table Migration
-- Description: Creates a singleton table to track running store balances
-- Version: 1.0
-- ============================================================================

-- Create store_balances table for running balances
-- This is a singleton table (only one row should ever exist)
CREATE TABLE IF NOT EXISTS store_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cash_balance DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (cash_balance >= 0),
  mpesa_agent_balance DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (mpesa_agent_balance >= 0),
  mpesa_phone_balance DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (mpesa_phone_balance >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT reasonable_balance_limits CHECK (
    cash_balance <= 10000000 AND
    mpesa_agent_balance <= 10000000 AND
    mpesa_phone_balance <= 10000000
  )
);

-- Add comment to table
COMMENT ON TABLE store_balances IS 'Singleton table storing current running balances for the store. Should only contain one record.';
COMMENT ON COLUMN store_balances.cash_balance IS 'Physical cash balance at the store';
COMMENT ON COLUMN store_balances.mpesa_agent_balance IS 'Mpesa agent account balance';
COMMENT ON COLUMN store_balances.mpesa_phone_balance IS 'Mpesa phone (Till Number) balance';

-- Enable Row Level Security
ALTER TABLE store_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read store_balances" ON store_balances;
DROP POLICY IF EXISTS "Allow authenticated users to insert store_balances" ON store_balances;
DROP POLICY IF EXISTS "Allow authenticated users to update store_balances" ON store_balances;
DROP POLICY IF EXISTS "Prevent deletion of store_balances" ON store_balances;

-- RLS Policies for authenticated users only
CREATE POLICY "Allow authenticated users to read store_balances"
  ON store_balances
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert store_balances"
  ON store_balances
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update store_balances"
  ON store_balances
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    cash_balance >= 0 AND
    mpesa_agent_balance >= 0 AND
    mpesa_phone_balance >= 0
  );

-- Prevent deletion - balances should never be deleted, only updated
CREATE POLICY "Prevent deletion of store_balances"
  ON store_balances
  FOR DELETE
  TO authenticated
  USING (false);

-- Insert initial record if none exists (idempotent)
INSERT INTO store_balances (
  id,
  cash_balance,
  mpesa_agent_balance,
  mpesa_phone_balance
)
VALUES (
  gen_random_uuid(),
  0,
  0,
  0
)
ON CONFLICT (id) DO NOTHING;

-- Only insert if table is completely empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM store_balances LIMIT 1) THEN
    INSERT INTO store_balances (cash_balance, mpesa_agent_balance, mpesa_phone_balance)
    VALUES (0, 0, 0);
  END IF;
END $$;

-- Create function to update timestamp automatically
CREATE OR REPLACE FUNCTION update_store_balances_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ensure updated_at is always set to current time
  NEW.updated_at = NOW();
  
  -- Ensure balances are never negative (double-check)
  IF NEW.cash_balance < 0 THEN
    RAISE EXCEPTION 'cash_balance cannot be negative';
  END IF;
  IF NEW.mpesa_agent_balance < 0 THEN
    RAISE EXCEPTION 'mpesa_agent_balance cannot be negative';
  END IF;
  IF NEW.mpesa_phone_balance < 0 THEN
    RAISE EXCEPTION 'mpesa_phone_balance cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add comment to function
COMMENT ON FUNCTION update_store_balances_updated_at() IS 'Automatically updates the updated_at timestamp and validates balance constraints';

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_store_balances_updated_at ON store_balances;
CREATE TRIGGER update_store_balances_updated_at
  BEFORE UPDATE ON store_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_store_balances_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_store_balances_updated_at 
  ON store_balances(updated_at DESC);

-- Add index on created_at for audit purposes
CREATE INDEX IF NOT EXISTS idx_store_balances_created_at 
  ON store_balances(created_at DESC);

-- ============================================================================
-- Verification Query
-- Run this to verify the table was created successfully
-- ============================================================================
-- SELECT * FROM store_balances;
