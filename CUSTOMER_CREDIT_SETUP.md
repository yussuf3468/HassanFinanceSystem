# Customer Credit System Setup

This document describes how to set up the Accounts Receivable (Customer Credit) feature to track money customers owe you.

## Database Tables

Run these SQL commands in your Supabase SQL Editor:

### 1. Create Customer Credits Table

```sql
-- Customer Credits Table (tracks money customers owe you)
CREATE TABLE IF NOT EXISTS customer_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
  credit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'partial')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_credits_customer_name ON customer_credits(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_credits_customer_phone ON customer_credits(customer_phone);
CREATE INDEX IF NOT EXISTS idx_customer_credits_status ON customer_credits(status);
CREATE INDEX IF NOT EXISTS idx_customer_credits_due_date ON customer_credits(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_credits_created_at ON customer_credits(created_at DESC);

-- Add comment
COMMENT ON TABLE customer_credits IS 'Tracks credit given to customers (accounts receivable)';
```

### 2. Create Credit Payments Table

```sql
-- Credit Payments Table (tracks customer payments)
CREATE TABLE IF NOT EXISTS credit_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  credit_id UUID NOT NULL REFERENCES customer_credits(id) ON DELETE CASCADE,
  payment_amount DECIMAL(12, 2) NOT NULL CHECK (payment_amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_credit_payments_credit_id ON credit_payments(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_payment_date ON credit_payments(payment_date DESC);

-- Add comment
COMMENT ON TABLE credit_payments IS 'Tracks payments received from customers for their credits';
```

### 3. Enable Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE customer_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users"
ON customer_credits FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users"
ON credit_payments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
```

### 4. Create Helper View

```sql
-- Create a view to see credit summaries with payment totals
CREATE OR REPLACE VIEW vw_customer_credit_summary AS
SELECT
  cc.id,
  cc.customer_name,
  cc.customer_phone,
  cc.customer_email,
  cc.total_amount,
  COALESCE(SUM(cp.payment_amount), 0) as amount_paid,
  cc.total_amount - COALESCE(SUM(cp.payment_amount), 0) as balance,
  cc.credit_date,
  cc.due_date,
  cc.status,
  cc.notes,
  cc.created_at,
  COUNT(cp.id) as payment_count
FROM customer_credits cc
LEFT JOIN credit_payments cp ON cc.id = cp.credit_id
GROUP BY cc.id, cc.customer_name, cc.customer_phone, cc.customer_email,
         cc.total_amount, cc.credit_date, cc.due_date, cc.status, cc.notes, cc.created_at
ORDER BY cc.created_at DESC;

-- Grant access to the view
GRANT SELECT ON vw_customer_credit_summary TO authenticated;
```

### 5. Create Updated At Trigger

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to customer_credits table
DROP TRIGGER IF EXISTS update_customer_credits_updated_at ON customer_credits;
CREATE TRIGGER update_customer_credits_updated_at
  BEFORE UPDATE ON customer_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Features

### ✅ What the Customer Credit System Does:

1. **Track Credit Given to Customers**

   - Record customer name, phone, email
   - Set credit amount and due date
   - Add notes about items sold

2. **Record Payments**

   - Track partial and full payments
   - Multiple payment methods (Cash, M-Pesa, Bank Transfer, etc.)
   - Auto-update credit status when paid

3. **Dashboard Overview**

   - Total receivable (money owed to you)
   - Total collected (payments received)
   - Overdue credits
   - Active credits

4. **Status Tracking**

   - **Active**: Credit given, no payments yet
   - **Partial**: Some payments received, balance remaining
   - **Paid**: Fully paid off
   - **Overdue**: Past due date with outstanding balance

5. **Payment History**
   - View all payments for each customer
   - Track payment dates and methods
   - See remaining balance

## Usage

1. **Create a Credit**:

   - Click "New Customer Credit"
   - Enter customer details (name, phone, email)
   - Set total amount and due date
   - Add notes about what was sold

2. **Record a Payment**:

   - Click the payment icon (💰) next to a credit
   - Enter payment amount
   - Select payment method
   - Add notes (optional)

3. **View Payment History**:

   - Click the clock icon (🕐) to see all payments
   - View total paid and remaining balance

4. **Edit or Delete**:
   - Edit icon: Update customer details
   - Delete icon: Remove credit record (with confirmation)

## Differences from Debt Management

| Feature               | Customer Credit (Receivables) | Debt Management (Payables) |
| --------------------- | ----------------------------- | -------------------------- |
| **Tracks**            | Money customers owe YOU       | Money YOU owe others       |
| **Main Field**        | Customer Name                 | Creditor/Lender Name       |
| **Payment Direction** | You RECEIVE money             | You PAY money              |
| **Balance Means**     | What they still owe you       | What you still owe them    |
| **Icon**              | 💳                            | 💰                         |
| **Status Colors**     | Blue/Green (positive)         | Yellow/Red (liability)     |

## Example Scenario

**Customer buys on credit:**

- Customer: "Ali Mohamed"
- Phone: "+254712345678"
- Total Amount: KES 15,000
- Items: "3 textbooks, 2 notebooks"
- Due Date: 30 days from now
- Status: Active

**First Payment:**

- Payment Amount: KES 5,000
- Method: M-Pesa
- Status changes to: Partial

**Second Payment:**

- Payment Amount: KES 10,000
- Method: Cash
- Status changes to: Paid ✅

## Verification

After running the SQL commands, verify:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('customer_credits', 'credit_payments');

-- Test insert
INSERT INTO customer_credits (customer_name, customer_phone, total_amount, notes)
VALUES ('Test Customer', '+254712345678', 1000, 'Test credit');

-- Check the view
SELECT * FROM vw_customer_credit_summary;
```

## Troubleshooting

**Error: "Table does not exist"**

- Run the CREATE TABLE commands in Supabase SQL Editor
- Make sure you're in the correct project

**Error: "Permission denied"**

- Run the RLS policy commands
- Make sure user is authenticated

**Credits not showing**

- Check browser console for errors
- Verify tables exist in Supabase
- Check RLS policies are enabled

## Next Steps

After setup, the "Accounts Receivable" tab will appear in the admin navigation menu. You can start tracking customer credits immediately!
