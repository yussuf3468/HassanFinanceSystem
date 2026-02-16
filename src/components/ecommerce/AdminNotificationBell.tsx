import { useState, useEffect, useRef, memo } from "react";
import { Bell, Package, Check, Trash2 } from "lucide-react";
import { supabase } from "../../lib/supabase";
import compactToast from "../../utils/compactToast";
import Badge from "./Badge";
import Button from "./Button";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id?: string;
  reference_type?: string;
  data?: any;
  is_read: boolean;
  priority: "low" | "normal" | "high" | "urgent";
  created_at: string;
  read_at?: string;
}

interface AdminNotificationBellProps {
  className?: string;
}

const AdminNotificationBell = memo(
  ({ className = "" }: AdminNotificationBellProps) => {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await (supabase as any)
          .from("admin_notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;
        setNotifications((data || []) as AdminNotification[]);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    // Mark notification as read
    const markAsRead = async (id: string) => {
      try {
        const { error } = await (supabase as any)
          .from("admin_notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq("id", id);

        if (error) throw error;

        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === id
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif,
          ),
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
        compactToast.error("Failed to mark as read");
      }
    };

    // Mark all as read
    const markAllAsRead = async () => {
      try {
        const unreadIds = notifications
          .filter((n) => !n.is_read)
          .map((n) => n.id);
        if (unreadIds.length === 0) return;

        const { error } = await (supabase as any)
          .from("admin_notifications")
          .update({ is_read: true, read_at: new Date().toISOString() })
          .in("id", unreadIds);

        if (error) throw error;

        setNotifications((prev) =>
          prev.map((notif) => ({
            ...notif,
            is_read: true,
            read_at: new Date().toISOString(),
          })),
        );

        compactToast.success("All notifications marked as read");
      } catch (error) {
        console.error("Error marking all as read:", error);
        compactToast.error("Failed to mark all as read");
      }
    };

    // Delete notification
    const deleteNotification = async (id: string) => {
      try {
        const { error } = await (supabase as any)
          .from("admin_notifications")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        compactToast.success("Notification deleted");
      } catch (error) {
        console.error("Error deleting notification:", error);
        compactToast.error("Failed to delete notification");
      }
    };

    // Subscribe to real-time notifications
    useEffect(() => {
      fetchNotifications();

      const channel = supabase
        .channel("admin-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "admin_notifications",
          },
          (payload) => {
            const newNotification = payload.new as AdminNotification;
            setNotifications((prev) => [newNotification, ...prev]);

            // Play sound for high priority notifications
            if (
              newNotification.priority === "high" ||
              newNotification.priority === "urgent"
            ) {
              audioRef.current?.play().catch(console.error);
            }

            // Show browser notification if permission granted
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification(newNotification.title, {
                body: newNotification.message,
                icon: "/favicon.ico",
                tag: `admin-notif-${newNotification.id}`,
              });
            }
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

    // Click outside to close
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen]);

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "urgent":
          return "bg-red-500 text-white";
        case "high":
          return "bg-orange-500 text-white";
        case "normal":
          return "bg-blue-500 text-white";
        case "low":
          return "bg-gray-500 text-white";
        default:
          return "bg-gray-500 text-white";
      }
    };

    const getNotificationIcon = (type: string) => {
      switch (type) {
        case "new_order":
          return <Package className="w-5 h-5" />;
        default:
          return <Bell className="w-5 h-5" />;
      }
    };

    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };

    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* Hidden audio element for notification sound */}
        <audio
          ref={audioRef}
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWH0fPTgjMGHm7A7+OZUQ0PVa3m7alZFApCm9/wtWMdBjiP1vLNfC0GI3bG8N6RQgsUXLPo7KlYFQpBnN7yuWcdBjWG0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OYTw0PU63l7KlZFApCm9/wtWMdBjiP1vLOey0GI3bG8N+RQgsUXLPp7KlYFQo="
          preload="auto"
        />

        {/* Bell Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          {unreadCount > 0 && (
            <Badge
              variant="danger"
              className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Notifications {unreadCount > 0 && `(${unreadCount})`}
              </h3>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  <Check className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No notifications
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        !notification.is_read
                          ? "bg-blue-50 dark:bg-blue-900/10"
                          : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-full ${getPriorityColor(
                            notification.priority,
                          )} flex-shrink-0`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex-shrink-0"
                                aria-label="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>

                            <button
                              onClick={() =>
                                deleteNotification(notification.id)
                              }
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              aria-label="Delete notification"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

AdminNotificationBell.displayName = "AdminNotificationBell";

export default AdminNotificationBell;
