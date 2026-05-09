import type { ExpenseInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function getExpenses() {
  const response = await apiClient
    .from("expenses")
    .select("*, expense_categories(name)")
    .order("incurred_on", { ascending: false });

  return unwrap(response, []);
}

export async function getExpenseCategories() {
  const response = await apiClient
    .from("expense_categories")
    .select("id, name, description, created_at")
    .order("name", { ascending: true });

  return unwrap(response, []);
}

export async function seedExpenseCategories(names: string[]) {
  const defaults = names.map((name) => ({ name, description: null }));
  const response = await apiClient
    .from("expense_categories")
    .upsert(defaults, { onConflict: "name" });

  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function createExpense(payload: ExpenseInput) {
  const response = await apiClient.from("expenses").insert(payload).select().single();
  return unwrap(response, null);
}

export async function updateExpense(id: string, payload: ExpenseInput) {
  const response = await apiClient
    .from("expenses")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return unwrap(response, null);
}

export async function deleteExpense(id: string) {
  const response = await apiClient.from("expenses").delete().eq("id", id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}
