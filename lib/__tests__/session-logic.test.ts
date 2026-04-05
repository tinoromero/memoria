// lib/__tests__/session-logic.test.ts
import { describe, it, expect } from 'vitest'
import { weightedSample, computeStreakUpdates } from '@/lib/session-logic'

const makeQuestion = (id: string, streak: number, is_memorized = false) => ({
  id, streak, is_memorized,
})

describe('weightedSample', () => {
  it('returns the requested number of questions', () => {
    const questions = [0, 1, 2, 3, 4].map(i => makeQuestion(`q${i}`, i))
    const result = weightedSample(questions, 3)
    expect(result).toHaveLength(3)
  })

  it('does not return duplicates', () => {
    const questions = [0, 1, 2, 3, 4].map(i => makeQuestion(`q${i}`, i))
    const result = weightedSample(questions, 5)
    const ids = result.map(q => q.id)
    expect(new Set(ids).size).toBe(5)
  })

  it('returns all questions if count exceeds pool size', () => {
    const questions = [makeQuestion('q1', 0), makeQuestion('q2', 2)]
    const result = weightedSample(questions, 10)
    expect(result).toHaveLength(2)
  })

  it('returns empty array for empty input', () => {
    expect(weightedSample([], 5)).toEqual([])
  })

  it('favors low-streak questions (statistical)', () => {
    // Run 1000 samples of 1 from [streak=0, streak=9]
    // streak=0 weight=1.0, streak=9 weight=0.1 → expect ~91% selection rate for q1
    const questions = [makeQuestion('q1', 0), makeQuestion('q2', 9)]
    let q1Count = 0
    for (let i = 0; i < 1000; i++) {
      const [picked] = weightedSample(questions, 1)
      if (picked.id === 'q1') q1Count++
    }
    expect(q1Count).toBeGreaterThan(800) // expect >80% (theoretical ~91%)
  })
})

describe('computeStreakUpdates', () => {
  it('increments streak on correct answer', () => {
    const results = [{ questionId: 'q1', result: 'correct' as const }]
    const streaks = { q1: 3 }
    const updates = computeStreakUpdates(results, streaks)
    expect(updates[0].newStreak).toBe(4)
    expect(updates[0].isMemorized).toBe(false)
  })

  it('resets streak to 0 on wrong answer', () => {
    const results = [{ questionId: 'q1', result: 'wrong' as const }]
    const streaks = { q1: 7 }
    const updates = computeStreakUpdates(results, streaks)
    expect(updates[0].newStreak).toBe(0)
    expect(updates[0].isMemorized).toBe(false)
  })

  it('marks question as memorized when streak reaches 10', () => {
    const results = [{ questionId: 'q1', result: 'correct' as const }]
    const streaks = { q1: 9 }
    const updates = computeStreakUpdates(results, streaks)
    expect(updates[0].newStreak).toBe(10)
    expect(updates[0].isMemorized).toBe(true)
  })

  it('handles question with no prior streak (defaults to 0)', () => {
    const results = [{ questionId: 'q1', result: 'correct' as const }]
    const updates = computeStreakUpdates(results, {})
    expect(updates[0].newStreak).toBe(1)
  })

  it('processes multiple questions independently', () => {
    const results = [
      { questionId: 'q1', result: 'correct' as const },
      { questionId: 'q2', result: 'wrong' as const },
    ]
    const streaks = { q1: 5, q2: 3 }
    const updates = computeStreakUpdates(results, streaks)
    expect(updates[0].newStreak).toBe(6)
    expect(updates[1].newStreak).toBe(0)
  })
})
