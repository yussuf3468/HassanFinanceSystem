-- DROP EXISTING TABLES AND RECREATE WITH IMAGES
-- Run this in your Supabase SQL Editor

-- Drop existing tables (this will remove all data)
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create products table with image support
CREATE TABLE products (
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
CREATE TABLE sales (
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

-- Create indexes for faster queries
CREATE INDEX idx_sales_product_id ON sales(product_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_products_product_id ON products(product_id);

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

-- Insert sample data with placeholder images
INSERT INTO products (product_id, name, category, image_url, buying_price, selling_price, quantity_in_stock, reorder_level) VALUES
('BOOK001', 'Introduction to Programming', 'Books', 'https://picsum.photos/300/400?random=1', 800.00, 1200.00, 25, 5),
('BOOK002', 'Advanced Mathematics', 'Books', 'https://picsum.photos/300/400?random=2', 1000.00, 1500.00, 15, 3),
('BOOK003', 'Data Structures & Algorithms', 'Books', 'https://picsum.photos/300/400?random=3', 1200.00, 1800.00, 12, 3),
('PEN001', 'Blue Ink Pen', 'Pens', 'https://picsum.photos/300/400?random=4', 20.00, 40.00, 100, 20),
('PEN002', 'Red Ink Pen', 'Pens', 'https://picsum.photos/300/400?random=5', 20.00, 40.00, 85, 20),
('NOTE001', 'A4 Notebook', 'Notebooks', 'https://picsum.photos/300/400?random=6', 50.00, 80.00, 50, 10),
('NOTE002', 'Exercise Book', 'Notebooks', 'https://picsum.photos/300/400?random=7', 30.00, 50.00, 75, 15),
('CALC001', 'Scientific Calculator', 'Other', 'https://picsum.photos/300/400?random=8', 1500.00, 2200.00, 8, 2),
('RULER001', 'Plastic Ruler 30cm', 'Other', 'https://picsum.photos/300/400?random=9', 15.00, 25.00, 40, 10),
('ERASER001', 'Rubber Eraser', 'Erasers', 'https://picsum.photos/300/400?random=10', 10.00, 20.00, 60, 15);