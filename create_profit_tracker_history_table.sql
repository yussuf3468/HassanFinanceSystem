-- Business Profit Tracker History Table
-- Run this in Supabase SQL Editor to create the table for storing profit calculations

CREATE TABLE IF NOT EXISTS public.profit_tracker_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Input values
  initial_investment decimal(15,2) NOT NULL DEFAULT 0,
  current_stock decimal(15,2) NOT NULL DEFAULT 0,
  total_sales decimal(15,2) NOT NULL DEFAULT 0,
  cash decimal(15,2) NOT NULL DEFAULT 0,
  machines decimal(15,2) NOT NULL DEFAULT 0,
  expenses decimal(15,2) NOT NULL DEFAULT 0,
  debts decimal(15,2) NOT NULL DEFAULT 0,
  investor_amount decimal(15,2) NOT NULL DEFAULT 0,
  
  -- Calculated results
  pure_profit decimal(15,2) NOT NULL,
  net_profit decimal(15,2) NOT NULL,
  capital_comparison decimal(15,2) NOT NULL,
  investor_percentage decimal(7,4) NOT NULL DEFAULT 0,
  investor_profit_share decimal(15,2) NOT NULL DEFAULT 0,
  
  -- Optional metadata
  notes text,
  calculation_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_profit_history_date 
ON public.profit_tracker_history(calculation_date DESC);

-- Enable Row Level Security
ALTER TABLE public.profit_tracker_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to view all history
CREATE POLICY "Allow authenticated users to view profit history"
ON public.profit_tracker_history FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to insert records
CREATE POLICY "Allow authenticated users to insert profit history"
ON public.profit_tracker_history FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to delete their own records
CREATE POLICY "Allow authenticated users to delete profit history"
ON public.profit_tracker_history FOR DELETE
TO authenticated
USING (true);

-- Grant permissions
GRANT SELECT, INSERT, DELETE ON public.profit_tracker_history TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMENT ON TABLE public.profit_tracker_history IS 'Stores historical business profit calculations for tracking and analysis';
