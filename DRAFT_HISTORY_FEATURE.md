# Draft History Feature

## Overview

Replaced localStorage-based draft system with database-backed draft history, allowing users to save multiple drafts and load them from a history view.

## Database Setup

Run `create_sale_drafts_table.sql` in Supabase SQL Editor to create the drafts table.

## Features

### 1. Save Multiple Drafts

- **Old**: Single draft stored in localStorage
- **New**: Unlimited drafts stored in database
- Can optionally name each draft for easy identification
- Default name: "Draft [timestamp]"

### 2. Draft History Modal

- **Button**: "Draft History (X)" shows count of saved drafts
- **View**: Lists all saved drafts with details:
  - Draft name
  - Sold by
  - Payment method
  - Number of items
  - Created date/time
- **Actions**: Load or Delete any draft

### 3. Draft Information Shown

Each draft displays:

- 👤 Sold by
- 💳 Payment method
- 📦 Number of items
- 🕒 Creation timestamp

### 4. Quick Save

- Can save from the main form with "Save Draft" button
- Can open history modal and save with custom name

## Usage

### Saving a Draft

**Option 1: Quick Save**

1. Fill out sale form
2. Click "Save Draft"
3. Uses default name

**Option 2: Named Save**

1. Click "Draft History"
2. Enter custom name in input field
3. Click "Save" button

### Loading a Draft

1. Click "Draft History (X)"
2. View all saved drafts
3. Click "Load" on desired draft
4. Form populates with draft data

### Deleting a Draft

1. Open "Draft History"
2. Click "Delete" on unwanted draft
3. Confirm deletion

## Benefits

✅ **Persistent**: Drafts survive browser refresh
✅ **Multiple**: Save as many drafts as needed
✅ **Organized**: Name drafts for easy identification
✅ **Cross-device**: Access from any device (same account)
✅ **History**: See when drafts were created
✅ **Safe**: Database backup instead of localStorage

## Data Stored Per Draft

- Draft name (optional)
- Staff member (sold by)
- Payment method
- All line items (products, quantities, discounts)
- Overall discount settings
- Selected customer
- Customer search term
- Quick sale mode status
- Created/updated timestamps

## Technical Details

### Database Table: `sale_drafts`

- `id`: UUID primary key
- `draft_name`: Varchar(255), optional
- `sold_by`: Varchar(100)
- `payment_method`: Varchar(50)
- `line_items`: JSONB (array of line items)
- `overall_discount_type`: Varchar(20)
- `overall_discount_value`: Decimal(10,2)
- `selected_customer_id`: UUID
- `customer_search`: Varchar(255)
- `quick_sale_mode`: Boolean
- `created_at`: Timestamptz
- `updated_at`: Timestamptz

### Indexes

- `idx_sale_drafts_created_at`: For sorting by date
- `idx_sale_drafts_customer_id`: For customer lookups

### Security

- Row Level Security (RLS) enabled
- Authenticated users can CRUD their drafts
- Automatic timestamp updates on changes
