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
