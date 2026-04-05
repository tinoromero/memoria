# Memoria Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack flashcard study app with auth, CRUD, and a streak-based spaced repetition study session.

**Architecture:** Next.js App Router with hybrid SSR + Client Components. Server Components fetch initial data via a server-side Supabase client. Client Components handle interactive UI (study session, forms). Route protection via Next.js middleware.

**Tech Stack:** Next.js 15 (App Router), Mantine v7, Supabase (PostgreSQL + Auth + Storage), @supabase/ssr, Inter font, Vitest + React Testing Library, @tabler/icons-react

**Spec:** `docs/superpowers/specs/2026-04-04-memoria-design.md`

---

## File Structure

```
/                                         # project root
├── app/
│   ├── layout.tsx                        # Root layout: MantineProvider + ColorSchemeScript
│   ├── page.tsx                          # Landing page (/)
│   ├── login/
│   │   └── page.tsx                      # Login page (Google + email/password)
│   ├── signup/
│   │   └── page.tsx                      # Signup page
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts                  # Supabase OAuth callback handler
│   └── (protected)/
│       ├── layout.tsx                    # Sidebar layout for all protected pages
│       ├── dashboard/
│       │   └── page.tsx                  # Overview stats
│       ├── questions/
│       │   └── page.tsx                  # Questions list + CRUD
│       ├── topics/
│       │   └── page.tsx                  # Topics list + CRUD
│       └── sessions/
│           └── page.tsx                  # Session configurator + history
├── sessions/
│   └── [id]/
│       └── page.tsx                      # Active study session — OUTSIDE (protected), full-screen, no sidebar
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                 # Email/password login form
│   │   └── SignupForm.tsx                # Email/password signup form
│   ├── layout/
│   │   └── AppSidebar.tsx               # Dark navy sidebar with nav links
│   ├── questions/
│   │   ├── QuestionTable.tsx            # Table with search/filter/actions
│   │   └── QuestionFormModal.tsx        # Create/edit modal with image upload
│   ├── topics/
│   │   ├── TopicTable.tsx               # Table with actions
│   │   └── TopicFormModal.tsx           # Create/edit modal
│   ├── sessions/
│   │   ├── SessionConfigurator.tsx      # New session form
│   │   ├── SessionHistoryTable.tsx      # Past sessions table
│   │   └── StudyCard.tsx               # Flashcard UI (question/answer/buttons)
│   └── ui/
│       └── ImageUpload.tsx             # Reusable image upload to Supabase Storage
├── lib/
│   ├── supabase/
│   │   ├── client.ts                   # Browser Supabase client (singleton)
│   │   └── server.ts                   # Server Supabase client (per-request)
│   ├── session-logic.ts               # Weighted selection + streak computation
│   └── types.ts                       # Shared TypeScript types (DB row types)
├── middleware.ts                       # Route protection + session refresh
├── theme.ts                           # Mantine theme (Inter, sky blue, dark sidebar tokens)
├── postcss.config.cjs                 # Mantine PostCSS config
├── vitest.config.ts                   # Vitest config
├── vitest.setup.ts                    # Testing Library matchers setup
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql     # All tables + RLS policies + enums
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.cjs`, `.env.local.example`, `.gitignore`

- [ ] **Step 1: Scaffold Next.js project in current directory**

Run from `/Users/tinoromero/Dev/Projects/memoria/memoria`:
```bash
npx create-next-app@latest . \
  --typescript \
  --eslint \
  --no-tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --no-turbopack
```
When prompted about existing files (docs/), confirm overwrite only for `.gitignore`. The `docs/` folder will be preserved.

Expected: Next.js project scaffolded, `package.json` created.

- [ ] **Step 2: Install app dependencies**

```bash
npm install \
  @mantine/core @mantine/hooks @mantine/notifications @mantine/form \
  @supabase/supabase-js @supabase/ssr \
  @tabler/icons-react \
  postcss-preset-mantine postcss-simple-vars
```

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev \
  vitest @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom
```

- [ ] **Step 4: Replace `postcss.config.cjs` with Mantine config**

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
  },
}
```

- [ ] **Step 5: Create `.env.local.example`**

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Copy to `.env.local` and fill in real values from Supabase dashboard → Settings → API.

- [ ] **Step 6: Add vitest config**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 7: Add vitest setup file**

```ts
// vitest.setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 8: Add test script to `package.json`**

Add to the `scripts` section:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```
Expected: Server starts on http://localhost:3000 with the default Next.js page.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Mantine, Supabase, Vitest"
```

---

## Task 2: Mantine Theme + Root Layout

**Files:**
- Create: `theme.ts`
- Modify: `app/layout.tsx`
- Delete: `app/globals.css` contents (keep the file, clear it — Mantine handles styles)

- [ ] **Step 1: Create Mantine theme**

```ts
// theme.ts
import { createTheme, type MantineColorsTuple } from '@mantine/core'

const sky: MantineColorsTuple = [
  '#f0f9ff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8',
  '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e',
]

export const theme = createTheme({
  fontFamily: 'Inter, sans-serif',
  primaryColor: 'sky',
  colors: { sky },
  defaultRadius: 'md',
  components: {
    NavLink: {
      styles: {
        root: { borderRadius: '8px' },
      },
    },
  },
})
```

- [ ] **Step 2: Replace `app/layout.tsx`**

```tsx
// app/layout.tsx
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { Inter } from 'next/font/google'
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { theme } from '@/theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata = { title: 'Memoria', description: 'Study smarter. Remember everything.' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Clear `app/globals.css`**

Replace contents with:
```css
/* Global overrides — Mantine handles base styles */
```

- [ ] **Step 4: Verify dev server still works**

```bash
npm run dev
```
Expected: Page loads without errors. Default Next.js content appears (unstyled is fine).

