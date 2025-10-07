# E-commerce Database Setup for Hassan Muse BookShop

## SQL Scripts to Run in Supabase

Copy and paste these SQL commands in your Supabase SQL Editor:

### 1. Create Customers Table

```sql
-- Customers table for customer registration and login
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only see and update their own data
CREATE POLICY "Customers can view own data" ON customers
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Customers can update own data" ON customers
  FOR UPDATE USING (auth.uid()::text = id::text);
```

### 2. Create Orders Table

```sql
-- Orders table for customer orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  order_number TEXT UNIQUE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  delivery_address TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only see their own orders
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (auth.uid()::text = customer_id::text);

-- Policy: Admin can see all orders
CREATE POLICY "Admin can view all orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 3. Create Order Items Table

```sql
-- Order items table for products in each order
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_name TEXT NOT NULL, -- Store product name for historical records
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS for order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can only see items from their own orders
CREATE POLICY "Customers can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id::text = auth.uid()::text
    )
  );

-- Policy: Admin can see all order items
CREATE POLICY "Admin can view all order items" ON order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
```

### 4. Create Order Number Function

```sql
-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_num TEXT;
BEGIN
  -- Generate order number like HMS-20251007-001
  SELECT 'HMS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' ||
         LPAD((COUNT(*) + 1)::TEXT, 3, '0')
  INTO order_num
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;

  RETURN order_num;
END;
$$ LANGUAGE plpgsql;
```

### 5. Create Trigger for Order Numbers

```sql
-- Trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();
```

### 6. Update Products for E-commerce

```sql
-- Add published status to products (for hiding products from customers)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
```

## 🔧 **How to Execute These Scripts**

1. **Go to Supabase Dashboard** → Your Project
2. **Click on "SQL Editor"** in the left sidebar
3. **Copy and paste each section** one by one
4. **Click "Run"** for each section
5. **Verify tables are created** in the Table Editor

## ✅ **Verification**

After running all scripts, you should see these new tables:

- `customers`
- `orders`
- `order_items`

And the `products` table should have new columns:

- `published`
- `featured`
- `description`
