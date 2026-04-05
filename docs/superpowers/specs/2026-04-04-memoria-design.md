# Memoria — Design Spec

**Date:** 2026-04-04
**Status:** Approved

---

## 1. Overview

Memoria is a flashcard-based study app where users upload question/answer pairs, run configurable study sessions, and track long-term memorization via a streak-based scoring system. The app is built as a single-user-per-account web app with full authentication.

---

## 2. Tech Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js (App Router) |
| Architecture | Hybrid SSR + Client Components |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Google OAuth + email/password |
| File Storage | Supabase Storage (card images) |
| UI Library | Mantine v7 |
| Font | Inter |
| Color scheme | System-aware dark/light mode via Mantine ColorScheme |

### Architecture notes

- **Server Components** handle initial data fetching (question lists, session config, dashboard stats)
- **Client Components** handle interactive UI (study session, forms, modals)
- Two Supabase client instances via `@supabase/ssr`: one for server (cookies), one for browser
- Route protection via Next.js middleware — unauthenticated users are redirected server-side, no client flash

---

## 3. Visual Design

### Style

Dark navy sidebar + light content area. Clean, focused, contrast-forward.

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| Sidebar | `#1e293b` | Navigation background |
| Primary | `#0ea5e9` | Active nav, primary buttons, stat highlights |
| Background | `#f1f5f9` | Page background |
| Surface | `#ffffff` | Cards, tables, inputs |
| Success | `#059669` | Memorized badge, "Got it" button, correct streak |
| Danger | `#dc2626` | "Missed it" button, error states |
| Text primary | `#0f172a` | Headings, body |
| Text muted | `#94a3b8` | Labels, hints, secondary info |
| Border | `#e2e8f0` | Card and table borders |

### Typography

- **Font:** Inter
- **Scale:** 11px labels → 13px body → 14px nav → 22px page titles
- **Weights:** 400 body, 500 nav, 600 labels/buttons, 700 headings

### Layout

- Sidebar: 220px fixed, dark navy (`#1e293b`), white text
- Content area: `#f1f5f9` background, max content width ~900px
- Study session (`/sessions/[id]`): full-screen, no sidebar, centered card layout

---

## 4. Database Schema

All tables use Supabase Row Level Security (RLS). Every table references `auth.users(id)` via `user_id`.

### `topics`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid FK | → auth.users, cascade delete |
| name | text | not null |
| created_at | timestamptz | default now() |

### `questions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid FK | → auth.users, cascade delete |
| topic_id | uuid FK | → topics, nullable, set null on topic delete |
| question | text | not null |
| question_image_path | text | nullable — Supabase Storage path |
| answer | text | not null |
| answer_image_path | text | nullable — Supabase Storage path |
| streak | int | default 0 |
| is_memorized | bool | default false |
| created_at | timestamptz | default now() |

### `sessions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid FK | → auth.users, cascade delete |
| topic_ids | uuid[] | nullable — null means all topics |
| question_count | int | not null — number of questions selected at session start |
| include_memorized | bool | default false |
| completed_at | timestamptz | nullable — null means session in progress |
| created_at | timestamptz | default now() |

### `session_questions`

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | default gen_random_uuid() |
| session_id | uuid FK | → sessions, cascade delete |
| question_id | uuid FK | → questions, cascade delete |
| result | enum | `correct` \| `wrong` \| `pending` — default `pending`. Set on the **first answer only**. Re-queued appearances do not update this value. |
| position | int | display order in the initial session queue |

---

## 5. Pages & Routing

### Public routes

| Route | Description |
|-------|-------------|
| `/` | Landing page. Minimalist hero: app name, subtitle, single "Get started" CTA. Redirects to `/dashboard` if already logged in. |
| `/login` | Google OAuth button + email/password form. Link to `/signup`. |
| `/signup` | Google OAuth button + email/password + name form. Link to `/login`. |

### Protected routes (require auth — middleware redirect)

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview stats: total questions, memorized count, topics count, sessions this week. |
| `/questions` | Full question list. Search by text, filter by topic. Create (batch), edit, delete. Shows streak badge + memorized indicator per row. |
| `/topics` | Topic list. Create, edit, delete. Shows question count per topic. |
| `/sessions` | Session configurator (topic multi-select, question count, include memorized toggle) + session history table. |
| `/sessions/[id]` | Active study session. Full-screen, no sidebar. Keyboard shortcuts. Completion screen at end. |

All protected routes share a sidebar layout component. `/sessions/[id]` uses a separate full-screen layout.

---

## 6. Study Session

### Configuration

User selects:
- **Topics** (multi-select, optional — empty means all topics)
- **Question count** (number input — capped at available eligible questions)
- **Include memorized** (toggle — default off)

### Question selection (weighted random)

Eligible questions are filtered by topic and memorization status, then sampled using weighted random selection:

```
weight = 1 / (streak + 1)
```

streak 0 → weight 1.0, streak 5 → weight 0.17, streak 9 → weight 0.1. Lower-streak questions are significantly more likely to be selected.

### Session flow

1. **Question shown** — answer hidden. "Reveal answer" button + `Space` shortcut.
2. **Answer revealed** — question and answer both visible. Two buttons:
   - ← **Missed it** (`←` key) — records `result = wrong`, streak will reset to 0 at session end, question re-queued for practice
   - **Got it** → (`→` key) — records `result = correct`, streak +1 at session end (if streak reaches 10: `is_memorized = true`)
3. **Re-queue loop** — wrong questions are appended to the end of the queue and shown again. When re-shown, the user still goes through the full reveal/grade cycle, but **the result is already locked from the first answer** — re-queue grades are ignored for scoring purposes. The loop ends when every question has been seen at least once correctly in the current pass.
4. **Completion screen** — shows: total "Got it" (result = correct), "Needed review" (result = wrong), newly memorized count. Buttons: "Back to sessions" and "Start new session".

### Mid-session navigation

If the user navigates away from `/sessions/[id]` before completing, the session remains with `completed_at = null` (in progress). On return, the session is **not** resumed — it is shown as incomplete in the session history. Streak updates are not committed for incomplete sessions.

### Streak updates

All streak and `is_memorized` updates are written to Supabase in a single batch at session completion — not after each card flip. Only the first answer per question determines the streak delta: `correct` → streak +1 (cap check for memorization), `wrong` → streak = 0.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Reveal answer |
| `→` | Got it (correct) |
| `←` | Missed it (wrong) |

Shortcut hints are displayed inline on buttons and in a hint bar below the grading buttons.

---

## 7. Flashcard Content Model

Each flashcard side (question and answer) has:
- **Text** — required, used for search, list previews, and display
- **Image** — optional, stored in Supabase Storage under a private per-user folder. DB stores the storage path, not a public URL. Signed URLs are generated at display time.

---

## 8. Authentication

- **Providers:** Google OAuth + email/password
- **Implementation:** Supabase Auth handles all OAuth flows. Callback URL configured in Supabase dashboard.
- **Session management:** Supabase session stored in cookies, refreshed via `@supabase/ssr` middleware
- **Route protection:** Next.js middleware checks for valid session on all `/dashboard`, `/questions`, `/topics`, `/sessions` routes. Redirects to `/login` if unauthenticated.
- **Login/Signup UI:** Google button on top, horizontal divider ("or"), email/password form below.

---

## 9. Dark / Light Mode

System-aware via Mantine's `ColorScheme`. Respects OS preference on first load. User can toggle manually (stored in cookie for SSR consistency). All color tokens defined as Mantine theme variables so both modes work without per-component overrides.
