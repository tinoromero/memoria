-- supabase/migrations/003_complete_session_rpc.sql
-- Atomic session completion: persist answers, recompute streaks, and mark the
-- session complete in a single transaction. Replaces the sequence of loose
-- client-side updates in components/sessions/StudySession.tsx.
--
-- security invoker: the function runs as the calling user, so the existing RLS
-- policies still apply and a user can only touch their own rows.

create or replace function complete_session(p_session_id uuid, p_answers jsonb)
returns void
language plpgsql
security invoker
as $$
begin
  -- Persist per-question results (first answers only).
  update session_questions sq
  set result = a.result::session_result,
      was_retried = a.was_retried
  from jsonb_to_recordset(p_answers)
    as a(session_question_id uuid, result text, was_retried boolean)
  where sq.id = a.session_question_id
    and sq.session_id = p_session_id;

  -- Recompute streaks. Mirrors computeStreakUpdates in lib/session-logic.ts:
  -- correct => streak + 1, wrong => 0; memorized once streak reaches 10
  -- (keep in sync with MEMORIZED_THRESHOLD there).
  update questions q
  set streak = case when a.result = 'correct' then q.streak + 1 else 0 end,
      is_memorized = case when a.result = 'correct' then q.streak + 1 >= 10 else false end
  from jsonb_to_recordset(p_answers)
    as a(session_question_id uuid, result text, was_retried boolean)
  join session_questions sq on sq.id = a.session_question_id
  where q.id = sq.question_id
    and sq.session_id = p_session_id;

  -- Mark the session complete.
  update sessions
  set completed_at = now()
  where id = p_session_id;
end;
$$;

grant execute on function complete_session(uuid, jsonb) to authenticated;
