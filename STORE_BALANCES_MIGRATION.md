# Store Balances Migration

## Setup Instructions

Run the `store_balances_table.sql` file in your Supabase SQL Editor to create the store_balances table.

This will:

1. Create the `store_balances` table to store running balances
2. Enable Row Level Security (RLS)
3. Create policies for authenticated users
4. Insert an initial record with 0 balances
5. Create triggers for automatic timestamp updates

## Migration from localStorage

After running the SQL:

- The app will automatically fetch balances from the database
- Initial balances will be 0 (unless already set in the database)
- When you reconcile, balances will be updated in the database
- The "Update Balances" button will save changes to the database

## Benefits

✅ Balances persist across devices
✅ Balances are backed up in the database
✅ Multiple users can see the same balances
✅ Complete audit trail of balance changes
