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
