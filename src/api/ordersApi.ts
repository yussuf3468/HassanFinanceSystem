import { unwrap, apiClient } from "./client";

export async function getOrders() {
  const response = await apiClient
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  return unwrap(response, []);
}

export async function getPendingOrdersCount() {
  const response = await apiClient
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "confirmed"]);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.count ?? 0;
}

export async function createOrderWithItemsAndStock(payload: {
  order: {
    customer_name: string;
    customer_email: string | null;
    customer_phone: string;
    delivery_address: string;
    delivery_fee: number;
    subtotal: number;
    total_amount: number;
    payment_method?: "cash" | "mpesa" | "card" | "bank_transfer";
    payment_status?: "pending" | "paid" | "failed";
    status?:
      | "pending"
      | "confirmed"
      | "processing"
      | "shipped"
      | "delivered"
      | "cancelled";
    notes: string | null;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    quantity_in_stock: number;
  }>;
}) {
  const { data: order, error: orderError } = await (apiClient as any)
    .from("orders")
    .insert([payload.order])
    .select()
    .single();

  if (orderError) throw new Error(orderError.message);

  const orderItems = payload.items.map((item) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price,
  }));

  const { error: itemsError } = await (apiClient as any)
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw new Error(itemsError.message);

  for (const item of payload.items) {
    const { error: stockError } = await (apiClient as any)
      .from("products")
      .update({
        quantity_in_stock: item.quantity_in_stock - item.quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.product_id);

    if (stockError) {
      throw new Error(stockError.message);
    }
  }

  return { order, orderItems };
}

export async function getOrderByNumber(orderNumber: string) {
  const response = await (apiClient as any)
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber.toUpperCase())
    .single();

  return unwrap(response, null);
}

export async function updateOrderPaymentDecision(orderId: string, approve: boolean) {
  const payload = {
    payment_status: approve ? "paid" : "failed",
    payment_verified_at: new Date().toISOString(),
    status: approve ? "confirmed" : "pending",
  } as const;

  const { error } = await (apiClient as any)
    .from("orders")
    .update(payload)
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

export async function updateOrderStatusById(orderId: string, status: string) {
  const { error } = await (apiClient as any)
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

export async function deleteOrderWithItems(orderId: string) {
  const { error: itemsError } = await (apiClient as any)
    .from("order_items")
    .delete()
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);

  const { error: orderError } = await (apiClient as any)
    .from("orders")
    .delete()
    .eq("id", orderId);

  if (orderError) throw new Error(orderError.message);
}
