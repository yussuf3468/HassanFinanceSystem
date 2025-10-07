# 🗄️ Supabase SQL Setup Commands

**Copy and paste these commands ONE BY ONE into your Supabase SQL Editor:**

## Step 1: Add E-commerce Columns to Products Table

```sql
-- Add new e-commerce columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing products to be published and visible
UPDATE products SET published = true WHERE published IS NULL;
UPDATE products SET featured = false WHERE featured IS NULL;
```

## Step 2: Create E-commerce Tables

```sql
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number VARCHAR(20) NOT NULL UNIQUE,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  delivery_address TEXT NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Step 3: Create Functions and Triggers

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for order number generation
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();
```

## Step 4: Set up Row Level Security (PUBLIC ACCESS)

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Products policies (ALLOW PUBLIC ACCESS to published products)
DROP POLICY IF EXISTS "Allow public read for published products" ON products;
CREATE POLICY "Allow public read for published products"
    ON products FOR SELECT
    TO public
    USING (published = true);

DROP POLICY IF EXISTS "Allow authenticated users full access to products" ON products;
CREATE POLICY "Allow authenticated users full access to products"
    ON products FOR ALL
    TO authenticated
    USING (true);

-- Customer policies (ALLOW PUBLIC ACCESS for registration)
DROP POLICY IF EXISTS "Allow public insert on customers" ON customers;
CREATE POLICY "Allow public insert on customers"
    ON customers FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on customers" ON customers;
CREATE POLICY "Allow public read on customers"
    ON customers FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage customers" ON customers;
CREATE POLICY "Allow authenticated users to manage customers"
    ON customers FOR ALL
    TO authenticated
    USING (true);

-- Orders policies (ALLOW PUBLIC ACCESS for checkout)
DROP POLICY IF EXISTS "Allow public insert on orders" ON orders;
CREATE POLICY "Allow public insert on orders"
    ON orders FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on orders" ON orders;
CREATE POLICY "Allow public read on orders"
    ON orders FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage orders" ON orders;
CREATE POLICY "Allow authenticated users to manage orders"
    ON orders FOR ALL
    TO authenticated
    USING (true);

-- Order items policies (ALLOW PUBLIC ACCESS)
DROP POLICY IF EXISTS "Allow public insert on order_items" ON order_items;
CREATE POLICY "Allow public insert on order_items"
    ON order_items FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on order_items" ON order_items;
CREATE POLICY "Allow public read on order_items"
    ON order_items FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to manage order_items" ON order_items;
CREATE POLICY "Allow authenticated users to manage order_items"
    ON order_items FOR ALL
    TO authenticated
    USING (true);
```

## Step 5: Create Performance Indexes

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(published);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
```

## ✅ All Done!

After running these commands, your e-commerce functionality will work with:

- ✅ Public access to browse products
- ✅ Public checkout without login required
- ✅ Order placement for anonymous customers
- ✅ Admin access with authentication for management

Your customers can now shop without any login required! 🛍️