- [ ] **Step 5: Commit**

```bash
git add theme.ts app/layout.tsx app/globals.css
git commit -m "feat: add Mantine theme with Inter font and sky blue primary"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: Write types matching the DB schema**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types for DB schema"
```

---

## Task 4: Database Schema

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Enum for session question result
create type session_result as enum ('correct', 'wrong', 'pending');

-- Topics
create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  question text not null,
  question_image_path text,
  answer text not null,
  answer_image_path text,
  streak int not null default 0,
  is_memorized boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_ids uuid[],
  question_count int not null,
  include_memorized boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Session questions
create table session_questions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  result session_result not null default 'pending',
  was_retried boolean not null default false,
  position int not null
);

-- RLS: enable for all tables
alter table topics enable row level security;
alter table questions enable row level security;
alter table sessions enable row level security;
alter table session_questions enable row level security;

-- RLS policies: users can only access their own data
create policy "topics: own data" on topics
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "questions: own data" on questions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "sessions: own data" on sessions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "session_questions: via session owner" on session_questions
  using (
    exists (
      select 1 from sessions
      where sessions.id = session_questions.session_id
      and sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sessions
      where sessions.id = session_questions.session_id
      and sessions.user_id = auth.uid()
    )
  );

-- Storage bucket for card images (run after creating bucket in dashboard)
-- Bucket name: card-images (private)
-- Policies are set via Supabase dashboard Storage UI
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

1. Open Supabase dashboard → SQL Editor
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click Run
4. Expected: "Success. No rows returned"
5. Verify tables exist in Table Editor: `topics`, `questions`, `sessions`, `session_questions`

- [ ] **Step 3: Create Storage bucket**

1. Supabase dashboard → Storage → New bucket
2. Name: `card-images`, **Private** (uncheck public)
3. Add RLS policy for the bucket:
   - Allowed operations: SELECT, INSERT, UPDATE, DELETE
   - Policy: `(auth.uid())::text = (storage.foldername(name))[1]`
   (This ensures each user can only access files in their own `{user_id}/` folder)

- [ ] **Step 4: Enable Google OAuth in Supabase**

1. Supabase dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Add Client ID and Client Secret from Google Cloud Console
4. Add `http://localhost:3000/auth/callback` to redirect URLs
5. Copy the Supabase callback URL and add it to Google Cloud Console → Authorized redirect URIs

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add DB schema migration with RLS policies"
```

---

## Task 5: Supabase Client Utilities + Middleware

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `middleware.ts`

- [ ] **Step 1: Create browser Supabase client**

```ts
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Create server Supabase client**

```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // Server Component — cookie setting ignored (middleware handles refresh)
          }
        },
      },
    }
  )
}
```

- [ ] **Step 3: Create Next.js middleware**

```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/questions', '/topics', '/sessions']
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Refresh session — required on every request
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
  const isAuthRoute = AUTH_ROUTES.includes(pathname)
  const isRoot = pathname === '/'

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if ((isAuthRoute || isRoot) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 4: Write unit test for middleware route logic**

```ts
// lib/supabase/__tests__/middleware-routes.test.ts
import { describe, it, expect } from 'vitest'

const PROTECTED_PREFIXES = ['/dashboard', '/questions', '/topics', '/sessions']

function shouldRedirectToLogin(pathname: string, hasUser: boolean): boolean {
  return PROTECTED_PREFIXES.some(p => pathname.startsWith(p)) && !hasUser
}

function shouldRedirectToDashboard(pathname: string, hasUser: boolean): boolean {
  return (['/login', '/signup', '/'].includes(pathname)) && hasUser
}

describe('middleware route logic', () => {
  it('redirects unauthenticated user from /dashboard to /login', () => {
    expect(shouldRedirectToLogin('/dashboard', false)).toBe(true)
  })

  it('redirects unauthenticated user from /sessions/abc to /login', () => {
    expect(shouldRedirectToLogin('/sessions/abc', false)).toBe(true)
  })

  it('does not redirect authenticated user from /dashboard', () => {
    expect(shouldRedirectToLogin('/dashboard', true)).toBe(false)
  })

  it('redirects authenticated user from /login to /dashboard', () => {
    expect(shouldRedirectToDashboard('/login', true)).toBe(true)
  })

  it('redirects authenticated user from / to /dashboard', () => {
    expect(shouldRedirectToDashboard('/', true)).toBe(true)
  })

  it('does not redirect unauthenticated user from /login', () => {
    expect(shouldRedirectToDashboard('/login', false)).toBe(false)
  })
})
```

- [ ] **Step 5: Run tests**

```bash
npm run test:run
```
Expected: 6 passed.

- [ ] **Step 6: Commit**

```bash
git add lib/supabase/ middleware.ts
git commit -m "feat: add Supabase client utilities and route protection middleware"
```

---

## Task 6: Session Logic (TDD)

**Files:**
- Create: `lib/session-logic.ts`
- Create: `lib/__tests__/session-logic.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm run test:run
```
Expected: FAIL — "Cannot find module '@/lib/session-logic'"

- [ ] **Step 3: Implement session logic**

```ts
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
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npm run test:run
```
Expected: 10 passed.

- [ ] **Step 5: Commit**

```bash
git add lib/session-logic.ts lib/__tests__/session-logic.test.ts
git commit -m "feat: add weighted question selection and streak computation (TDD)"
```

---

## Task 7: Landing Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the landing page**

```tsx
// app/page.tsx
import { Center, Stack, Title, Text, Button, Group } from '@mantine/core'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <Center h="100dvh" bg="var(--mantine-color-body)">
      <Stack align="center" gap="xl" maw={480} px="md" ta="center">
        <Stack gap="xs">
          <Title order={1} size="3rem" fw={700} lts="-0.03em">
            memoria
          </Title>
          <Text size="lg" c="dimmed">
            Study smarter. Remember everything.
          </Text>
        </Stack>
        <Group>
          <Button component={Link} href="/login" size="md" radius="md">
            Get started
          </Button>
          <Button component={Link} href="/login" variant="subtle" size="md" radius="md">
            Sign in
          </Button>
        </Group>
      </Stack>
    </Center>
  )
}
```

- [ ] **Step 2: Write render test**

```tsx
// app/__tests__/landing.test.tsx
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import LandingPage from '@/app/page'
import { theme } from '@/theme'

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

