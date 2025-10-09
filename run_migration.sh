#!/bin/bash

# Run the migration to add description field to products table
# This can be run from the Supabase dashboard SQL editor or via CLI

echo "Running migration to add description field to products table..."

# Copy the SQL content from the migration file
cat supabase/migrations/20251009_add_product_description.sql

echo ""
echo "Migration SQL copied above. Please run this in your Supabase dashboard SQL editor."
echo "Or if you have Supabase CLI installed, run: supabase db reset"