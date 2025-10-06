-- Enable RLS (Row Level Security) for authentication
-- This ensures data security based on user access

-- Create a function to set up staff accounts
-- Note: This is for development/setup only
-- In production, use Supabase Dashboard or Admin API

-- Staff accounts to create:
-- Admin account for system administrator
-- Staff accounts for bookshop employees

-- Create profiles table to store additional user information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email LIKE '%admin%' OR new.email LIKE '%yussuf%' THEN 'Yussuf Muse (Admin)'
      WHEN new.email LIKE '%zakaria%' THEN 'Zakaria'
      WHEN new.email LIKE '%khaled%' THEN 'Khaled'
      ELSE split_part(new.email, '@', 1)
    END,
    CASE 
      WHEN new.email LIKE '%admin%' OR new.email LIKE '%yussuf%' THEN 'admin'
      ELSE 'staff'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Add RLS policies for products and sales tables to ensure only authenticated users can access
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view all products
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert products
CREATE POLICY "Authenticated users can insert products" ON public.products
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update products
CREATE POLICY "Authenticated users can update products" ON public.products
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete products
CREATE POLICY "Authenticated users can delete products" ON public.products
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can view all sales
CREATE POLICY "Authenticated users can view sales" ON public.sales
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can insert sales
CREATE POLICY "Authenticated users can insert sales" ON public.sales
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Authenticated users can update sales
CREATE POLICY "Authenticated users can update sales" ON public.sales
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy: Authenticated users can delete sales
CREATE POLICY "Authenticated users can delete sales" ON public.sales
  FOR DELETE USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.sales TO authenticated;
GRANT ALL ON public.profiles TO authenticated;