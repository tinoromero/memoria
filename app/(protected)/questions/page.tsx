// app/(protected)/questions/page.tsx
import { Title, Text, Stack } from '@mantine/core'
import { createClient } from '@/lib/supabase/server'
import QuestionTable from '@/components/questions/QuestionTable'
import type { QuestionWithTopic } from '@/lib/types'

export default async function QuestionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: questions }, { data: topics }] = await Promise.all([
    supabase.from('questions').select('*, topic:topics(id, name)').order('created_at', { ascending: false }),
    supabase.from('topics').select('*').order('name'),
  ])

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} fw={700}>Questions</Title>
        <Text c="dimmed" size="sm">Manage your flashcard questions.</Text>
      </div>
      <QuestionTable
        initialQuestions={(questions ?? []) as QuestionWithTopic[]}
        topics={topics ?? []}
        userId={user!.id}
      />
    </Stack>
  )
}
