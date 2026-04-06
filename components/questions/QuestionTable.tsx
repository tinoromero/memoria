// components/questions/QuestionTable.tsx
'use client'
import { useState, useMemo } from 'react'
import { Table, Badge, ActionIcon, Group, TextInput, Select, Stack, Button, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconTrash, IconPlus, IconSearch, IconFlame, IconStar } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import QuestionFormModal from './QuestionFormModal'
import type { Question, Topic, QuestionWithTopic } from '@/lib/types'

interface Props {
  initialQuestions: QuestionWithTopic[]
  topics: Topic[]
  userId: string
}

export default function QuestionTable({ initialQuestions, topics, userId }: Props) {
  const supabase = createClient()
  const [questions, setQuestions] = useState(initialQuestions)
  const [editing, setEditing] = useState<Question | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<string | null>(null)

  async function refresh() {
    const { data } = await supabase
      .from('questions')
      .select('*, topic:topics(id, name)')
      .order('created_at', { ascending: false })
    if (data) setQuestions(data as QuestionWithTopic[])
  }

  function handleEdit(q: Question) { setEditing(q); open() }

  function handleDelete(q: Question) {
    modals.openConfirmModal({
      title: 'Delete question',
      children: <Text size="sm">Delete this question? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabase.from('questions').delete().eq('id', q.id)
        if (error) { notifications.show({ message: error.message, color: 'red' }); return }
        notifications.show({ message: 'Question deleted.', color: 'green' })
        await refresh()
      },
    })
  }

  const filtered = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = !search || q.question.toLowerCase().includes(search.toLowerCase())
      const matchesTopic = !topicFilter || q.topic_id === topicFilter
      return matchesSearch && matchesTopic
    })
  }, [questions, search, topicFilter])

  const topicOptions = [{ value: '', label: 'All topics' }, ...topics.map(t => ({ value: t.id, label: t.name }))]

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <TextInput
              placeholder="Search questions…"
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={e => setSearch(e.currentTarget.value)}
              w={240}
            />
            <Select
              data={topicOptions}
              value={topicFilter ?? ''}
              onChange={v => setTopicFilter(v || null)}
              w={180}
            />
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditing(null); open() }}>
            Add question
          </Button>
        </Group>

        {filtered.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No questions found.</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Question</Table.Th>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Streak</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map(q => (
                <Table.Tr key={q.id}>
                  <Table.Td maw={400} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.question}
                  </Table.Td>
                  <Table.Td>
                    {q.topic ? <Badge variant="light">{q.topic.name}</Badge> : <Text c="dimmed" size="sm">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <IconFlame size={14} color={q.streak > 0 ? '#f59e0b' : '#94a3b8'} />
                      <Text size="sm" fw={600}>{q.streak}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {q.is_memorized && (
                      <Badge color="green" leftSection={<IconStar size={10} />}>Memorized</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" onClick={() => handleEdit(q)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(q)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      <QuestionFormModal
        opened={opened}
        onClose={close}
        onSaved={refresh}
        topics={topics}
        question={editing}
        userId={userId}
      />
    </>
  )
}
