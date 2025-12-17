-- Customer Management System for Hassan Bookshop
-- Creates customers table with credit balance tracking

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  credit_balance DECIMAL(10, 2) DEFAULT 0.00,
  total_purchases DECIMAL(10, 2) DEFAULT 0.00,
  total_payments DECIMAL(10, 2) DEFAULT 0.00,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add customer_id to sales table (if not exists)
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

-- Create customer payments tracking table
CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) DEFAULT 'cash',
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  processed_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON customer_payments(customer_id);

-- Enable RLS (Row Level Security)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Enable all operations for authenticated users" ON customers
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for authenticated users" ON customer_payments
  FOR ALL USING (true);

-- Create function to update customer balance
CREATE OR REPLACE FUNCTION update_customer_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- When a sale is made, increase credit balance
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers 
      SET credit_balance = credit_balance + NEW.total_sale,
          total_purchases = total_purchases + NEW.total_sale,
          updated_at = NOW()
      WHERE id = NEW.customer_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic balance update
DROP TRIGGER IF EXISTS update_customer_balance_trigger ON sales;
CREATE TRIGGER update_customer_balance_trigger
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_balance();

-- Create function to update customer balance on payment
CREATE OR REPLACE FUNCTION process_customer_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE customers 
    SET credit_balance = credit_balance - NEW.amount,
        total_payments = total_payments + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payment processing
DROP TRIGGER IF EXISTS process_customer_payment_trigger ON customer_payments;
CREATE TRIGGER process_customer_payment_trigger
  AFTER INSERT ON customer_payments
  FOR EACH ROW
  EXECUTE FUNCTION process_customer_payment();

-- Insert walk-in customer (default for one-time customers)
INSERT INTO customers (id, customer_name, phone, email, address, credit_balance, is_active, notes)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Walk-in Customer', NULL, NULL, NULL, 0.00, true, 'Default customer for cash sales and one-time customers')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE customers IS 'Stores customer information with credit balance tracking';
COMMENT ON COLUMN customers.credit_balance IS 'Current outstanding balance (amount owed by customer)';
COMMENT ON COLUMN customers.total_purchases IS 'Total amount of all purchases made';
COMMENT ON COLUMN customers.total_payments IS 'Total amount of all payments received';
