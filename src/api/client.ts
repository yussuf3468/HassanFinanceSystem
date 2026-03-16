import { supabaseClient } from "../lib/supabaseClient";

export function unwrap<T>(
  response: { data: T | null; error: { message: string } | null },
  fallback: T,
): T {
  if (response.error) {
    throw new Error(response.error.message);
  }
  return (response.data ?? fallback) as T;
}

export { supabaseClient as apiClient };
