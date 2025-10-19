import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";

/**
 * Custom hook for cached Supabase queries
 * Reduces egress costs by caching data client-side
 *
 * @example
 * const { data: products } = useSupabaseQuery('products', () =>
 *   supabase.from('products').select('*')
 * );
 */
export function useSupabaseQuery<T = any>(
  key: string | string[],
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  return useQuery<T, Error>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const { data, error } = await queryFn();
      if (error) throw error;
      // Ensure we never return undefined - return empty array for null array data
      if (data === null || data === undefined) {
        return [] as T; // For array queries, return empty array
      }
      return data as T;
    },
    staleTime: Infinity, // ❌ NEVER auto-refetch - cache forever!
    gcTime: 60 * 60 * 1000, // 1 hour - keep cache in memory longer
    refetchOnWindowFocus: false, // ❌ Don't refetch on window focus
    refetchOnMount: false, // ❌ Don't refetch on mount
    refetchOnReconnect: false, // ❌ Don't refetch on reconnect
    ...options,
  });
}

/**
 * Custom hook for queries that return data directly (not wrapped in {data, error})
 * Use this for custom queries that handle errors internally
 */
export function useSupabaseQueryDirect<T = any>(
  key: string | string[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">
) {
  return useQuery<T, Error>({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: async () => {
      const data = await queryFn();
      // Ensure we never return undefined
      if (data === null || data === undefined) {
        return [] as T; // For array queries, return empty array
      }
      return data;
    },
    staleTime: Infinity, // ❌ NEVER auto-refetch - cache forever!
    gcTime: 60 * 60 * 1000, // 1 hour - keep cache in memory longer
    refetchOnWindowFocus: false, // ❌ Don't refetch on window focus
    refetchOnMount: false, // ❌ Don't refetch on mount
    refetchOnReconnect: false, // ❌ Don't refetch on reconnect
    ...options,
  });
}

/**
 * Hook for products data with caching
 */
export function useProducts() {
  return useSupabaseQuery<Product[]>(
    "products",
    async () => await supabase.from("products").select("*")
  );
}

/**
 * Hook for sales data with caching
 */
export function useSales() {
  return useSupabaseQuery<any[]>(
    "sales",
    async () => await supabase.from("sales").select("*")
  );
}

/**
 * Hook for orders data with caching
 */
export function useOrders() {
  return useSupabaseQuery<any[]>(
    "orders",
    async () => await supabase.from("orders").select("*, order_items(*)")
  );
}

/**
 * Hook for pending orders count (NO AUTO-REFETCH - save egress!)
 */
export function usePendingOrdersCount() {
  return useSupabaseQueryDirect(
    "pending-orders-count",
    async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"]);

      if (error) {
        console.error("Error fetching pending orders count:", error);
        return 0; // Return 0 on error instead of undefined
      }

      return count ?? 0; // Use nullish coalescing to ensure never undefined
    },
    {
      staleTime: Infinity, // NEVER refetch automatically - infinite cache!
      refetchInterval: false, // ❌ DISABLED auto-polling - saves 100+ requests/day!
    }
  );
}

/**
 * Hook for customer credits with caching
 */
export function useCustomerCredits() {
  return useSupabaseQueryDirect("customer-credits", async () => {
    const { data: credits, error } = await supabase
      .from("customer_credits" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return credits || [];
  });
}

/**
 * Hook for credit payments with caching
 */
export function useCreditPayments() {
  return useSupabaseQueryDirect("credit-payments", async () => {
    const { data: payments, error } = await supabase
      .from("credit_payments" as any)
      .select("*")
      .order("payment_date", { ascending: false });

    if (error) throw error;
    return payments || [];
  });
}

/**
 * Hook for expenses with caching
 */
export function useExpenses() {
  return useSupabaseQuery<any[]>(
    "expenses",
    async () =>
      await supabase.from("expenses").select("*, expense_categories(name)")
  );
}

/**
 * Hook for debts with caching
 */
export function useDebts() {
  return useSupabaseQuery<any[]>(
    "debts",
    async () => await supabase.from("debts").select("*")
  );
}

/**
 * Hook for publicly visible products (published and in stock) with caching
 */
export function usePublicProducts() {
  return useSupabaseQuery<Product[]>(
    "public-products",
    async () =>
      await supabase
        .from("products")
        .select("*")
        .eq("published", true)
        .gt("quantity_in_stock", 0)
        .order("featured", { ascending: false })
        .order("name")
  );
}

/**
 * Hook for featured products list (limited) with caching
 */
export function useFeaturedProducts(limit = 8) {
  return useSupabaseQuery<Product[]>(
    "featured-products",
    async () =>
      await supabase
        .from("products")
        .select("*")
        .gt("quantity_in_stock", 0)
        .order("quantity_in_stock", { ascending: true })
        .limit(limit)
  );
}

/**
 * Hook for initial investments data with caching
 */
export function useInitialInvestments() {
  return useSupabaseQuery<any[]>(
    "initial-investments",
    async () => await supabase.from("initial_investments").select("*")
  );
}
