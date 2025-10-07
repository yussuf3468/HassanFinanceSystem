-- 🔧 FIX RLS POLICIES FOR ORDERS
-- This will fix the Row Level Security policies to allow public order creation

-- ✅ Drop existing policies first
DROP POLICY IF EXISTS "Allow public to insert orders" ON orders;
DROP POLICY IF EXISTS "Allow public to insert order items" ON order_items;

-- ✅ Create new policies that work with anonymous users
CREATE POLICY "Enable insert for anonymous users" 
  ON orders FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" 
  ON orders FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Enable insert for anonymous users" 
  ON order_items FOR INSERT 
  TO anon 
  WITH CHECK (true);

CREATE POLICY "Enable insert for authenticated users" 
  ON order_items FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- ✅ Also allow anon users to select (needed for the .select() after insert)
CREATE POLICY "Enable select for anonymous users" 
  ON orders FOR SELECT 
  TO anon 
  USING (true);

CREATE POLICY "Enable select for anonymous users" 
  ON order_items FOR SELECT 
  TO anon 
  USING (true);

-- ✅ Verify policies are created
SELECT schemaname, tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items');

-- 🎉 RLS policies fixed!