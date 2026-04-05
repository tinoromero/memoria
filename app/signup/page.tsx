import { Center, Card, Title, Stack } from '@mantine/core'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <Center h="100dvh" bg="var(--mantine-color-body)">
      <Card w={400} p="xl" radius="md" withBorder shadow="sm">
        <Stack gap="lg">
          <Title order={2} fw={700} ta="center">
            Create your account
          </Title>
          <SignupForm />
        </Stack>
      </Card>
    </Center>
  )
}
