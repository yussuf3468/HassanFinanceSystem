-- 🛒 Hassan Muse BookShop - Orders System Setup
-- Copy and paste this entire script into Supabase SQL Editor

-- ✅ Step 1: Clean up any existing functions/triggers (with CASCADE to handle dependencies)
DROP TRIGGER IF EXISTS trigger_update_order_totals ON order_items CASCADE;
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders CASCADE;
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders CASCADE;
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_order_totals() CASCADE;
DROP FUNCTION IF EXISTS set_order_number() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ✅ Step 2: Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  customer_email text,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  delivery_fee decimal(10,2) NOT NULL DEFAULT 0,
  subtotal decimal(10,2) NOT NULL DEFAULT 0,
  total_amount decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank_transfer')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ✅ Step 3: Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL CHECK (unit_price >= 0),
  total_price decimal(10,2) NOT NULL CHECK (total_price >= 0),
  created_at timestamptz DEFAULT now()
);

-- ✅ Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ✅ Step 5: Create functions
CREATE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS integer)), 0) + 1
  INTO counter
  FROM orders
  WHERE order_number ~ '^ORD[0-9]+$';
  
  new_number := 'ORD' || LPAD(counter::text, 3, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION update_order_totals()
RETURNS trigger AS $$
BEGIN
  UPDATE orders 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0)
      FROM order_items 
      WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    ),
    total_amount = subtotal + delivery_fee,
    updated_at = now()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION set_order_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ✅ Step 6: Create triggers
CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ✅ Step 7: Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ✅ Step 8: Create RLS policies
CREATE POLICY "Allow public to insert orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow public to insert order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update order items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (true);

-- 🎉 Setup Complete! Your orders system is ready!