-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Merges the old /intake customer (parent/guardian) fields into
-- child_profiles, since the operator decided one combined form replaces the
-- separate customer intake + child report flows.

alter table child_profiles
  add column if not exists customer_name text,
  add column if not exists customer_age int check (customer_age is null or (customer_age > 0 and customer_age < 120)),
  add column if not exists dependents_count int not null default 0 check (dependents_count >= 0),
  add column if not exists desired_life_cover_lkr numeric check (desired_life_cover_lkr is null or desired_life_cover_lkr >= 0),
  add column if not exists monthly_budget_lkr numeric check (monthly_budget_lkr is null or monthly_budget_lkr >= 0),
  add column if not exists customer_health_flags text[] not null default '{}';
