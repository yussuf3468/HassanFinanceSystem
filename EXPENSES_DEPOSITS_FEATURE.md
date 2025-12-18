# Expenses and Deposits Feature

## Overview
Added tracking for daily expenses and deposits in cash reconciliation.

## Database Migration
Run `add_expenses_deposits_columns.sql` in Supabase SQL Editor to add the new columns.

## Features Added

### 1. Deposits Field
- **Purpose**: Record money added to cash (owner deposits, bank transfers, etc.)
- **Location**: Next to expenses field in reconciliation form
- **Impact**: Adds to cash balance when reconciling

### 2. Expenses Display in History
- **Purpose**: See daily expenses and deposits for each reconciliation
- **Location**: Reconciliation history cards
- **Display**: Shows as separate badges (green for deposits, amber for expenses)

### 3. Balance Calculation Update
- **Old**: Cash Balance = Previous + Cash Collected - Expenses
- **New**: Cash Balance = Previous + Cash Collected + Deposits - Expenses

## Usage

### Recording Deposits
1. Open Cash Reconciliation
2. Enter amount in "Today's Deposits" field
3. Examples: Owner bringing cash, bank withdrawal, etc.
4. Amount will be added to cash balance

### Recording Expenses
1. Enter amount in "Today's Expenses" field
2. Examples: Rent paid, utilities, supplies, etc.
3. Amount will be deducted from cash balance

### Viewing History
- Each reconciliation shows deposits (green) and expenses (amber)
- Only displays if amount > 0
- Helps track daily cash flow

## Benefits
✅ Complete cash flow tracking
✅ Visibility of money in/out of store
✅ Better balance reconciliation
✅ Audit trail for deposits and expenses
