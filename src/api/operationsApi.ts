import { apiClient, unwrap } from "./client";

export async function getPublishedProducts() {
  const response = await apiClient
    .from("products")
    .select("*")
    .eq("published", true)
    .order("name");

  return unwrap(response, []);
}

export async function getPublishedProductsInStock() {
  const response = await apiClient
    .from("products")
    .select("*")
    .eq("published", true)
    .gt("quantity_in_stock", 0)
    .order("featured", { ascending: false })
    .order("name");

  return unwrap(response, []);
}

export async function processStockReceiptItems(items: Array<{
  product_id: string | undefined;
  quantity: number;
  cost_per_unit: null;
  received_by: string;
}>) {
  const response = await (apiClient as any).rpc("process_stock_receipt", {
    p_items: items,
  });

  if (response.error) throw new Error(response.error.message);

  return response.data as string;
}

export async function getStockMovements(filter: "all" | "receipt" | "sale" | "adjustment") {
  let query = (apiClient as any)
    .from("stock_movements")
    .select(
      `
      *,
      product:products(name, product_id, image_url)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter !== "all") {
    query = query.ilike("reason", `%${filter}%`);
  }

  const response = await query;
  return unwrap(response, []);
}

export async function getProfitTrackerHistory(limit = 50) {
  const response = await (apiClient as any)
    .from("profit_tracker_history")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return unwrap(response, []);
}

export async function createProfitTrackerHistory(payload: Record<string, unknown>) {
  const { error } = await (apiClient as any)
    .from("profit_tracker_history")
    .insert(payload);

  if (error) throw new Error(error.message);
}

export async function deleteProfitTrackerHistory(id: string) {
  const { error } = await (apiClient as any)
    .from("profit_tracker_history")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getUserProfilesForActivity(limit = 10) {
  const { error: testError } = await apiClient
    .from("profiles")
    .select("count", { count: "exact", head: true });

  if (testError) {
    throw new Error(`Database connection failed: ${testError.message}`);
  }

  const response = await apiClient
    .from("profiles")
    .select("id, email, full_name, role, last_login, created_at")
    .limit(limit);

  return unwrap(response, []);
}

export async function deleteProductWithRelations(productId: string) {
  const { error: salesError } = await apiClient
    .from("sales")
    .delete()
    .eq("product_id", productId);

  if (salesError) throw new Error(salesError.message);

  const { error: orderItemsError } = await apiClient
    .from("order_items")
    .delete()
    .eq("product_id", productId);

  if (orderItemsError) throw new Error(orderItemsError.message);

  const { error: productError } = await apiClient
    .from("products")
    .delete()
    .eq("id", productId);

  if (productError) throw new Error(productError.message);
}

export async function getSaleForDelete(saleId: string) {
  const response = await apiClient
    .from("sales")
    .select("product_id, quantity_sold")
    .eq("id", saleId)
    .single();

  return unwrap(response, null as any);
}

export async function deleteSaleById(saleId: string) {
  const { error } = await apiClient.from("sales").delete().eq("id", saleId);
  if (error) throw new Error(error.message);
}

export async function restoreProductStock(productId: string, quantityInStock: number) {
  const { error } = await apiClient
    .from("products")
    .update({ quantity_in_stock: quantityInStock })
    .eq("id", productId);

  if (error) throw new Error(error.message);
}

export async function deleteSalesByCustomerName(customerName: string) {
  const { error } = await apiClient
    .from("sales")
    .delete()
    .eq("customer_name", customerName);

  if (error) throw new Error(error.message);
}

export async function getSalesTotalsFromRpc() {
  const { data, error } = await (apiClient as any).rpc("get_sales_totals");
  if (error) throw new Error(error.message);
  return data;
}

export async function getFinancialTotalsFromRpc() {
  const { data, error } = await (apiClient as any).rpc("get_financial_totals");
  if (error) throw new Error(error.message);
  return data;
}
