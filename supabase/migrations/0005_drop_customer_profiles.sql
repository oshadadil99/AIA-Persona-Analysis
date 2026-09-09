-- ⚠️ DESTRUCTIVE — run this LAST, only after 0004 is applied and the
-- /child-report form is confirmed working with the merged customer fields.
-- This permanently deletes the customer_profiles table and ALL rows in it
-- (at least one test row exists as of this writing). There is no undo once
-- run — if you want to keep that data, export it first (Table Editor >
-- customer_profiles > Export, or `select * from customer_profiles;` in the
-- SQL Editor and save the result) before running this.

drop table if exists customer_profiles;
