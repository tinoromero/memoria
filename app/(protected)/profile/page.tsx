// app/(protected)/profile/page.tsx
import { Title, Text, Stack } from '@mantine/core'

export default function ProfilePage() {
  return (
    <Stack gap="lg">
      <div>
        <Title order={2} fw={700}>Profile</Title>
        <Text c="dimmed" size="sm">Your account settings.</Text>
      </div>
    </Stack>
  )
}
