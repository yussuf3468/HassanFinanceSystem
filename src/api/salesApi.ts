import type { SaleInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function getSales() {
  let allSales: any[] = [];
  let from = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const response = await apiClient
      .from("sales")
      .select(
        "id,transaction_id,product_id,quantity_sold,selling_price,buying_price,total_sale,profit,payment_method,sold_by,discount_amount,discount_percentage,original_price,final_price,created_at,sale_date,customer_name,payment_status,amount_paid",
      )
      .order("created_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (response.error) {
      throw new Error(response.error.message);
    }

    const pageData = response.data || [];
    allSales = [...allSales, ...pageData];
    hasMore = pageData.length === pageSize;
    from += pageSize;
  }

  return allSales;
}

export async function createSale(payload: SaleInput) {
  const response = await apiClient.from("sales").insert(payload).select().single();
  return unwrap(response, null);
}

export async function createManySales(payloads: SaleInput[]) {
  const response = await apiClient.from("sales").insert(payloads);
  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function getSaleDrafts(): Promise<any[]> {
  const response = await (apiClient as any)
    .from("sale_drafts")
    .select("*")
    .order("created_at", { ascending: false });
  return unwrap(response, []);
}

export async function createSaleDraft(payload: {
  draft_name: string;
  line_items: unknown;
  sold_by: string;
  payment_method: string;
  overall_discount_type: string;
  overall_discount_value: number | null;
  customer_name: string | null;
  payment_status: string;
  amount_paid: number | null;
}): Promise<any> {
  const draftResponse = await (apiClient as any)
    .from("sale_drafts")
    .insert(payload)
    .select()
    .single();
  return unwrap(draftResponse, null);
}

export async function deleteSaleDraft(id: string) {
  const response = await (apiClient as any)
    .from("sale_drafts")
    .delete()
    .eq("id", id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function processStockReceipt(payload: {
  product_id: string;
  quantity: number;
  received_by: string;
  notes: string;
}) {
  const response = await (apiClient as any).rpc("process_stock_receipt", {
    p_items: [
      {
        product_id: payload.product_id,
        quantity: payload.quantity,
        cost_per_unit: null,
        received_by: payload.received_by,
        notes: payload.notes,
      },
    ],
  });

  if (response.error) {
    throw new Error(response.error.message);
  }
}
