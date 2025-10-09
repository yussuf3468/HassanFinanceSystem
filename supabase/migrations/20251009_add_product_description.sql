-- Add description field to products table for customer clarification
-- This allows adding details like "sold in packets", "bulk items", etc.

ALTER TABLE products 
ADD COLUMN description text;

-- Create index for description field to enable fast text search
CREATE INDEX IF NOT EXISTS idx_products_description ON products(description);