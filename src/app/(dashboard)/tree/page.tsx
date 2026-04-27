import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FamilyTree } from '@/components/tree/FamilyTree'
import { Person, Relationship, TreeNode } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { GitFork, Plus, Users } from 'lucide-react'

type HealthCounts = Record<string, {
  activeConditions: number
  hereditaryConditions: number
  medicationCount: number
  allergyCount: number
}>

function getAgeLabel(dateOfBirth: string | null) {
  if (!dateOfBirth) return 'Age unknown'
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1
  return `${age} yrs`
}

function buildTree(persons: Person[], relationships: Relationship[], healthCounts: HealthCounts): TreeNode {
  if (persons.length === 0) return { name: 'No members yet' }

  const childMap: Record<string, string[]> = {}
  const hasParent = new Set<string>()

  for (const rel of relationships) {
    if (rel.relationship_type === 'parent') {
      if (!childMap[rel.person_id]) childMap[rel.person_id] = []
      childMap[rel.person_id].push(rel.related_person_id)
      hasParent.add(rel.related_person_id)
    }
  }

  const personMap = Object.fromEntries(persons.map((p) => [p.id, p]))

  function buildNode(personId: string): TreeNode {
    const p = personMap[personId]
    const name = `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`
    const children = (childMap[personId] ?? []).map(buildNode)
    const counts = healthCounts[personId] ?? {
      activeConditions: 0,
      hereditaryConditions: 0,
      medicationCount: 0,
      allergyCount: 0,
    }
    return {
      name,
      personId,
      initials: `${p.first_name[0]}${p.last_name?.[0] ?? ''}`.toUpperCase(),
      age: getAgeLabel(p.date_of_birth),
      ...counts,
      ...(children.length > 0 ? { children } : {}),
    }
  }

  const roots = persons.filter((p) => !hasParent.has(p.id))
  if (roots.length === 1) return buildNode(roots[0].id)
  return { name: 'Family', children: roots.map((r) => buildNode(r.id)) }
}

export default async function TreePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user!.id)
    .single()

  if (!familyMember) redirect('/settings')

  const [personsResult, relationshipsResult] = await Promise.all([
    supabase.from('persons').select('*').eq('family_id', familyMember.family_id).order('created_at'),
    supabase.from('relationships').select('*').eq('family_id', familyMember.family_id),
  ])

  const persons: Person[] = personsResult.data ?? []
  const relationships: Relationship[] = relationshipsResult.data ?? []
  const personIds = persons.map((person) => person.id)

  const [conditionsResult, medsResult, allergiesResult] = personIds.length > 0
    ? await Promise.all([
      supabase.from('health_conditions').select('person_id, status, is_hereditary').in('person_id', personIds),
      supabase.from('medications').select('person_id').in('person_id', personIds),
      supabase.from('allergies').select('person_id').in('person_id', personIds),
    ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  const healthCounts: HealthCounts = Object.fromEntries(personIds.map((id) => [id, {
    activeConditions: 0,
    hereditaryConditions: 0,
    medicationCount: 0,
    allergyCount: 0,
  }]))

  for (const condition of conditionsResult.data ?? []) {
    const count = healthCounts[condition.person_id]
    if (!count) continue
    if (condition.status === 'active' || condition.status === 'chronic') count.activeConditions += 1
    if (condition.is_hereditary) count.hereditaryConditions += 1
  }

  for (const med of medsResult.data ?? []) {
    if (healthCounts[med.person_id]) healthCounts[med.person_id].medicationCount += 1
  }

  for (const allergy of allergiesResult.data ?? []) {
    if (healthCounts[allergy.person_id]) healthCounts[allergy.person_id].allergyCount += 1
  }

  const treeData = buildTree(persons, relationships, healthCounts)
  const connectedCount = relationships.filter((rel) => rel.relationship_type === 'parent').length

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-white/70 p-6 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {persons.length} members
            </Badge>
            <Badge variant="outline" className="gap-1 bg-white">
              <GitFork className="h-3 w-3" />
              {connectedCount} family links
            </Badge>
          </div>
          <h1 className="text-3xl font-black">Family Tree</h1>
          <p className="text-muted-foreground text-sm">
            Pan, zoom, and click any profile card to open that person&apos;s health record.
          </p>
        </div>
        <Link href="/members/new" className={buttonVariants({ size: 'lg' })}>
          <Plus className="h-4 w-4" />
          Add Member
        </Link>
      </div>

      {persons.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">No family members yet.</p>
          <Link href="/members/new" className={buttonVariants({})}>
            Add your first member
          </Link>
        </div>
      ) : (
        <FamilyTree data={treeData} memberCount={persons.length} relationshipCount={connectedCount} />
      )}
    </div>
  )
}
