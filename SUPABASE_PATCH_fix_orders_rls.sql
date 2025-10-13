-- Fix RLS so anonymous checkout can create and read orders immediately
-- Safe to run multiple times

-- Orders: allow anon SELECT for .insert(...).select()
DROP POLICY IF EXISTS "orders_anon_select" ON public.orders;
CREATE POLICY "orders_anon_select" ON public.orders
  FOR SELECT TO anon USING (true);

-- Order items: allow anon SELECT for .insert(...).select()
DROP POLICY IF EXISTS "order_items_anon_select" ON public.order_items;
CREATE POLICY "order_items_anon_select" ON public.order_items
  FOR SELECT TO anon USING (true);
