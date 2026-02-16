import { supabase } from "../lib/supabase";

/**
 * Send admin notification for new order
 * Uses multiple channels: Browser notification, Email (if configured)
 */
export async function notifyAdminNewOrder(order: any) {
  try {
    // 1. Browser Notification (if permission granted)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("🛍️ New Order Received!", {
        body: `Order #${order.order_number} - ${
          order.customer_name
        }\nTotal: KES ${order.total_amount.toLocaleString()}`,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: `order-${order.id}`,
        requireInteraction: true,
      });
    }

    // 2. Create admin notification record in database
    const { error: notificationError } = await (supabase as any)
      .from("admin_notifications")
      .insert([
        {
          type: "new_order",
          title: "New Order Received",
          message: `Order #${order.order_number} from ${order.customer_name}`,
          reference_id: order.id,
          reference_type: "order",
          data: {
            order_number: order.order_number,
            customer_name: order.customer_name,
            customer_phone: order.customer_phone,
            total_amount: order.total_amount,
            payment_method: order.payment_method,
          },
          is_read: false,
          priority: "high",
        },
      ]);

    if (notificationError) {
      console.error("Failed to create admin notification:", notificationError);
    }

    // 3. Send WhatsApp notification (if configured)
    await sendWhatsAppNotification(order);

    // 4. Play notification sound
    playNotificationSound();
  } catch (error) {
    console.error("Error sending admin notification:", error);
  }
}

/**
 * Send WhatsApp notification - Opens WhatsApp Web with pre-filled message
 * Admin just needs to click "Send"
 */
async function sendWhatsAppNotification(order: any) {
  try {
    const adminPhone = "254722979547"; // Admin WhatsApp number
    const message =
      `🛍️ *NEW ORDER RECEIVED*\n\n` +
      `Order #: *${order.order_number}*\n` +
      `Customer: ${order.customer_name}\n` +
      `Phone: ${order.customer_phone}\n` +
      `Address: ${order.delivery_address}\n` +
      `Total: *KES ${order.total_amount.toLocaleString()}*\n` +
      `Payment: ${order.payment_method.toUpperCase()}\n\n` +
      `📱 Call customer: https://wa.me/${order.customer_phone.replace(
        /[^0-9]/g,
        "",
      )}\n` +
      `🔗 View order in admin panel`;

    // Auto-open WhatsApp Web with pre-filled message for admin to send
    // This opens in a new window so admin can send with one click
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(
      message,
    )}`;

    // Open in new window/tab
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    // Also store for reference
    localStorage.setItem(
      `whatsapp-order-${order.id}`,
      JSON.stringify({
        phone: adminPhone,
        message,
        sent_at: new Date().toISOString(),
      }),
    );

    console.log(`WhatsApp notification opened for order ${order.order_number}`);
  } catch (error) {
    console.error("WhatsApp notification error:", error);
  }
}

/**
 * Play notification sound
 */
function playNotificationSound() {
  try {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjWH0fPTgjMGHm7A7+OZUQ0PVa3m7alZFApCm9/wtWMdBjiP1vLNfC0GI3bG8N6RQgsUXLPo7KlYFQpBnN7yuWcdBjWG0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OZUQ0PU63m7apZFApCm9/wtWMdBjiP1vLOey0GI3bG8N6RQgsUXLPp7KlYFQpBnN7yuWcdBjWF0PPTgzQGHW3A7+OYTw0PU63l7KlZFApCm9/wtWMdBjiP1vLOey0GI3bG8N+RQgsUXLPp7KlYFQo=",
    );
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Ignore if audio play fails (user interaction required)
    });
  } catch (error) {
    console.error("Notification sound error:", error);
  }
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
}

/**
 * Get admin phone number for WhatsApp
 */
export function getAdminWhatsAppNumber() {
  return "254722979547"; // Remove + and spaces
}

/**
 * Format WhatsApp link
 */
export function getWhatsAppLink(phone: string, message?: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encodedMessage = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleanPhone}${encodedMessage}`;
}

/**
 * Send order notification to customer via WhatsApp
 */
export function getCustomerWhatsAppMessage(order: any) {
  return (
    `Hi ${order.customer_name}! 👋\n\n` +
    `Thank you for your order #${order.order_number}!\n\n` +
    `📦 Order Details:\n` +
    `Total: KES ${order.total_amount.toLocaleString()}\n` +
    `Delivery: ${order.delivery_address}\n` +
    `Payment: ${order.payment_method.toUpperCase()}\n\n` +
    `We'll contact you shortly to confirm your order.\n\n` +
    `Best regards,\n` +
    `Horumar Team 🛍️`
  );
}
