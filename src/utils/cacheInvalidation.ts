import type { QueryClient } from "@tanstack/react-query";

/**
 * Cache invalidation utilities for keeping dashboard data up-to-date
 * while maintaining the infinite caching strategy for cost savings
 */

/**
 * Invalidate all sales-related caches after recording a new sale
 * Call this after successful sale creation to update dashboard totals
 */
export async function invalidateSalesCaches(queryClient: QueryClient) {
  console.log("🔄 Invalidating sales caches...");
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["sales-totals"] }),
    queryClient.invalidateQueries({ queryKey: ["sales"] }),
    queryClient.invalidateQueries({ queryKey: ["recent-sales"] }),
  ]);
  console.log("✅ Sales caches invalidated");
}

/**
 * Invalidate product caches after updating stock levels
 * Call this after sales or returns that modify inventory
 */
export async function invalidateProductCaches(queryClient: QueryClient) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["products"] }),
    queryClient.invalidateQueries({ queryKey: ["products-paginated"] }),
    queryClient.invalidateQueries({ queryKey: ["public-products"] }),
    queryClient.invalidateQueries({ queryKey: ["featured-products"] }),
  ]);
}

/**
 * Invalidate return caches after recording a return
 */
export async function invalidateReturnsCaches(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["returns"] });
}

/**
 * Invalidate expenses cache after recording an expense
 */
export async function invalidateExpensesCaches(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["expenses"] });
}

/**
 * Invalidate debts cache after updating debt information
 */
export async function invalidateDebtsCaches(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: ["debts"] });
}

/**
 * Invalidate all financial caches (for comprehensive refresh)
 * Use this when you need to ensure all financial data is up-to-date
 */
export async function invalidateAllFinancialCaches(queryClient: QueryClient) {
  console.log("🔄 FULL REFRESH: Invalidating all financial caches...");
  await Promise.all([
    invalidateSalesCaches(queryClient),
    invalidateExpensesCaches(queryClient),
    invalidateDebtsCaches(queryClient),
    queryClient.invalidateQueries({ queryKey: ["initial_investments"] }),
    queryClient.invalidateQueries({ queryKey: ["cyber_services"] }),
    invalidateProductCaches(queryClient),
    invalidateReturnsCaches(queryClient),
  ]);
  console.log(
    "✅ ALL financial caches invalidated - all components should refresh now"
  );
}

/**
 * Invalidate all related caches after a sale transaction
 * This includes sales data and product stock levels
 */
export async function invalidateAfterSale(queryClient: QueryClient) {
  await Promise.all([
    invalidateSalesCaches(queryClient),
    invalidateProductCaches(queryClient),
  ]);
}

/**
 * Invalidate all related caches after a return transaction
 * This includes returns, sales (for refund entry), and products (for stock restoration)
 */
export async function invalidateAfterReturn(queryClient: QueryClient) {
  await Promise.all([
    invalidateReturnsCaches(queryClient),
    invalidateSalesCaches(queryClient),
    invalidateProductCaches(queryClient),
  ]);
}
