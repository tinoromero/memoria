// app/(protected)/topics/page.tsx
import { Title, Text, Stack } from '@mantine/core'
import { createClient } from '@/lib/supabase/server'
import TopicTable from '@/components/topics/TopicTable'

export default async function TopicsPage() {
  const supabase = await createClient()
  const { data: topics } = await supabase
    .from('topics')
    .select('*, question_count:questions(count)')
    .order('created_at', { ascending: false })

  const topicsWithCount = (topics ?? []).map(t => ({
    ...t,
    question_count: (t.question_count as any)[0]?.count ?? 0,
  }))

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} fw={700}>Topics</Title>
        <Text c="dimmed" size="sm">Organize your questions into topics.</Text>
      </div>
      <TopicTable initialTopics={topicsWithCount} />
    </Stack>
  )
}
