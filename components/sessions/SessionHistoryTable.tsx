// components/sessions/SessionHistoryTable.tsx
import { Table, Badge, Text, Group } from '@mantine/core'
import type { SessionWithStats } from '@/lib/types'

interface Props { sessions: SessionWithStats[] }

export default function SessionHistoryTable({ sessions }: Props) {
  if (sessions.length === 0) {
    return <Text c="dimmed" ta="center" py="xl">No sessions yet. Start your first session above.</Text>
  }

  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Questions</Table.Th>
          <Table.Th>Correct</Table.Th>
          <Table.Th>Needed review</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sessions.map(s => (
          <Table.Tr key={s.id}>
            <Table.Td>{new Date(s.created_at).toLocaleDateString()}</Table.Td>
            <Table.Td>{s.total_count}</Table.Td>
            <Table.Td>
              <Badge color="green" variant="light">{s.correct_count}</Badge>
            </Table.Td>
            <Table.Td>
              {s.wrong_count > 0
                ? <Badge color="red" variant="light">{s.wrong_count}</Badge>
                : <Text c="dimmed" size="sm">—</Text>
              }
            </Table.Td>
            <Table.Td>
              {s.completed_at
                ? <Badge color="green">Completed</Badge>
                : <Badge color="yellow">Incomplete</Badge>
              }
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
