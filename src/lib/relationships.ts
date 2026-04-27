import { Person, Relationship, RelationshipType } from '@/types'

export type RelativeRole = RelationshipType

export interface RelationshipInsert {
  family_id: string
  person_id: string
  related_person_id: string
  relationship_type: RelationshipType
}

export function fullName(person: Pick<Person, 'first_name' | 'last_name'>) {
  return `${person.first_name}${person.last_name ? ' ' + person.last_name : ''}`
}

export function buildRelationshipInserts({
  familyId,
  personId,
  relatedPersonId,
  role,
}: {
  familyId: string
  personId: string
  relatedPersonId: string
  role: RelativeRole
}): RelationshipInsert[] {
  if (!relatedPersonId || personId === relatedPersonId) return []

  if (role === 'parent') {
    return [{
      family_id: familyId,
      person_id: personId,
      related_person_id: relatedPersonId,
      relationship_type: 'parent',
    }]
  }

  if (role === 'child') {
    return [{
      family_id: familyId,
      person_id: relatedPersonId,
      related_person_id: personId,
      relationship_type: 'parent',
    }]
  }

  return [
    {
      family_id: familyId,
      person_id: personId,
      related_person_id: relatedPersonId,
      relationship_type: role,
    },
    {
      family_id: familyId,
      person_id: relatedPersonId,
      related_person_id: personId,
      relationship_type: role,
    },
  ]
}

export function describeRelationship({
  relationship,
  currentPersonId,
  peopleById,
}: {
  relationship: Relationship
  currentPersonId: string
  peopleById: Record<string, Person>
}) {
  const otherPersonId = relationship.person_id === currentPersonId
    ? relationship.related_person_id
    : relationship.person_id
  const other = peopleById[otherPersonId]
  const otherName = other ? fullName(other) : 'Unknown member'

  if (relationship.relationship_type === 'parent') {
    return relationship.person_id === currentPersonId
      ? `Parent of ${otherName}`
      : `Child of ${otherName}`
  }

  if (relationship.relationship_type === 'spouse') return `Spouse of ${otherName}`
  if (relationship.relationship_type === 'sibling') return `Sibling of ${otherName}`
  return `${relationship.relationship_type} of ${otherName}`
}
