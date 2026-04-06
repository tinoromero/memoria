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
