-- Create PostgreSQL function to calculate comprehensive financial totals
-- This function handles ALL sales records without pagination limits
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_financial_totals()
RETURNS TABLE (
  total_sales numeric,
  total_profit numeric,
  monthly_sales numeric,
  monthly_profit numeric,
  daily_sales numeric,
  daily_profit numeric,
  yesterday_profit numeric,
  total_cyber_profit numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- All-time totals
    COALESCE(SUM(s.total_sale), 0)::numeric AS total_sales,
    COALESCE(SUM(s.profit), 0)::numeric AS total_profit,
    
    -- Current month totals
    COALESCE(SUM(CASE 
      WHEN date_trunc('month', COALESCE(s.sale_date, s.created_at)) = date_trunc('month', CURRENT_DATE)
      THEN s.total_sale 
      ELSE 0 
    END), 0)::numeric AS monthly_sales,
    COALESCE(SUM(CASE 
      WHEN date_trunc('month', COALESCE(s.sale_date, s.created_at)) = date_trunc('month', CURRENT_DATE)
      THEN s.profit 
      ELSE 0 
    END), 0)::numeric AS monthly_profit,
    
    -- Today's totals
    COALESCE(SUM(CASE 
      WHEN COALESCE(s.sale_date::date, s.created_at::date) = CURRENT_DATE 
      THEN s.total_sale 
      ELSE 0 
    END), 0)::numeric AS daily_sales,
    COALESCE(SUM(CASE 
      WHEN COALESCE(s.sale_date::date, s.created_at::date) = CURRENT_DATE 
      THEN s.profit 
      ELSE 0 
    END), 0)::numeric AS daily_profit,
    
    -- Yesterday's profit
    COALESCE(SUM(CASE 
      WHEN COALESCE(s.sale_date::date, s.created_at::date) = CURRENT_DATE - INTERVAL '1 day'
      THEN s.profit 
      ELSE 0 
    END), 0)::numeric AS yesterday_profit,
    
    -- Total cyber services profit (if you have a cyber services category)
    -- Adjust this query based on how you identify cyber services
    -- For now, returning 0 - modify based on your product categorization
    0::numeric AS total_cyber_profit
  FROM public.sales s;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_financial_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_totals() TO anon;

-- Test the function
SELECT * FROM public.get_financial_totals();
