-- supabase/migrations/002_security_and_indexes.sql
-- Security hardening + performance indexes.
-- Safe to run on an existing database: idempotent where possible.

-- ---------------------------------------------------------------------------
-- 2.1 Storage policies for the private `card-images` bucket
-- ---------------------------------------------------------------------------
-- Image paths are laid out as `<user_id>/<timestamp>.<ext>` (see
-- components/ui/ImageUpload.tsx), so the first path segment is the owner.
-- These policies make that the single source of truth in version control;
-- if equivalent policies already exist in the Supabase dashboard, remove them
-- there so this migration is the only definition.

drop policy if exists "card-images: read own folder" on storage.objects;
drop policy if exists "card-images: upload to own folder" on storage.objects;
drop policy if exists "card-images: delete own files" on storage.objects;

create policy "card-images: read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "card-images: upload to own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "card-images: delete own files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------------------
-- 2.2 Default user_id to the current auth user
-- ---------------------------------------------------------------------------
-- Client inserts never send user_id; without a default the NOT NULL constraint
-- would reject them. RLS still enforces that the default matches the caller.

alter table topics    alter column user_id set default auth.uid();
alter table questions alter column user_id set default auth.uid();
alter table sessions  alter column user_id set default auth.uid();

-- ---------------------------------------------------------------------------
-- 2.3 Indexes on foreign keys
-- ---------------------------------------------------------------------------
-- Postgres does not create these automatically. RLS policies filter by user_id
-- on every request, and the session_questions policy joins back to sessions.

create index if not exists idx_topics_user_id             on topics(user_id);
create index if not exists idx_questions_user_id          on questions(user_id);
create index if not exists idx_questions_topic_id         on questions(topic_id);
create index if not exists idx_sessions_user_id           on sessions(user_id);
create index if not exists idx_session_questions_session  on session_questions(session_id);
create index if not exists idx_session_questions_question on session_questions(question_id);
