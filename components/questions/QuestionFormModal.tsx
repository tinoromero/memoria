// components/questions/QuestionFormModal.tsx
'use client'
import { useEffect } from 'react'
import { Modal, Textarea, Select, Stack, Button, Divider } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/components/ui/ImageUpload'
import type { Question, Topic } from '@/lib/types'

interface Props {
  opened: boolean
  onClose: () => void
  onSaved: () => void
  topics: Topic[]
  question?: Question | null
  userId: string
}

export default function QuestionFormModal({ opened, onClose, onSaved, topics, question, userId }: Props) {
  const supabase = createClient()
  const isEdit = !!question

  const form = useForm({
    initialValues: {
      question: question?.question ?? '',
      question_image_path: question?.question_image_path ?? null as string | null,
      answer: question?.answer ?? '',
      answer_image_path: question?.answer_image_path ?? null as string | null,
      topic_id: question?.topic_id ?? null as string | null,
    },
    validate: {
      question: v => (v.trim().length >= 1 ? null : 'Question is required'),
      answer: v => (v.trim().length >= 1 ? null : 'Answer is required'),
    },
  })

  useEffect(() => {
    form.setValues({
      question: question?.question ?? '',
      question_image_path: question?.question_image_path ?? null,
      answer: question?.answer ?? '',
      answer_image_path: question?.answer_image_path ?? null,
      topic_id: question?.topic_id ?? null,
    })
  }, [question?.id])

  async function handleSubmit(values: typeof form.values) {
    const payload = {
      question: values.question.trim(),
      question_image_path: values.question_image_path,
      answer: values.answer.trim(),
      answer_image_path: values.answer_image_path,
      topic_id: values.topic_id || null,
    }

    const { error } = isEdit
      ? await supabase.from('questions').update(payload).eq('id', question!.id)
      : await supabase.from('questions').insert(payload)

    if (error) { notifications.show({ message: error.message, color: 'red' }); return }
    notifications.show({ message: isEdit ? 'Question updated.' : 'Question created.', color: 'green' })
    form.reset()
    onSaved()
    onClose()
  }

  const topicOptions = topics.map(t => ({ value: t.id, label: t.name }))

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? 'Edit question' : 'New question'}
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Select
            label="Topic"
            placeholder="No topic"
            data={topicOptions}
            clearable
            {...form.getInputProps('topic_id')}
          />

          <Divider label="Question side" labelPosition="left" />
          <Textarea label="Question" placeholder="Enter the question" size="md" autosize minRows={2} {...form.getInputProps('question')} />
          <ImageUpload
            label="Question image"
            value={form.values.question_image_path}
            onChange={v => form.setFieldValue('question_image_path', v)}
            userId={userId}
          />

          <Divider label="Answer side" labelPosition="left" />
          <Textarea label="Answer" placeholder="Enter the answer" size="md" autosize minRows={2} {...form.getInputProps('answer')} />
          <ImageUpload
            label="Answer image"
            value={form.values.answer_image_path}
            onChange={v => form.setFieldValue('answer_image_path', v)}
            userId={userId}
          />

          <Button type="submit" fullWidth mt="xs">
            {isEdit ? 'Save changes' : 'Create question'}
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}
