# Long-term Maintenance, Egress, and Performance Guide

This document summarizes the practices we applied to make the app fast, stable, and cost-efficient over the long term.

## Data-fetching and caching

- React Query is configured globally with:
  - staleTime: Infinity and gcTime: Infinity for queries by default.
  - refetchOnWindowFocus, refetchOnMount, refetchOnReconnect: false.
  - retry: 0 to avoid hidden replays.
- All reads use centralized hooks in `src/hooks/useSupabaseQuery.ts`.
- CRUD flows must call `queryClient.invalidateQueries([keys...])` for the affected resources to refresh data when needed.

## Storage egress minimization

- Optimized images via `OptimizedImage` and `utils/imageOptimization.ts`:
  - Adds width/quality/format parameters for smaller payloads.
  - Lazy-load and memoize resulting URLs to avoid re-downloading.
- Service worker is explicitly unregistered; we rely on browser cache + React Query instead of a custom SW that forced fresh loads.

## Polling and background work

- All polling/auto-refresh is disabled by default.
- If live updates are required, prefer an explicit Refresh button or very targeted invalidations.

## Diagnostics (dev only)

- `QueryDiagnostics` overlays a tiny widget in dev that shows:
  - Number of queries in cache
  - Total observer count
- Sudden spikes indicate duplicated subscriptions or unmounted components not cleaned up.

## Safe patterns

- Read data through hooks `useProducts`, `useSales`, `useOrders`, `useExpenses`, `useDebts`, `usePublicProducts`, `useFeaturedProducts`, `useInitialInvestments`.
- Avoid direct `supabase.from(...).select()` in components—put into hooks.
- For lists, memoize sorting and mapping where applicable (`useMemo`).

## Manual refresh UX (optional)

- If a screen needs a manual refresh, add a small button that calls `queryClient.invalidateQueries([key])`.

## Releases and verification

1. npm run typecheck
2. npm run build
3. Verify no console errors and that images are loaded with optimized URLs.
4. Confirm Supabase dashboard shows very few read/storage requests.

## Troubleshooting

- Data appearing stale: ensure corresponding mutations invalidate the right cache keys.
- Images reloading often: confirm no cache-busting params are added and `OptimizedImage` is used.
- Unexpected requests: search for direct Supabase calls and replace with hooks.

---

This setup targets near-zero read egress while keeping the app responsive. Adjust as needed for specific real-time needs.
