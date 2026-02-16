# WhatsApp & Admin Notification System Setup Guide

## 🚀 Overview

This guide explains the new WhatsApp integration and admin notification system added to Horumar.

## ✅ Features Implemented

### 1. WhatsApp Integration

- **Customer Contact**: Direct WhatsApp link on phone number in footer
- **One-Click Messaging**: Customers can message you directly on WhatsApp
- **Order Notifications**: Automatic WhatsApp message templates for new orders

### 2. Admin Notification System

- **Real-Time Alerts**: Instant notifications when customers place orders
- **Multiple Channels**:
  - Browser notifications (desktop/mobile)
  - In-app notification bell with badge counter
  - Database notification history
  - Audio alert for high-priority notifications
- **Notification Bell Component**:
  - Shows unread count
  - Real-time updates via Supabase
  - Mark as read/delete functionality
  - Priority-based color coding

## 📋 Setup Instructions

### Step 1: Database Setup

Run the SQL script to create the admin notifications table:

```bash
# In Supabase Dashboard, go to SQL Editor and run:
```

```sql
-- File: create-admin-notifications-table.sql
-- This creates the admin_notifications table with RLS policies
```

**Or copy the contents of** `create-admin-notifications-table.sql` **into Supabase SQL Editor and execute.**

### Step 2: Enable Browser Notifications

1. **Desktop Browsers** (Chrome, Firefox, Edge):

   - When you first checkout an order, the browser will ask for notification permission
   - Click "Allow" to enable desktop notifications
   - Notifications will appear even when the tab is not active

2. **Mobile Browsers** (Android Chrome, iOS Safari):
   - Android Chrome: Same as desktop, click "Allow" when prompted
   - iOS Safari: Add the site to home screen first, then notifications work

### Step 3: Add Notification Bell to Admin Panel

In your admin layout/header component, add the notification bell:

```tsx
import AdminNotificationBell from "../components/ecommerce/AdminNotificationBell";

// Inside your admin header/navigation component:
<div className="flex items-center gap-4">
  <AdminNotificationBell />
  {/* Other admin header items */}
</div>;
```

**Example integration in admin navbar:**

```tsx
// src/components/AdminNavbar.tsx or similar
import { User, LogOut } from "lucide-react";
import AdminNotificationBell from "./ecommerce/AdminNotificationBell";

export default function AdminNavbar() {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard</h1>

        <div className="flex items-center gap-4">
          {/* Notification Bell */}
          <AdminNotificationBell />

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <span>Admin</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### Step 4: Test the System

1. **Test Order Creation**:

   - Go to storefront
   - Add items to cart
   - Complete checkout
   - Verify:
     - ✅ Browser notification appears (if permission granted)
     - ✅ Notification bell shows badge with unread count
     - ✅ Audio alert plays (for high-priority notifications)
     - ✅ Notification appears in notification dropdown

2. **Test WhatsApp Link**:
   - Go to storefront footer
   - Click on phone number "+254 722 979 547"
   - Verify:
     - ✅ Opens WhatsApp Web/App
     - ✅ Phone number is pre-filled
     - ✅ Ready to send message

## 🔧 Configuration

### Customize Admin Phone Number

**File:** `src/utils/adminNotifications.ts`

```typescript
// Line 71: Change admin WhatsApp number
export function getAdminWhatsAppNumber() {
  return "254722979547"; // Change this to your number (without + or spaces)
}
```

### Customize Notification Messages

**File:** `src/utils/adminNotifications.ts`

Edit the `sendWhatsAppNotification()` function to customize the message template:

```typescript
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
```

### Adjust Notification Sound

**File:** `src/utils/adminNotifications.ts`

Change the audio alert volume or sound:

```typescript
// Line 94: Adjust volume (0.0 to 1.0)
audio.volume = 0.5; // 50% volume

// To use a custom sound, replace the base64 data with your own audio file URL:
const audio = new Audio("/path/to/your/notification-sound.mp3");
```

## 📱 WhatsApp Features

### 1. Footer Contact Link

**Location:** [StorefrontFooter.tsx](src/components/ecommerce/StorefrontFooter.tsx#L171-L185)

The phone number in the footer is now a direct WhatsApp link with:

- ✅ 44px minimum touch target (mobile-friendly)
- ✅ Green "WhatsApp" badge
- ✅ Opens in new tab
- ✅ Hover effect for better UX

### 2. Customer Order Confirmation

After order is placed, customers can contact you via WhatsApp instantly. The system provides:

```typescript
// Helper function to send customer order confirmation
import {
  getCustomerWhatsAppMessage,
  getWhatsAppLink,
} from "../utils/adminNotifications";

// Usage:
const message = getCustomerWhatsAppMessage(order);
const link = getWhatsAppLink(order.customer_phone, message);
// Use this link in email confirmations or order confirmation page
```

## 🔔 Notification System Details

### Notification Types

The system supports multiple notification types:

```typescript
type NotificationType =
  | "new_order" // New customer order placed
  | "low_stock" // Product stock running low
  | "customer_message"; // Customer sent a message
// Add custom types as needed
```

### Priority Levels

Notifications have 4 priority levels:

- **Urgent** 🔴: Critical alerts (payment failures, system errors)
- **High** 🟠: Important alerts (new orders, stock issues)
- **Normal** 🔵: Regular notifications (order updates)
- **Low** ⚪: Informational (customer viewed product)

### Real-Time Updates

The notification system uses **Supabase Real-Time** to push notifications instantly:

```typescript
// Automatically subscribes to new notifications
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
      // New notification received
      // Plays sound, shows browser notification, updates UI
    },
  )
  .subscribe();
