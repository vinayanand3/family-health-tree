'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Person, Relationship } from '@/types'
import { buildRelationshipInserts, describeRelationship, fullName, RelativeRole } from '@/lib/relationships'
import { GitFork, Plus, Trash2 } from 'lucide-react'

interface RelationshipManagerProps {
  person: Person
  persons: Person[]
  relationships: Relationship[]
}

const roleLabels: Record<RelativeRole, string> = {
  parent: 'Parent of selected member',
  child: 'Child of selected member',
  spouse: 'Spouse of selected member',
  sibling: 'Sibling of selected member',
}

export function RelationshipManager({ person, persons, relationships }: RelationshipManagerProps) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [relatedPersonId, setRelatedPersonId] = useState('')
  const [role, setRole] = useState<RelativeRole>('child')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const peopleById = useMemo(
    () => Object.fromEntries(persons.map((member) => [member.id, member])),
    [persons]
  )
  const availablePeople = persons.filter((member) => member.id !== person.id)
  const visibleRelationships = useMemo(() => {
    const seen = new Set<string>()
    return relationships.filter((relationship) => {
      const isReciprocal = relationship.relationship_type === 'spouse' || relationship.relationship_type === 'sibling'
      if (!isReciprocal) return true

      const ids = [relationship.person_id, relationship.related_person_id].sort()
      const key = `${relationship.relationship_type}:${ids.join(':')}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [relationships])

  async function addRelationship() {
    if (!relatedPersonId) return
    setLoading(true)
    setError('')

    const inserts = buildRelationshipInserts({
      familyId: person.family_id,
      personId: person.id,
      relatedPersonId,
      role,
    })

    const { error: insertError } = await supabase
      .from('relationships')
      .upsert(inserts, {
        onConflict: 'person_id,related_person_id,relationship_type',
        ignoreDuplicates: true,
      })

    if (insertError) {
      setError(insertError.message)
    } else {
      setRelatedPersonId('')
      router.refresh()
    }
    setLoading(false)
  }

  async function removeRelationship(relationship: Relationship) {
    setLoading(true)
    setError('')

    const idsToDelete = [relationship.id]

    if (relationship.relationship_type === 'spouse' || relationship.relationship_type === 'sibling') {
      const inverse = relationships.find((candidate) =>
        candidate.relationship_type === relationship.relationship_type &&
        candidate.person_id === relationship.related_person_id &&
        candidate.related_person_id === relationship.person_id
      )
      if (inverse) idsToDelete.push(inverse.id)
    }

    const { error: deleteError } = await supabase
      .from('relationships')
      .delete()
      .in('id', idsToDelete)

    if (deleteError) {
      setError(deleteError.message)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-primary" />
          <h3 className="font-bold">Family relationships</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Parent and child links shape the tree. Spouse and sibling links are saved for profiles.
        </p>
      </div>

      {visibleRelationships.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          No relationships yet.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleRelationships.map((relationship) => (
            <div key={relationship.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white/70 px-3 py-2">
              <Badge variant="secondary">
                {describeRelationship({ relationship, currentPersonId: person.id, peopleById })}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeRelationship(relationship)}
                disabled={loading}
                title="Remove relationship"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Separator />

      <div className="space-y-3 rounded-xl border bg-white/70 p-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Relationship</Label>
            <Select value={role} onValueChange={(value: RelativeRole | null) => value && setRole(value)}>
              <SelectTrigger className="w-full">
                <span className="text-sm">{roleLabels[role]}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="child">Child of selected member</SelectItem>
                <SelectItem value="parent">Parent of selected member</SelectItem>
                <SelectItem value="spouse">Spouse of selected member</SelectItem>
                <SelectItem value="sibling">Sibling of selected member</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Member</Label>
            <Select value={relatedPersonId || undefined} onValueChange={(value: string | null) => setRelatedPersonId(value ?? '')}>
              <SelectTrigger className="w-full">
                <span className={relatedPersonId ? 'text-sm' : 'text-sm text-muted-foreground'}>
                  {relatedPersonId ? fullName(peopleById[relatedPersonId]) : 'Select member'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {availablePeople.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {fullName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="button" onClick={addRelationship} disabled={loading || !relatedPersonId || availablePeople.length === 0}>
          <Plus className="h-4 w-4" />
          Add relationship
        </Button>
      </div>
    </div>
  )
}
