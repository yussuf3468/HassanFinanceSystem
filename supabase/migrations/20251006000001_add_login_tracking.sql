-- Add last_login tracking to profiles table
-- This will help track when each staff member last logged in

-- Add last_login column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Create a function to update last_login when user signs in
CREATE OR REPLACE FUNCTION public.update_last_login(user_id UUID, login_time TIMESTAMPTZ)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    last_login = login_time,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for better performance on last_login queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_last_login(UUID, TIMESTAMPTZ) TO authenticated;