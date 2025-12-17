# Customer Management System Setup Guide

## Overview

This update adds a comprehensive customer management system to track customer credit balances, purchases, and payments.

## Features Added

### 1. Customer Management Page

- View all customers with their credit balances
- Add new customers with credit limits
- Edit customer information
- Record customer payments
- View payment history
- Filter and search customers

### 2. Sales Integration

- Select customer when recording sales
- Automatic credit balance updates when customers buy on credit
- Warning when sale exceeds customer's credit limit
- Support for "Walk-in Customer" for one-time cash sales

### 3. Automatic Balance Tracking

- Credit balance automatically increases when customer makes a purchase
- Credit balance automatically decreases when customer makes a payment
- All updates happen automatically via database triggers

## Database Setup

### Step 1: Run SQL Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Open the file `setup-customers.sql` and copy all its contents
6. Paste into the SQL Editor
7. Click "Run" button (or press Ctrl+Enter)

### Step 2: Verify Setup

After running the SQL, verify these tables exist:

- ✅ `customers` - Stores customer information and credit balances
- ✅ `customer_payments` - Tracks payment history
- ✅ `sales` - Now has `customer_id` and `customer_name` columns

You should also see a default customer:

- **Walk-in Customer** - Used for one-time cash sales

## Usage

### Adding a Customer

1. Go to "Macaamiisha" (Customers) page
2. Click "Add Customer" button
3. Fill in customer information:
   - **Customer Name** (required)
   - **Phone** (optional)
   - **Email** (optional)
   - **Address** (optional)
   - **Credit Limit** - Maximum amount they can owe (KES)
   - **Notes** (optional)
4. Click "Add Customer"

### Recording a Sale with Customer

1. Go to "Iibka" (Sales) page
2. Select products as usual
3. In the customer dropdown, select:
   - **Walk-in Customer** - For cash sales (no credit tracking)
   - **Specific Customer** - For credit sales
4. If customer has existing balance, you'll see a warning showing:
   - Current balance
   - Balance after this sale
   - Credit limit
   - Warning if sale exceeds limit
5. Complete the sale as normal

**Note**: The customer's credit balance will automatically increase by the sale amount!

### Recording a Payment

1. Go to "Macaamiisha" (Customers) page
2. Find the customer with a balance (red amount in Credit Balance column)
3. Click the green dollar icon (💵) button
4. Enter payment details:
   - **Amount** - How much they're paying
   - **Payment Method** - Cash, M-Pesa, Bank Transfer, Card
   - **Notes** (optional) - Payment reference or notes
5. Click "Process Payment"

**Note**: The customer's credit balance will automatically decrease by the payment amount!

### Viewing Customer Details

The customer list shows:

- **Customer Name & Address**
- **Contact Info** (phone, email)
- **Credit Balance** (in red if they owe money)
- **Credit Limit** (maximum they can owe)
- **Total Purchases** (lifetime value)
- **Status** (Active/Inactive)

## Dashboard Stats

The Customers page shows overview cards:

- **Total Customers** - How many customers in the system
- **With Balance** - How many customers currently owe money
- **Total Credit** - Total amount owed by all customers
- **Total Sales** - Total purchases by all customers

## How Credit Tracking Works

### When Recording a Sale:

1. Select a customer (not "Walk-in Customer")
2. Complete the sale
3. Database trigger automatically:
   - Increases customer's `credit_balance` by sale amount
   - Updates customer's `total_purchases`
   - Records sale with customer information

### When Recording a Payment:

1. Enter payment amount
2. Process payment
3. Database trigger automatically:
   - Decreases customer's `credit_balance` by payment amount
   - Updates customer's `total_payments`
   - Records payment in history

### Walk-in Customers:

- Select "Walk-in Customer" for one-time sales
- No credit balance tracking
- Customer pays cash immediately
- Used for customers you don't need to track

## Credit Limit Warnings

The system warns you when:

- Customer's new balance will exceed their credit limit
- Shows exact amount over limit
- You can still complete the sale (warning only)
- Helps prevent customers from owing too much

## Example Scenarios

### Scenario 1: New Customer on Credit

1. Add customer "Ali Mohamed" with credit limit KES 50,000
2. Ali buys books worth KES 15,000
3. Select "Ali Mohamed" in sales form
4. Complete sale
5. Ali's balance is now KES 15,000

### Scenario 2: Customer Makes Payment

1. Ali pays KES 10,000
2. Go to Customers page
3. Click dollar icon next to Ali's name
4. Enter amount: 10,000
5. Select payment method: M-Pesa
6. Process payment
7. Ali's balance is now KES 5,000 (15,000 - 10,000)

### Scenario 3: Customer Buys More

1. Ali buys more books worth KES 8,000
2. System shows warning:
   - Current Balance: KES 5,000
   - After Sale: KES 13,000
   - Credit Limit: KES 50,000
3. Sale is within limit (13,000 < 50,000) ✅
4. Complete sale
5. Ali's balance is now KES 13,000

### Scenario 4: Walk-in Customer

1. Unknown customer buys a book for KES 500
2. Select "Walk-in Customer"
3. Complete sale
4. No credit tracking (cash sale)

## Navigation

New menu item added:

- **Macaamiisha** (Customers) - Between "Sales Transaction Log" and "Soo Celinta" (Returns)
- Icon: 👥 (Users)
- Color: Pink to Rose gradient

## Technical Details

### Database Triggers

The system uses PostgreSQL triggers for automatic updates:

1. **update_customer_balance_trigger**

   - Fires when new sale is recorded
   - Increases credit_balance
   - Updates total_purchases

2. **process_customer_payment_trigger**
   - Fires when payment is recorded
   - Decreases credit_balance
   - Updates total_payments

### Security

- Row Level Security (RLS) enabled
- Only authenticated users can access customer data
- All operations logged with staff member name

## Troubleshooting

### Customer dropdown is empty

- Make sure you ran the SQL setup file
- Check if "Walk-in Customer" exists in database
- Reload the page

### Balance not updating automatically

- Check database triggers are enabled
- Verify `sales` table has `customer_id` column
- Check Supabase logs for errors

### Cannot delete Walk-in Customer

- This is intentional
- Walk-in Customer is required for the system
- It cannot be deleted

## Support

If you need help:

1. Check Supabase logs for errors
2. Verify all SQL setup completed successfully
3. Make sure all table columns exist
4. Check browser console for errors

---

**System Ready**: Once SQL is run, the customer management system is fully operational! 🎉
