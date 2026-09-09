-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Separate flow from customer_profiles: this one is child-centric and
-- drives the "future outlook" Sinhala report, independent of insurance plan
-- eligibility matching.

create table if not exists child_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  child_name text,
  child_age int not null check (child_age >= 0 and child_age < 25),
  province text not null check (province in (
    'Western', 'Central', 'Southern', 'Northern', 'Eastern',
    'North Western', 'North Central', 'Uva', 'Sabaragamuwa'
  )),
  household_monthly_income_lkr numeric not null check (household_monthly_income_lkr >= 0),

  -- e.g. ["diabetes", "heart_disease"]
  critical_illnesses text[] not null default '{}',

  higher_education_plan text not null check (higher_education_plan in (
    'local_government_degree', 'local_private_degree', 'overseas_degree',
    'vocational_training', 'medicine', 'engineering', 'undecided'
  )),

  sports_plan_description text,
  sports_monthly_cost_lkr numeric check (sports_monthly_cost_lkr is null or sports_monthly_cost_lkr >= 0),

  notes text,

  status text not null default 'draft' check (status in ('draft', 'submitted', 'processed')),

  -- Full original form payload, kept verbatim for the audit trail.
  raw_input jsonb not null,

  -- Filled in once the report agent runs.
  projection_output jsonb,
  report_sinhala text,
  report_generated_at timestamptz
);

create index if not exists child_profiles_status_idx on child_profiles (status);
create index if not exists child_profiles_created_at_idx on child_profiles (created_at desc);
