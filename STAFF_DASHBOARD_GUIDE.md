# Staff Dashboard - User Guide

## Overview

The Staff Dashboard provides personalized sales metrics for each staff member, showing their individual performance and sales history.

## Features

### 1. **Today's Performance Metrics**

- **Today's Sales**: Total revenue from sales made today
- **Today's Profit**: Net profit from today's sales
- **Transactions**: Number of sales completed today
- **Average Sale Value**: Average transaction size

### 2. **Period Performance**

- **This Week**: Weekly sales and profit totals
- **This Month**: Monthly sales and profit totals

### 3. **Today's Sales Feed**

- Real-time list of all sales made today
- Shows product details, quantities, and profit per transaction
- Auto-sorted newest-first

## How Sales are Matched to Staff

The dashboard filters sales based on the `sold_by` field in the sales record:

1. **For Regular Staff**: Matches sales where `sold_by` contains your email username

   - Example: If logged in as `khaled@example.com`, shows sales where `sold_by` includes "khaled"

2. **For Admin/Yussuf**: Shows sales where `sold_by` includes "yussuf" or matches admin identifier

## Navigation

Access the Staff Dashboard via:

- Sidebar menu: **"My Sales"** (with TrendingUp icon)
- Located second in the navigation list

## Troubleshooting

### "All fields show 0"

**Possible causes:**

1. No sales recorded with your name in the `sold_by` field
2. Sales were recorded with a different name/spelling
3. Check console for debug logs showing:
   - Your staff identifier
   - Sample `sold_by` values from sales
   - Number of filtered sales

**How to check:**

1. Open browser DevTools (F12)
2. Look for console logs: `🔍 Staff Dashboard Debug:`
3. Verify your sales have matching `sold_by` values

**Fix:**

- Ensure sales are recorded with your correct name/identifier
- Sales must have the `sold_by` field populated
- Name must match your email username (before @)

### "React DevTools warning"

This is informational only and doesn't affect functionality. It appears in development mode.

## Technical Details

### Data Source

- Uses cached React Query hooks (`useSales`, `useProducts`)
- Zero additional database requests after initial load
- Updates when sales are added/modified

### Performance

- All calculations done client-side
- Memoized for efficiency
- Real-time updates via React Query cache invalidation

### Date Calculations

- **Today**: From midnight to current time (local timezone)
- **This Week**: From Sunday to current day
- **This Month**: From 1st of month to current day

## Visual Design

- Follows project's glassmorphism theme
- Gradient cards matching main dashboard
- Responsive layout (mobile-friendly)
- Smooth animations and transitions

## Best Practices

1. **Record Sales Correctly**

   - Always fill in "Sold By" field when creating sales
   - Use consistent naming (e.g., always "Yussuf Muse" not variations)

2. **Daily Monitoring**

   - Check dashboard at start/end of shift
   - Use metrics to track personal performance

3. **Goal Setting**
   - Compare daily averages over time
   - Track monthly progress toward targets

## Support

If fields remain at 0 after confirming sales exist:

1. Share the console debug output
2. Verify database `sold_by` field values
3. Check if filtering logic needs adjustment for your naming convention
