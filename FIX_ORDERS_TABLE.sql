-- 🛠️ ORDERS TABLE FIX SCRIPT
-- This will ensure your orders table has all required columns

-- ✅ Method 1: Add missing columns (safest - preserves existing data)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee decimal(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal decimal(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cash';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- ✅ Update constraints for payment_method and payment_status (if they don't exist)
DO $$
BEGIN
    -- Add payment_method constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_payment_method_check' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_payment_method_check 
        CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank_transfer'));
    END IF;

    -- Add payment_status constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_payment_status_check' 
        AND table_name = 'orders'
    ) THEN
        ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
        CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
    END IF;
END $$;

-- ✅ Verify the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;