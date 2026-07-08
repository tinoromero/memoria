# Memoria — flashcard study app

Study app based on question/answer flashcards: users create topics and questions (with optional images), then run study sessions. Correct answers build a streak; a long enough streak marks a question as memorized.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (auth + Postgres + storage for question/answer images) via `@supabase/ssr` — clients in `lib/supabase/`
- Mantine 9 for UI (NOT Tailwind) + CSS modules; theme in `theme.ts`
- Vitest + React Testing Library

## Commands (use npm, not pnpm)
- `npm run dev` — dev server
- `npm run test:run` — run tests once (`npm test` for watch mode)
- `npm run lint` — ESLint
- `npm run build` — production build

## Structure
- `app/(protected)/` — authenticated routes; `app/login`, `app/signup`, `app/auth` — auth flow
- `components/` — organized by domain: `topics/`, `questions/`, `sessions/`, `auth/`, `layout/`, `ui/`
- `lib/types.ts` — shared domain types (Topic, Question, Session, SessionQuestion)
- `lib/session-logic.ts` — pure logic for question sampling and streak updates; has unit tests in `lib/__tests__/`
- `supabase/migrations/` — SQL migrations
- `middleware.ts` / `proxy.ts` — auth session handling

## Rules
- UI is built with Mantine components — do not introduce Tailwind or other UI libraries.
- Session/streak logic lives in `lib/session-logic.ts` as pure functions with tests; don't duplicate it in components.
- Database schema changes go through a new file in `supabase/migrations/`.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
