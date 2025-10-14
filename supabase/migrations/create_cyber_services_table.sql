-- Create cyber_services table
CREATE TABLE IF NOT EXISTS cyber_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on date for faster queries
CREATE INDEX IF NOT EXISTS idx_cyber_services_date ON cyber_services(date DESC);

-- Create index on created_at
CREATE INDEX IF NOT EXISTS idx_cyber_services_created_at ON cyber_services(created_at DESC);

-- Enable Row Level Security
ALTER TABLE cyber_services ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read cyber_services"
  ON cyber_services
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow all authenticated users to insert
CREATE POLICY "Allow authenticated users to insert cyber_services"
  ON cyber_services
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow all authenticated users to update
CREATE POLICY "Allow authenticated users to update cyber_services"
  ON cyber_services
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow all authenticated users to delete
CREATE POLICY "Allow authenticated users to delete cyber_services"
  ON cyber_services
  FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cyber_services_updated_at
  BEFORE UPDATE ON cyber_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