describe('LandingPage', () => {
  it('renders the app name', () => {
    render(<LandingPage />, { wrapper: Wrapper })
    expect(screen.getByText('memoria')).toBeInTheDocument()
  })

  it('renders the subtitle', () => {
    render(<LandingPage />, { wrapper: Wrapper })
    expect(screen.getByText('Study smarter. Remember everything.')).toBeInTheDocument()
  })

  it('renders a Get started link', () => {
    render(<LandingPage />, { wrapper: Wrapper })
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/login')
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npm run test:run
```
Expected: 3 passed (landing tests) + 10 session-logic tests = 13 total.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/__tests__/
git commit -m "feat: add landing page"
```

---

## Task 8: Auth Callback Route

**Files:**
- Create: `app/auth/callback/route.ts`

- [ ] **Step 1: Create OAuth callback handler**

```ts
// app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
```

- [ ] **Step 2: Commit**

```bash
git add app/auth/
git commit -m "feat: add Supabase OAuth callback route"
```

---

## Task 9: Login Page

**Files:**
- Create: `app/login/page.tsx`
- Create: `components/auth/LoginForm.tsx`

- [ ] **Step 1: Create LoginForm client component**

```tsx
// components/auth/LoginForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, PasswordInput, Button, Stack, Divider, Text, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconBrandGoogle } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: v => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: v => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  })

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(values)
    setLoading(false)
    if (error) {
      notifications.show({ message: error.message, color: 'red' })
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Stack gap="md">
      <Button
        leftSection={<IconBrandGoogle size={18} />}
        variant="default"
        size="md"
        onClick={handleGoogleLogin}
        fullWidth
      >
        Continue with Google
      </Button>

      <Divider label="or" labelPosition="center" />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            size="md"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            size="md"
            {...form.getInputProps('password')}
          />
          <Button type="submit" size="md" loading={loading} fullWidth mt="xs">
            Sign in
          </Button>
        </Stack>
      </form>

      <Text ta="center" size="sm" c="dimmed">
        No account?{' '}
        <Anchor component={Link} href="/signup">
          Sign up
        </Anchor>
      </Text>
    </Stack>
  )
}
```

- [ ] **Step 2: Create login page**

```tsx
// app/login/page.tsx
import { Center, Card, Title, Stack } from '@mantine/core'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <Center h="100dvh" bg="var(--mantine-color-body)">
      <Card w={400} p="xl" radius="md" withBorder shadow="sm">
        <Stack gap="lg">
          <Title order={2} fw={700} ta="center">
            Welcome back
          </Title>
          <LoginForm />
        </Stack>
      </Card>
    </Center>
  )
}
```

- [ ] **Step 3: Write render test**

```tsx
// components/auth/__tests__/LoginForm.test.tsx
import { render, screen } from '@testing-library/react'
import { MantineProvider } from '@mantine/core'
import LoginForm from '@/components/auth/LoginForm'
import { theme } from '@/theme'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: vi.fn(),
    },
  }),
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>
}

describe('LoginForm', () => {
  it('renders email and password fields', () => {
    render(<LoginForm />, { wrapper: Wrapper })
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('renders Google login button', () => {
    render(<LoginForm />, { wrapper: Wrapper })
    expect(screen.getByText(/continue with google/i)).toBeInTheDocument()
  })

  it('renders sign up link', () => {
    render(<LoginForm />, { wrapper: Wrapper })
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup')
  })
})
```

- [ ] **Step 4: Run tests**

```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/login/ components/auth/LoginForm.tsx components/auth/__tests__/
git commit -m "feat: add login page with Google OAuth and email/password"
```

---

## Task 10: Signup Page

**Files:**
- Create: `app/signup/page.tsx`
- Create: `components/auth/SignupForm.tsx`

- [ ] **Step 1: Create SignupForm**

```tsx
// components/auth/SignupForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, PasswordInput, Button, Stack, Divider, Text, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconBrandGoogle } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validate: {
      email: v => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: v => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
      confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match'),
    },
  })

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })
    setLoading(false)
    if (error) {
      notifications.show({ message: error.message, color: 'red' })
      return
    }
    notifications.show({
      message: 'Check your email to confirm your account.',
      color: 'green',
    })
    router.push('/login')
  }

  return (
    <Stack gap="md">
      <Button
        leftSection={<IconBrandGoogle size={18} />}
        variant="default"
        size="md"
        onClick={handleGoogleSignup}
        fullWidth
      >
        Continue with Google
      </Button>

      <Divider label="or" labelPosition="center" />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            size="md"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="Min. 8 characters"
            size="md"
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Repeat your password"
            size="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Button type="submit" size="md" loading={loading} fullWidth mt="xs">
            Create account
          </Button>
        </Stack>
      </form>

      <Text ta="center" size="sm" c="dimmed">
        Already have an account?{' '}
        <Anchor component={Link} href="/login">
          Sign in
        </Anchor>
      </Text>
    </Stack>
  )
}
```

- [ ] **Step 2: Create signup page**

```tsx
// app/signup/page.tsx
import { Center, Card, Title, Stack } from '@mantine/core'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <Center h="100dvh" bg="var(--mantine-color-body)">
      <Card w={400} p="xl" radius="md" withBorder shadow="sm">
        <Stack gap="lg">
          <Title order={2} fw={700} ta="center">
            Create your account
          </Title>
          <SignupForm />
        </Stack>
      </Card>
    </Center>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/signup/ components/auth/SignupForm.tsx
git commit -m "feat: add signup page with Google OAuth and email/password"
```

---

## Task 11: Protected Layout (Sidebar)

**Files:**
- Create: `app/(protected)/layout.tsx`
- Create: `components/layout/AppSidebar.tsx`

- [ ] **Step 1: Create AppSidebar**

```tsx
// components/layout/AppSidebar.tsx
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Stack, NavLink, Text, Box, Divider } from '@mantine/core'
import {
  IconLayoutDashboard, IconCards, IconTag,
  IconHistory, IconUser, IconLogout,
} from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: IconLayoutDashboard },
  { label: 'Questions', href: '/questions', icon: IconCards },
  { label: 'Topics', href: '/topics', icon: IconTag },
  { label: 'Sessions', href: '/sessions', icon: IconHistory },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Box
      w={220}
      h="100dvh"
      bg="#1e293b"
      style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '24px 12px' }}
    >
      <Text fw={700} size="lg" c="white" px={12} pb="xl" style={{ letterSpacing: '-0.02em' }}>
        memo<Text span c="sky.4" inherit>ria</Text>
      </Text>

      <Text size="xs" fw={600} tt="uppercase" c="gray.6" px={12} pb={4} style={{ letterSpacing: '0.08em' }}>
        Main
      </Text>

      <Stack gap={2} style={{ flex: 1 }}>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            component={Link}
            href={href}
            label={label}
            leftSection={<Icon size={16} />}
            active={pathname === href || (href !== '/dashboard' && pathname.startsWith(href))}
            styles={{
              root: {
                color: 'var(--mantine-color-gray-4)',
                borderRadius: '8px',
                '&[dataActive]': { background: 'rgba(14,165,233,0.15)', color: 'var(--mantine-color-sky-4)' },
              },
            }}
          />
        ))}
      </Stack>

      <Divider color="gray.8" my="md" />

      <Text size="xs" fw={600} tt="uppercase" c="gray.6" px={12} pb={4} style={{ letterSpacing: '0.08em' }}>
        Account
      </Text>
      <Stack gap={2}>
        <NavLink
          component={Link}
          href="/profile"
          label="Profile"
          leftSection={<IconUser size={16} />}
          styles={{ root: { color: 'var(--mantine-color-gray-4)', borderRadius: '8px' } }}
        />
        <NavLink
          label="Logout"
          leftSection={<IconLogout size={16} />}
          onClick={handleLogout}
          styles={{ root: { color: 'var(--mantine-color-red-4)', borderRadius: '8px', cursor: 'pointer' } }}
        />
      </Stack>
    </Box>
  )
}
```

- [ ] **Step 2: Create protected layout**

```tsx
// app/(protected)/layout.tsx
import { Box } from '@mantine/core'
import AppSidebar from '@/components/layout/AppSidebar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box style={{ display: 'flex', minHeight: '100dvh' }}>
      <AppSidebar />
      <Box style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9' }} p="xl">
        {children}
      </Box>
    </Box>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/\(protected\)/ components/layout/
git commit -m "feat: add protected layout with dark navy sidebar"
```

---

## Task 12: Topics Page

**Files:**
- Create: `app/(protected)/topics/page.tsx`
- Create: `components/topics/TopicTable.tsx`
- Create: `components/topics/TopicFormModal.tsx`

- [ ] **Step 1: Create TopicFormModal**

```tsx
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
```

- [ ] **Step 2: Create TopicTable**

```tsx
// components/topics/TopicTable.tsx
'use client'
import { useState } from 'react'
import { Table, Button, Group, Text, ActionIcon, Stack, Badge } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import TopicFormModal from './TopicFormModal'
import type { Topic } from '@/lib/types'

interface TopicWithCount extends Topic { question_count: number }

interface Props { initialTopics: TopicWithCount[] }

export default function TopicTable({ initialTopics }: Props) {
  const supabase = createClient()
  const [topics, setTopics] = useState(initialTopics)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [opened, { open, close }] = useDisclosure(false)

  async function refresh() {
    const { data } = await supabase
      .from('topics')
      .select('*, question_count:questions(count)')
      .order('created_at', { ascending: false })
    if (data) setTopics(data.map(t => ({ ...t, question_count: (t.question_count as any)[0]?.count ?? 0 })))
  }

  function handleEdit(topic: Topic) {
    setEditing(topic)
    open()
  }

  function handleDelete(topic: Topic) {
    modals.openConfirmModal({
      title: 'Delete topic',
      children: <Text size="sm">Delete "{topic.name}"? Questions in this topic will become unassigned.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabase.from('topics').delete().eq('id', topic.id)
        if (error) { notifications.show({ message: error.message, color: 'red' }); return }
        notifications.show({ message: 'Topic deleted.', color: 'green' })
        await refresh()
      },
    })
  }

  return (
    <>
      <Stack gap="md">
        <Group justify="flex-end">
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditing(null); open() }}>
            New topic
          </Button>
        </Group>

        {topics.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No topics yet. Create your first topic above.</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Questions</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topics.map(topic => (
                <Table.Tr key={topic.id}>
                  <Table.Td fw={500}>{topic.name}</Table.Td>
                  <Table.Td><Badge variant="light">{topic.question_count}</Badge></Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" onClick={() => handleEdit(topic)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(topic)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      <TopicFormModal
        opened={opened}
        onClose={close}
        onSaved={refresh}
        topic={editing}
      />
    </>
  )
}
```

- [ ] **Step 3: Create topics page (Server Component)**

```tsx
// app/(protected)/topics/page.tsx
import { Title, Text, Stack } from '@mantine/core'
import { createClient } from '@/lib/supabase/server'
import TopicTable from '@/components/topics/TopicTable'

export default async function TopicsPage() {
  const supabase = await createClient()
  const { data: topics } = await supabase
    .from('topics')
    .select('*, question_count:questions(count)')
    .order('created_at', { ascending: false })

  const topicsWithCount = (topics ?? []).map(t => ({
    ...t,
    question_count: (t.question_count as any)[0]?.count ?? 0,
  }))

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} fw={700}>Topics</Title>
        <Text c="dimmed" size="sm">Organize your questions into topics.</Text>
      </div>
      <TopicTable initialTopics={topicsWithCount} />
    </Stack>
  )
}
```

- [ ] **Step 4: Add ModalsProvider to root layout**

Mantine's `modals.openConfirmModal` requires `ModalsProvider`. Update `app/layout.tsx`:

```tsx
// app/layout.tsx — add ModalsProvider
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import { Inter } from 'next/font/google'
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import { theme } from '@/theme'

const inter = Inter({ subsets: ['latin'] })

export const metadata = { title: 'Memoria', description: 'Study smarter. Remember everything.' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <ModalsProvider>
            <Notifications />
            {children}
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  )
}
```

Also add `@mantine/modals` to dependencies:
```bash
npm install @mantine/modals
```
And add styles import in `app/layout.tsx`:
```tsx
import '@mantine/modals/styles.css'
```

- [ ] **Step 5: Commit**

```bash
git add app/\(protected\)/topics/ components/topics/
git commit -m "feat: add topics CRUD page"
```

---

## Task 13: Image Upload Utility

**Files:**
- Create: `components/ui/ImageUpload.tsx`

- [ ] **Step 1: Create ImageUpload component**

```tsx
// components/ui/ImageUpload.tsx
'use client'
import { useState } from 'react'
import { Box, Button, Image, Text, Stack, ActionIcon } from '@mantine/core'
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import { notifications } from '@mantine/notifications'

interface Props {
  label: string
  value: string | null          // current storage path
  onChange: (path: string | null) => void
  userId: string
}

export default function ImageUpload({ label, value, onChange, userId }: Props) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('card-images').upload(path, file)
    setUploading(false)

    if (error) {
      notifications.show({ message: error.message, color: 'red' })
      return
    }

    onChange(path)
    // Generate a temporary preview URL
    const { data } = await supabase.storage.from('card-images').createSignedUrl(path, 60)
    if (data) setPreviewUrl(data.signedUrl)
  }

  async function handleRemove() {
    if (value) {
      await supabase.storage.from('card-images').remove([value])
    }
    onChange(null)
    setPreviewUrl(null)
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>{label}</Text>
      {previewUrl || value ? (
        <Box pos="relative" w={120} h={80}>
          <Image src={previewUrl ?? undefined} alt={label} radius="sm" h={80} w={120} fit="cover" />
          <ActionIcon
            pos="absolute" top={4} right={4}
            size="xs" color="red" variant="filled"
            onClick={handleRemove}
          >
            <IconX size={10} />
          </ActionIcon>
        </Box>
      ) : (
        <Button
          component="label"
          variant="default"
          leftSection={<IconUpload size={14} />}
          loading={uploading}
          size="sm"
          w="fit-content"
        >
          Upload image
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </Button>
      )}
      {!previewUrl && !value && (
        <Text size="xs" c="dimmed">Optional</Text>
      )}
    </Stack>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/
git commit -m "feat: add image upload component with Supabase Storage"
```

---

## Task 14: Questions Page

**Files:**
- Create: `app/(protected)/questions/page.tsx`
- Create: `components/questions/QuestionTable.tsx`
- Create: `components/questions/QuestionFormModal.tsx`

- [ ] **Step 1: Create QuestionFormModal**

```tsx
// components/questions/QuestionFormModal.tsx
'use client'
import { Modal, TextInput, Textarea, Select, Stack, Button, Group, Divider } from '@mantine/core'
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
```

- [ ] **Step 2: Create QuestionTable**

```tsx
// components/questions/QuestionTable.tsx
'use client'
import { useState, useMemo } from 'react'
import { Table, Badge, ActionIcon, Group, TextInput, Select, Stack, Button, Text, Tooltip } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'
import { IconEdit, IconTrash, IconPlus, IconSearch, IconFlame, IconStar } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import QuestionFormModal from './QuestionFormModal'
import type { Question, Topic, QuestionWithTopic } from '@/lib/types'

interface Props {
  initialQuestions: QuestionWithTopic[]
  topics: Topic[]
  userId: string
}

export default function QuestionTable({ initialQuestions, topics, userId }: Props) {
  const supabase = createClient()
  const [questions, setQuestions] = useState(initialQuestions)
  const [editing, setEditing] = useState<Question | null>(null)
  const [opened, { open, close }] = useDisclosure(false)
  const [search, setSearch] = useState('')
  const [topicFilter, setTopicFilter] = useState<string | null>(null)

  async function refresh() {
    const { data } = await supabase
      .from('questions')
      .select('*, topic:topics(id, name)')
      .order('created_at', { ascending: false })
    if (data) setQuestions(data as QuestionWithTopic[])
  }

  function handleEdit(q: Question) { setEditing(q); open() }

  function handleDelete(q: Question) {
    modals.openConfirmModal({
      title: 'Delete question',
      children: <Text size="sm">Delete this question? This cannot be undone.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const { error } = await supabase.from('questions').delete().eq('id', q.id)
        if (error) { notifications.show({ message: error.message, color: 'red' }); return }
        notifications.show({ message: 'Question deleted.', color: 'green' })
        await refresh()
      },
    })
  }

  const filtered = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = !search || q.question.toLowerCase().includes(search.toLowerCase())
      const matchesTopic = !topicFilter || q.topic_id === topicFilter
      return matchesSearch && matchesTopic
    })
  }, [questions, search, topicFilter])

  const topicOptions = [{ value: '', label: 'All topics' }, ...topics.map(t => ({ value: t.id, label: t.name }))]

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="sm">
            <TextInput
              placeholder="Search questions…"
              leftSection={<IconSearch size={14} />}
              value={search}
              onChange={e => setSearch(e.currentTarget.value)}
              w={240}
            />
            <Select
              data={topicOptions}
              value={topicFilter ?? ''}
              onChange={v => setTopicFilter(v || null)}
              w={180}
            />
          </Group>
          <Button leftSection={<IconPlus size={16} />} onClick={() => { setEditing(null); open() }}>
            Add question
          </Button>
        </Group>

        {filtered.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">No questions found.</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder withColumnBorders>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Question</Table.Th>
                <Table.Th>Topic</Table.Th>
                <Table.Th>Streak</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th w={80}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.map(q => (
                <Table.Tr key={q.id}>
                  <Table.Td maw={400} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.question}
                  </Table.Td>
                  <Table.Td>
                    {q.topic ? <Badge variant="light">{q.topic.name}</Badge> : <Text c="dimmed" size="sm">—</Text>}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      <IconFlame size={14} color={q.streak > 0 ? '#f59e0b' : '#94a3b8'} />
                      <Text size="sm" fw={600}>{q.streak}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {q.is_memorized && (
                      <Badge color="green" leftSection={<IconStar size={10} />}>Memorized</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end">
                      <ActionIcon variant="subtle" onClick={() => handleEdit(q)}><IconEdit size={16} /></ActionIcon>
                      <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(q)}><IconTrash size={16} /></ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      <QuestionFormModal
        opened={opened}
        onClose={close}
        onSaved={refresh}
        topics={topics}
        question={editing}
        userId={userId}
      />
    </>
  )
}
```

- [ ] **Step 3: Create questions page (Server Component)**

```tsx
// app/(protected)/questions/page.tsx
import { Title, Text, Stack } from '@mantine/core'
import { createClient } from '@/lib/supabase/server'
import QuestionTable from '@/components/questions/QuestionTable'
import type { QuestionWithTopic } from '@/lib/types'

export default async function QuestionsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: questions }, { data: topics }] = await Promise.all([
    supabase.from('questions').select('*, topic:topics(id, name)').order('created_at', { ascending: false }),
    supabase.from('topics').select('*').order('name'),
  ])

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} fw={700}>Questions</Title>
        <Text c="dimmed" size="sm">Manage your flashcard questions.</Text>
      </div>
      <QuestionTable
        initialQuestions={(questions ?? []) as QuestionWithTopic[]}
        topics={topics ?? []}
        userId={user!.id}
      />
    </Stack>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(protected\)/questions/ components/questions/
git commit -m "feat: add questions CRUD page with image upload and topic filter"
```

---

## Task 15: Session Configurator + History

**Files:**
- Create: `app/(protected)/sessions/page.tsx`
- Create: `components/sessions/SessionConfigurator.tsx`
- Create: `components/sessions/SessionHistoryTable.tsx`

- [ ] **Step 1: Create SessionConfigurator**

```tsx
// components/sessions/SessionConfigurator.tsx
'use client'
import { useState } from 'react'
import { Card, Title, Stack, MultiSelect, NumberInput, Switch, Button, Text } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { createClient } from '@/lib/supabase/client'
import { weightedSample } from '@/lib/session-logic'
import type { Topic, Question } from '@/lib/types'

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
```

- [ ] **Step 2: Create SessionHistoryTable**

```tsx
// components/sessions/SessionHistoryTable.tsx
import { Table, Badge, Text, Group } from '@mantine/core'
import type { SessionWithStats } from '@/lib/types'

interface Props { sessions: SessionWithStats[] }

export default function SessionHistoryTable({ sessions }: Props) {
  if (sessions.length === 0) {
    return <Text c="dimmed" ta="center" py="xl">No sessions yet. Start your first session above.</Text>
  }

  return (
    <Table striped highlightOnHover withTableBorder withColumnBorders>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Questions</Table.Th>
          <Table.Th>Correct</Table.Th>
          <Table.Th>Needed review</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sessions.map(s => (
          <Table.Tr key={s.id}>
            <Table.Td>{new Date(s.created_at).toLocaleDateString()}</Table.Td>
            <Table.Td>{s.total_count}</Table.Td>
            <Table.Td>
              <Badge color="green" variant="light">{s.correct_count}</Badge>
            </Table.Td>
            <Table.Td>
              {s.wrong_count > 0
                ? <Badge color="red" variant="light">{s.wrong_count}</Badge>
                : <Text c="dimmed" size="sm">—</Text>
              }
            </Table.Td>
            <Table.Td>
              {s.completed_at
                ? <Badge color="green">Completed</Badge>
                : <Badge color="yellow">Incomplete</Badge>
              }
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
```

- [ ] **Step 3: Create sessions page (Server Component)**

```tsx
// app/(protected)/sessions/page.tsx
import { Title, Text, Stack } from '@mantine/core'
import { createClient } from '@/lib/supabase/server'
import SessionConfigurator from '@/components/sessions/SessionConfigurator'
import SessionHistoryTable from '@/components/sessions/SessionHistoryTable'
import type { SessionWithStats } from '@/lib/types'

export default async function SessionsPage() {
  const supabase = await createClient()

  const [{ data: topics }, { data: sessions }] = await Promise.all([
    supabase.from('topics').select('*').order('name'),
    supabase.from('sessions')
      .select('*, session_questions(result)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const sessionsWithStats: SessionWithStats[] = (sessions ?? []).map(s => {
    const sqs = s.session_questions as { result: string }[]
    return {
      ...s,
      session_questions: undefined,
      total_count: sqs.length,
      correct_count: sqs.filter(sq => sq.result === 'correct').length,
      wrong_count: sqs.filter(sq => sq.result === 'wrong').length,
    } as SessionWithStats
  })

  return (
    <Stack gap="xl">
      <div>
        <Title order={2} fw={700}>Sessions</Title>
        <Text c="dimmed" size="sm">Configure and start a study session.</Text>
      </div>
      <SessionConfigurator topics={topics ?? []} />
      <div>
        <Title order={4} mb="md">History</Title>
        <SessionHistoryTable sessions={sessionsWithStats} />
      </div>
    </Stack>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/\(protected\)/sessions/page.tsx components/sessions/SessionConfigurator.tsx components/sessions/SessionHistoryTable.tsx
git commit -m "feat: add session configurator and history page"
```

---

## Task 16: Study Session Page

**Files:**
- Create: `app/(protected)/sessions/[id]/page.tsx`
- Create: `components/sessions/StudySession.tsx`

- [ ] **Step 1: Write failing test for StudySession queue logic**

```ts
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
```

- [ ] **Step 2: Run tests**

```bash
npm run test:run
```
Expected: 5 study-queue tests pass + all previous tests.

- [ ] **Step 3: Create StudySession client component**

```tsx
// components/sessions/StudySession.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { Box, Card, Text, Button, Group, Progress, Badge, Stack, Center, Title } from '@mantine/core'
import { useRouter } from 'next/navigation'
import { notifications } from '@mantine/notifications'
import { IconArrowLeft, IconArrowRight, IconCheck, IconX } from '@tabler/icons-react'
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
  const [queue] = useState<QueueItem[]>(() =>
    initialSessionQuestions.map(sq => ({
      sqId: sq.id,
      question: sq.question,
      isRetry: false,
    }))
  )
  const [currentQueue, setCurrentQueue] = useState<QueueItem[]>(queue)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('question')

  // Track first answers only (sqId → result)
  const [firstAnswers, setFirstAnswers] = useState<Record<string, 'correct' | 'wrong'>>({})

  const currentItem = currentQueue[currentIndex]
  const isComplete = currentIndex >= currentQueue.length
  const progress = Math.round((currentIndex / currentQueue.length) * 100)

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
      const sqToQuestion: Record<string, string> = {}
      const questionStreaks: Record<string, number> = {}
      initialSessionQuestions.forEach(sq => {
        sqToQuestion[sq.id] = sq.question_id
        questionStreaks[sq.question_id] = sq.question.streak
      })

      const sessionResults = Object.entries(firstAnswers).map(([sqId, result]) => ({
        questionId: sqToQuestion[sqId],
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
    const qId = sq.question_id
    const qStreak = sq.question.streak
    const firstAnswer = Object.entries(firstAnswers).find(([sqId]) => sqToQuestion(sqId, initialSessionQuestions) === qId)
    return firstAnswer?.[1] === 'correct' && qStreak + 1 >= 10
  }).length

  if (phase === 'complete') {
    return (
      <Center h="100dvh" bg="var(--mantine-color-body)">
        <Card w={460} p="xl" radius="md" withBorder shadow="sm" ta="center">
          <Stack gap="lg" align="center">
            <Text size="3rem">🎉</Text>
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
            {/* Question image would render here */}

            {phase === 'answer' && (
              <>
                <Box w="100%" style={{ borderTop: '1px dashed var(--mantine-color-gray-3)' }} />
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} style={{ letterSpacing: '0.08em' }}>
                  Answer
                </Text>
                <Text size="lg" fw={600} c="green">{currentItem.question.answer}</Text>
                {/* Answer image would render here */}
              </>
            )}
          </Stack>
        </Card>

        {/* Actions */}
        {phase === 'question' && (
          <Button size="md" variant="filled" color="dark" onClick={handleReveal}>
            Reveal answer{' '}
            <Badge ml="xs" variant="light" color="gray" size="xs">Space</Badge>
          </Button>
        )}

        {phase === 'answer' && (
          <Group grow>
            <Button
              size="md"
              color="red"
              variant="light"
              leftSection={<Text size="xs" fw={700}>←</Text>}
              onClick={() => handleGrade('wrong')}
            >
              Missed it
            </Button>
            <Button
              size="md"
              color="green"
              variant="light"
              rightSection={<Text size="xs" fw={700}>→</Text>}
              onClick={() => handleGrade('correct')}
            >
              Got it
            </Button>
          </Group>
        )}

        {/* Keyboard hint bar */}
        {phase === 'answer' && (
          <Group justify="space-between" px="xs">
            <Text size="xs" c="dimmed"><kbd>←</kbd> Missed it</Text>
            <Text size="xs" c="dimmed">Got it <kbd>→</kbd></Text>
          </Group>
        )}

        {/* Topic + streak */}
        <Group justify="space-between" px="xs">
          <Text size="xs" c="dimmed">{currentItem.question.topic?.name ?? 'No topic'}</Text>
          <Text size="xs" c="dimmed">🔥 Streak: {currentItem.question.streak}</Text>
        </Group>
      </Stack>
    </Center>
  )
}

function sqToQuestion(sqId: string, sqs: Array<{ id: string; question_id: string }>) {
  return sqs.find(sq => sq.id === sqId)?.question_id ?? ''
}
```

- [ ] **Step 4: Create session page (Server Component)**

```tsx
// app/(protected)/sessions/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StudySession from '@/components/sessions/StudySession'

export default async function SessionPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!session) notFound()
  if (session.user_id !== user!.id) notFound()
  if (session.completed_at) redirect('/sessions')

  const { data: sessionQuestions } = await supabase
    .from('session_questions')
    .select('*, question:questions(*, topic:topics(name))')
    .eq('session_id', params.id)
    .order('position')

  if (!sessionQuestions || sessionQuestions.length === 0) notFound()

  return (
    <StudySession
      sessionId={params.id}
      initialSessionQuestions={sessionQuestions as any}
    />
  )
}
```

- [ ] **Step 5: Make session page use a full-screen layout (no sidebar)**

The session page is inside `(protected)` which adds the sidebar layout. Override it by adding a layout override:

```tsx
// app/(protected)/sessions/[id]/layout.tsx
export default function SessionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

Wait — this doesn't remove the parent `(protected)/layout.tsx` sidebar. To solve this, move the session route outside `(protected)`:

**Move:** `app/(protected)/sessions/[id]/` → `app/sessions/[id]/`

Update `middleware.ts` to also protect `/sessions/` prefix (already covered by `PROTECTED_PREFIXES`). The session page will use the root layout only (Mantine + no sidebar).

Final file path: `app/sessions/[id]/page.tsx`

- [ ] **Step 6: Run all tests**

```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add app/sessions/ components/sessions/StudySession.tsx lib/__tests__/study-queue.test.ts
git commit -m "feat: add full-screen study session with keyboard shortcuts and streak commit"
```

---

## Task 17: Dashboard Overview

**Files:**
- Create: `app/(protected)/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page**

```tsx
// app/(protected)/dashboard/page.tsx
import { Title, Text, Stack, SimpleGrid, Card, Group } from '@mantine/core'
import { IconCards, IconStar, IconTag, IconHistory } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/server'

interface StatCardProps { label: string; value: number; icon: React.ReactNode; color: string }

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card withBorder shadow="sm" p="lg" radius="md">
      <Group justify="space-between" mb="xs">
        <Text size="sm" c="dimmed" fw={500}>{label}</Text>
        <Text c={color}>{icon}</Text>
      </Group>
      <Text size="2rem" fw={700} c={color} style={{ letterSpacing: '-0.03em' }}>
        {value}
      </Text>
    </Card>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const [
    { count: totalQuestions },
    { count: memorizedCount },
    { count: topicsCount },
    { count: sessionsThisWeek },
  ] = await Promise.all([
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    supabase.from('questions').select('*', { count: 'exact', head: true }).eq('is_memorized', true),
    supabase.from('topics').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true })
      .gte('created_at', oneWeekAgo.toISOString()),
  ])

  return (
    <Stack gap="lg">
      <div>
        <Title order={2} fw={700}>Overview</Title>
        <Text c="dimmed" size="sm">Welcome back — here's how your study is going.</Text>
      </div>
      <SimpleGrid cols={4} spacing="md">
        <StatCard label="Total Questions" value={totalQuestions ?? 0} icon={<IconCards size={20} />} color="sky" />
        <StatCard label="Memorized" value={memorizedCount ?? 0} icon={<IconStar size={20} />} color="green" />
        <StatCard label="Topics" value={topicsCount ?? 0} icon={<IconTag size={20} />} color="gray" />
        <StatCard label="Sessions this week" value={sessionsThisWeek ?? 0} icon={<IconHistory size={20} />} color="violet" />
      </SimpleGrid>
    </Stack>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/\(protected\)/dashboard/
git commit -m "feat: add dashboard overview with stats"
```

---

## Task 18: Final Wiring + Smoke Test

- [ ] **Step 1: Add redirect from `/` for unauthenticated users**

The landing page is already at `app/page.tsx` and middleware already handles redirect of authenticated users to `/dashboard`. Verify the root route works end-to-end.

- [ ] **Step 2: Add `.gitignore` entries**

Ensure these are in `.gitignore`:
```
.env.local
.env.*.local
.superpowers/
```

- [ ] **Step 3: Run full test suite**

```bash
npm run test:run
```
Expected: All tests pass.

- [ ] **Step 4: Run dev server and smoke-test manually**

```bash
npm run dev
```

Verify each flow:
- [ ] Landing page renders at `http://localhost:3000`
- [ ] `/login` shows Google button + email form
- [ ] `/signup` shows sign up form
- [ ] Unauthenticated visit to `/dashboard` redirects to `/login`
- [ ] After login, `/dashboard` shows stats
- [ ] Topics CRUD works (create, edit, delete)
- [ ] Questions CRUD works (create with topic, edit, delete)
- [ ] Session configuration creates a session and redirects to `/sessions/[id]`
- [ ] Study session: Space reveals answer, → marks correct, ← marks wrong, wrong re-queues
- [ ] Completion screen shows stats, streak/memorized updates persist in Supabase

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Memoria app — auth, CRUD, study sessions"
```

---

## Notes

- **Google OAuth:** requires a Google Cloud project with OAuth 2.0 credentials. Add `http://localhost:3000/auth/callback` as an authorized redirect URI in both Google Cloud Console and Supabase Auth settings.
- **Supabase Storage signed URLs:** The `ImageUpload` component generates 60-second signed URLs for preview. In `StudySession`, signed URLs for card images need to be fetched before rendering — extend `StudySession` to fetch them on mount if images are present.
- **Dark mode toggle:** The spec requires a manual toggle. Add a `useMantineColorScheme` hook button to `AppSidebar` (or the Profile page) — call `toggleColorScheme()` and persist via Mantine's built-in cookie support (`localStorageManager` or `cookieStorageManagerSSR` from `@mantine/core`). The sidebar hardcodes `#1e293b` — it is intentionally always dark regardless of scheme.
- **Profile page:** The sidebar links to `/profile` but no implementation is included in this plan. Add `app/(protected)/profile/page.tsx` as a stub (user email display + logout button) after the core features are working.
- **`@mantine/modals`:** requires `ModalsProvider` in the root layout AND `import '@mantine/modals/styles.css'`.
