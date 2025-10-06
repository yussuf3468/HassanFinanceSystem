-- Fix RLS policies to allow admin users to view all profiles for staff monitoring
-- This is required for the UserActivityDashboard to work

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policies that allow:
-- 1. Users to view their own profile
-- 2. Admin users to view all profiles (for staff monitoring)

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Admin users can view all profiles (for staff activity monitoring)
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Update the function to handle authentication better
-- Make sure the trigger function creates profiles for actual authenticated users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, last_login)
  VALUES (
    new.id,
    new.email,
    CASE 
      WHEN new.email LIKE '%admin%' OR new.email LIKE '%yussuf%' THEN 'Yussuf Muse (Admin)'
      WHEN new.email LIKE '%zakaria%' THEN 'Zakaria'
      WHEN new.email LIKE '%khaled%' THEN 'Khaled'
      ELSE COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
    END,
    CASE 
      WHEN new.email LIKE '%admin%' OR new.email LIKE '%yussuf%' THEN 'admin'
      ELSE 'staff'
    END,
    NOW()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();