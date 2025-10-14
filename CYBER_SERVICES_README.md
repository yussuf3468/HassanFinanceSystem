# Cyber Services Dashboard Setup

## Database Setup Instructions

To use the Cyber Services dashboard, you need to create the `cyber_services` table in your Supabase database.

### Step 1: Create the Table

#### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/migrations/create_cyber_services_table.sql`
5. Click **Run** to execute the SQL

#### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

This will apply all migrations in the `supabase/migrations` folder.

### Step 2: Update TypeScript Types (Optional but Recommended)

After creating the table, update your TypeScript types to remove compile errors:

#### If using Supabase CLI:

```bash
supabase gen types typescript --local > src/lib/database.types.ts
```

#### If using Supabase Dashboard:

1. Go to **Settings** > **API**
2. Scroll down to **Generated Types**
3. Copy the TypeScript types
4. Replace the contents of `src/lib/database.types.ts` with the copied types

**Note:** The dashboard will work even without updating the types. TypeScript will show warnings, but the functionality is not affected.

### Step 3: Verify Installation

1. Log in to your admin account
2. Navigate to **Cyber Services** in the sidebar
3. Click **Add Service** to create a test entry
4. Verify the entry appears in the list

### Table Structure

The `cyber_services` table has the following structure:

- `id` (UUID) - Primary key
- `service_name` (TEXT) - Name of the service (e.g., Photocopy, Printing, etc.)
- `amount` (DECIMAL) - Amount earned from the service
- `date` (DATE) - Date of the service
- `notes` (TEXT) - Optional notes about the service
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Record update timestamp

### Features

✅ **Track Cyber Café Income** - Record all cyber service transactions
✅ **Service Dropdown** - Pre-defined list of common cyber services:

- Photocopy
- Printing
- Scanning
- Editing
- Typing
- Internet Service
- Lamination
- Binding
- CV Writing
- Document Formatting
- Email Service
- Computer Training
- Other

✅ **100% Profit** - All entries are treated as pure profit
✅ **Statistics Dashboard** - View:

- Total income (all time)
- Today's income
- This month's income

✅ **Responsive Design** - Works on mobile, tablet, and desktop
✅ **Date Format** - All dates display in dd/mm/yyyy format
✅ **CRUD Operations** - Create, Read, Update, Delete service entries

### Usage

1. Navigate to **Cyber Services** from the admin sidebar
2. Click **Add Service** to record a new cyber service transaction
3. Select the service type from the dropdown
4. Enter the amount earned
5. Select the date
6. (Optional) Add notes
7. Click **Add Service** to save

### Security

- Row Level Security (RLS) is enabled
- Only authenticated users can access the data
- All CRUD operations are restricted to authenticated users

### Navigation

The Cyber Services dashboard is available in the admin sidebar, located between "Debts" and other financial management tools.
