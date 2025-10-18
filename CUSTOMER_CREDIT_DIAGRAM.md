# 📊 Customer Credit System - Visual Overview

## 🏗️ Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    customer_credits                         │
│                   (Deemaha ya Customers)                    │
├─────────────────────────────────────────────────────────────┤
│ 🔑 id (UUID)                                                │
│ 👤 customer_name (TEXT) - e.g. "Ali Mohamed"               │
│ 📱 customer_phone (TEXT) - e.g. "+252612345678"            │
│ 📧 customer_email (TEXT) - Optional                        │
│ 💰 total_amount (DECIMAL) - e.g. 150.00                    │
│ 📅 credit_date (DATE) - When credit was given              │
│ ⏰ due_date (DATE) - When payment is due                   │
│ 🚦 status (TEXT) - active/paid/overdue/partial             │
│ 📝 notes (TEXT) - "3 textbooks, 2 notebooks"               │
│ 🕐 created_at (TIMESTAMP)                                  │
│ 🕐 updated_at (TIMESTAMP)                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ ONE credit can have
                            │ MANY payments
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     credit_payments                         │
│                  (Lacag la bixiyey/Payments)                │
├─────────────────────────────────────────────────────────────┤
│ 🔑 id (UUID)                                                │
│ 🔗 credit_id (UUID) ─────► Links to customer_credits.id    │
│ 💵 payment_amount (DECIMAL) - e.g. 50.00                   │
│ 📅 payment_date (DATE) - When payment received             │
│ 💳 payment_method (TEXT) - Cash/M-Pesa/Bank                │
│ 📝 notes (TEXT) - Optional                                 │
│ 🕐 created_at (TIMESTAMP)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Example Scenario Flow

### Scenario: Ali buys books on credit

```
STEP 1: Create Credit (Customer owes you money)
┌───────────────────────────────────────────────────┐
│ Customer: Ali Mohamed                             │
│ Phone: +252612345678                              │
│ Total Amount: $150.00                             │
│ Due Date: 30 days from now                        │
│ Notes: "3 English textbooks, 2 math notebooks"    │
│ Status: active 🟢                                 │
└───────────────────────────────────────────────────┘
                    ↓
            customer_credits table
         (1 record: Ali owes $150)

═══════════════════════════════════════════════════════

STEP 2: First Payment (Ali pays partial amount)
┌───────────────────────────────────────────────────┐
│ Credit: Ali Mohamed's credit                      │
│ Payment Amount: $50.00                            │
│ Payment Date: Today                               │
│ Method: M-Pesa                                    │
│ Notes: "Partial payment via M-Pesa"              │
└───────────────────────────────────────────────────┘
                    ↓
           credit_payments table
      (1 payment record: $50 paid)
                    ↓
        Status automatically changes to: partial 🟡
        Balance: $150 - $50 = $100 remaining

═══════════════════════════════════════════════════════

STEP 3: Second Payment (Ali pays remaining balance)
┌───────────────────────────────────────────────────┐
│ Credit: Ali Mohamed's credit                      │
│ Payment Amount: $100.00                           │
│ Payment Date: Today                               │
│ Method: Cash                                      │
│ Notes: "Final payment in cash"                    │
└───────────────────────────────────────────────────┘
                    ↓
           credit_payments table
      (2 payment records: $50 + $100 = $150 total)
                    ↓
        Status automatically changes to: paid ✅
        Balance: $150 - $150 = $0 (FULLY PAID!)
```

---

## 🎨 Status Color Coding

```
🟢 active   - Credit given, no payments yet
🟡 partial  - Some payments received, balance remaining
✅ paid     - Fully paid off, no balance
🔴 overdue  - Past due date with outstanding balance
```

---

## 🔗 Relationship Diagram

```
┌─────────────────────┐
│  customer_credits   │
│  ─────────────────  │
│  id (PK) ◄──────────┼───────┐
│  customer_name      │       │
│  total_amount       │       │
│  status             │       │
└─────────────────────┘       │
                              │
                              │ Foreign Key
                              │ ON DELETE CASCADE
                              │ (If credit deleted,
                              │  all payments deleted)
                              │
┌─────────────────────┐       │
│  credit_payments    │       │
│  ─────────────────  │       │
│  id (PK)            │       │
│  credit_id (FK) ────┼───────┘
│  payment_amount     │
│  payment_date       │
└─────────────────────┘
```

