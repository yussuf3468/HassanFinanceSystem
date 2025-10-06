# Database Setup Guide for Staff Activity Dashboard

## ⚠️ Important: Your staff activity dashboard shows "0 records" because the database needs to be set up properly.

## 🔧 Quick Fix Steps:

### Option 1: Manual SQL Execution (Recommended)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Open SQL Editor**: Click on "SQL Editor" in the left sidebar
3. **Run this SQL** to fix the admin access issue:

```sql
-- Allow admin users to view all profiles for staff monitoring
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;

CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
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