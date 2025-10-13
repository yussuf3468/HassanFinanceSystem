-- SUPABASE FULL BOOTSTRAP SCRIPT
-- Run this entire script in the SQL editor of your brand new Supabase project.
-- It will create all required tables, functions, triggers, indexes, RLS policies,
-- and storage policies for the BookStore app.

-- IMPORTANT:
-- - If you already ran any earlier scripts, this script uses IF EXISTS/IF NOT EXISTS
--   and safe drops to avoid conflicts.
-- - This script deliberately allows anon to insert orders and order_items so the
--   public checkout can work without auth. Adjust as needed for production.

------------------------------------------------------------------------
-- EXTENSIONS
------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;          -- for gen_random_uuid()

------------------------------------------------------------------------
-- CORE TABLES: products and sales
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  image_url text,
  buying_price decimal(10,2) NOT NULL DEFAULT 0,
  selling_price decimal(10,2) NOT NULL DEFAULT 0,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 5,
  -- visibility/sorting flags used by UI queries
  published boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date timestamptz NOT NULL DEFAULT now(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity_sold integer NOT NULL,
  selling_price decimal(10,2) NOT NULL,
  buying_price decimal(10,2) NOT NULL,
  total_sale decimal(10,2) NOT NULL,
  profit decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  sold_by text NOT NULL,
  -- discount fields
  discount_amount decimal(10,2) DEFAULT 0,
  discount_percentage decimal(5,2) DEFAULT 0,
  original_price decimal(10,2),
  final_price decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON public.sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON public.sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_products_product_id ON public.products(product_id);
CREATE INDEX IF NOT EXISTS idx_products_description ON public.products(description);

-- updated_at trigger for products
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Initialize sales original/final price if null
UPDATE public.sales 
SET original_price = selling_price,
    final_price = selling_price,
    discount_amount = COALESCE(discount_amount, 0),
    discount_percentage = COALESCE(discount_percentage, 0)
WHERE original_price IS NULL;

------------------------------------------------------------------------
-- ORDERS SYSTEM: orders and order_items
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 0,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash','mpesa','card','bank_transfer')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Order number generator
DROP FUNCTION IF EXISTS public.generate_order_number();
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS integer)), 0) + 1
    INTO counter
  FROM public.orders
  WHERE order_number ~ '^ORD[0-9]+$';

  new_number := 'ORD' || LPAD(counter::text, 3, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Set order number before insert
DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
DROP FUNCTION IF EXISTS public.set_order_number();
CREATE OR REPLACE FUNCTION public.set_order_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := public.generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_number();

-- Update order totals when items change
DROP TRIGGER IF EXISTS trigger_update_order_totals ON public.order_items;
DROP FUNCTION IF EXISTS public.update_order_totals();
CREATE OR REPLACE FUNCTION public.update_order_totals()
RETURNS trigger AS $$
BEGIN
  UPDATE public.orders 
  SET subtotal = (
        SELECT COALESCE(SUM(total_price), 0)
        FROM public.order_items 
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
      ),
      total_amount = subtotal + delivery_fee,
      updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_totals();

-- updated_at for orders
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

------------------------------------------------------------------------
-- AUTH/PROFILES (optional; supports staff monitoring and last_login)
------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Trigger: create profile for new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email ILIKE '%admin%' OR NEW.email ILIKE '%yussuf%'
         THEN 'admin' ELSE 'staff' END,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Last login helper
CREATE OR REPLACE FUNCTION public.update_last_login(user_id UUID, login_time TIMESTAMPTZ)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET last_login = login_time, updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

------------------------------------------------------------------------
-- RLS POLICIES
------------------------------------------------------------------------
-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Products
CREATE POLICY IF NOT EXISTS "products_public_read" ON public.products
  FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "products_authenticated_insert" ON public.products
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "products_authenticated_update" ON public.products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "products_authenticated_delete" ON public.products
  FOR DELETE TO authenticated USING (true);

-- Sales
CREATE POLICY IF NOT EXISTS "sales_public_read" ON public.sales
  FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "sales_authenticated_cud" ON public.sales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders (allow public insert for checkout flow)
CREATE POLICY IF NOT EXISTS "orders_public_insert" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "orders_authenticated_select" ON public.orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "orders_authenticated_update" ON public.orders
  FOR UPDATE TO authenticated USING (true);
-- Allow anon to select newly inserted rows (needed for .insert(...).select())
CREATE POLICY IF NOT EXISTS "orders_anon_select" ON public.orders
  FOR SELECT TO anon USING (true);

-- Order items (allow public insert for checkout flow)
CREATE POLICY IF NOT EXISTS "order_items_public_insert" ON public.order_items
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "order_items_authenticated_select" ON public.order_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY IF NOT EXISTS "order_items_authenticated_update" ON public.order_items
  FOR UPDATE TO authenticated USING (true);
-- Allow anon to select inserted items (needed for .insert(...).select())
CREATE POLICY IF NOT EXISTS "order_items_anon_select" ON public.order_items
  FOR SELECT TO anon USING (true);

-- Profiles: users can view/update own; admins can view/update all
CREATE POLICY IF NOT EXISTS "profiles_view_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_admin_view_all" ON public.profiles
  FOR SELECT USING ((auth.jwt() ->> 'email') ILIKE '%admin%' OR (auth.jwt() ->> 'email') ILIKE '%yussuf%');
CREATE POLICY IF NOT EXISTS "profiles_admin_update_all" ON public.profiles
  FOR UPDATE USING ((auth.jwt() ->> 'email') ILIKE '%admin%' OR (auth.jwt() ->> 'email') ILIKE '%yussuf%');

-- Grants
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.sales TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

------------------------------------------------------------------------
-- STORAGE: bucket and policies for product images
------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage.objects (scoped to product-images)
DO $$
BEGIN
  -- INSERT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product_images_insert_public'
  ) THEN
    CREATE POLICY "product_images_insert_public"
      ON storage.objects FOR INSERT TO public
      WITH CHECK (bucket_id = 'product-images');
  END IF;

  -- SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product_images_select_public'
  ) THEN
    CREATE POLICY "product_images_select_public"
      ON storage.objects FOR SELECT TO public
      USING (bucket_id = 'product-images');
  END IF;

  -- UPDATE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product_images_update_public'
  ) THEN
    CREATE POLICY "product_images_update_public"
      ON storage.objects FOR UPDATE TO public
      USING (bucket_id = 'product-images')
      WITH CHECK (bucket_id = 'product-images');
  END IF;

  -- DELETE
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'product_images_delete_public'
  ) THEN
    CREATE POLICY "product_images_delete_public"
      ON storage.objects FOR DELETE TO public
      USING (bucket_id = 'product-images');
  END IF;
END $$;

------------------------------------------------------------------------
-- OPTIONAL: Seed minimal sample products (safe to run multiple times)
------------------------------------------------------------------------
INSERT INTO public.products (product_id, name, category, image_url, buying_price, selling_price, quantity_in_stock, reorder_level)
VALUES
('BOOK001', 'Introduction to Programming', 'Books', 'https://picsum.photos/300/400?random=1', 800.00, 1200.00, 25, 5),
('BOOK002', 'Advanced Mathematics', 'Books', 'https://picsum.photos/300/400?random=2', 1000.00, 1500.00, 15, 3),
('PEN001', 'Blue Ink Pen', 'Pens', 'https://picsum.photos/300/400?random=3', 20.00, 40.00, 100, 20)
ON CONFLICT (product_id) DO NOTHING;

-- END OF SCRIPT
