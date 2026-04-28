'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, X } from 'lucide-react'

interface ProfilePhotoUploadProps {
  value?: string | null
  initials: string
  onChange: (url: string) => void
}

const BUCKET_NAME = 'profile-photos'

function fileExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension && extension.length <= 5 ? extension : 'jpg'
}

export function ProfilePhotoUpload({ value, initials, onChange }: ProfilePhotoUploadProps) {
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function uploadPhoto(file: File) {
    setError('')

    if (!file.type.startsWith('image/')) {
      setError('Choose an image file.')
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Choose an image smaller than 4 MB.')
      return
    }

    setUploading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Sign in again before uploading a photo.')
      setUploading(false)
      return
    }

    const path = `${user.id}/${crypto.randomUUID()}.${fileExtension(file)}`
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)
    onChange(data.publicUrl)
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      <Label>Profile photo</Label>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar className="h-16 w-16">
          {value && <AvatarImage src={value} alt="Profile photo preview" />}
          <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
            {initials || 'PH'}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-wrap gap-2">
          <Input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) uploadPhoto(file)
              event.target.value = ''
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Camera className="h-4 w-4" />
            {uploading ? 'Uploading...' : value ? 'Change photo' : 'Upload photo'}
          </Button>
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange('')}>
              <X className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        This photo appears on the member profile and in the family tree.
      </p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
