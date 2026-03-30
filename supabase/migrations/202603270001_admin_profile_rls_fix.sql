-- Fix admin profile access without recursive RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

DO $$
BEGIN
  -- Drop the recursive admin policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Admins can view all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Admins can view all profiles" ON profiles';
  END IF;

  -- Ensure the select policy allows admins without recursion
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can view own profile'
  ) THEN
    ALTER POLICY "Users can view own profile"
      ON profiles
      USING (auth.uid() = id OR public.is_admin());
  ELSE
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id OR public.is_admin());
  END IF;
END $$;
