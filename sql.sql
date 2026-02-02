-- supabase/schema.sql (additional)
-- Create profile trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
insert into public.profiles (id, email, created_at, updated_at)
values (
new.id,
new.email,
now(),
now()
);
return new;
end;

$$
;

-- Create trigger for new auth users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create RLS policies for profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
$$

-- Minimal fix for existing policies
DO $$ 
BEGIN
  -- Skip if policies already exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can view own profile'
  ) THEN
    RAISE NOTICE 'Policy already exists, skipping creation';
  ELSE
    CREATE POLICY "Users can view own profile"
      ON profiles FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    RAISE NOTICE 'Policy already exists, skipping creation';
  ELSE
    CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;