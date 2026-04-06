// app/(protected)/sessions/page.tsx
import { Title, Text, Stack } from '@mantine/core'
import { createClient } from '@/lib/supabase/server'
import SessionConfigurator from '@/components/sessions/SessionConfigurator'
import SessionHistoryTable from '@/components/sessions/SessionHistoryTable'
import type { SessionWithStats } from '@/lib/types'

export default async function SessionsPage() {
  const supabase = await createClient()

  const [{ data: topics }, { data: sessions }] = await Promise.all([
    supabase.from('topics').select('*').order('name'),
    supabase.from('sessions')
      .select('*, session_questions(result)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const sessionsWithStats: SessionWithStats[] = (sessions ?? []).map(s => {
    const sqs = s.session_questions as { result: string }[]
    return {
      ...s,
      session_questions: undefined,
      total_count: sqs.length,
      correct_count: sqs.filter(sq => sq.result === 'correct').length,
      wrong_count: sqs.filter(sq => sq.result === 'wrong').length,
    } as SessionWithStats
  })

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} fw={700}>Sessions</Title>
        <Text c="dimmed" size="sm">Configure and start a study session.</Text>
      </div>
      <SessionConfigurator topics={topics ?? []} />
      <div>
        <Title order={4} mb="md">History</Title>
        <SessionHistoryTable sessions={sessionsWithStats} />
      </div>
    </Stack>
  )
}
