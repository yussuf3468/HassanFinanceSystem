-- Manual staff account creation for Hassan Muse BookShop
-- This migration manually inserts staff profiles into the database
-- Note: In production, these would be created through the auth system

-- Insert admin profile
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at
) VALUES (
    'admin-temp-id-001', 
    'yussuf.admin@dardaaranbookshop.ke', 
    'Yussuf Muse (Admin)', 
    'admin', 
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Zakaria staff profile
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at
) VALUES (
    'staff-temp-id-002', 
    'zakaria.staff@dardaaranbookshop.ke', 
    'Zakaria', 
    'staff', 
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert Khaled staff profile
INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at
) VALUES (
    'staff-temp-id-003', 
    'khaled.staff@dardaaranbookshop.ke', 
    'Khaled', 
    'staff', 
    NOW(), 
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add some sample login activity for testing
UPDATE public.profiles 
SET last_login = NOW() - INTERVAL '2 hours'
WHERE email = 'zakaria.staff@dardaaranbookshop.ke';

UPDATE public.profiles 
SET last_login = NOW() - INTERVAL '30 minutes'
WHERE email = 'khaled.staff@dardaaranbookshop.ke';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);