// lib/__tests__/study-queue.test.ts
import { describe, it, expect } from 'vitest'

// Queue management logic to be extracted from StudySession
interface QueueItem { id: string; questionId: string; isRetry: boolean }

function buildInitialQueue(sessionQuestionIds: string[]): QueueItem[] {
  return sessionQuestionIds.map(id => ({ id, questionId: id, isRetry: false }))
}

function processAnswer(
  queue: QueueItem[],
  currentIndex: number,
  result: 'correct' | 'wrong'
): { nextQueue: QueueItem[]; nextIndex: number } {
  const nextQueue = [...queue]
  if (result === 'wrong') {
    // Re-append to end as a retry item
    nextQueue.push({ ...nextQueue[currentIndex], isRetry: true })
  }
  const nextIndex = currentIndex + 1
  return { nextQueue, nextIndex }
}

function isSessionComplete(queue: QueueItem[], currentIndex: number): boolean {
  return currentIndex >= queue.length
}

describe('study session queue', () => {
  it('builds initial queue from session question IDs', () => {
    const queue = buildInitialQueue(['sq1', 'sq2', 'sq3'])
    expect(queue).toHaveLength(3)
    expect(queue[0].isRetry).toBe(false)
  })

  it('does not modify queue on correct answer', () => {
    const queue = buildInitialQueue(['sq1', 'sq2'])
    const { nextQueue, nextIndex } = processAnswer(queue, 0, 'correct')
    expect(nextQueue).toHaveLength(2)
    expect(nextIndex).toBe(1)
  })

  it('re-queues item at end on wrong answer', () => {
    const queue = buildInitialQueue(['sq1', 'sq2'])
    const { nextQueue } = processAnswer(queue, 0, 'wrong')
    expect(nextQueue).toHaveLength(3)
    expect(nextQueue[2].id).toBe('sq1')
    expect(nextQueue[2].isRetry).toBe(true)
  })

  it('session is complete when currentIndex reaches queue length', () => {
    const queue = buildInitialQueue(['sq1'])
    const { nextQueue, nextIndex } = processAnswer(queue, 0, 'correct')
    expect(isSessionComplete(nextQueue, nextIndex)).toBe(true)
  })

  it('session is not complete when items remain', () => {
    const queue = buildInitialQueue(['sq1', 'sq2'])
    expect(isSessionComplete(queue, 0)).toBe(false)
  })
})
