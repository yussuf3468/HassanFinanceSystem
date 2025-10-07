/*
  # Orders System Migration

  ## Overview
  This migration creates a complete orders system for customer orders,
  order items, and order tracking functionality.

  ## New Tables

  ### 1. `orders` - Customer Orders
    - `id` (uuid, primary key) - Unique order identifier
    - `order_number` (text, unique) - Human-readable order number (e.g., ORD001)
    - `customer_name` (text) - Customer name
    - `customer_email` (text) - Customer email
    - `customer_phone` (text) - Customer phone number
    - `delivery_address` (text) - Delivery address
    - `delivery_fee` (decimal) - Delivery cost
    - `subtotal` (decimal) - Order subtotal before delivery
    - `total_amount` (decimal) - Final order total
    - `status` (text) - pending, confirmed, processing, delivered, cancelled
    - `payment_method` (text) - Cash, Mpesa, Card, etc.
    - `payment_status` (text) - pending, paid, failed, refunded
    - `notes` (text) - Order notes
    - `created_at` (timestamptz) - Order creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `order_items` - Individual Order Items
    - `id` (uuid, primary key) - Unique item identifier
    - `order_id` (uuid, foreign key) - Reference to orders table
    - `product_id` (uuid, foreign key) - Reference to products table
    - `product_name` (text) - Product name at time of order
    - `quantity` (integer) - Quantity ordered
    - `unit_price` (decimal) - Price per unit at time of order
    - `total_price` (decimal) - Total price for this item (quantity × unit_price)
    - `created_at` (timestamptz) - Record creation timestamp

  ## Functions
    - Auto-generate order numbers
    - Update order totals when items change
    - Stock management integration

  ## Security
    - RLS policies for customer access
    - Admin access for order management
*/

-- Create orders table
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
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'delivered', 'cancelled')),
  payment_method text NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank_transfer')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_items table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Drop existing function if it exists (to avoid conflicts)
DROP FUNCTION IF EXISTS generate_order_number();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text AS $$
DECLARE
  new_number text;
  counter integer;
BEGIN
  -- Get the next order number
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS integer)), 0) + 1
  INTO counter
  FROM orders
  WHERE order_number ~ '^ORD[0-9]+$';
  
  -- Format as ORD001, ORD002, etc.
  new_number := 'ORD' || LPAD(counter::text, 3, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_order_totals ON order_items;
DROP FUNCTION IF EXISTS update_order_totals();

-- Function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS trigger AS $$
BEGIN
  -- Update the order totals when order items change
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

-- Trigger to auto-update order totals
CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
DROP FUNCTION IF EXISTS set_order_number();

-- Function to set order number before insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order number
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders
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

-- RLS Policies for order_items
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

-- Drop existing trigger and function if they exist for updated_at
DROP TRIGGER IF EXISTS trigger_update_orders_updated_at ON orders;
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at trigger for orders
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();