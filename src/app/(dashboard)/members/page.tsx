import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberCard } from '@/components/members/MemberCard'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import { HealthCondition } from '@/types'

export default async function MembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    if (!acc[c!.person_id]) acc[c!.person_id] = []
    acc[c!.person_id].push(c)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground text-sm">{persons?.length ?? 0} family members</p>
        </div>
        <Link href="/members/new" className={buttonVariants({})}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Member
        </Link>
      </div>

      {!persons || persons.length === 0 ? (
        <div className="text-center py-20 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground mb-4">No family members yet.</p>
          <Link href="/members/new" className={buttonVariants({})}>
            Add your first member
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {persons.map((person) => (
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
