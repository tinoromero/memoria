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
