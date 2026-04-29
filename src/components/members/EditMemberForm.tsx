'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personSchema, PersonFormData } from '@/lib/validations/member'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { ProfilePhotoUpload } from '@/components/members/ProfilePhotoUpload'
import Link from 'next/link'

const GENDER_LABELS: Record<string, string> = { male: 'Male', female: 'Female', other: 'Other' }

interface EditMemberFormProps {
  person: {
    id: string
    first_name: string
    last_name?: string | null
    date_of_birth?: string | null
    gender?: string | null
    photo_url?: string | null
    notes?: string | null
  }
}

export function EditMemberForm({ person }: EditMemberFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedGender, setSelectedGender] = useState(person.gender ?? '')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      first_name: person.first_name,
      last_name: person.last_name ?? undefined,
      date_of_birth: person.date_of_birth ?? undefined,
      gender: person.gender ?? undefined,
      photo_url: person.photo_url ?? undefined,
      notes: person.notes ?? undefined,
    },
  })
  const firstName = watch('first_name') ?? ''
  const lastName = watch('last_name') ?? ''
  const photoUrl = watch('photo_url') ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  async function onSubmit(data: PersonFormData) {
    setLoading(true)
    setError('')

    const { error: updateError } = await supabase
      .from('persons')
      .update({ ...data, photo_url: data.photo_url || null })
      .eq('id', person.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push(`/members/${person.id}`)
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>First Name *</Label>
          <Input {...register('first_name')} placeholder="Jane" />
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Last Name</Label>
          <Input {...register('last_name')} placeholder="Doe" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Date of Birth</Label>
          <Input type="date" {...register('date_of_birth')} />
        </div>
        <div className="space-y-1.5">
          <Label>Gender</Label>
          <Select
            value={selectedGender || undefined}
            onValueChange={(v: string | null) => {
              const val = v ?? ''
              setSelectedGender(val)
              setValue('gender', val || undefined)
            }}
          >
            <SelectTrigger>
              <span className={selectedGender ? 'text-sm' : 'text-sm text-muted-foreground'}>
                {selectedGender ? GENDER_LABELS[selectedGender] ?? selectedGender : 'Select'}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea {...register('notes')} placeholder="Any additional notes..." rows={3} />
      </div>

      <ProfilePhotoUpload
        value={photoUrl}
        initials={initials}
        onChange={(url) => setValue('photo_url', url || undefined, { shouldDirty: true })}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
        <Link href={`/members/${person.id}`} className={buttonVariants({ variant: 'outline' })}>
          Cancel
        </Link>
      </div>
    </form>
  )
}
