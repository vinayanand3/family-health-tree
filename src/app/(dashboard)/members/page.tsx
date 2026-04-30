import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MembersBrowser } from '@/components/members/MembersBrowser'
import { buttonVariants } from '@/components/ui/button'
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration'
import Link from 'next/link'
import { HeartPulse, UserPlus, X } from 'lucide-react'
import { HealthCondition, Person, PersonHealthMetadata } from '@/types'

type HealthFilter = 'conditions' | 'hereditary' | 'checkups' | null
type MembersSearchParams = Promise<{ health?: string }>

export default async function MembersPage({ searchParams }: { searchParams?: MembersSearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const params = searchParams ? await searchParams : {}
  const healthFilter: HealthFilter = params.health === 'conditions' || params.health === 'hereditary' || params.health === 'checkups'
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
  const { data: metadata } = persons?.length
    ? await supabase.from('person_health_metadata').select('person_id, last_checkup_date').in('person_id', persons.map(p => p.id))
    : { data: [] }

  const conditionsByPerson = ((conditions ?? []) as HealthCondition[]).reduce<Record<string, HealthCondition[]>>((acc, c) => {
    if (!acc[c.person_id]) acc[c.person_id] = []
    acc[c.person_id].push(c)
    return acc
  }, {})

  const allPersons = (persons ?? []) as Person[]
  const fifteenMonthsAgo = new Date()
  fifteenMonthsAgo.setMonth(fifteenMonthsAgo.getMonth() - 15)
  const recentCheckups = new Set(
    ((metadata ?? []) as Pick<PersonHealthMetadata, 'person_id' | 'last_checkup_date'>[])
      .filter((item) => item.last_checkup_date && new Date(item.last_checkup_date) >= fifteenMonthsAgo)
      .map((item) => item.person_id)
  )
  const missingRecentCheckupIds = allPersons
    .filter((person) => !recentCheckups.has(person.id))
    .map((person) => person.id)
  const pageTitle = healthFilter === 'conditions'
    ? 'Members with health conditions'
    : healthFilter === 'hereditary'
      ? 'Members with hereditary markers'
      : healthFilter === 'checkups'
        ? 'Members missing recent checkups'
        : 'Members'

  const pageDescription = healthFilter
    ? healthFilter === 'checkups'
      ? `${missingRecentCheckupIds.length} members need a last checkup date recorded`
      : `Filtered view across ${allPersons.length} family members`
    : `${allPersons.length} family members`

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-end md:justify-between">
        <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
              <HeartPulse className="h-3.5 w-3.5" />
              Family profiles
            </p>
          <h1 className="text-3xl font-black">{pageTitle}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{pageDescription}</p>
        </div>
          <div className="flex flex-col gap-2 sm:flex-row">
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
      </div>

      {allPersons.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-white/65 px-4 py-20 text-center shadow-sm backdrop-blur">
          <EmptyStateIllustration variant="family" />
          <p className="mt-4 font-black">No family members yet</p>
          <p className="mx-auto mb-5 mt-2 max-w-md text-sm text-muted-foreground">
            Add the first person to start connecting health records, appointments, and family relationships.
          </p>
          <Link href="/members/new" className={buttonVariants({})}>
            Add your first member
          </Link>
        </div>
      ) : (
        <MembersBrowser
          persons={allPersons}
          conditionsByPerson={conditionsByPerson}
          missingRecentCheckupIds={missingRecentCheckupIds}
          initialFilter={healthFilter}
        />
      )}
    </div>
  )
}