```

### Notification Auto-Cleanup

Old read notifications are automatically deleted after **30 days** to keep the database clean.

**Customize retention period in SQL:**

```sql
-- File: create-admin-notifications-table.sql (Line 57)
WHERE is_read = TRUE
  AND read_at < NOW() - INTERVAL '30 days'; -- Change this interval
```

## 🎨 UI Customization

### Notification Bell Position

```tsx
// Default: Right side of admin header
<AdminNotificationBell className="ml-auto" />

// Left side:
<AdminNotificationBell className="mr-auto" />

// Custom position:
<AdminNotificationBell className="absolute top-4 right-4" />
```

### Notification Bell Colors

**File:** `src/components/ecommerce/AdminNotificationBell.tsx`

```typescript
// Line 189: Change priority colors
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-500 text-white"; // Change red-500 to your color
    case "high":
      return "bg-orange-500 text-white"; // Change orange-500
    case "normal":
      return "bg-blue-500 text-white"; // Change blue-500
    case "low":
      return "bg-gray-500 text-white"; // Change gray-500
  }
};
```

## 🛠️ Troubleshooting

### Browser Notifications Not Showing

1. **Check Permission**:

   - Chrome: Settings → Privacy and security → Site Settings → Notifications
   - Firefox: Settings → Privacy & Security → Permissions → Notifications
   - Ensure your site is allowed

2. **Check Browser Support**:

   ```javascript
   if ("Notification" in window) {
     console.log("Notifications supported");
     console.log("Permission:", Notification.permission);
   } else {
     console.log("Notifications NOT supported");
   }
   ```

3. **HTTPS Required**: Browser notifications only work on HTTPS sites (or localhost)

### WhatsApp Link Not Working

1. **Phone Number Format**:

   - ✅ Correct: `254722979547` (no +, spaces, or dashes)
   - ❌ Wrong: `+254 722 979 547` or `254-722-979-547`

2. **WhatsApp Not Installed**:
   - Desktop: Opens WhatsApp Web
   - Mobile: Should open WhatsApp app if installed, otherwise opens WhatsApp Web

### Notifications Not Saving to Database

1. **Check Supabase Connection**:

   ```typescript
   const { data, error } = await supabase
     .from("admin_notifications")
     .select("*")
     .limit(1);

   if (error) {
     console.error("Database error:", error);
   }
   ```

2. **Verify Table Exists**:

   - Go to Supabase Dashboard → Table Editor
   - Check if `admin_notifications` table exists
   - Verify RLS policies are enabled

3. **Check Console Errors**:
   - Open browser DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

## 📊 Notification Analytics

To track notification performance:

```sql
-- Count notifications by type
SELECT type, COUNT(*) as count
FROM admin_notifications
GROUP BY type
ORDER BY count DESC;

-- Unread notification count
SELECT COUNT(*) as unread_count
FROM admin_notifications
WHERE is_read = FALSE;

-- Notifications in last 24 hours
SELECT *
FROM admin_notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Average response time (time to mark as read)
SELECT
  AVG(EXTRACT(EPOCH FROM (read_at - created_at))) / 60 as avg_response_minutes
FROM admin_notifications
WHERE read_at IS NOT NULL;
```

## 🔐 Security Considerations

### RLS Policies

All admin notifications are protected by Row Level Security:

```sql
-- Only authenticated users can access notifications
CREATE POLICY "Allow authenticated users to view notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (true);
```

**To restrict to specific admin users:**

```sql
-- Only allow users with admin role
CREATE POLICY "Allow admin users only"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE staff_users.user_id = auth.uid()
      AND staff_users.role = 'admin'
    )
  );
```

### Phone Number Privacy

- Customer phone numbers are stored securely in orders table
- WhatsApp links only work when clicked (not publicly visible)
- Consider adding phone number masking in UI: `+254 *** *** 547`

## 🚀 Future Enhancements

### Email Notifications

Add email alerts for orders:

```typescript
// src/utils/adminNotifications.ts
async function sendEmailNotification(order: any) {
  // Use SendGrid, Resend, or Supabase Edge Functions
  const response = await fetch("/api/send-email", {
    method: "POST",
    body: JSON.stringify({
      to: "admin@horumar.com",
      subject: `New Order #${order.order_number}`,
      html: `<h1>New Order from ${order.customer_name}</h1>...`,
    }),
  });
}
```

### SMS Notifications

Integrate SMS via Twilio or Africa's Talking:

```typescript
async function sendSMSNotification(order: any) {
  const response = await fetch("/api/send-sms", {
    method: "POST",
    body: JSON.stringify({
      to: "+254722979547",
      message: `New order #${order.order_number} - KES ${order.total_amount}`,
    }),
  });
}
```

### WhatsApp Business API

For automated WhatsApp messages (requires WhatsApp Business Account):

```typescript
// Requires WhatsApp Business API access
async function sendWhatsAppBusinessMessage(order: any) {
  const response = await fetch(
    "https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: order.customer_phone,
        type: "template",
        template: {
          name: "order_confirmation",
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: order.order_number },
                { type: "text", text: order.total_amount.toString() },
              ],
            },
          ],
        },
      }),
    },
  );
}
```

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Verify Supabase connection
3. Test notification permissions
4. Review SQL table structure

## 📝 Summary

✅ **WhatsApp Integration**: One-click customer contact via footer phone link  
✅ **Browser Notifications**: Real-time desktop/mobile alerts  
✅ **Notification Bell**: In-app notification center with badge counter  
✅ **Database Storage**: Persistent notification history with auto-cleanup  
✅ **Real-Time Updates**: Instant push notifications via Supabase  
✅ **Audio Alerts**: Sound notification for high-priority events  
✅ **Mobile-Friendly**: 44px touch targets, responsive design

Your admin panel now has a professional notification system! 🎉
