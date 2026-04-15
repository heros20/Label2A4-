create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  email text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.billing_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  plan_id text not null check (plan_id in ('monthly', 'annual')),
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists billing_subscriptions_user_status_idx
  on public.billing_subscriptions (user_id, status, updated_at desc);

create index if not exists billing_subscriptions_period_end_idx
  on public.billing_subscriptions (current_period_end desc);

create table if not exists public.day_pass_entitlements (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  email text,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists day_pass_entitlements_user_expires_idx
  on public.day_pass_entitlements (user_id, expires_at desc);

create table if not exists public.stripe_events (
  event_id text primary key,
  event_type text not null,
  created_at timestamptz not null default timezone('utc', now())
);
