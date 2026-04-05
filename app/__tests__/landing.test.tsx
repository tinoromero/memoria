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