**Key Point:** When you delete a credit, all its payments are automatically deleted too (CASCADE).

---

## 📊 Summary View (vw_customer_credit_summary)

This view automatically calculates totals:

```sql
SELECT * FROM vw_customer_credit_summary;
```

Returns:

```
┌──────────────┬──────────────┬────────┬──────────────┬─────────┬─────────────┐
│ customer_name│ total_amount │ paid   │ balance      │ status  │ pay_count   │
├──────────────┼──────────────┼────────┼──────────────┼─────────┼─────────────┤
│ Ali Mohamed  │ 150.00       │ 150.00 │ 0.00         │ paid    │ 2 payments  │
│ Fatima H.    │ 75.50        │ 25.00  │ 50.50        │ partial │ 1 payment   │
│ Ahmed Ali    │ 200.00       │ 0.00   │ 200.00       │ active  │ 0 payments  │
└──────────────┴──────────────┴────────┴──────────────┴─────────┴─────────────┘
```

**Columns:**

- `total_amount`: Original credit amount
- `amount_paid`: Sum of all payments (calculated)
- `balance`: What customer still owes (calculated)
- `payment_count`: Number of payments received

---

## 🚀 API Usage in Your App

### Fetch all credits with payments:

```typescript
const { data: credits } = useCustomerCredits();
// Returns: All customer credits with calculated balances
```

### Fetch payments for a credit:

```typescript
const { data: payments } = useCreditPayments();
// Returns: All payment records
```

### Create new credit:

```typescript
await supabase.from("customer_credits").insert({
  customer_name: "Ali Mohamed",
  customer_phone: "+252612345678",
  total_amount: 150.0,
  due_date: "2025-11-18",
  notes: "3 textbooks",
});
```

### Record a payment:

```typescript
await supabase.from("credit_payments").insert({
  credit_id: "uuid-of-credit",
  payment_amount: 50.0,
  payment_method: "M-Pesa",
});
```

---

## 💰 Dashboard Statistics

The CustomerCredit component shows:

```
┌─────────────────────────────────────────────────────────┐
│               ACCOUNTS RECEIVABLE DASHBOARD             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Total Receivable: $1,250.00                         │
│      (Total amount owed by all customers)               │
│                                                          │
│  💵 Total Collected: $450.00                            │
│      (Total payments received)                          │
│                                                          │
│  ⚠️  Overdue Credits: 3                                 │
│      (Credits past due date with balance)               │
│                                                          │
│  🟢 Active Credits: 12                                  │
│      (Credits with outstanding balance)                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Status Auto-Update Logic

```javascript
// Component automatically updates status based on:

if (balance === 0) {
  status = "paid" ✅
} else if (balance === total_amount) {
  status = "active" 🟢
} else if (balance > 0 && balance < total_amount) {
  status = "partial" 🟡
}

if (due_date < today && balance > 0) {
  status = "overdue" 🔴
}
```

---

## 📱 Mobile-Friendly Design

The interface works on all devices:

```
Desktop View:
┌───────────────────────────────────────────────────────┐
│ Dashboard | Customer | Phone | Amount | Status | Actions│
├───────────────────────────────────────────────────────┤
│ Ali       | +252...  | $150   | paid   | 💰📝🗑️       │
│ Fatima    | +252...  | $75    | partial| 💰📝🗑️       │
└───────────────────────────────────────────────────────┘

Mobile View:
┌─────────────────────────┐
│ Ali Mohamed             │
│ +252612345678           │
│ $150.00 | paid ✅       │
│ [💰] [📝] [🗑️]          │
├─────────────────────────┤
│ Fatima Hassan           │
│ +252611111111           │
│ $75.50 | partial 🟡     │
│ [💰] [📝] [🗑️]          │
└─────────────────────────┘
```

---

## ✅ Setup Complete!

After running `SAFE_CUSTOMER_CREDIT_SETUP.sql`:

- ✅ 2 tables created
- ✅ Indexes added for performance
- ✅ RLS security enabled
- ✅ Summary view created
- ✅ Auto-update trigger added
- ✅ Ready to use in your app!

**No warnings, no errors, no data loss!** 🎉
