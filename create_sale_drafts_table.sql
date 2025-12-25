-- ============================================================================
-- Sale Drafts Table Migration
-- Description: Creates table to store sale form drafts with full history
-- Version: 1.0
-- ============================================================================

-- Create sale_drafts table
CREATE TABLE IF NOT EXISTS sale_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_name VARCHAR(255) DEFAULT NULL,
  sold_by VARCHAR(100),
  payment_method VARCHAR(50),
  line_items JSONB NOT NULL,
  overall_discount_type VARCHAR(20),
  overall_discount_value DECIMAL(10, 2),
  selected_customer_id UUID,
  customer_search VARCHAR(255),
  quick_sale_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comments
COMMENT ON TABLE sale_drafts IS 'Stores draft sales for later completion';
COMMENT ON COLUMN sale_drafts.draft_name IS 'Optional user-provided name for the draft';
COMMENT ON COLUMN sale_drafts.line_items IS 'JSON array of sale line items';
COMMENT ON COLUMN sale_drafts.selected_customer_id IS 'Customer ID for the sale';

-- Enable Row Level Security
ALTER TABLE sale_drafts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read sale_drafts" ON sale_drafts;
DROP POLICY IF EXISTS "Allow authenticated users to insert sale_drafts" ON sale_drafts;
DROP POLICY IF EXISTS "Allow authenticated users to update sale_drafts" ON sale_drafts;
DROP POLICY IF EXISTS "Allow authenticated users to delete sale_drafts" ON sale_drafts;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read sale_drafts"
  ON sale_drafts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert sale_drafts"
  ON sale_drafts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sale_drafts"
  ON sale_drafts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sale_drafts"
  ON sale_drafts
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_sale_drafts_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_sale_drafts_updated_at ON sale_drafts;
CREATE TRIGGER update_sale_drafts_updated_at
  BEFORE UPDATE ON sale_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_sale_drafts_updated_at();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sale_drafts_created_at 
  ON sale_drafts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sale_drafts_customer_id 
  ON sale_drafts(selected_customer_id);

-- ============================================================================
-- Verification Query
-- ============================================================================
-- SELECT id, draft_name, sold_by, created_at, updated_at
-- FROM sale_drafts
-- ORDER BY created_at DESC
-- LIMIT 10;
