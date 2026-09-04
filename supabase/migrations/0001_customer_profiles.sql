-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Stores the operator's raw intake data for a customer. This is step 2 of
-- the build order (PROJECT_GUIDE.md Section 7) — later steps (rules engine,
-- LLM explanation, PDF report) read from this table and write their own
-- outputs into `recommendation_audit`, added in a later migration.

create table if not exists customer_profiles (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Operator-facing label only, not used in any calculation.
  customer_name text,

  age int not null check (age > 0 and age < 120),
  monthly_income_lkr numeric not null check (monthly_income_lkr >= 0),
  dependents_count int not null default 0 check (dependents_count >= 0),

  -- Nullable: not every intake is education-goal-driven.
  child_age int check (child_age is null or (child_age >= 0 and child_age < 30)),
  child_target_education_year int,

  desired_life_cover_lkr numeric check (desired_life_cover_lkr is null or desired_life_cover_lkr >= 0),
  monthly_budget_lkr numeric not null check (monthly_budget_lkr >= 0),

  -- Free-form flags the operator checks off, e.g. ["smoker", "chronic_illness"].
  health_flags text[] not null default '{}',

  notes text,

  -- draft: operator still editing: submitted: ready for the pipeline to pick up.
  status text not null default 'draft' check (status in ('draft', 'submitted', 'processed')),

  -- Full original form payload, kept verbatim for the compliance audit trail
  -- (Section 3): any report must be reconstructable from what was entered.
  raw_input jsonb not null
);

create index if not exists customer_profiles_status_idx on customer_profiles (status);
create index if not exists customer_profiles_created_at_idx on customer_profiles (created_at desc);
