import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

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
      return data as T;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
}

/**
 * Hook for products data with caching
 */
export function useProducts() {
  return useSupabaseQuery("products", () =>
    supabase.from("products").select("*")
  );
}

/**
 * Hook for sales data with caching
 */
export function useSales() {
  return useSupabaseQuery("sales", () => supabase.from("sales").select("*"));
}

/**
 * Hook for orders data with caching
 */
export function useOrders() {
  return useSupabaseQuery("orders", () =>
    supabase.from("orders").select("*, order_items(*)")
  );
}

/**
 * Hook for pending orders count (MAXIMUM cache - reduce egress)
 */
export function usePendingOrdersCount() {
  return useSupabaseQuery(
    "pending-orders-count",
    async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"]);

      if (error) throw error;
      return count || 0;
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutes (was 1 minute - 90% less requests!)
      refetchInterval: 10 * 60 * 1000, // Auto-refetch every 10 minutes (was 2 minutes - 80% less requests!)
    }
  );
}

/**
 * Hook for customer credits with caching
 */
export function useCustomerCredits() {
  return useSupabaseQuery("customer-credits", () =>
    supabase
      .from("customer_credits")
      .select("*")
      .order("created_at", { ascending: false })
  );
}

/**
 * Hook for credit payments with caching
 */
export function useCreditPayments() {
  return useSupabaseQuery("credit-payments", () =>
    supabase
      .from("credit_payments")
      .select("*")
      .order("payment_date", { ascending: false })
  );
}

/**
 * Hook for expenses with caching
 */
export function useExpenses() {
  return useSupabaseQuery("expenses", () =>
    supabase.from("expenses").select("*, expense_categories(name)")
  );
}

/**
 * Hook for debts with caching
 */
export function useDebts() {
  return useSupabaseQuery("debts", () => supabase.from("debts").select("*"));
}
