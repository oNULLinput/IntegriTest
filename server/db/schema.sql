-- Instructors table
create table if not exists public.instructors (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  created_at timestamp with time zone default now()
);

-- Exams table
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  duration integer not null,
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamp with time zone default now()
);

-- Students table
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_number text unique not null,
  full_name text not null,
  last_login_at timestamp with time zone
);

-- Events (analytics)
create table if not exists public.events (
  id bigserial primary key,
  type text not null,
  payload jsonb,
  created_at timestamp with time zone default now()
);

-- Helpful indexes
create index if not exists idx_exams_code on public.exams(code);
create index if not exists idx_events_type on public.events(type);

