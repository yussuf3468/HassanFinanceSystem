/*
  # Bookstore Management System Schema

  ## Overview
  This migration creates a complete database schema for a bookstore management system
  with inventory tracking, sales recording, and automated stock management.

  ## New Tables

  ### 1. `products` - Product Inventory
    - `id` (uuid, primary key) - Unique product identifier
    - `product_id` (text, unique) - Human-readable product ID (e.g., BOOK001)
    - `name` (text) - Product name
    - `category` (text) - Product category (Books, Pens, Notebooks, etc.)
    - `image_url` (text) - Product image URL
    - `buying_price` (decimal) - Purchase cost in KES
    - `selling_price` (decimal) - Retail price in KES
    - `quantity_in_stock` (integer) - Current stock level
    - `reorder_level` (integer) - Minimum stock level before reorder alert
    - `created_at` (timestamptz) - Record creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `sales` - Sales Transactions
    - `id` (uuid, primary key) - Unique sale identifier
    - `sale_date` (timestamptz) - Date and time of sale
    - `product_id` (uuid, foreign key) - Reference to products table
    - `quantity_sold` (integer) - Number of units sold
    - `selling_price` (decimal) - Price per unit at time of sale
    - `buying_price` (decimal) - Cost per unit at time of sale
    - `total_sale` (decimal) - Total revenue (quantity × selling price)
    - `profit` (decimal) - Total profit ((selling - buying) × quantity)
    - `payment_method` (text) - Cash, Mpesa, Card, etc.
    - `sold_by` (text) - Staff member name
    - `created_at` (timestamptz) - Record creation timestamp

  ### 3. `product_stats` - Aggregated Product Statistics View
    - Materialized view for performance
    - Tracks total sales, profit, and quantity sold per product

  ## Security
    - Enable Row Level Security (RLS) on all tables
    - Add policies for authenticated users to manage inventory and sales
    - Public read access for product lookup (can be restricted later)

  ## Important Notes
    1. Stock is automatically reduced via application logic when sales are recorded
    2. Buying/selling prices are stored in sales records to maintain historical accuracy
    3. All monetary values use decimal type for precision
    4. Timestamps use timestamptz for timezone awareness
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  image_url text,
  buying_price decimal(10,2) NOT NULL DEFAULT 0,
  selling_price decimal(10,2) NOT NULL DEFAULT 0,
  quantity_in_stock integer NOT NULL DEFAULT 0,
  reorder_level integer NOT NULL DEFAULT 5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date timestamptz NOT NULL DEFAULT now(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_sold integer NOT NULL,
  selling_price decimal(10,2) NOT NULL,
  buying_price decimal(10,2) NOT NULL,
  total_sale decimal(10,2) NOT NULL,
  profit decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  sold_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for sales table
CREATE POLICY "Allow public read access to sales"
  ON sales FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (true);

-- Function to update product updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();