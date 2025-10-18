# 🚀 Quick Start - Customer Credit Setup

## ⚡ 3-Minute Setup

### Step 1: Copy the SQL (30 seconds)

1. Open file: `SAFE_CUSTOMER_CREDIT_SETUP.sql`
2. Copy all content (Ctrl+A, then Ctrl+C)

### Step 2: Run in Supabase (1 minute)

1. Go to: https://supabase.com/dashboard
2. Select project: **productionEnvironment**
3. Click **SQL Editor** in sidebar
4. Click **New query**
5. Paste script (Ctrl+V)
6. Click **Run** button

### Step 3: Verify Success (30 seconds)

Look for these messages:

```
✅ Table customer_credits exists
✅ Table credit_payments exists
✅ View vw_customer_credit_summary exists
✅ Customer Credit setup completed successfully!
```

### Step 4: Use in App (1 minute)

1. Start app: `npm run dev`
2. Open: http://localhost:5174
3. Click **"Accounts Receivable"** in navigation
4. Done! 🎉

---

## 📋 Files Created

| File                               | Purpose                                    |
| ---------------------------------- | ------------------------------------------ |
| `SAFE_CUSTOMER_CREDIT_SETUP.sql`   | **Main SQL script** - Run this in Supabase |
| `CUSTOMER_CREDIT_INSTALL_GUIDE.md` | Detailed setup instructions                |
| `CUSTOMER_CREDIT_DIAGRAM.md`       | Visual diagrams and examples               |
| `CUSTOMER_CREDIT_QUICK_START.md`   | This file - quick reference                |

---

## 🔒 Safety Guarantees

✅ **Uses `IF NOT EXISTS`** - Won't create duplicates
✅ **No DROP commands** - Won't delete existing tables
✅ **No DELETE commands** - Won't remove data
✅ **No ALTER breaking changes** - Won't modify other tables
✅ **Can run multiple times** - Completely safe to re-run
✅ **Won't trigger Supabase warnings** - No destructive operations

---

## 📊 What Gets Created

### Tables (2):

1. **customer_credits** - Tracks money customers owe you
2. **credit_payments** - Tracks payments received

### View (1):

1. **vw_customer_credit_summary** - Shows balances and totals

### Indexes (7):

- Speed up queries by name, phone, status, date

### Security (2):

- RLS policies for authenticated users only

### Trigger (1):

- Auto-updates `updated_at` timestamp

---

## 🎯 Common Use Cases

### Record a new credit:

```
Customer: Ali Mohamed
Phone: +252612345678
Amount: $150
Due: 30 days
Notes: 3 textbooks
→ Status: active 🟢
```

### Record a payment:

```
Credit: Ali Mohamed
Payment: $50
Method: M-Pesa
→ Status changes to: partial 🟡
Balance: $100 remaining
```

### Full payment:

```
Credit: Ali Mohamed
Payment: $100 (remaining balance)
Method: Cash
→ Status changes to: paid ✅
Balance: $0
```

---

## ❓ Troubleshooting One-Liners

| Problem                          | Solution                                |
| -------------------------------- | --------------------------------------- |
| "Table already exists"           | This is OK! Script is safe to re-run    |
| "Permission denied"              | Make sure you're logged into your app   |
| Tables exist but no data showing | Hard refresh browser (Ctrl+F5)          |
| Component shows errors           | Check browser console (F12)             |
| Can't find SQL Editor            | Look for `</>` icon in Supabase sidebar |

---

## 📱 Features You Get

✅ Track customer credits (accounts receivable)
✅ Record partial and full payments
✅ Auto-calculate balances
✅ Status tracking (active/partial/paid/overdue)
✅ Payment history
✅ Dashboard with statistics
✅ Mobile-friendly interface
✅ Search and filter customers
✅ Export to CSV
✅ Overdue notifications

---

## 💡 Pro Tips

1. **Use the summary view for reports:**

   ```sql
   SELECT * FROM vw_customer_credit_summary
   WHERE status = 'overdue';
   ```

2. **Check total receivables:**

   ```sql
   SELECT SUM(total_amount - COALESCE(amount_paid, 0))
   FROM vw_customer_credit_summary
   WHERE status != 'paid';
   ```

3. **Find customers with high balances:**
   ```sql
   SELECT * FROM vw_customer_credit_summary
   WHERE balance > 100
   ORDER BY balance DESC;
   ```

---

## 🎉 You're All Set!

The Customer Credit system is now ready to use. Start tracking money customers owe you today!

**Next:** Open your app and click "Accounts Receivable" in the navigation menu.

---

## 📞 Need Help?

1. Check `CUSTOMER_CREDIT_INSTALL_GUIDE.md` for detailed instructions
2. Check `CUSTOMER_CREDIT_DIAGRAM.md` for visual examples
3. Check browser console (F12) for error messages
4. Verify you're in the correct Supabase project

---

## 🔧 Advanced: Add Test Data

Uncomment the test data section in `SAFE_CUSTOMER_CREDIT_SETUP.sql`:

Find this section at the bottom:

```sql
/*
INSERT INTO customer_credits ...
*/
```

Remove the `/*` and `*/`, then run the script again to add 2 test customers with 1 payment.

---

**That's it! Setup is complete.** 🚀
