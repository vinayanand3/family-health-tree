import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberCard } from '@/components/members/MemberCard'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { UserPlus, X } from 'lucide-react'
import { HealthCondition, Person } from '@/types'

type MembersSearchParams = Promise<{ health?: string }>

export default async function MembersPage({ searchParams }: { searchParams?: MembersSearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = searchParams ? await searchParams : {}
  const healthFilter = params.health === 'conditions' || params.health === 'hereditary'
    ? params.health
    : null

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user!.id)
    .single()

  if (!familyMember) redirect('/settings')

  const { data: persons } = await supabase
    .from('persons')
    .select('*')
    .eq('family_id', familyMember.family_id)
    .order('first_name')

  const { data: conditions } = persons?.length
    ? await supabase.from('health_conditions').select('*').in('person_id', persons.map(p => p.id))
    : { data: [] }

  const conditionsByPerson = ((conditions ?? []) as HealthCondition[]).reduce<Record<string, HealthCondition[]>>((acc, c) => {
    if (!acc[c.person_id]) acc[c.person_id] = []
    acc[c.person_id].push(c)
    return acc
  }, {})

  const allPersons = (persons ?? []) as Person[]
  const filteredPersons = allPersons.filter((person) => {
    if (healthFilter === 'conditions') {
      return (conditionsByPerson[person.id] ?? []).length > 0
    }

    if (healthFilter === 'hereditary') {
      return (conditionsByPerson[person.id] ?? []).some((condition) => condition.is_hereditary)
    }

    return true
  })

  const pageTitle = healthFilter === 'conditions'
    ? 'Members with health conditions'
    : healthFilter === 'hereditary'
      ? 'Members with hereditary markers'
      : 'Members'

  const pageDescription = healthFilter
    ? `${filteredPersons.length} of ${allPersons.length} family members`
    : `${allPersons.length} family members`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground text-sm">{pageDescription}</p>
        </div>
        <div className="flex items-center gap-2">
          {healthFilter && (
            <Link href="/members" className={buttonVariants({ variant: 'outline' })}>
              <X className="h-4 w-4 mr-2" />
              Clear filter
            </Link>
          )}
          <Link href="/members/new" className={buttonVariants({})}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Link>
        </div>
      </div>

      {allPersons.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">No family members yet.</p>
          <Link href="/members/new" className={buttonVariants({})}>
            Add your first member
          </Link>
        </div>
      ) : filteredPersons.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">No members match this view.</p>
          <Link href="/members" className={buttonVariants({ variant: 'outline' })}>
            View all members
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPersons.map((person) => (
            <MemberCard
              key={person.id}
              person={person}
              conditions={conditionsByPerson[person.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}
