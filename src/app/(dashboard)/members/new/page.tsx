'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personSchema, PersonFormData } from '@/lib/validations/member'
import { createClient } from '@/lib/supabase/client'
import { buildRelationshipInserts, fullName, RelativeRole } from '@/lib/relationships'
import { Person } from '@/types'
import { Button } from '@/components/ui/button'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfilePhotoUpload } from '@/components/members/ProfilePhotoUpload'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewMemberPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [familyId, setFamilyId] = useState('')
  const [persons, setPersons] = useState<Person[]>([])
  const [relatedPersonId, setRelatedPersonId] = useState('')
  const [relationshipRole, setRelationshipRole] = useState<RelativeRole>('child')

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PersonFormData>({
    resolver: zodResolver(personSchema),
  })
  const firstName = watch('first_name') ?? ''
  const lastName = watch('last_name') ?? ''
  const photoUrl = watch('photo_url') ?? ''
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  useEffect(() => {
    async function loadFamilyMembers() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: familyMember } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user!.id)
        .single()

      if (!familyMember) return

      setFamilyId(familyMember.family_id)
      const { data: existingPersons } = await supabase
        .from('persons')
        .select('*')
        .eq('family_id', familyMember.family_id)
        .order('first_name')

      setPersons((existingPersons ?? []) as Person[])
    }

    loadFamilyMembers()
  }, [supabase])

  async function onSubmit(data: PersonFormData) {
    setLoading(true)
    setError('')

    const activeFamilyId = familyId

    if (!activeFamilyId) {
      setError('You must be part of a family first.')
      setLoading(false)
      return
    }

    const { data: person, error: insertError } = await supabase
      .from('persons')
      .insert({ ...data, photo_url: data.photo_url || null, family_id: activeFamilyId })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
    } else {
      if (relatedPersonId) {
        const relationships = buildRelationshipInserts({
          familyId: activeFamilyId,
          personId: person.id,
          relatedPersonId,
          role: relationshipRole,
        })

        const { error: relationshipError } = await supabase
          .from('relationships')
          .upsert(relationships, {
            onConflict: 'person_id,related_person_id,relationship_type',
            ignoreDuplicates: true,
          })

        if (relationshipError) {
          setError(`Member saved, but relationship failed: ${relationshipError.message}`)
          setLoading(false)
          return
        }
      }

      router.push(`/members/${person.id}`)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/members" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <h1 className="text-2xl font-bold mt-2">Add Family Member</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
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
                <Select onValueChange={(v: string | null) => setValue('gender', v ?? undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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

            {persons.length > 0 && (
              <div className="space-y-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <p className="text-sm font-bold">Connect to family tree</p>
                  <p className="text-xs text-muted-foreground">
                    Choose how this new member connects to someone already in your family.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>This member is</Label>
                    <Select
                      value={relationshipRole}
                      onValueChange={(value: RelativeRole | null) => value && setRelationshipRole(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="child">Child of</SelectItem>
                        <SelectItem value="parent">Parent of</SelectItem>
                        <SelectItem value="spouse">Spouse of</SelectItem>
                        <SelectItem value="sibling">Sibling of</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Existing member</Label>
                    <Select
                      value={relatedPersonId || undefined}
                      onValueChange={(value: string | null) => setRelatedPersonId(value ?? '')}
                    >
                      <SelectTrigger className="w-full">
                        <span className={relatedPersonId ? 'text-sm' : 'text-sm text-muted-foreground'}>
                          {relatedPersonId
                            ? fullName(persons.find((person) => person.id === relatedPersonId)!)
                            : 'Select member'}
                        </span>
                      </SelectTrigger>
                      <SelectContent>
                        {persons.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {fullName(person)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Add Member'}
              </Button>
              <Link href="/members" className={buttonVariants({ variant: 'outline' })}>
                Cancel
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
