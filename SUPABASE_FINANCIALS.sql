-- Financial Management Schema for Dashboard KPIs
-- Run in Supabase SQL Editor. Safe to run multiple times.

-- Categories for expenses
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Expenses
CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  incurred_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Initial investments (capital injections)
CREATE TABLE IF NOT EXISTS public.initial_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,                -- e.g., Owner, Partner, Bank
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  invested_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Debts/Loans
CREATE TABLE IF NOT EXISTS public.debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lender text NOT NULL,                -- e.g., Bank, Supplier
  principal decimal(12,2) NOT NULL CHECK (principal >= 0),
  interest_rate decimal(7,4) DEFAULT 0, -- e.g., 0.1200 for 12%
  started_on date NOT NULL DEFAULT CURRENT_DATE,
  due_on date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','closed','defaulted')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Debt payments
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid NOT NULL REFERENCES public.debts(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL CHECK (amount >= 0),
  paid_on date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_incurred_on ON public.expenses(incurred_on);
CREATE INDEX IF NOT EXISTS idx_debt_payments_paid_on ON public.debt_payments(paid_on);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts(status);

-- RLS
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initial_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

-- PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY on some versions.
-- Use idempotent DO blocks to create policies only when they don't exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expense_categories' AND policyname = 'expense_categories_select_public'
  ) THEN
    CREATE POLICY "expense_categories_select_public" ON public.expense_categories FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expense_categories' AND policyname = 'expense_categories_cud_auth'
  ) THEN
    CREATE POLICY "expense_categories_cud_auth" ON public.expense_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_select_public'
  ) THEN
    CREATE POLICY "expenses_select_public" ON public.expenses FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'expenses_cud_auth'
  ) THEN
    CREATE POLICY "expenses_cud_auth" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'initial_investments' AND policyname = 'initial_investments_select_public'
  ) THEN
    CREATE POLICY "initial_investments_select_public" ON public.initial_investments FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'initial_investments' AND policyname = 'initial_investments_cud_auth'
  ) THEN
    CREATE POLICY "initial_investments_cud_auth" ON public.initial_investments FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'debts' AND policyname = 'debts_select_public'
  ) THEN
    CREATE POLICY "debts_select_public" ON public.debts FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'debts' AND policyname = 'debts_cud_auth'
  ) THEN
    CREATE POLICY "debts_cud_auth" ON public.debts FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'debt_payments' AND policyname = 'debt_payments_select_public'
  ) THEN
    CREATE POLICY "debt_payments_select_public" ON public.debt_payments FOR SELECT TO public USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'debt_payments' AND policyname = 'debt_payments_cud_auth'
  ) THEN
    CREATE POLICY "debt_payments_cud_auth" ON public.debt_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Dashboard Views
-- Today revenue/profit from sales
CREATE OR REPLACE VIEW public.vw_today_revenue_profit AS
SELECT 
  COALESCE(SUM(total_sale), 0)::decimal(12,2) AS today_revenue,
  COALESCE(SUM(profit), 0)::decimal(12,2) AS today_profit
FROM public.sales
WHERE sale_date::date = CURRENT_DATE;

-- Monthly profit (sales profit - expenses in month)
CREATE OR REPLACE VIEW public.vw_monthly_profit AS
WITH sales_month AS (
  SELECT COALESCE(SUM(profit),0) AS sales_profit
  FROM public.sales
  WHERE date_trunc('month', sale_date) = date_trunc('month', CURRENT_DATE)
),
expenses_month AS (
  SELECT COALESCE(SUM(amount),0) AS total_expenses
  FROM public.expenses
  WHERE date_trunc('month', incurred_on) = date_trunc('month', CURRENT_DATE)
)
SELECT (sales_profit - total_expenses)::decimal(12,2) AS monthly_profit
FROM sales_month, expenses_month;

-- Net worth (simplified): total revenue - total expenses - outstanding debt principal + initial investments
CREATE OR REPLACE VIEW public.vw_net_worth AS
WITH all_sales AS (
  SELECT COALESCE(SUM(total_sale),0) AS revenue FROM public.sales
), all_expenses AS (
  SELECT COALESCE(SUM(amount),0) AS expenses FROM public.expenses
), debt_balance AS (
  SELECT COALESCE(SUM(d.principal) - COALESCE(SUM(dp.amount),0),0) AS outstanding
  FROM public.debts d
  LEFT JOIN public.debt_payments dp ON dp.debt_id = d.id
  WHERE d.status = 'active'
), initial AS (
  SELECT COALESCE(SUM(amount),0) AS invested FROM public.initial_investments
)
SELECT (revenue - expenses - outstanding + invested)::decimal(12,2) AS net_worth
FROM all_sales, all_expenses, debt_balance, initial;

-- Outstanding debt
CREATE OR REPLACE VIEW public.vw_outstanding_debt AS
SELECT COALESCE(SUM(d.principal) - COALESCE(SUM(dp.amount),0),0)::decimal(12,2) AS outstanding_debt
FROM public.debts d
LEFT JOIN public.debt_payments dp ON dp.debt_id = d.id
WHERE d.status = 'active';

-- Debts with running balance per debt
CREATE OR REPLACE VIEW public.vw_debts_with_balance AS
SELECT 
  d.id,
  d.lender,
  d.principal,
  d.interest_rate,
  d.started_on,
  d.due_on,
  d.status,
  d.notes,
  d.created_at,
  COALESCE(SUM(dp.amount), 0)::decimal(12,2) AS total_paid,
  (d.principal - COALESCE(SUM(dp.amount), 0))::decimal(12,2) AS outstanding
FROM public.debts d
LEFT JOIN public.debt_payments dp ON dp.debt_id = d.id
GROUP BY d.id
ORDER BY d.created_at DESC;

-- Monthly expenses for the last 12 months
CREATE OR REPLACE VIEW public.vw_monthly_expenses AS
SELECT
  to_char(date_trunc('month', e.incurred_on), 'YYYY-MM') AS ym,
  date_trunc('month', e.incurred_on) AS month,
  COALESCE(SUM(e.amount), 0)::decimal(12,2) AS total
FROM public.expenses e
WHERE e.incurred_on >= (date_trunc('month', CURRENT_DATE) - INTERVAL '11 months')
GROUP BY 1,2
ORDER BY 2;

-- Monthly investments for the last 12 months
CREATE OR REPLACE VIEW public.vw_monthly_investments AS
SELECT
  to_char(date_trunc('month', i.invested_on), 'YYYY-MM') AS ym,
  date_trunc('month', i.invested_on) AS month,
  COALESCE(SUM(i.amount), 0)::decimal(12,2) AS total
FROM public.initial_investments i
WHERE i.invested_on >= (date_trunc('month', CURRENT_DATE) - INTERVAL '11 months')
GROUP BY 1,2
ORDER BY 2;

-- Expense split by category for current month
CREATE OR REPLACE VIEW public.vw_expense_by_category_month AS
SELECT 
  c.name AS category,
  COALESCE(SUM(e.amount),0)::decimal(12,2) AS total
FROM public.expenses e
LEFT JOIN public.expense_categories c ON c.id = e.category_id
WHERE date_trunc('month', e.incurred_on) = date_trunc('month', CURRENT_DATE)
GROUP BY c.name
ORDER BY total DESC NULLS LAST;

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT, UPDATE, DELETE ON public.expense_categories, public.expenses, public.initial_investments, public.debts, public.debt_payments TO authenticated;
