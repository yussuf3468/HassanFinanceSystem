import type { CyberServiceInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function getCyberServices() {
  const response = await apiClient
    .from("cyber_services" as any)
    .select("*")
    .order("date", { ascending: false });

  return unwrap(response, []);
}

export async function createCyberService(payload: CyberServiceInput) {
  const response = await apiClient
    .from("cyber_services" as any)
    .insert(payload)
    .select()
    .single();

  return unwrap(response, null);
}

export async function updateCyberService(id: string, payload: CyberServiceInput) {
  const response = await apiClient
    .from("cyber_services" as any)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  return unwrap(response, null);
}

export async function deleteCyberService(id: string) {
  const response = await apiClient.from("cyber_services" as any).delete().eq("id", id);
  if (response.error) {
    throw new Error(response.error.message);
  }
}
