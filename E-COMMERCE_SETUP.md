# 🛍️ Hassan Muse BookShop E-commerce Setup Guide

## Database Schema Setup

⚠️ **IMPORTANT**: You need to run these SQL commands in your Supabase dashboard to set up the e-commerce tables.

### Step 1: Add New Columns to Products Table

```sql
-- Add new e-commerce columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing products to be published
UPDATE products SET published = true WHERE published IS NULL;
UPDATE products SET featured = false WHERE featured IS NULL;
```

### Step 2: Create E-commerce Tables

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

### Step 3: Create Triggers for Auto-updates

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
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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

-- Create sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Create trigger for order number generation
CREATE TRIGGER generate_order_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();
```

### Step 4: Set up Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products policies (allow public read for published products)
CREATE POLICY "Allow public read for published products"
    ON products FOR SELECT
    USING (published = true);

CREATE POLICY "Allow authenticated users full access to products"
    ON products FOR ALL
    USING (auth.role() = 'authenticated');

-- Customer policies
CREATE POLICY "Allow public insert on customers"
    ON customers FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own customer data"
    ON customers FOR SELECT
    USING (auth.uid()::text = id::text OR auth.role() = 'authenticated');

-- Orders policies
CREATE POLICY "Allow public insert on orders"
    ON orders FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read all orders"
    ON orders FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update orders"
    ON orders FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Order items policies
CREATE POLICY "Allow public insert on order_items"
    ON order_items FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read order_items"
    ON order_items FOR SELECT
    USING (auth.role() = 'authenticated');
```

### Step 5: Create Indexes for Performance

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
```

## Features Included

✅ **Customer Store Frontend**

- Product catalog with search and filtering
- Shopping cart with localStorage persistence
- Mobile-responsive design
- Bilingual labels (English/Somali)

✅ **Shopping Cart**

- Add/remove/update quantities
- Stock validation
- Price calculations
- Persistent storage

✅ **Checkout Process**

- Customer information form
- Phone number validation (Kenyan format)
- Order placement
- Order confirmation

✅ **Database Structure**

- Customers table
- Orders with auto-generated order numbers
- Order items with product relationships
- Stock management integration

✅ **Admin Integration**

- Toggle between customer and admin views
- Existing admin functionality preserved
- Product management for e-commerce

## Getting Started

1. **Run the SQL commands above** in your Supabase SQL editor
2. **Start the development server**: `npm run dev`
3. **Toggle between views** using the buttons in the top-right corner:
   - **Customer Store**: Public shopping interface
   - **Admin Panel**: Management dashboard (requires login)

## Usage

### Customer Experience

1. Browse products in the store
2. Search and filter by category
3. Add items to cart
4. Proceed to checkout
5. Fill in delivery details
6. Place order

### Admin Experience

1. Access admin panel
2. Manage products (set published/featured status)
3. View and manage orders
4. Track inventory and sales

## Next Steps (Optional Enhancements)

- 🔔 Email notifications for orders
- 📱 SMS integration for order updates
- 💳 M-Pesa payment integration
- 📦 Order tracking system
- 👥 Customer accounts and order history
- 📊 E-commerce analytics dashboard
- 🎨 Product image management
- 🚚 Delivery zone management

Your e-commerce platform is now ready! 🎉
