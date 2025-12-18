-- ============================================================================
-- Add Expenses and Deposits Columns to Cash Reconciliation
-- Description: Adds columns to track daily expenses and deposits
-- Version: 1.0
-- ============================================================================

-- Add expenses and deposits columns
ALTER TABLE cash_reconciliation
ADD COLUMN IF NOT EXISTS expenses DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (expenses >= 0),
ADD COLUMN IF NOT EXISTS deposits DECIMAL(12, 2) DEFAULT 0 NOT NULL CHECK (deposits >= 0);

-- Add comments
COMMENT ON COLUMN cash_reconciliation.expenses IS 'Total expenses paid from cash during the day (rent, utilities, etc.)';
COMMENT ON COLUMN cash_reconciliation.deposits IS 'Total deposits added to cash during the day (owner funds, bank deposits, etc.)';

-- Create indexes for reporting
CREATE INDEX IF NOT EXISTS idx_cash_reconciliation_expenses 
  ON cash_reconciliation(expenses) WHERE expenses > 0;

CREATE INDEX IF NOT EXISTS idx_cash_reconciliation_deposits 
  ON cash_reconciliation(deposits) WHERE deposits > 0;

-- ============================================================================
-- Verification Query
-- Run this to verify the columns were added successfully
-- ============================================================================
-- SELECT reconciliation_date, expenses, deposits, actual_total, variance_total
-- FROM cash_reconciliation
-- ORDER BY reconciliation_date DESC
-- LIMIT 10;
