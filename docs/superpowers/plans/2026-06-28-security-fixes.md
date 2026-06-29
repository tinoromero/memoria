# Security Fixes Plan

Addresses three exploitable vulnerabilities found during security bounty hunt on 2026-06-28.

---

## Step 1 — Fix open redirect in auth callback

**Intent**: The `next` query parameter in `/auth/callback` is user-controlled and appended directly to `origin` without validation. Passing `next=@evil.com` constructs the URL `https://app.com@evil.com`, which browsers interpret as redirecting to `evil.com`. Add a guard that ensures `next` is a safe relative path (starts with `/`, does not start with `//`), falling back to `/dashboard`.

**File**: `app/auth/callback/route.ts:7,13`

**Acceptance**:
- `next=@evil.com` redirects to `/dashboard`, not `evil.com`
- `next=//evil.com` redirects to `/dashboard`
- `next=/questions` redirects to `/questions` (valid path still works)

---

## Step 2 — Wire up the authentication middleware

**Intent**: The auth guard logic lives in `proxy.ts` and exports a `proxy` function and `config`, but no `middleware.ts` file exists in the project root. Next.js only executes middleware from `middleware.ts`, so the entire auth guard is dead code and never runs. Create `middleware.ts` at the project root that re-exports `proxy` as `middleware` and re-exports `config`. Verify all protected routes redirect unauthenticated users to `/login`.

**Files**: `proxy.ts` (source), new `middleware.ts` (to create)

**Acceptance**:
- `GET /dashboard` without session cookie returns 302 to `/login`
- `GET /questions` without session cookie returns 302 to `/login`
- `GET /sessions/<any-id>` without session cookie returns 302 to `/login`
- Authenticated users are not affected

---

## Step 3 — Add MIME type validation to image upload

**Intent**: File type is only enforced via `accept="image/*"` on the HTML input, which is trivially bypassed. The file extension is trusted from the filename. An attacker can upload an SVG containing embedded JavaScript; if Supabase serves it with `Content-Type: image/svg+xml`, the browser executes the script. Add a client-side allowlist check on `file.type` (JPEG, PNG, GIF, WebP) that rejects files before they reach Supabase Storage.

**File**: `components/ui/ImageUpload.tsx:31-39`

**Acceptance**:
- Uploading a `.svg` file is rejected with an error notification
- Uploading a `.html` file is rejected with an error notification
- Uploading a valid `.jpg` or `.png` proceeds as before
