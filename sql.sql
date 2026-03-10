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
-- supabase/storage-policies.sql
-- Enable storage and create buckets
insert into storage.buckets (id, name, public)
values 
  ('proof-images', 'proof-images', true),
  ('proof-files', 'proof-files', true),
  ('user-uploads', 'user-uploads', false);

-- Row Level Security for storage.objects
create policy "Users can upload their own proof files"
on storage.objects for insert
with check (
  bucket_id in ('proof-images', 'proof-files', 'user-uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own proof files"
on storage.objects for select
using (
  bucket_id in ('proof-images', 'proof-files', 'user-uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own proof files"
on storage.objects for update
using (
  bucket_id in ('proof-images', 'proof-files', 'user-uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own proof files"
on storage.objects for delete
using (
  bucket_id in ('proof-images', 'proof-files', 'user-uploads') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Function to generate secure file paths
create or replace function generate_proof_file_path(
  user_id uuid,
  goal_id uuid,
  file_name text,
  file_type text
)
returns text
language plpgsql
security definer
as $$
declare
  file_ext text;
  timestamp_str text;
  random_str text;
  final_path text;
begin
  -- Extract file extension
  file_ext := split_part(file_name, '.', -1);
  
  -- Generate timestamp and random string for uniqueness
  timestamp_str := to_char(now(), 'YYYYMMDD_HH24MISS');
  random_str := substr(md5(random()::text), 1, 8);
  
  -- Determine bucket based on file type
  if file_type ilike 'image/%' then
    final_path := format('%s/%s_%s_%s.%s', 
      user_id, goal_id, timestamp_str, random_str, file_ext);
  else
    final_path := format('%s/%s_%s_%s.%s', 
      user_id, goal_id, timestamp_str, random_str, file_ext);
  end if;
  
  return final_path;
end;
$$;
-- supabase/functions/check-recurring-proofs.sql
create or replace function check_recurring_proofs()
returns table (
  goal_id uuid,
  user_id uuid,
  last_checkin_date timestamptz,
  next_checkin_date timestamptz,
  penalty_amount integer,
  status text
)
language plpgsql
security definer
as $$
begin
  return query
  with recurring_goals as (
    select 
      g.id as goal_id,
      g.user_id,
      g.penalty_amount,
      g.recurrence,
      g.frequency,
      max(gc.due_at) as last_checkin_date,
      case 
        when g.recurrence = 'daily' then max(gc.due_at) + interval '1 day' * g.frequency
        when g.recurrence = 'weekly' then max(gc.due_at) + interval '1 week' * g.frequency
        when g.recurrence = 'monthly' then max(gc.due_at) + interval '1 month' * g.frequency
        else null
      end as next_checkin_date
    from goals g
    left join goal_checkins gc on g.id = gc.goal_id
    where g.status = 'active'
      and g.recurrence != 'none'
      and g.proof_required = true
    group by g.id, g.user_id, g.penalty_amount, g.recurrence, g.frequency
  ),
  missing_proofs as (
    select 
      rg.goal_id,
      rg.user_id,
      rg.last_checkin_date,
      rg.next_checkin_date,
      rg.penalty_amount,
      case 
        when rg.next_checkin_date < now() then 'overdue'
        when rg.next_checkin_date <= now() + interval '24 hours' then 'due_soon'
        else 'upcoming'
      end as status
    from recurring_goals rg
    where not exists (
      select 1
      from goal_submissions gs
      where gs.goal_id = rg.goal_id
        and gs.created_at >= rg.last_checkin_date
        and gs.verification_status = 'approved'
    )
  )
  select * from missing_proofs
  where status in ('overdue', 'due_soon');
end;
$$;
-- supabase/functions/process-penalties.sql
create or replace function process_pending_penalties()
returns table (
  processed_count integer,
  failed_count integer
)
language plpgsql
security definer
as $$
declare
  penalty_record record;
  customer_id text;
  charge_result jsonb;
  processed integer := 0;
  failed integer := 0;
begin
  -- Get pending penalties that are due
  for penalty_record in
    select 
      pc.*,
      p.stripe_customer_id,
      g.title as goal_title
    from penalty_charges pc
    join profiles p on pc.user_id = p.id
    join goals g on pc.goal_id = g.id
    where pc.status = 'pending'
      and pc.due_date <= now()
      and pc.charge_attempts < 3
    order by pc.due_date
    limit 10 -- Process in batches
  loop
    begin
      -- Call Stripe API via edge function
      -- This would trigger a webhook to app/api/stripe/charge-penalty
      
      -- For demo purposes, simulate charge
      update penalty_charges
      set 
        status = 'charged',
        stripe_charge_id = 'ch_sim_' || penalty_record.id,
        charged_at = now(),
        charge_attempts = charge_attempts + 1
      where id = penalty_record.id;
      
      processed := processed + 1;
      
      -- Create notification for user
      insert into notifications (
        user_id,
        type,
        title,
        message,
        metadata
      ) values (
        penalty_record.user_id,
        'penalty_charged',
        'Penalty Charged',
        format('A penalty of $%s was charged for goal: %s', 
               penalty_record.amount / 100, 
               penalty_record.goal_title),
        jsonb_build_object(
          'goal_id', penalty_record.goal_id,
          'charge_id', 'ch_sim_' || penalty_record.id,
          'amount', penalty_record.amount
        )
      );
      
    exception when others then
      -- Log failure and increment attempt count
      update penalty_charges
      set 
        charge_attempts = charge_attempts + 1,
        last_attempt_at = now()
      where id = penalty_record.id;
      
      failed := failed + 1;
    end;
  end loop;
  
  return query select processed, failed;
end;
$$;