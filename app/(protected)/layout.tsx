// app/(protected)/layout.tsx
import { redirect } from 'next/navigation'
import { Box } from '@mantine/core'
import AppSidebar from '@/components/layout/AppSidebar'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: the middleware already gates these routes, but never
  // trust it as the only check for authenticated data access.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <Box style={{ display: 'flex', minHeight: '100dvh' }}>
      <AppSidebar />
      <Box style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9' }} p="xl">
        {children}
      </Box>
    </Box>
  )
}
