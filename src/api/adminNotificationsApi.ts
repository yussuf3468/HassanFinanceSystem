import { apiClient, unwrap } from "./client";

export type AdminNotificationRecord = {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  data?: unknown;
  is_read: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  read_at?: string;
};

export async function getAdminNotifications(limit = 20) {
  const response = await (apiClient as any)
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return unwrap(response, [] as AdminNotificationRecord[]);
}

export async function createAdminNotification(payload: {
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  data?: unknown;
  is_read?: boolean;
  priority?: "low" | "normal" | "high" | "urgent";
}) {
  const { error } = await (apiClient as any)
    .from("admin_notifications")
    .insert([
      {
        ...payload,
        is_read: payload.is_read ?? false,
        priority: payload.priority ?? "normal",
      },
    ]);

  if (error) throw new Error(error.message);
}

export async function markAdminNotificationAsRead(id: string) {
  const { error } = await (apiClient as any)
    .from("admin_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function markAllAdminNotificationsAsRead(ids: string[]) {
  if (ids.length === 0) return;

  const { error } = await (apiClient as any)
    .from("admin_notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", ids);

  if (error) throw new Error(error.message);
}

export async function deleteAdminNotification(id: string) {
  const { error } = await (apiClient as any)
    .from("admin_notifications")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export function subscribeToAdminNotifications(
  onInsert: (notification: AdminNotificationRecord) => void,
) {
  return apiClient
    .channel("admin-notifications")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "admin_notifications",
      },
      (payload) => {
        onInsert(payload.new as AdminNotificationRecord);
      },
    )
    .subscribe();
}

export function unsubscribeChannel(channel: ReturnType<typeof apiClient.channel>) {
  apiClient.removeChannel(channel);
}
