import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FamilyTree } from '@/components/tree/FamilyTree'
import { Person, Relationship, TreeNode } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'

function buildTree(persons: Person[], relationships: Relationship[]): TreeNode {
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
    return { name, personId, ...(children.length > 0 ? { children } : {}) }
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
  const treeData = buildTree(persons, relationships)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Family Tree</h1>
          <p className="text-muted-foreground text-sm">Click a member to view their health profile</p>
        </div>
        <Link href="/members/new" className={buttonVariants({})}>
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
        <FamilyTree data={treeData} />
      )}
    </div>
  )
}
