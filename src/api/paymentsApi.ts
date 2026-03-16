import type { PaymentConfirmationInput } from "../types/domain";
import { apiClient, unwrap } from "./client";

export async function submitPaymentConfirmation(payload: PaymentConfirmationInput) {
  const response = await apiClient
    .from("payment_confirmations")
    .insert(payload)
    .select()
    .single();

  return unwrap(response, null);
}
