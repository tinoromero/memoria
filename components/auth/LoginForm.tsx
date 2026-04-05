// components/auth/LoginForm.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, PasswordInput, Button, Stack, Divider, Text, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconBrandGoogle } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function LoginForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: v => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: v => (v.length >= 6 ? null : 'Password must be at least 6 characters'),
    },
  })

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword(values)
    setLoading(false)
    if (error) {
      notifications.show({ message: error.message, color: 'red' })
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Stack gap="md">
      <Button
        leftSection={<IconBrandGoogle size={18} />}
        variant="default"
        size="md"
        onClick={handleGoogleLogin}
        fullWidth
      >
        Continue with Google
      </Button>

      <Divider label="or" labelPosition="center" />

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Email"
            placeholder="you@example.com"
            size="md"
            {...form.getInputProps('email')}
          />
          <PasswordInput
            label="Password"
            placeholder="••••••••"
            size="md"
            {...form.getInputProps('password')}
          />
          <Button type="submit" size="md" loading={loading} fullWidth mt="xs">
            Sign in
          </Button>
        </Stack>
      </form>

      <Text ta="center" size="sm" c="dimmed">
        No account?{' '}
        <Anchor component={Link} href="/signup">
          Sign up
        </Anchor>
      </Text>
    </Stack>
  )
}
