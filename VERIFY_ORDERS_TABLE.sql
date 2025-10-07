-- 🔍 VERIFY ORDERS TABLE STRUCTURE
-- Run this first to check if your orders table has the correct columns

-- Check if orders table exists and show its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If the above query returns no results or missing columns, run the commands below:

-- ✅ ADD MISSING COLUMNS (run these one by one if needed)
-- Only run these if the columns are missing from the check above

-- Add customer_email column if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;

-- Add delivery_fee column if missing  
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee decimal(10,2) DEFAULT 0;

-- Add subtotal column if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal decimal(10,2) DEFAULT 0;

-- Add payment_method column if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';

-- Add payment_status column if missing
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- ✅ VERIFY AGAIN - Run this to confirm all columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;