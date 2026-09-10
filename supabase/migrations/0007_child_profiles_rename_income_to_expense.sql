-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- We now collect the household's current monthly EXPENSE instead of income
-- (used to show combined monthly budget burden at each stage, not an
-- affordability/income check) — rename the column to match.

alter table child_profiles
  rename column household_monthly_income_lkr to household_monthly_expense_lkr;
