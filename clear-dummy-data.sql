-- REMOVE ALL DUMMY DATA
-- Run this in your Supabase SQL Editor

-- First delete all sales (they reference products)
DELETE FROM sales;

-- Then delete all existing products
DELETE FROM products;

-- Reset the sequences (optional - for clean IDs)
-- This ensures new products start with fresh IDs