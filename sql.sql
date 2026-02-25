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

-- check_expired_goals
create or replace function check_expired_goals()
returns void
language plpgsql
security definer
as $$
declare
expired_goal record;
penalty_record_id uuid;
begin
-- Find active goals that have passed their deadline
for expired_goal in
select
g.*,
p.stripe_customer_id,
case
when g.recurrence = 'daily' then 1
when g.recurrence = 'weekly' then 7
when g.recurrence = 'monthly' then 30
else 0
end as days_overdue
from goals g
join profiles p on g.user_id = p.id
where g.status = 'active'
and g.target_date < now()
and g.stripe_subscription_id is not null
loop
-- Mark goal as failed
update goals
set status = 'failed',
updated_at = now()
where id = expired_goal.id;

    -- Create penalty charge record
    insert into penalty_charges (
      goal_id,
      user_id,
      amount,
      currency,
      status,
      due_date,
      reason
    ) values (
      expired_goal.id,
      expired_goal.user_id,
      expired_goal.penalty_amount,
      expired_goal.currency,
      'pending',
      now(),
      'Goal deadline missed'
    )
    returning id into penalty_record_id;

    -- Log for webhook processing
    raise notice 'Goal % failed, penalty charge % created',
      expired_goal.id,
      penalty_record_id;

end loop;
end;
$$
