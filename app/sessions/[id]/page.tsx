// app/sessions/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudySession, { type SessionQuestionWithQuestion } from '@/components/sessions/StudySession'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (!session) notFound()
  if (session.user_id !== user.id) notFound()
  if (session.completed_at) redirect('/sessions')

  const { data: sessionQuestions } = await supabase
    .from('session_questions')
    .select('*, question:questions(*, topic:topics(name))')
    .eq('session_id', id)
    .order('position')

  if (!sessionQuestions || sessionQuestions.length === 0) notFound()

  return (
    <StudySession
      sessionId={id}
      initialSessionQuestions={sessionQuestions as unknown as SessionQuestionWithQuestion[]}
    />
  )
}
