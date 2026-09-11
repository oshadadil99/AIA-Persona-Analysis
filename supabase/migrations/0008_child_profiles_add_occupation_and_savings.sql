-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Adds the customer's occupation and the household's current monthly
-- savings — both optional, captured alongside the existing monthly expense
-- field for a fuller picture of the household's finances.

alter table child_profiles
  add column if not exists customer_occupation text,
  add column if not exists household_monthly_savings_lkr numeric;
