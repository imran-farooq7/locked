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

-- Admin helper (bypasses RLS to avoid policy recursion)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, row_security = off
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Minimal fix for existing policies
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

  -- Skip if policies already exist
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

  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    RAISE NOTICE 'Policy already exists, skipping creation';
  ELSE
    CREATE POLICY "Users can insert own profile"
      ON profiles FOR INSERT
      WITH CHECK (auth.uid() = id);
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
-- // refund_requests
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_charge_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  amount INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- supabase/schema/jobs.sql
create table job_queue (
  id uuid default gen_random_uuid() primary key,
  job_type text not null,
  payload jsonb default '{}',
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'retry')),
  
  -- Priority: 1 (high) to 5 (low)
  priority integer default 3 check (priority between 1 and 5),
  
  -- Retry logic
  max_attempts integer default 3,
  attempt_count integer default 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz default now(),
  
  -- Timing
  scheduled_for timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  
  -- Results
  result jsonb,
  error_message text,
  error_stack text,
  
  -- Metadata
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for efficient job fetching
create index idx_job_queue_status on job_queue(status);
create index idx_job_queue_scheduled on job_queue(scheduled_for) where status = 'pending';
create index idx_job_queue_retry on job_queue(next_attempt_at) where status = 'retry';
create index idx_job_queue_priority on job_queue(priority);

