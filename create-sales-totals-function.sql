-- Create PostgreSQL function to calculate sales totals efficiently
-- This function handles ALL sales records without pagination limits
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_sales_totals()
RETURNS TABLE (
  total_sales numeric,
  total_profit numeric,
  today_sales numeric,
  today_profit numeric,
  year_sales numeric,
  year_profit numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- All-time totals
    COALESCE(SUM(s.total_sale), 0)::numeric AS total_sales,
    COALESCE(SUM(s.profit), 0)::numeric AS total_profit,
    
    -- Today's totals (using sale_date column if available, otherwise created_at)
    COALESCE(SUM(CASE 
      WHEN COALESCE(s.sale_date::date, s.created_at::date) = CURRENT_DATE 
      THEN s.total_sale 
      ELSE 0 
    END), 0)::numeric AS today_sales,
    COALESCE(SUM(CASE 
      WHEN COALESCE(s.sale_date::date, s.created_at::date) = CURRENT_DATE 
      THEN s.profit 
      ELSE 0 
    END), 0)::numeric AS today_profit,
    
    -- Current fiscal year totals (Feb 1 - Jan 31)
    -- Fiscal year starts on February 1st and ends on January 31st
    COALESCE(SUM(CASE 
      WHEN COALESCE(s.sale_date, s.created_at) >= 
        (CASE 
          WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 2 
          THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 2, 1)
          ELSE make_date((EXTRACT(YEAR FROM CURRENT_DATE) - 1)::int, 2, 1)
        END)
      AND COALESCE(s.sale_date, s.created_at) <= CURRENT_DATE
      THEN s.total_sale 
      ELSE 0 
    END), 0)::numeric AS year_sales,
    COALESCE(SUM(CASE 
      WHEN COALESCE(s.sale_date, s.created_at) >= 
        (CASE 
          WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 2 
          THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 2, 1)
          ELSE make_date((EXTRACT(YEAR FROM CURRENT_DATE) - 1)::int, 2, 1)
        END)
      AND COALESCE(s.sale_date, s.created_at) <= CURRENT_DATE
      THEN s.profit 
      ELSE 0 
    END), 0)::numeric AS year_profit
  FROM public.sales s;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_sales_totals() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_sales_totals() TO anon;

-- Test the function
SELECT * FROM public.get_sales_totals();
