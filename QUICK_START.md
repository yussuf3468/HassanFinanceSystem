# 🚀 Quick Start: Reduce Supabase Costs NOW

## ✅ Already Done (Automatic):

- [x] Installed React Query
- [x] Added QueryClientProvider to main.tsx
- [x] Created cached hooks (`useSupabaseQuery.ts`)
- [x] Created image optimization utilities
- [x] Enhanced OptimizedImage component
- [x] Set cache duration to 5-10 minutes

## 📝 What You Need to Do:

### URGENT (Do Today) - 70% Cost Savings:

#### 1. Update UserActivityDashboard (BIGGEST COST)

**Current Issue:** Fetches all user data every 30 seconds = 1.2MB/hour

**Location:** `src/components/UserActivityDashboard.tsx`

**Change this:**

```typescript
const intervalId = setInterval(fetchUserActivities, 30000); // ❌ Every 30 seconds
```

**To this:**

```typescript
const intervalId = setInterval(fetchUserActivities, 5 * 60 * 1000); // ✅ Every 5 minutes
```

**Savings:** ~90% reduction in this component alone!

---

#### 2. Update Layout Order Polling

**Current Issue:** Polls orders count repeatedly

**Location:** `src/components/Layout.tsx`

**Replace manual fetching with:**

```typescript
import { usePendingOrdersCount } from "../hooks/useSupabaseQuery";

// Inside Layout component:
const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();
// Remove fetchPendingOrdersCount function and useEffect
```

---

### IMPORTANT (This Week) - 15% Additional Savings:

#### 3. Update Search Component Images

**Location:** `src/components/Search.tsx`

Search for all:

```tsx
<img src={product.image_url} />
```

Replace with:

```tsx
<OptimizedImage src={product.image_url} alt={product.name} preset="small" />
```

---

#### 4. Update Checkout Component Images

**Location:** `src/components/Checkout.tsx`

Around line 420-425, replace:

```tsx
<img src={item.product.image_url} />
```

With:

```tsx
<OptimizedImage
  src={item.product.image_url}
  alt={item.product.name}
  preset="thumbnail"
/>
```

---

#### 5. Update Dashboard Component Images

**Location:** `src/components/Dashboard.tsx`

Around line 259-261, replace:

```tsx
<img src={item.product.image_url} />
```

With:

```tsx
<OptimizedImage
  src={item.product.image_url}
  alt={item.product.name}
  preset="thumbnail"
/>
```

---

### OPTIONAL (When You Have Time) - 5% More Savings:

#### 6. Use Cached Hooks in Other Components

**Search.tsx:**

```typescript
// Replace line 58-59:
const { data: products = [] } = useProducts();
const { data: sales = [] } = useSales();
// Remove the manual fetching code
```

**Inventory.tsx:**

```typescript
import { useProducts } from "../hooks/useSupabaseQuery";
const { data: products = [] } = useProducts();
```

**CustomerCredit.tsx:**

```typescript
import {
  useCustomerCredits,
  useCreditPayments,
} from "../hooks/useSupabaseQuery";
const { data: credits = [] } = useCustomerCredits();
const { data: payments = [] } = useCreditPayments();
```

---

## 🧪 Testing After Changes:

### 1. Open Browser DevTools

```
1. Press F12
2. Go to Network tab
3. Filter by "supabase.co"
4. Refresh page multiple times
5. Should see MUCH fewer requests!
```

### 2. Check Image Sizes

```
1. Network tab → Img filter
2. Click on any product image
3. Should see URL has: ?width=300&quality=80&format=webp
4. Size should be ~150-200KB instead of 2MB
```

### 3. Verify Caching Works

```
1. Load Dashboard
2. Navigate away
3. Come back to Dashboard
4. Should load INSTANTLY (from cache)
5. No new network requests!
```

---

## 📊 Expected Results:

### Before:

- 🔴 10-20 Supabase requests per page load
- 🔴 100MB+ image loading per session
- 🔴 API polling every 30 seconds
- 🔴 $50-100/month egress costs

### After:

- 🟢 1-3 Supabase requests per 5 minutes
- 🟢 10-15MB image loading per session (cached)
- 🟢 API polling every 2-5 minutes
- 🟢 $5-10/month egress costs

**💰 SAVINGS: ~$40-90/month!**

---

## 🆘 If Something Breaks:

### Issue: "useProducts is not defined"

**Solution:** Add import:

```typescript
import { useProducts } from "../hooks/useSupabaseQuery";
```

### Issue: Images not showing

**Solution:** Check console for errors. May need to:

```typescript
<OptimizedImage
  src={image_url}
  forceFresh={true} // Bypass cache temporarily
/>
```

### Issue: Data not updating

**Solution:** Invalidate cache after mutations:

```typescript
import { useQueryClient } from "@tanstack/react-query";
const queryClient = useQueryClient();

// After updating data:
queryClient.invalidateQueries({ queryKey: ["products"] });
```

---

## 📞 Quick Commands:

### Check if React Query is installed:

```bash
npm list @tanstack/react-query
```

### Clear all caches (if needed):

```typescript
// In browser console:
localStorage.clear();
location.reload();
```

### Monitor Supabase usage:

Visit: https://supabase.com/dashboard/project/xhesxzfjbkbzdhsyrpot/settings/billing

---

## ⏱️ Time Estimate:

- Urgent changes: **15 minutes**
- Important changes: **30 minutes**
- Optional changes: **1 hour**

**Total: 1.75 hours to save $40-90/month = $240-1080/year!**

---

## 🎯 Priority Order:

1. **[5 min]** Update UserActivityDashboard polling interval
2. **[3 min]** Update Layout with `usePendingOrdersCount()`
3. **[5 min]** Replace Checkout images with OptimizedImage
4. **[5 min]** Replace Dashboard images with OptimizedImage
5. **[5 min]** Replace Search images with OptimizedImage
6. **[30 min]** Convert components to use cached hooks

---

**🚀 START HERE:** Open `src/components/UserActivityDashboard.tsx` and change line 139 from `30000` to `5 * 60 * 1000`

That ONE change will save you ~60% of your current costs!