-- Function to enqueue a job
create or replace function enqueue_job(
  p_job_type text,
  p_payload jsonb default '{}',
  p_priority integer default 3,
  p_scheduled_for timestamptz default now(),
  p_max_attempts integer default 3
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_job_id uuid;
begin
  insert into job_queue (
    job_type,
    payload,
    priority,
    scheduled_for,
    max_attempts
  ) values (
    p_job_type,
    p_payload,
    p_priority,
    p_scheduled_for,
    p_max_attempts
  ) returning id into v_job_id;
  
  return v_job_id;
end;
$$;

-- Function to fetch next job
create or replace function fetch_next_job()
returns setof job_queue
language plpgsql
security definer
as $$
begin
  return query
  update job_queue j
  set 
    status = 'processing',
    started_at = now(),
    attempt_count = attempt_count + 1,
    updated_at = now()
  where j.id = (
    select id 
    from job_queue 
    where status in ('pending', 'retry')
      and scheduled_for <= now()
      and (next_attempt_at is null or next_attempt_at <= now())
    order by priority asc, scheduled_for asc
    limit 1
    for update skip locked
  )
  returning j.*;
end;
$$;

-- Function to mark job as completed
create or replace function complete_job(
  p_job_id uuid,
  p_result jsonb default null
)
returns void
language plpgsql
security definer
as $$
begin
  update job_queue
  set 
    status = 'completed',
    completed_at = now(),
    result = p_result,
    updated_at = now()
  where id = p_job_id;
end;
$$;

-- Function to mark job as failed
create or replace function fail_job(
  p_job_id uuid,
  p_error_message text,
  p_error_stack text default null
)
returns void
language plpgsql
security definer
as $$
declare
  v_max_attempts integer;
  v_attempt_count integer;
begin
  select max_attempts, attempt_count
  into v_max_attempts, v_attempt_count
  from job_queue
  where id = p_job_id;
  
  if v_attempt_count >= v_max_attempts then
    -- Max attempts reached, mark as permanently failed
    update job_queue
    set 
      status = 'failed',
      error_message = p_error_message,
      error_stack = p_error_stack,
      updated_at = now()
    where id = p_job_id;
  else
    -- Schedule retry with exponential backoff
    update job_queue
    set 
      status = 'retry',
      error_message = p_error_message,
      error_stack = p_error_stack,
      next_attempt_at = now() + (interval '5 minutes' * power(2, v_attempt_count - 1)),
      updated_at = now()
    where id = p_job_id;
  end if;
end;
$$;
-- supabase/schema/alerts.sql
create table job_alerts (
  id uuid default gen_random_uuid() primary key,
  
  -- Alert configuration
  alert_type text not null check (alert_type in ('job_failed', 'job_stuck', 'queue_backlog', 'system_error')),
  threshold integer not null,
  comparison text not null check (comparison in ('greater_than', 'less_than', 'equals')),
  
  -- Notification settings
  notify_email boolean default true,
  notify_slack boolean default false,
  notify_webhook boolean default false,
  
  -- Recipients
  email_recipients text[],
  slack_webhook_url text,
  webhook_url text,
  
  -- Alert status
  enabled boolean default true,
  last_triggered_at timestamptz,
  trigger_count integer default 0,
  
  -- Metadata
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table alert_history (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid references job_alerts(id) on delete cascade,
  
  -- Alert details
  alert_type text not null,
  severity text not null check (severity in ('critical', 'warning', 'info')),
  message text not null,
  context jsonb default '{}',
  
  -- Delivery status
  email_sent boolean default false,
  slack_sent boolean default false,
  webhook_sent boolean default false,
  
  created_at timestamptz default now()
);

-- Function to check and trigger alerts
create or replace function check_job_alerts()
returns table (
  alerts_triggered integer,
  alerts_skipped integer
)
language plpgsql
security definer
as $$
declare
  alert_record record;
  current_value integer;
  should_trigger boolean;
  alerts_triggered integer := 0;
  alerts_skipped integer := 0;
begin
  for alert_record in
    select * from job_alerts where enabled = true
  loop
    -- Get current value based on alert type
    case alert_record.alert_type
      when 'job_failed' then
        select count(*) into current_value
        from job_queue
        where status = 'failed'
          and created_at > now() - interval '1 hour';
      
      when 'job_stuck' then
        select count(*) into current_value
        from job_queue
        where status = 'processing'
          and started_at < now() - interval '30 minutes';
      
      when 'queue_backlog' then
        select count(*) into current_value
        from job_queue
        where status in ('pending', 'retry');
      
      else
        current_value := 0;
    end case;
    
    -- Check threshold
    case alert_record.comparison
      when 'greater_than' then
        should_trigger := current_value > alert_record.threshold;
      when 'less_than' then
        should_trigger := current_value < alert_record.threshold;
      when 'equals' then
        should_trigger := current_value = alert_record.threshold;
    end case;
    
    if should_trigger then
      -- Create alert history
      insert into alert_history (
        alert_id,
        alert_type,
        severity,
        message,
        context
      ) values (
        alert_record.id,
        alert_record.alert_type,
        case when current_value > alert_record.threshold * 2 then 'critical' else 'warning' end,
        format('%s alert: Current value %s exceeds threshold %s', 
               alert_record.alert_type, current_value, alert_record.threshold),
        jsonb_build_object(
          'current_value', current_value,
          'threshold', alert_record.threshold,
          'comparison', alert_record.comparison
        )
      );
      
      -- Update alert record
      update job_alerts
      set 
        last_triggered_at = now(),
        trigger_count = trigger_count + 1
      where id = alert_record.id;
      
      alerts_triggered := alerts_triggered + 1;
    else
      alerts_skipped := alerts_skipped + 1;
    end if;
  end loop;
  
  return query select alerts_triggered, alerts_skipped;
end;
$$;
-- supabase/functions/vacuum-analyze.sql
create or replace function vacuum_analyze_tables()
returns void
language plpgsql
security definer
as $$
declare
  table_record record;
begin
  -- Only vacuum analyze tables that need it (large tables)
  for table_record in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename in (
        'job_queue',
        'penalty_charges',
        'goal_submissions',
        'notifications'
      )
  loop
    -- Analyze table (update statistics)
    execute format('analyze %I', table_record.tablename);
    
    -- Vacuum if needed (based on table size)
    if exists (
      select 1
      from pg_stat_user_tables
      where relname = table_record.tablename
        and n_dead_tup > 1000
    ) then
      execute format('vacuum %I', table_record.tablename);
    end if;
  end loop;
end;
$$;
-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON public.notifications TO authenticated, service_role;
GRANT SELECT ON public.notifications TO anon;
-- Create cron_logs table for tracking
CREATE TABLE IF NOT EXISTS public.cron_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name TEXT NOT NULL,
  status TEXT NOT NULL,
  processed INTEGER DEFAULT 0,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  synced INTEGER DEFAULT 0,
  cancelled INTEGER DEFAULT 0,
  results JSONB,
  error TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for cron logs (admin only)
ALTER TABLE public.cron_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view cron logs"
  ON public.cron_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = TRUE
  ));
