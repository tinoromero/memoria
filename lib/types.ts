// lib/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Topic {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface Question {
  id: string
  user_id: string
  topic_id: string | null
  question: string
  question_image_path: string | null
  answer: string
  answer_image_path: string | null
  streak: number
  is_memorized: boolean
  created_at: string
}

export interface Session {
  id: string
  user_id: string
  topic_ids: string[] | null
  question_count: number
  include_memorized: boolean
  completed_at: string | null
  created_at: string
}

export type SessionResult = 'correct' | 'wrong' | 'pending'

export interface SessionQuestion {
  id: string
  session_id: string
  question_id: string
  result: SessionResult
  was_retried: boolean
  position: number
}

// Enriched types for UI
export interface QuestionWithTopic extends Question {
  topic: Pick<Topic, 'id' | 'name'> | null
}

export interface SessionWithStats extends Session {
  correct_count: number
  wrong_count: number
  total_count: number
}
