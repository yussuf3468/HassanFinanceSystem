-- Create admin_notifications table for real-time order alerts
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- 'new_order', 'low_stock', 'customer_message', etc.
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID, -- Order ID, Product ID, etc.
  reference_type VARCHAR(50), -- 'order', 'product', 'customer', etc.
  data JSONB, -- Additional notification data
  is_read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON admin_notifications(priority);

-- Enable Row Level Security
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin only)
CREATE POLICY "Allow authenticated users to view notifications"
  ON admin_notifications
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to update notifications"
  ON admin_notifications
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to insert notifications"
  ON admin_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete notifications"
  ON admin_notifications
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to auto-delete old read notifications (older than 30 days)
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM admin_notifications
  WHERE is_read = TRUE
    AND read_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up old notifications
CREATE TRIGGER trigger_delete_old_notifications
  AFTER INSERT ON admin_notifications
  EXECUTE FUNCTION delete_old_notifications();

-- Grant permissions
GRANT ALL ON admin_notifications TO authenticated;
GRANT ALL ON admin_notifications TO service_role;

COMMENT ON TABLE admin_notifications IS 'Stores notifications for admin users about orders, stock, and other important events';
COMMENT ON COLUMN admin_notifications.type IS 'Type of notification: new_order, low_stock, customer_message, etc.';
COMMENT ON COLUMN admin_notifications.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN admin_notifications.data IS 'Additional JSON data related to the notification';
