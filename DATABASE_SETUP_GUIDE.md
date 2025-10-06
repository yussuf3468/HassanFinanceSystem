# Database Setup Guide for Staff Activity Dashboard

## ✅ Recursion Error Fixed! Now showing 0 records because no profiles exist yet.

## 🎯 Current Issue: Dashboard shows "0 records" - Need to create profile data

## 🔧 Quick Fix Steps:

### Option 1: Add Test Profile Data (Immediate Fix)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Open SQL Editor**: Click on "SQL Editor" in the left sidebar
3. **Run this SQL** to create test profiles:

```sql
-- Create test profiles for Staff Activity Dashboard
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
    'zakaria.staff@dardaaranbookshop.ke',
    'Zakaria',
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

-- Check if profiles were created
SELECT email, full_name, role, last_login FROM public.profiles;
```

### Option 2: Fix RLS Policies (If Not Done Yet)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Open SQL Editor**: Click on "SQL Editor" in the left sidebar
3. **Run this SQL** to fix the infinite recursion error:

```sql
-- Fix infinite recursion in RLS policies for profiles table
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create simple, non-recursive policies
-- Policy 1: Users can view their own profile
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

-- Policy 4: Allow inserts for new user creation
CREATE POLICY "Allow profile creation" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

4. **Check if you have any profiles**: Run this query to see current profiles:

```sql
SELECT id, email, full_name, role, last_login, created_at
FROM public.profiles;
```

### Option 2: If No Profiles Exist

If the above query returns 0 rows, you need to create user profiles. This happens when users sign up through the authentication system.

**The profiles are automatically created when users login through your app!**

### 🧪 Test the Fix:

1. **Login as admin** on your deployed app
2. **Go to Staff Activity tab**
3. **You should now see**:
   - Admin profile (yourself)
   - Any other users who have logged in

### 📋 Why This Happened:

- **RLS (Row Level Security)** was preventing admin from seeing other profiles
- **No profiles existed** because users hadn't logged in yet
- **The trigger creates profiles automatically** when users sign up/login

### 🚀 Next Steps:

1. **Run the SQL fix above**
2. **Have your staff login once** (this creates their profiles)
3. **Check the dashboard again** - you should see activity data

### 📞 If Still Not Working:

Share the output of this query from your Supabase SQL Editor:

```sql
-- Debug query to check current state
SELECT
  'profiles_count' as check_type,
  COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT
  'auth_users_count' as check_type,
  COUNT(*) as count
FROM auth.users;
```

This will help us identify if the issue is with profiles creation or RLS policies.

---

**Quick Summary**: Run the SQL policy fix in Supabase Dashboard, then have staff login once to create their profiles. The dashboard will then show their activity! 🎉
