import type { DebtInput, DebtPaymentInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function verifyDebtTables() {
  await apiClient.from("debts").select("id").limit(1);
  await apiClient.from("debt_payments").select("id").limit(1);
}

export async function getDebts() {
  const response = await apiClient
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  return unwrap(response, []);
}

export async function createDebt(payload: DebtInput) {
  const response = await apiClient
    .from("debts")
    .insert({ ...payload, status: "active" })
    .select()
    .single();

  return unwrap(response, null);
}

export async function updateDebt(id: string, payload: DebtInput) {
  const response = await apiClient
    .from("debts")
    .update({ ...payload, status: "active" })
    .eq("id", id)
    .select()
    .single();

  return unwrap(response, null);
}

export async function deleteDebt(id: string) {
  const response = await apiClient.from("debts").delete().eq("id", id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function createDebtPayment(payload: DebtPaymentInput) {
  const response = await apiClient.from("debt_payments").insert(payload);
  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function getDebtPaymentsTotal(debtId: string) {
  const response = await apiClient
    .from("debt_payments")
    .select("amount")
    .eq("debt_id", debtId);

  if (response.error) {
    throw new Error(response.error.message);
  }

  const total = (response.data || []).reduce(
    (sum, item: { amount?: number }) => sum + Number(item.amount ?? 0),
    0,
  );

  return total;
}

export async function updateDebtStatus(
  id: string,
  status: "active" | "closed" | "defaulted",
) {
  const response = await apiClient.from("debts").update({ status }).eq("id", id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}
