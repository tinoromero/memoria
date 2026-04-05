// lib/session-logic.ts

export interface SampleableQuestion {
  id: string
  streak: number
  is_memorized: boolean
}

export interface SessionResult {
  questionId: string
  result: 'correct' | 'wrong'
}

export interface StreakUpdate {
  questionId: string
  newStreak: number
  isMemorized: boolean
}

/**
 * Weighted random sampling without replacement.
 * Weight formula: 1 / (streak + 1) — lower streak = higher probability.
 */
export function weightedSample<T extends SampleableQuestion>(
  questions: T[],
  count: number
): T[] {
  if (questions.length === 0) return []

  const pool = [...questions]
  const selected: T[] = []
  const n = Math.min(count, pool.length)

  for (let i = 0; i < n; i++) {
    const weights = pool.map(q => 1 / (q.streak + 1))
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    let rand = Math.random() * totalWeight
    for (let j = 0; j < pool.length; j++) {
      rand -= weights[j]
      if (rand <= 0) {
        selected.push(pool[j])
        pool.splice(j, 1)
        break
      }
    }
  }

  return selected
}

/**
 * Compute streak updates from first-answer session results.
 * Only the first answer per question counts — re-queue answers are ignored.
 */
export function computeStreakUpdates(
  results: SessionResult[],
  currentStreaks: Record<string, number>
): StreakUpdate[] {
  return results.map(({ questionId, result }) => {
    const currentStreak = currentStreaks[questionId] ?? 0
    const newStreak = result === 'correct' ? currentStreak + 1 : 0
    return {
      questionId,
      newStreak,
      isMemorized: newStreak >= 10,
    }
  })
}
