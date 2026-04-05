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
    expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0)
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
