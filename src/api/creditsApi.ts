import { apiClient, unwrap } from "./client";

export async function getCustomerCredits() {
  const response = await (apiClient as any)
    .from("customer_credits")
    .select("*")
    .order("created_at", { ascending: false });

  return unwrap(response, []);
}

export async function getCreditPayments() {
  const response = await (apiClient as any)
    .from("credit_payments")
    .select("*")
    .order("payment_date", { ascending: false });

  return unwrap(response, []);
}

export async function checkCustomerCreditTables() {
  await (apiClient as any).from("customer_credits").select("id").limit(1);
  await (apiClient as any).from("credit_payments").select("id").limit(1);
}

export async function createCustomerCredit(payload: {
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  credit_date: string;
  due_date: string | null;
  status: "active";
  notes: string | null;
}) {
  const { error } = await (apiClient as any)
    .from("customer_credits")
    .insert([payload]);

  if (error) throw new Error(error.message);
}

export async function updateCustomerCredit(id: string, payload: {
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  credit_date: string;
  due_date: string | null;
  status: "active";
  notes: string | null;
}) {
  const { error } = await (apiClient as any)
    .from("customer_credits")
    .update(payload)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function addCreditPayment(payload: {
  credit_id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  notes: string | null;
}) {
  const { error } = await (apiClient as any)
    .from("credit_payments")
    .insert([payload]);

  if (error) throw new Error(error.message);
}

export async function updateCustomerCreditStatus(id: string, status: string) {
  const { error } = await (apiClient as any)
    .from("customer_credits")
    .update({ status } as any)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteCustomerCreditWithPayments(id: string) {
  await (apiClient as any).from("credit_payments").delete().eq("credit_id", id);

  const { error } = await (apiClient as any)
    .from("customer_credits")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
