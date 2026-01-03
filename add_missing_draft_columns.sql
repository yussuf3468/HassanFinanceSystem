-- ============================================================================
-- Add Missing Columns to sale_drafts Table
-- Description: Adds customer_name, payment_status, and amount_paid columns
-- Version: 1.0
-- Date: 2026-01-03
-- ============================================================================

-- Add missing columns to sale_drafts table
ALTER TABLE sale_drafts 
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2);

-- Add comments for new columns
COMMENT ON COLUMN sale_drafts.customer_name IS 'Customer name for the sale';
COMMENT ON COLUMN sale_drafts.payment_status IS 'Payment status (full, partial, pending)';
COMMENT ON COLUMN sale_drafts.amount_paid IS 'Amount paid for partial payments';

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sale_drafts'
ORDER BY ordinal_position;
