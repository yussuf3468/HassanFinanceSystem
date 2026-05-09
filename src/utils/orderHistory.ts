import { supabase } from "../lib/supabase";
import type { OrderHistoryEntry, OrderStatus } from "../types";

const ORDER_HISTORY_TABLE = "order_history";

const localStorageKey = (orderId: string) => `order-history-${orderId}`;

type FetchHistoryOptions = {
  customerVisibleOnly?: boolean;
};

type AppendHistoryPayload = {
  orderId: string;
  status: OrderStatus;
  title: string;
  note?: string;
  actorName?: string;
  actorEmail?: string;
  visibleToCustomer?: boolean;
  metadata?: Record<string, unknown> | null;
};

function readLocalHistory(orderId: string): OrderHistoryEntry[] {
  try {
    const raw = localStorage.getItem(localStorageKey(orderId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as OrderHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(orderId: string, entries: OrderHistoryEntry[]) {
  localStorage.setItem(localStorageKey(orderId), JSON.stringify(entries));
}

function normalizeHistoryEntries(
  rows: any[] | null | undefined,
  options?: FetchHistoryOptions,
): OrderHistoryEntry[] {
  const next = (rows ?? []).map((row) => ({
    id: String(row.id),
    order_id: String(row.order_id),
    status: row.status as OrderStatus,
    title: String(row.title ?? "Order update"),
    note: row.note ?? null,
    actor_name: row.actor_name ?? null,
    actor_email: row.actor_email ?? null,
    visible_to_customer: Boolean(row.visible_to_customer ?? true),
    created_at: String(row.created_at ?? new Date().toISOString()),
    metadata: row.metadata ?? null,
  }));

  const filtered = options?.customerVisibleOnly
    ? next.filter((entry) => entry.visible_to_customer)
    : next;

  return filtered.sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
}

export async function fetchOrderHistory(
  orderId: string,
  options?: FetchHistoryOptions,
): Promise<OrderHistoryEntry[]> {
  try {
    let query = (supabase as any)
      .from(ORDER_HISTORY_TABLE)
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (options?.customerVisibleOnly) {
      query = query.eq("visible_to_customer", true);
    }

    const { data, error } = await query;
    if (error) throw error;

    const normalized = normalizeHistoryEntries(data, options);

    if (normalized.length > 0) {
      writeLocalHistory(orderId, normalized);
      return normalized;
    }

    return normalizeHistoryEntries(readLocalHistory(orderId), options);
  } catch {
    return normalizeHistoryEntries(readLocalHistory(orderId), options);
  }
}

export async function appendOrderHistoryEntry(
  payload: AppendHistoryPayload,
): Promise<OrderHistoryEntry> {
  const entry: OrderHistoryEntry = {
    id: crypto.randomUUID(),
    order_id: payload.orderId,
    status: payload.status,
    title: payload.title,
    note: payload.note ?? null,
    actor_name: payload.actorName ?? null,
    actor_email: payload.actorEmail ?? null,
    visible_to_customer: payload.visibleToCustomer ?? true,
    created_at: new Date().toISOString(),
    metadata: payload.metadata ?? null,
  };

  try {
    const { data, error } = await (supabase as any)
      .from(ORDER_HISTORY_TABLE)
      .insert({
        order_id: entry.order_id,
        status: entry.status,
        title: entry.title,
        note: entry.note,
        actor_name: entry.actor_name,
        actor_email: entry.actor_email,
        visible_to_customer: entry.visible_to_customer,
        created_at: entry.created_at,
        metadata: entry.metadata,
      })
      .select("*")
      .single();

    if (error) throw error;

    const saved = normalizeHistoryEntries([data])[0] ?? entry;

    const existing = readLocalHistory(payload.orderId);
    writeLocalHistory(payload.orderId, [...existing, saved]);
    return saved;
  } catch {
    const existing = readLocalHistory(payload.orderId);
    writeLocalHistory(payload.orderId, [...existing, entry]);
    return entry;
  }
}
