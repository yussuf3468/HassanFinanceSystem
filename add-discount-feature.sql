-- ADD DISCOUNT FUNCTIONALITY TO SALES
-- Run this in your Supabase SQL Editor

-- Add discount columns to sales table
ALTER TABLE sales 
ADD COLUMN IF NOT EXISTS discount_amount decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percentage decimal(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_price decimal(10,2),
ADD COLUMN IF NOT EXISTS final_price decimal(10,2);

-- Update existing sales to have original_price = selling_price and final_price = selling_price
UPDATE sales 
SET 
  original_price = selling_price,
  final_price = selling_price,
  discount_amount = 0,
  discount_percentage = 0
WHERE original_price IS NULL;