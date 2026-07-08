// components/topics/__tests__/TopicFormModal.test.tsx
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import TopicFormModal from '@/components/topics/TopicFormModal'
import { theme } from '@/theme'
import { vi } from 'vitest'
import type { Topic } from '@/lib/types'

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ from: () => ({}) }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

function makeTopic(id: string, name: string): Topic {
  return { id, user_id: 'u1', name, created_at: '2026-01-01T00:00:00Z' }
}

describe('TopicFormModal', () => {
  it('shows the name of the topic being edited', () => {
    render(
      <TopicFormModal opened onClose={vi.fn()} onSaved={vi.fn()} topic={makeTopic('t1', 'Biology')} />,
      { wrapper: Wrapper }
    )
    expect(screen.getByLabelText(/name/i)).toHaveValue('Biology')
  })

  // Regression: the modal stays mounted in TopicTable, so switching the edited
  // topic must refresh the field. The parent remounts via a `key` prop on the
  // topic id — simulated here by re-rendering with a different key.
  it('refreshes the field when the edited topic changes', () => {
    const { rerender } = render(
      <TopicFormModal key="t1" opened onClose={vi.fn()} onSaved={vi.fn()} topic={makeTopic('t1', 'Biology')} />,
      { wrapper: Wrapper }
    )
    expect(screen.getByLabelText(/name/i)).toHaveValue('Biology')

    rerender(
      <MantineProvider theme={theme}>
        <TopicFormModal key="t2" opened onClose={vi.fn()} onSaved={vi.fn()} topic={makeTopic('t2', 'Chemistry')} />
      </MantineProvider>
    )
    expect(screen.getByLabelText(/name/i)).toHaveValue('Chemistry')
  })
})
