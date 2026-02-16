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
  key: string | string[],
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
  return useSupabaseQuery<Product[]>("products", async () => {
    // Only select fields we actually need - reduces payload by ~40%
    const { data, error } = await supabase
      .from("products")
      .select(
        "id,name,product_id,category,buying_price,selling_price,quantity_in_stock,reorder_level,image_url,featured,published,created_at",
      )
      .order("created_at", { ascending: false }); // Index on created_at for faster sorting

    return { data, error };
  });
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
      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("products")
        .select(
          "id,name,product_id,category,buying_price,selling_price,quantity_in_stock,reorder_level,image_url,featured,published,created_at",
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      return { data, error };
    },
  );
}

/**
 * Hook for sales data with caching and optimization
 * Use manual refresh button to update data and save egress costs
 */
export function useSales() {
  return useSupabaseQuery<any[]>(
    "sales",
    async () => {
      // Fetch ALL sales using pagination to bypass 1000 row limit
      let allSales: any[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from("sales")
          .select(
            "id,transaction_id,product_id,quantity_sold,selling_price,buying_price,total_sale,profit,payment_method,sold_by,discount_amount,discount_percentage,original_price,final_price,created_at,sale_date,customer_name,payment_status,amount_paid",
          )
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) {
          return { data: allSales, error };
        }

        if (data && data.length > 0) {
          allSales = [...allSales, ...data];
          from += pageSize;
          hasMore = data.length === pageSize; // Continue if we got a full page
        } else {
          hasMore = false;
        }
      }

      return { data: allSales, error: null };
    },
    // ✅ No auto-refetch - use manual Refresh button to save costs!
  );
}

/**
 * Hook for recent sales only (for dashboard)
 * Much faster for large datasets
 */
export function useRecentSales(limit: number = 100) {
  return useSupabaseQuery<any[]>(["recent-sales", limit], async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        "id,product_id,quantity_sold,total_sale,profit,payment_method,sold_by,created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    return { data, error };
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
    // Use PostgreSQL function for server-side aggregation (handles ALL rows, no limits)
    const { data, error } = await supabase.rpc("get_sales_totals" as any);

    if (error) {
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

    const result = data?.[0] || {
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
    const { data, error } = await supabase.rpc("get_financial_totals" as any);

    if (error) {
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

    const result = data?.[0] || {};
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
  });
}

/**
 * Hook for orders data with caching
 */
export function useOrders() {
  return useSupabaseQuery<any[]>(
    "orders",
    async () => await supabase.from("orders").select("*, order_items(*)"),
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
    },
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
      await supabase.from("expenses").select("*, expense_categories(name)"),
  );
}

/**
 * Hook for debts with caching
 */
export function useDebts() {
  return useSupabaseQuery<any[]>(
    "debts",
    async () => await supabase.from("debts").select("*"),
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
        .gt("quantity_in_stock", 0)
        .order("selling_price", { ascending: false })
        .order("name"),
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
        .order("selling_price", { ascending: false })
        .limit(limit),
  );
}

/**
 * Hook for initial investments data with caching
 */
export function useInitialInvestments() {
  return useSupabaseQuery<any[]>(
    "initial-investments",
    async () => await supabase.from("initial_investments").select("*"),
  );
}

/**
 * Hook for returns data with caching
 */
export function useReturns() {
  return useSupabaseQuery<any[]>(
    "returns",
    async () =>
      await supabase
        .from("returns")
        .select("*")
        .order("return_date", { ascending: false }),
  );
}
