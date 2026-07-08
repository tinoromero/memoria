// components/sessions/SessionConfigurator.tsx
'use client'
import { useState } from 'react'
import { Card, Title, Stack, MultiSelect, NumberInput, Switch, Button } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { createClient } from '@/lib/supabase/client'
import { weightedSample } from '@/lib/session-logic'
import type { Topic } from '@/lib/types'

interface Props { topics: Topic[] }

export default function SessionConfigurator({ topics }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: {
      topic_ids: [] as string[],
      question_count: 10,
      include_memorized: false,
    },
    validate: {
      question_count: v => (v >= 1 ? null : 'Must be at least 1'),
    },
  })

  async function handleSubmit(values: typeof form.values) {
    setLoading(true)

    // Fetch eligible questions
    let query = supabase.from('questions').select('id, streak, is_memorized, topic_id')
    if (values.topic_ids.length > 0) {
      query = query.in('topic_id', values.topic_ids)
    }
    if (!values.include_memorized) {
      query = query.eq('is_memorized', false)
    }

    const { data: allQuestions, error } = await query
    if (error || !allQuestions) {
      notifications.show({ message: 'Failed to load questions.', color: 'red' })
      setLoading(false)
      return
    }

    if (allQuestions.length === 0) {
      notifications.show({ message: 'No eligible questions found for this configuration.', color: 'yellow' })
      setLoading(false)
      return
    }

    // Weighted sample
    const selected = weightedSample(allQuestions, values.question_count)

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({
        topic_ids: values.topic_ids.length > 0 ? values.topic_ids : null,
        question_count: selected.length,
        include_memorized: values.include_memorized,
      })
      .select()
      .single()

    if (sessionError || !session) {
      notifications.show({ message: 'Failed to create session.', color: 'red' })
      setLoading(false)
      return
    }

    // Insert session_questions
    const sessionQuestions = selected.map((q, i) => ({
      session_id: session.id,
      question_id: q.id,
      result: 'pending' as const,
      was_retried: false,
      position: i,
    }))

    const { error: sqError } = await supabase.from('session_questions').insert(sessionQuestions)
    if (sqError) {
      notifications.show({ message: 'Failed to set up session questions.', color: 'red' })
      setLoading(false)
      return
    }

    setLoading(false)
    router.push(`/sessions/${session.id}`)
  }

  const topicOptions = topics.map(t => ({ value: t.id, label: t.name }))

  return (
    <Card withBorder shadow="sm" p="xl" radius="md">
      <Title order={4} mb="md">Start a new session</Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <MultiSelect
            label="Topics"
            placeholder="All topics"
            data={topicOptions}
            searchable
            {...form.getInputProps('topic_ids')}
          />
          <NumberInput
            label="Number of questions"
            min={1}
            max={100}
            size="md"
            {...form.getInputProps('question_count')}
          />
          <Switch
            label="Include memorized questions"
            description="Memorized questions are excluded by default"
            {...form.getInputProps('include_memorized', { type: 'checkbox' })}
          />
          <Button type="submit" size="md" loading={loading}>
            Start session
          </Button>
        </Stack>
      </form>
    </Card>
  )
}
