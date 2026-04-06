import { Title, Text, Stack, SimpleGrid, Card, Group } from '@mantine/core'
import { IconCards, IconStar, IconTag, IconHistory } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/server'

interface StatCardProps { label: string; value: number; icon: React.ReactNode; color: string }

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card withBorder shadow="sm" p="lg" radius="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>{label}</Text>
        <Text c={color}>{icon}</Text>
      </Group>
      <Text size="2rem" fw={700} c={color} style={{ letterSpacing: '-0.03em' }}>
        {value}
      </Text>
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const [
    { count: totalQuestions },
    { count: memorizedCount },
    { count: topicsCount },
    { count: sessionsThisWeek },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_memorized', true),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString()),
  ])

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} fw={700}>Overview</Title>
        <Text c="dimmed" size="sm">Welcome back — here's how your study is going.</Text>
      </div>
      <SimpleGrid cols={4} spacing="md">
        <StatCard label="Total Questions" value={totalQuestions ?? 0} icon={<IconCards size={20} />} color="sky" />
        <StatCard label="Memorized" value={memorizedCount ?? 0} icon={<IconStar size={20} />} color="green" />
        <StatCard label="Topics" value={topicsCount ?? 0} icon={<IconTag size={20} />} color="gray" />
        <StatCard label="Sessions this week" value={sessionsThisWeek ?? 0} icon={<IconHistory size={20} />} color="violet" />
      </SimpleGrid>
    </Stack>
  )
}
