// components/topics/TopicTable.tsx
'use client'
import { useState } from 'react'
import { Table, Button, Group, Text, ActionIcon, Stack, Badge } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import TopicFormModal from './TopicFormModal'
import type { Topic } from '@/lib/types'

interface TopicWithCount extends Topic { question_count: number }

interface Props { initialTopics: TopicWithCount[] }

export default function TopicTable({ initialTopics }: Props) {
  const supabase = createClient()
  const [topics, setTopics] = useState(initialTopics)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [opened, { open, close }] = useDisclosure(false)

  async function refresh() {
    const { data } = await supabase
      .from('topics')
      .select('*, question_count:questions(count)')
      .order('created_at', { ascending: false })
    if (data) setTopics(data.map(t => {
      const { question_count, ...topic } = t as typeof t & { question_count: { count: number }[] }
      return { ...topic, question_count: question_count[0]?.count ?? 0 }
    }))
  }

  function handleEdit(topic: Topic) {
    setEditing(topic)
    open()
  }

  function handleDelete(topic: Topic) {
    modals.openConfirmModal({
      title: 'Delete topic',
      children: <Text size="sm">Delete &quot;{topic.name}&quot;? Questions in this topic will become unassigned.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabase.from('topics').delete().eq('id', topic.id)
        if (error) { notifications.show({ message: error.message, color: 'red' }); return }
        notifications.show({ message: 'Topic deleted.', color: 'green' })
        await refresh()
      },
    })
  }

  return (
    <>
      <Stack gap="md">
        <Group justify="flex-end">
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditing(null); open() }}>
            New topic
          </Button>
        </Group>

        {topics.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No topics yet. Create your first topic above.</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Questions</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topics.map(topic => (
                <Table.Tr key={topic.id}>
                  <Table.Td fw={500}>{topic.name}</Table.Td>
                  <Table.Td><Badge variant="light">{topic.question_count}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" aria-label={`Edit ${topic.name}`} onClick={() => handleEdit(topic)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" aria-label={`Delete ${topic.name}`} onClick={() => handleDelete(topic)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      <TopicFormModal
        key={editing?.id ?? 'new'}
        opened={opened}
        onClose={close}
        onSaved={refresh}
        topic={editing}
      />
    </>
  )
}
