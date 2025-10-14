-- Create test profiles for Staff Activity Dashboard
-- This will populate the profiles table with sample data so you can see the dashboard working

-- First, let's see what auth.users exist (this will help us create matching profiles)
-- Note: You need to run this after the RLS fix

-- Method 1: If you want to see the dashboard working immediately with test data
-- Insert sample profiles (these will show up in the dashboard)

INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    created_at, 
    updated_at,
    last_login
) VALUES 
(
    gen_random_uuid(), 
    'yussuf.admin@dardaaranbookshop.ke', 
    'Yussuf Muse (Admin)', 
    'admin', 
    NOW() - INTERVAL '5 days', 
    NOW(),
    NOW() - INTERVAL '10 minutes'
),
(
    gen_random_uuid(), 
    'yussuf.staff@dardaaranbookshop.ke', 
    'Yussuf', 
    'staff', 
    NOW() - INTERVAL '3 days', 
    NOW(),
    NOW() - INTERVAL '2 hours'
),
(
    gen_random_uuid(), 
    'khaled.staff@dardaaranbookshop.ke', 
    'Khaled', 
    'staff', 
    NOW() - INTERVAL '1 day', 
    NOW(),
    NOW() - INTERVAL '30 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- Add some more realistic login times for testing
UPDATE public.profiles 
SET last_login = NOW() - INTERVAL '15 minutes'
WHERE email = 'yussuf.admin@dardaaranbookshop.ke';

UPDATE public.profiles 
SET last_login = NOW() - INTERVAL '3 hours'
WHERE email = 'zakaria.staff@dardaaranbookshop.ke';

UPDATE public.profiles 
SET last_login = NOW() - INTERVAL '45 minutes'
WHERE email = 'khaled.staff@dardaaranbookshop.ke';

-- Check if profiles were created successfully
SELECT 
    id,
    email, 
    full_name, 
    role, 
    last_login,
    created_at
FROM public.profiles
ORDER BY created_at DESC;