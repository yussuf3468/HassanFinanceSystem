import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import type { Product } from "../types";
import {
  getProducts,
  getSales,
  getOrders,
  getPendingOrdersCount,
  getExpenses,
  getDebts,
  getPublicProducts,
  getFeaturedProducts,
  getInitialInvestments,
  getReturns,
  getCustomerCredits,
  getCreditPayments,
  getSalesTotalsFromRpc,
  getFinancialTotalsFromRpc,
} from "../api";

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
  key: string | Array<string | number>,
  queryFn: () => Promise<{ data: T | null; error: any }>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">,
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
  key: string | Array<string | number>,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, Error>, "queryKey" | "queryFn">,
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
 * Hook for products data with caching and optimization
 * Only fetches essential fields to reduce payload size
 */
export function useProducts() {
  return useSupabaseQueryDirect<Product[]>(
    "products",
    async () => (await getProducts()) as unknown as Product[],
  );
}

/**
 * Hook for products with pagination (for large datasets)
 * @param page - Page number (0-indexed)
 * @param pageSize - Number of items per page
 */
export function useProductsPaginated(page: number = 0, pageSize: number = 50) {
  return useSupabaseQuery<Product[]>(
    ["products-paginated", page, pageSize],
    async () => {
      const products = (await getProducts()) as unknown as Product[];
      const from = page * pageSize;
      const to = from + pageSize - 1;

      return {
        data: products.slice(from, to + 1),
        error: null,
      };
    },
  );
}

/**
 * Hook for sales data with caching and optimization
 * Use manual refresh button to update data and save egress costs
 */
export function useSales() {
  return useSupabaseQueryDirect<any[]>("sales", getSales);
}

/**
 * Hook for recent sales only (for dashboard)
 * Much faster for large datasets
 */
export function useRecentSales(limit: number = 100) {
  return useSupabaseQuery<any[]>(["recent-sales", limit], async () => {
    const data = (await getSales()).slice(0, limit).map((sale: any) => ({
      id: sale.id,
      product_id: sale.product_id,
      quantity_sold: sale.quantity_sold,
      total_sale: sale.total_sale,
      profit: sale.profit,
      payment_method: sale.payment_method,
      sold_by: sale.sold_by,
      created_at: sale.created_at,
    }));

    return { data, error: null };
  });
}

/**
 * Hook for sales totals only (for accurate dashboard stats without loading all data)
 * Uses PostgreSQL aggregate functions for efficiency
 */
export function useSalesTotals() {
  return useSupabaseQueryDirect<{
    total_sales: number;
    total_profit: number;
    today_sales: number;
    today_profit: number;
    year_sales: number;
    year_profit: number;
  }>("sales-totals", async () => {
    try {
      const data = await getSalesTotalsFromRpc();
      const result: any = data?.[0] || {
        total_sales: 0,
        total_profit: 0,
        today_sales: 0,
        today_profit: 0,
        year_sales: 0,
        year_profit: 0,
      };

      return {
        total_sales: Number(result.total_sales) || 0,
        total_profit: Number(result.total_profit) || 0,
        today_sales: Number(result.today_sales) || 0,
        today_profit: Number(result.today_profit) || 0,
        year_sales: Number(result.year_sales) || 0,
        year_profit: Number(result.year_profit) || 0,
      };
    } catch (error) {
      console.error("Error fetching sales totals from RPC:", error);
      return {
        total_sales: 0,
        total_profit: 0,
        today_sales: 0,
        today_profit: 0,
        year_sales: 0,
        year_profit: 0,
      };
    }
  });
}

/**
 * Hook for comprehensive financial totals (uses PostgreSQL aggregation)
 * This bypasses the 1000 row limit and calculates server-side
 */
export function useFinancialTotals() {
  return useSupabaseQueryDirect<{
    total_sales: number;
    total_profit: number;
    monthly_sales: number;
    monthly_profit: number;
    daily_sales: number;
    daily_profit: number;
    yesterday_profit: number;
    total_cyber_profit: number;
  }>("financial-totals", async () => {
    try {
      const data = await getFinancialTotalsFromRpc();
      const result: any = data?.[0] || {};
      return {
        total_sales: Number(result.total_sales) || 0,
        total_profit: Number(result.total_profit) || 0,
        monthly_sales: Number(result.monthly_sales) || 0,
        monthly_profit: Number(result.monthly_profit) || 0,
        daily_sales: Number(result.daily_sales) || 0,
        daily_profit: Number(result.daily_profit) || 0,
        yesterday_profit: Number(result.yesterday_profit) || 0,
        total_cyber_profit: Number(result.total_cyber_profit) || 0,
      };
    } catch (error) {
      console.error("Error fetching financial totals from RPC:", error);
      return {
        total_sales: 0,
        total_profit: 0,
        monthly_sales: 0,
        monthly_profit: 0,
        daily_sales: 0,
        daily_profit: 0,
        yesterday_profit: 0,
        total_cyber_profit: 0,
      };
    }
  });
}

/**
 * Hook for orders data with caching
 */
export function useOrders() {
  return useSupabaseQueryDirect<any[]>("orders", getOrders);
}

/**
 * Hook for pending orders count (NO AUTO-REFETCH - save egress!)
 */
export function usePendingOrdersCount() {
  return useSupabaseQueryDirect(
    "pending-orders-count",
    getPendingOrdersCount,
    {
      staleTime: Infinity, // NEVER refetch automatically - infinite cache!
      refetchInterval: false, // ❌ DISABLED auto-polling - saves 100+ requests/day!
    },
  );
}

/**
 * Hook for customer credits with caching
 */
export function useCustomerCredits() {
  return useSupabaseQueryDirect("customer-credits", getCustomerCredits);
}

/**
 * Hook for credit payments with caching
 */
export function useCreditPayments() {
  return useSupabaseQueryDirect("credit-payments", getCreditPayments);
}

/**
 * Hook for expenses with caching
 */
export function useExpenses() {
  return useSupabaseQueryDirect<any[]>("expenses", getExpenses);
}

/**
 * Hook for debts with caching
 */
export function useDebts() {
  return useSupabaseQueryDirect<any[]>("debts", getDebts);
}

/**
 * Hook for publicly visible products (published and in stock) with caching
 */
export function usePublicProducts() {
  return useSupabaseQueryDirect<Product[]>("public-products", getPublicProducts);
}

/**
 * Hook for featured products list (limited) with caching
 */
export function useFeaturedProducts(limit = 8) {
  return useSupabaseQueryDirect<Product[]>(
    ["featured-products", limit],
    async () => getFeaturedProducts(limit),
  );
}

/**
 * Hook for initial investments data with caching
 */
export function useInitialInvestments() {
  return useSupabaseQueryDirect<any[]>("initial-investments", getInitialInvestments);
}

/**
 * Hook for returns data with caching
 */
export function useReturns() {
  return useSupabaseQueryDirect<any[]>("returns", getReturns);
}
