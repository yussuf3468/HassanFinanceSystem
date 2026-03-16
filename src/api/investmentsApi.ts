import type { InvestmentInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function getInitialInvestments() {
  const response = await apiClient
    .from("initial_investments")
    .select("*")
    .order("invested_on", { ascending: false });

  return unwrap(response, []);
}

export async function createInitialInvestment(payload: InvestmentInput) {
  const response = await apiClient
    .from("initial_investments")
    .insert(payload)
    .select()
    .single();
  return unwrap(response, null);
}

export async function updateInitialInvestment(id: string, payload: InvestmentInput) {
  const response = await apiClient
    .from("initial_investments")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  return unwrap(response, null);
}

export async function deleteInitialInvestment(id: string) {
  const response = await apiClient.from("initial_investments").delete().eq("id", id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}
