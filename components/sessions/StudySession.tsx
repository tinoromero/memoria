// components/sessions/StudySession.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { Box, Card, Text, Button, Group, Progress, Stack, Center, Title } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { createClient } from '@/lib/supabase/client'
import { computeStreakUpdates } from '@/lib/session-logic'
import type { Question, SessionQuestion } from '@/lib/types'

interface SessionQuestionWithQuestion extends SessionQuestion {
  question: Question & { topic: { name: string } | null }
}

interface Props {
  sessionId: string
  initialSessionQuestions: SessionQuestionWithQuestion[]
}

interface QueueItem {
  sqId: string
  question: Question & { topic: { name: string } | null }
  isRetry: boolean
}

type Phase = 'question' | 'answer' | 'complete'

export default function StudySession({ sessionId, initialSessionQuestions }: Props) {
  const supabase = createClient()
  const router = useRouter()

  // Build initial queue
  const [currentQueue, setCurrentQueue] = useState<QueueItem[]>(() =>
    initialSessionQuestions.map(sq => ({
      sqId: sq.id,
      question: sq.question,
      isRetry: false,
    }))
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('question')

  // Track first answers only (sqId → result)
  const [firstAnswers, setFirstAnswers] = useState<Record<string, 'correct' | 'wrong'>>({})

  const currentItem = currentQueue[currentIndex]
  const isComplete = currentIndex >= currentQueue.length
  const progress = currentQueue.length > 0 ? Math.round((currentIndex / currentQueue.length) * 100) : 0

  // Keyboard shortcuts
  const handleReveal = useCallback(() => {
    if (phase === 'question') setPhase('answer')
  }, [phase])

  const handleGrade = useCallback((result: 'correct' | 'wrong') => {
    if (phase !== 'answer' || !currentItem) return

    const sqId = currentItem.sqId
    const isFirstAnswer = !firstAnswers[sqId]

    if (isFirstAnswer) {
      setFirstAnswers(prev => ({ ...prev, [sqId]: result }))
    }

    const newQueue = [...currentQueue]
    if (result === 'wrong') {
      newQueue.push({ ...currentItem, isRetry: true })
    }
    setCurrentQueue(newQueue)

    const nextIndex = currentIndex + 1
    setCurrentIndex(nextIndex)

    if (nextIndex >= newQueue.length) {
      setPhase('complete')
    } else {
      setPhase('question')
    }
  }, [phase, currentItem, firstAnswers, currentQueue, currentIndex])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.code === 'Space') { e.preventDefault(); handleReveal() }
      if (e.code === 'ArrowRight') handleGrade('correct')
      if (e.code === 'ArrowLeft') handleGrade('wrong')
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleReveal, handleGrade])

  // Commit results on completion
  useEffect(() => {
    if (!isComplete || phase !== 'complete') return

    async function commitResults() {
      // Update session_questions results (first answers only)
      const updates = Object.entries(firstAnswers).map(([sqId, result]) =>
        supabase.from('session_questions').update({
          result,
          was_retried: currentQueue.some(item => item.sqId === sqId && item.isRetry),
        }).eq('id', sqId)
      )
      await Promise.all(updates)

      // Map sqId → questionId for streak computation
      const sqToQuestionId: Record<string, string> = {}
      const questionStreaks: Record<string, number> = {}
      initialSessionQuestions.forEach(sq => {
        sqToQuestionId[sq.id] = sq.question_id
        questionStreaks[sq.question_id] = sq.question.streak
      })

      const sessionResults = Object.entries(firstAnswers).map(([sqId, result]) => ({
        questionId: sqToQuestionId[sqId],
        result,
      }))

      const streakUpdates = computeStreakUpdates(sessionResults, questionStreaks)

      await Promise.all(
        streakUpdates.map(({ questionId, newStreak, isMemorized }) =>
          supabase.from('questions').update({ streak: newStreak, is_memorized: isMemorized }).eq('id', questionId)
        )
      )

      // Mark session as completed
      await supabase.from('sessions').update({ completed_at: new Date().toISOString() }).eq('id', sessionId)
    }

    commitResults().catch(() =>
      notifications.show({ message: 'Failed to save session results.', color: 'red' })
    )
  }, [isComplete, phase])

  // Stats for completion screen
  const correctCount = Object.values(firstAnswers).filter(r => r === 'correct').length
  const wrongCount = Object.values(firstAnswers).filter(r => r === 'wrong').length
  const newlyMemorized = initialSessionQuestions.filter(sq => {
    const firstAnswer = firstAnswers[sq.id]
    return firstAnswer === 'correct' && sq.question.streak + 1 >= 10
  }).length

  if (phase === 'complete') {
    return (
      <Center h="100dvh" bg="var(--mantine-color-body)">
        <Card w={460} p="xl" radius="md" withBorder shadow="sm" ta="center">
          <Stack gap="lg" align="center">
            <Title order={2}>Session complete!</Title>
            <Text c="dimmed">You worked through all {initialSessionQuestions.length} questions.</Text>
            <Group justify="center" gap="xl">
              <Stack gap={4} align="center">
                <Text size="xl" fw={700} c="green">{correctCount}</Text>
                <Text size="xs" c="dimmed">Got it</Text>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="xl" fw={700} c="red">{wrongCount}</Text>
                <Text size="xs" c="dimmed">Needed review</Text>
              </Stack>
              <Stack gap={4} align="center">
                <Text size="xl" fw={700} c="violet">{newlyMemorized}</Text>
                <Text size="xs" c="dimmed">Now memorized</Text>
              </Stack>
            </Group>
            <Group>
              <Button onClick={() => router.push('/sessions')}>Back to sessions</Button>
              <Button variant="default" onClick={() => router.push('/sessions')}>Start new session</Button>
            </Group>
          </Stack>
        </Card>
      </Center>
    )
  }

  if (!currentItem) return null

  return (
    <Center h="100dvh" bg="var(--mantine-color-body)">
      <Stack w={560} gap="md">
        {/* Progress */}
        <Group gap="sm">
          <Progress value={progress} style={{ flex: 1 }} size="sm" />
          <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            {currentIndex + 1} / {currentQueue.length}
          </Text>
        </Group>

        {/* Card */}
        <Card withBorder shadow="sm" p="xl" radius="md">
          <Stack gap="lg" align="center" ta="center">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.08em' }}>
              Question
            </Text>
            <Text size="lg" fw={600}>{currentItem.question.question}</Text>

            {phase === 'answer' && (
              <>
                <Box w="100%" style={{ borderTop: '1px dashed var(--mantine-color-gray-3)' }} />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.08em' }}>
                  Answer
                </Text>
                <Text size="lg" fw={600} c="green">{currentItem.question.answer}</Text>
              </>
            )}
          </Stack>
        </Card>

        {/* Actions */}
        {phase === 'question' && (
          <Button size="md" variant="filled" color="dark" onClick={handleReveal}>
            Reveal answer
          </Button>
        )}

        {phase === 'answer' && (
          <Group grow>
            <Button
              size="md"
              color="red"
              variant="light"
              onClick={() => handleGrade('wrong')}
            >
              ← Missed it
            </Button>
            <Button
              size="md"
              color="green"
              variant="light"
              onClick={() => handleGrade('correct')}
            >
              Got it →
            </Button>
          </Group>
        )}

        {/* Keyboard hint bar */}
        {phase === 'answer' && (
          <Group justify="space-between" px="xs">
            <Text size="xs" c="dimmed">← Missed it</Text>
            <Text size="xs" c="dimmed">Got it →</Text>
          </Group>
        )}

        {/* Topic + streak */}
        <Group justify="space-between" px="xs">
          <Text size="xs" c="dimmed">{currentItem.question.topic?.name ?? 'No topic'}</Text>
          <Text size="xs" c="dimmed">Streak: {currentItem.question.streak}</Text>
        </Group>
      </Stack>
    </Center>
  )
}
