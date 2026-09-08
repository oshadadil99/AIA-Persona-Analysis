-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Adds field-of-study selection for local private degrees, since cost varies
-- a lot by field (Business, Humanities/Healthcare, Computing/IT, Engineering).

alter table child_profiles
  add column if not exists local_private_degree_field text
    check (local_private_degree_field is null or local_private_degree_field in (
      'business_management', 'humanities_social_healthcare', 'computing_it', 'engineering_built_environment'
    ));
