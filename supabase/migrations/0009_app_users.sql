-- Run this in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Login accounts for the site. Passwords are never stored in plain text —
-- password_hash holds a scrypt hash in "salt:key" hex form, written only by
-- scripts/create-user.ts. Two roles: "agent" can generate reports, "admin"
-- can also see the customer records dashboard.

create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  password_hash text not null,
  role text not null default 'agent' check (role in ('agent', 'admin')),
  created_at timestamptz not null default now()
);

-- Usernames are compared case-insensitively at login, so uniqueness has to be
-- enforced the same way — otherwise "Oshada" and "oshada" could both exist and
-- a login would be ambiguous.
create unique index if not exists app_users_username_lower_idx
  on app_users (lower(username));
