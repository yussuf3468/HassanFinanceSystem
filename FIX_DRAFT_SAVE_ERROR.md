# Fix Draft Save Functionality

## Problem
The draft save feature was failing with "Failed to save draft" error because the database table was missing required columns.

## Root Cause
The `sale_drafts` table was missing these columns that the code was trying to save:
- `customer_name` - Customer name for the sale
- `payment_status` - Payment status (full/partial/pending)
- `amount_paid` - Amount paid for partial payments

## Solution

### Step 1: Run the Migration SQL in Supabase

Copy and run the following SQL in your **Supabase SQL Editor**:

```sql
-- Add missing columns to sale_drafts table
ALTER TABLE sale_drafts 
  ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2);

-- Add comments for new columns
COMMENT ON COLUMN sale_drafts.customer_name IS 'Customer name for the sale';
COMMENT ON COLUMN sale_drafts.payment_status IS 'Payment status (full, partial, pending)';
COMMENT ON COLUMN sale_drafts.amount_paid IS 'Amount paid for partial payments';
```

Or simply run the file: `add_missing_draft_columns.sql`

### Step 2: Verify the Fix

After running the migration:

1. Go to the Sale Form in your application
2. Add some items to a sale
3. Click "Save Draft"
4. Enter a name for the draft
5. You should see "✅ Draft saved!" message
6. The draft should appear in the saved drafts list

### Step 3: Verify Database Structure (Optional)

Run this query to confirm all columns exist:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'sale_drafts'
ORDER BY ordinal_position;
```

Expected columns:
- id (uuid)
- draft_name (varchar)
- sold_by (varchar)
- payment_method (varchar)
- line_items (jsonb)
- overall_discount_type (varchar)
- overall_discount_value (numeric)
- selected_customer_id (uuid)
- customer_name (varchar) ← **NEW**
- customer_search (varchar)
- payment_status (varchar) ← **NEW**
- amount_paid (numeric) ← **NEW**
- quick_sale_mode (boolean)
- created_at (timestamp)
- updated_at (timestamp)

## Files Updated
- ✅ `create_sale_drafts_table.sql` - Updated with correct schema
- ✅ `add_missing_draft_columns.sql` - Created migration to fix existing tables

## Testing Checklist
- [ ] Draft saves successfully with customer name
- [ ] Draft saves with payment status (full/partial/pending)
- [ ] Draft saves with amount paid value
- [ ] Saved drafts load correctly
- [ ] No console errors when saving/loading drafts
