-- ===============================================
-- UPDATE CUSTOMER OPENING BALANCE
-- ===============================================
-- This script helps you record preexisting debts for customers
-- who already owed money before implementing this system.
--
-- INSTRUCTIONS:
-- 1. Uncomment and modify the UPDATE statements below
-- 2. Replace 'Customer Name' with actual customer name
-- 3. Replace 0.00 with the actual amount they owe
-- 4. Run each statement one by one in Supabase SQL Editor
-- ===============================================

-- Example: Update a customer's opening balance
-- This will set their credit_balance to the amount they already owed
-- 
-- UPDATE customers 
-- SET credit_balance = 5000.00
-- WHERE customer_name = 'Ahmed Ali' 
-- AND is_active = true;

-- Example: Update multiple customers at once
-- 
-- UPDATE customers 
-- SET credit_balance = CASE customer_name
--     WHEN 'Ahmed Ali' THEN 5000.00
--     WHEN 'Fatima Hassan' THEN 3500.00
--     WHEN 'Omar Ibrahim' THEN 1200.50
--     ELSE credit_balance
-- END
-- WHERE customer_name IN ('Ahmed Ali', 'Fatima Hassan', 'Omar Ibrahim')
-- AND is_active = true;

-- ===============================================
-- VERIFY YOUR UPDATES
-- ===============================================
-- After running updates, verify with this query:
-- 
-- SELECT 
--     customer_name,
--     credit_balance,
--     total_purchases,
--     total_payments,
--     created_at
-- FROM customers 
-- WHERE credit_balance > 0
-- ORDER BY credit_balance DESC;

-- ===============================================
-- BULK UPDATE TEMPLATE
-- ===============================================
-- Copy and customize this template for your customers:
/*
UPDATE customers 
SET credit_balance = CASE customer_name
    WHEN 'Customer 1' THEN 0.00
    WHEN 'Customer 2' THEN 0.00
    WHEN 'Customer 3' THEN 0.00
    -- Add more customers as needed
    ELSE credit_balance
END
WHERE customer_name IN ('Customer 1', 'Customer 2', 'Customer 3')
AND is_active = true;
*/

-- ===============================================
-- NOTES:
-- ===============================================
-- 1. credit_balance > 0 = Customer owes you money
-- 2. credit_balance < 0 = Customer has prepaid credit
-- 3. credit_balance = 0 = All paid up
-- 4. The system will automatically update balances from this point forward
-- 5. You can still use the UI "Opening Balance" field when adding NEW customers
