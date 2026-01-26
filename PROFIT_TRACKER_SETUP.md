# Business Profit Tracker - Database Setup Guide

## Quick Setup

To enable the history feature for the Business Profit Tracker, you need to create the database table in Supabase.

### Steps:

1. **Open Supabase Dashboard**

   - Go to your project dashboard at https://supabase.com/dashboard

2. **Open SQL Editor**

   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the SQL Script**

   - Open the file: `create_profit_tracker_history_table.sql`
   - Copy all the SQL code
   - Paste it into the Supabase SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)

4. **Verify Table Creation**
   - Go to "Table Editor" in the left sidebar
   - You should see a new table called `profit_tracker_history`

### What This Creates:

- ✅ **profit_tracker_history** table with all required columns
- ✅ Row Level Security (RLS) policies for authenticated users
- ✅ Index on `calculation_date` for fast queries
- ✅ Proper permissions for insert, select, and delete operations

### Features Available After Setup:

1. **Save Calculations** - Store profit calculations with notes
2. **View History** - See all past calculations (up to 50 most recent)
3. **Load Previous Calculations** - Click "Load" to restore old data
4. **Delete Entries** - Remove unwanted history entries
5. **Track Changes** - Monitor who created each calculation and when

### Security:

- Only authenticated users can view, save, and delete history
- All data is protected by Row Level Security (RLS)
- Each entry records who created it (`created_by` field)

---

## Troubleshooting

**Error: "relation does not exist"**

- Make sure you ran the SQL script successfully
- Check that you're connected to the correct Supabase project

**Can't save to history:**

- Verify you're logged in
- Check browser console for specific errors
- Ensure the table was created with proper RLS policies

**History not loading:**

- Refresh the page
- Check that the table has data (go to Table Editor → profit_tracker_history)
