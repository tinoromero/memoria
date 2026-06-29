'use client'
import { useState, useEffect } from 'react'
import { Box, Button, Image, Text, Stack, ActionIcon } from '@mantine/core'
import { IconUpload, IconX } from '@tabler/icons-react'
import { createClient } from '@/lib/supabase/client'
import { notifications } from '@mantine/notifications'

interface Props {
  label: string
  value: string | null          // current storage path
  onChange: (path: string | null) => void
  userId: string
}

export default function ImageUpload({ label, value, onChange, userId }: Props) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (value && !previewUrl) {
      supabase.storage.from('card-images').createSignedUrl(value, 3600).then(({ data }) => {
        if (data) setPreviewUrl(data.signedUrl)
      })
    }
    if (!value) {
      setPreviewUrl(null)
    }
  }, [value])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!ALLOWED_TYPES.includes(file.type)) {
      notifications.show({ message: 'Only JPEG, PNG, GIF, and WebP images are allowed.', color: 'red' })
      return
    }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${userId}/${Date.now()}.${ext}`

    const { error } = await supabase.storage.from('card-images').upload(path, file)
    setUploading(false)

    if (error) {
      notifications.show({ message: error.message, color: 'red' })
      return
    }

    onChange(path)
    // Generate a temporary preview URL
    const { data } = await supabase.storage.from('card-images').createSignedUrl(path, 60)
    if (data) setPreviewUrl(data.signedUrl)
  }

  async function handleRemove() {
    if (value) {
      await supabase.storage.from('card-images').remove([value])
    }
    onChange(null)
    setPreviewUrl(null)
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>{label}</Text>
      {previewUrl || value ? (
        <Box pos="relative" w={120} h={80}>
          <Image src={previewUrl ?? undefined} alt={label} radius="sm" h={80} w={120} fit="cover" />
          <ActionIcon
            pos="absolute" top={4} right={4}
            size="xs" color="red" variant="filled"
            onClick={handleRemove}
          >
            <IconX size={10} />
          </ActionIcon>
        </Box>
      ) : (
        <Button
          component="label"
          variant="default"
          leftSection={<IconUpload size={14} />}
          loading={uploading}
          size="sm"
          w="fit-content"
        >
          Upload image
          <input type="file" accept="image/*" hidden onChange={handleFileChange} />
        </Button>
      )}
      {!previewUrl && !value && (
        <Text size="xs" c="dimmed">Optional</Text>
      )}
    </Stack>
  )
}
