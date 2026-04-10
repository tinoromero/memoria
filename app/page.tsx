// app/page.tsx
'use client'
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
