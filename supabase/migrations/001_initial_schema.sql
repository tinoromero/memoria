-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Enum for session question result
create type session_result as enum ('correct', 'wrong', 'pending');

-- Topics
create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  question text not null,
  question_image_path text,
  answer text not null,
  answer_image_path text,
  streak int not null default 0,
  is_memorized boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_ids uuid[],
  question_count int not null,
  include_memorized boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Session questions
create table session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  result session_result not null default 'pending',
  was_retried boolean not null default false,
  position int not null
);

-- RLS: enable for all tables
alter table topics enable row level security;
alter table questions enable row level security;
alter table sessions enable row level security;
alter table session_questions enable row level security;

-- RLS policies: users can only access their own data
create policy "topics: own data" on topics
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "questions: own data" on questions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions: own data" on sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "session_questions: via session owner" on session_questions
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_questions.session_id
      and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions
      where sessions.id = session_questions.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- Storage bucket for card images (run after creating bucket in dashboard)
-- Bucket name: card-images (private)
-- Policies are set via Supabase dashboard Storage UI
