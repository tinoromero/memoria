'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TextInput, PasswordInput, Button, Stack, Divider, Text, Anchor } from '@mantine/core'
import { useForm } from '@mantine/form'
import { notifications } from '@mantine/notifications'
import { IconBrandGoogle } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const form = useForm({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validate: {
      email: v => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: v => (v.length >= 8 ? null : 'Password must be at least 8 characters'),
      confirmPassword: (v, values) => (v === values.password ? null : 'Passwords do not match'),
    },
  })

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleSubmit(values: typeof form.values) {
    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
    })
    setLoading(false)
    if (error) {
      notifications.show({ message: error.message, color: 'red' })
      return
    }
    notifications.show({
      message: 'Check your email to confirm your account.',
      color: 'green',
    })
    router.push('/login')
  }

  return (
    <Stack gap="md">
      <Button
        leftSection={<IconBrandGoogle size={18} />}
        variant="default"
        size="md"
        onClick={handleGoogleSignup}
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
            placeholder="Min. 8 characters"
            size="md"
            {...form.getInputProps('password')}
          />
          <PasswordInput
            label="Confirm password"
            placeholder="Repeat your password"
            size="md"
            {...form.getInputProps('confirmPassword')}
          />
          <Button type="submit" size="md" loading={loading} fullWidth mt="xs">
            Create account
          </Button>
        </Stack>
      </form>

      <Text ta="center" size="sm" c="dimmed">
        Already have an account?{' '}
        <Anchor component={Link} href="/login">
          Sign in
        </Anchor>
      </Text>
    </Stack>
  )
}
