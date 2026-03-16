import type { ReturnInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function getReturns() {
  const response = await (apiClient as any)
    .from("returns")
    .select("*")
    .order("return_date", { ascending: false });
  return unwrap(response, []);
}

export async function getReturnById(id: string) {
  const response = await (apiClient as any)
    .from("returns")
    .select("*")
    .eq("id", id)
    .single();
  return unwrap(response, null);
}

export async function createReturn(payload: ReturnInput) {
  const response = await (apiClient as any)
    .from("returns")
    .insert(payload)
    .select()
    .single();
  return unwrap(response, null);
}

export async function deleteReturn(id: string) {
  const response = await (apiClient as any).from("returns").delete().eq("id", id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}
