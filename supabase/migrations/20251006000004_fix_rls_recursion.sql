-- Fix infinite recursion in RLS policies for profiles table
-- The previous policy caused recursion by querying profiles table within a profiles policy

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create simple, non-recursive policies

-- Policy 1: Users can view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Admin users can view all profiles (using auth.jwt() to avoid recursion)
CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT 
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%admin%' 
    OR (auth.jwt() ->> 'email')::text LIKE '%yussuf%'
  );

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Policy 4: Admin users can update any profile
CREATE POLICY "Admin can update all profiles" ON public.profiles
  FOR UPDATE 
  USING (
    (auth.jwt() ->> 'email')::text LIKE '%admin%' 
    OR (auth.jwt() ->> 'email')::text LIKE '%yussuf%'
  );

-- Policy 5: Allow inserts for new user creation
CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);