-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Adds the customer's contact number, needed for the operator admin table.

alter table child_profiles
  add column if not exists customer_contact_number text;
