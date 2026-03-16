# Horumar Architecture

## Overview
Horumar follows a feature-oriented front-end architecture with strict data access boundaries:

- UI components render state and dispatch actions.
- `src/api` is the only layer that talks to Supabase.
- `src/hooks` and `src/features/**/hooks` provide React Query integration.
- `src/config` contains environment and runtime configuration.
- `src/lib/supabaseClient.ts` holds centralized Supabase client setup.

## Folder Structure

```text
src/
├─ api/                 # Centralized Supabase access wrappers
├─ components/          # Shared and screen-level UI components
├─ features/
│  ├─ auth/
│  ├─ products/
│  ├─ orders/
│  ├─ analytics/
│  └─ settings/
├─ hooks/               # Reusable app-level hooks
├─ lib/                 # Client setup and low-level helpers
├─ pages/               # Route-level page wrappers
├─ styles/              # Global styles and tokens
├─ types/               # Shared TS domain contracts
└─ config/              # Environment and app config
```

## Data Flow

1. Component calls a feature hook (`useProductsFeature`, `useOrdersFeature`) or shared hook.
2. Hook uses React Query (`useQuery`) with stable query keys.
3. Query function calls API wrapper in `src/api/*`.
4. API wrapper uses `apiClient` (Supabase client) and returns typed data.
5. UI consumes hook state (`data`, `isLoading`, `isError`) and renders loading/error/empty states.

## Supabase Integration Rules

1. Do not call `supabase.from(...)` directly in UI components.
2. Add new table/query logic in `src/api/<domain>Api.ts`.
3. Reuse API methods from feature hooks instead of duplicating query logic.
4. Keep query keys consistent and domain-scoped.
5. Mutations must invalidate related query keys.

## Adding a New Feature

1. Create domain API file in `src/api`.
2. Create feature hook in `src/features/<feature>/hooks`.
3. Add/extend domain types in `src/types`.
4. Build UI in `src/components` and optional page wrapper in `src/pages`.
5. Add loading/error/empty UI states.
6. Verify `npm run typecheck`, `npm run lint`, `npm run build`.

## Environment Configuration

Use `.env` based on `.env.example`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PAYMENT_API_URL` (optional)

`src/config/env.ts` validates required values at startup.

## Performance Strategy

- Query caching and stale-time policy in `src/config/queryClient.ts`.
- Lazy-loaded major views in `src/App.tsx`.
- Debounced input support via `src/hooks/useDebouncedValue.ts`.
- Batched read patterns in API modules where needed.

## Deployment Checklist

1. Set environment variables in hosting provider.
2. Run checks:
   - `npm run typecheck`
   - `npm run lint`
   - `npm run build`
3. Deploy and verify:
   - auth flow
   - dashboard analytics
   - product CRUD
   - sales/returns flows
   - order payment confirmation flow
