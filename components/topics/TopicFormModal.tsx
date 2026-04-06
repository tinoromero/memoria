// components/topics/TopicFormModal.tsx
'use client'
import { Modal, TextInput, Button, Stack } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { createClient } from '@/lib/supabase/client'
import type { Topic } from '@/lib/types'

interface Props {
  opened: boolean
  onClose: () => void
  onSaved: () => void
  topic?: Topic | null
}

export default function TopicFormModal({ opened, onClose, onSaved, topic }: Props) {
  const supabase = createClient()
  const isEdit = !!topic

  const form = useForm({
    initialValues: { name: topic?.name ?? '' },
    validate: { name: v => (v.trim().length >= 1 ? null : 'Name is required') },
  })

  async function handleSubmit(values: typeof form.values) {
    const payload = { name: values.name.trim() }
    const { error } = isEdit
      ? await supabase.from('topics').update(payload).eq('id', topic!.id)
      : await supabase.from('topics').insert(payload)

    if (error) {
      notifications.show({ message: error.message, color: 'red' })
      return
    }
    notifications.show({ message: isEdit ? 'Topic updated.' : 'Topic created.', color: 'green' })
    form.reset()
    onSaved()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={onClose} title={isEdit ? 'Edit topic' : 'New topic'} centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput label="Name" placeholder="e.g. Biology" size="md" {...form.getInputProps('name')} />
          <Button type="submit" fullWidth>{isEdit ? 'Save changes' : 'Create topic'}</Button>
        </Stack>
      </form>
    </Modal>
  )
}
