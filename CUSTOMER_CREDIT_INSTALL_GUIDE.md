# 🛡️ Safe Customer Credit Setup - Step by Step

## ✅ This Script is 100% Safe

- **NO destructive operations**
- **NO data deletion**
- **NO Supabase warnings**
- **Can be run multiple times**
- **Won't affect other tables**

---

## 📋 How to Run the SQL Script

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `productionEnvironment`
3. Click on **SQL Editor** in the left sidebar (icon looks like `</>`)

### Step 2: Copy the SQL Script

1. Open the file: `SAFE_CUSTOMER_CREDIT_SETUP.sql`
2. Select ALL content (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 3: Run the Script

1. In Supabase SQL Editor, click **"New query"**
2. Paste the SQL script (Ctrl+V)
3. Click **"Run"** button (or press Ctrl+Enter)

### Step 4: Check Results

You should see messages like:

```
✅ Table customer_credits exists
✅ Table credit_payments exists
✅ View vw_customer_credit_summary exists
✅ Customer Credit setup completed successfully!
```

---

## ✅ What This Script Creates

### 1. **customer_credits** Table

- Tracks money customers owe you
- Fields: customer name, phone, email, amount, due date, status
- **Status values**: `active`, `paid`, `overdue`, `partial`

### 2. **credit_payments** Table

- Tracks payments received from customers
- Fields: payment amount, date, method, notes
- Linked to customer_credits with foreign key

### 3. **Indexes** for Fast Queries

- Speeds up searches by name, phone, status, date
- No impact on existing data

### 4. **Row Level Security (RLS)**

- Only authenticated users can access
- Protects your data

### 5. **Helper View** (vw_customer_credit_summary)

- Shows credit totals, payments, and balances
- Makes reporting easier

### 6. **Auto-Update Trigger**

- Automatically updates `updated_at` timestamp
- Tracks when credits are modified

---

## 🔍 Verify It Worked

Run this query in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('customer_credits', 'credit_payments', 'vw_customer_credit_summary')
ORDER BY table_name;
```

**Expected result:** 3 rows showing the tables and view

---

## 🧪 Test with Sample Data (Optional)

If you want to add test data, uncomment the section at the bottom of the SQL script:

1. Find the lines starting with `/*` and ending with `*/`
2. Remove the `/*` and `*/` to uncomment
3. Run the script again
4. This adds 2 test customers and 1 test payment

---

## 🚀 Using in Your App

After running the script, your React app will automatically work! The tables are already integrated:

- **File**: `src/components/CustomerCredit.tsx`
- **Hooks**: `useCustomerCredits()`, `useCreditPayments()`
- **Navigation**: "Accounts Receivable" tab in admin menu

---

## ❓ Troubleshooting

### Error: "permission denied for table customer_credits"

**Solution:** The RLS policies should fix this. Make sure you're logged in to your app.

### Error: "relation customer_credits already exists"

**Solution:** This is OK! The script uses `IF NOT EXISTS`, so it won't create duplicates.

### No errors but CustomerCredit component shows errors

**Solution:**

1. Hard refresh your browser (Ctrl+F5)
2. Clear browser cache
3. Restart dev server

### Tables exist but no data showing

**Solution:**

1. Check browser console for errors (F12)
2. Verify you're logged in
3. Check Supabase logs for RLS policy issues

---

## 📊 What Each Table Does

### customer_credits (Deemaha Table)

```
┌─────────────────┬──────────┬─────────────────────────────┐
│ Field           │ Type     │ Description                 │
├─────────────────┼──────────┼─────────────────────────────┤
│ id              │ UUID     │ Unique credit ID            │
│ customer_name   │ TEXT     │ Customer's full name        │
│ customer_phone  │ TEXT     │ Customer's phone number     │
│ customer_email  │ TEXT     │ Customer's email (optional) │
│ total_amount    │ DECIMAL  │ Total credit amount         │
│ credit_date     │ DATE     │ When credit was given       │
│ due_date        │ DATE     │ When payment is due         │
│ status          │ TEXT     │ active/paid/overdue/partial │
│ notes           │ TEXT     │ Description of items sold   │
│ created_at      │ TIMESTAMP│ When record was created     │
│ updated_at      │ TIMESTAMP│ When record was updated     │
└─────────────────┴──────────┴─────────────────────────────┘
```

### credit_payments (Payments Table)

```
┌─────────────────┬──────────┬─────────────────────────────┐
│ Field           │ Type     │ Description                 │
├─────────────────┼──────────┼─────────────────────────────┤
│ id              │ UUID     │ Unique payment ID           │
│ credit_id       │ UUID     │ Links to customer_credits   │
│ payment_amount  │ DECIMAL  │ Amount paid                 │
│ payment_date    │ DATE     │ When payment was received   │
│ payment_method  │ TEXT     │ Cash/M-Pesa/Bank/etc        │
│ notes           │ TEXT     │ Payment notes (optional)    │
│ created_at      │ TIMESTAMP│ When record was created     │
└─────────────────┴──────────┴─────────────────────────────┘
```

---

## 💡 Key Features

1. **Safe Foreign Key**: `credit_payments.credit_id` references `customer_credits.id`

   - When you delete a credit, all its payments are automatically deleted (CASCADE)

2. **Status Auto-Update**: Component automatically updates status:

   - `active`: No payments yet
   - `partial`: Some payments, balance remaining
   - `paid`: Fully paid off
   - `overdue`: Past due date with balance

3. **Balance Calculation**: View automatically calculates:
   - `amount_paid`: Total of all payments
   - `balance`: Total amount - amount paid

---

## 🎉 You're Done!

The Customer Credit (Deemaha) system is now set up and ready to use!

**Next Steps:**

1. Start your React app: `npm run dev`
2. Log in to your admin account
3. Click on "Accounts Receivable" in the navigation
4. Start tracking customer credits!

---

## 📞 Support

If you get any errors:

1. Copy the EXACT error message
2. Check which line failed
3. Make sure you're in the correct Supabase project
4. Verify you have permission to create tables

The script is designed to be error-free, so if you see issues, it's likely a permission or project selection problem.
