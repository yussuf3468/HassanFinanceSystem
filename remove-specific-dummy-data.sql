-- REMOVE SPECIFIC DUMMY PRODUCTS
-- Run this in your Supabase SQL Editor

-- Remove specific dummy products by their product_id
DELETE FROM products WHERE product_id IN (
  'BOOK001',
  'BOOK002', 
  'BOOK003',
  'PEN001',
  'PEN002',
  'NOTE001',
  'NOTE002',
  'CALC001',
  'RULER001',
  'ERASER001'
);

-- Or remove all products with placeholder images
DELETE FROM products WHERE image_url LIKE '%picsum.photos%';