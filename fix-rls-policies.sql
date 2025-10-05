-- FIX RLS POLICIES TO ALLOW ANONYMOUS USERS
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to insert products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to update products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to delete products" ON products;

DROP POLICY IF EXISTS "Allow public read access to sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to insert sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to update sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to delete sales" ON sales;

-- Create new policies that allow anonymous users
CREATE POLICY "Allow all access to products"
  ON products
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all access to sales"
  ON sales
  USING (true)
  WITH CHECK (true);