import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FamilyTree, PersonNodeData } from '@/components/tree/FamilyTree'
import { Person, Relationship } from '@/types'
import { buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { CalendarDays, GitFork, Plus, Sparkles, Users } from 'lucide-react'

function getAgeLabel(dateOfBirth: string | null) {
  if (!dateOfBirth) return 'Age unknown'
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age -= 1
  return `${age} yrs`
}

type HealthCounts = Record<
  string,
  {
    activeConditions: number
    hereditaryConditions: number
    sharedHereditaryRisks: number
    medicationCount: number
    allergyCount: number
  }
>

type UpcomingAppointmentPreview = {
  id: string
  title: string
  appointmentDate: string
  doctorName: string | null
  location: string | null
}

export default async function TreePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user!.id)
    .single()

  if (!familyMember) redirect('/settings')

  const [personsResult, relationshipsResult] = await Promise.all([
    supabase
      .from('persons')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .order('created_at'),
    supabase
      .from('relationships')
      .select('*')
      .eq('family_id', familyMember.family_id),
  ])

  const persons: Person[] = personsResult.data ?? []
  const relationships: Relationship[] = relationshipsResult.data ?? []
  const personIds = persons.map((p) => p.id)

  const [conditionsResult, medsResult, allergiesResult, appointmentsResult] =
    personIds.length > 0
      ? await Promise.all([
          supabase
            .from('health_conditions')
            .select('person_id, name, status, is_hereditary')
            .in('person_id', personIds),
          supabase
            .from('medications')
            .select('person_id')
            .in('person_id', personIds),
          supabase
            .from('allergies')
            .select('person_id')
            .in('person_id', personIds),
          supabase
            .from('appointments')
            .select('id, person_id, title, appointment_date, doctor_name, location')
            .in('person_id', personIds)
            .eq('is_completed', false)
            .gte('appointment_date', new Date().toISOString())
            .order('appointment_date', { ascending: true }),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const healthCounts: HealthCounts = Object.fromEntries(
    personIds.map((id) => [
      id,
      {
        activeConditions: 0,
        hereditaryConditions: 0,
        sharedHereditaryRisks: 0,
        medicationCount: 0,
        allergyCount: 0,
      },
    ])
  )

  const hereditaryNameCounts = new Map<string, Set<string>>()
  for (const condition of conditionsResult.data ?? []) {
    const count = healthCounts[condition.person_id]
    if (!count) continue
    if (condition.status === 'active' || condition.status === 'chronic')
      count.activeConditions += 1
    if (condition.is_hereditary) {
      count.hereditaryConditions += 1
      const key = condition.name.trim().toLowerCase()
      if (key) {
        const familyMembers = hereditaryNameCounts.get(key) ?? new Set<string>()
        familyMembers.add(condition.person_id)
        hereditaryNameCounts.set(key, familyMembers)
      }
    }
  }
  const sharedHereditaryNames = new Set(
    [...hereditaryNameCounts.entries()]
      .filter(([, familyMembers]) => familyMembers.size > 1)
      .map(([name]) => name)
  )
  for (const condition of conditionsResult.data ?? []) {
    if (!condition.is_hereditary) continue
    const key = condition.name.trim().toLowerCase()
    if (sharedHereditaryNames.has(key) && healthCounts[condition.person_id]) {
      healthCounts[condition.person_id].sharedHereditaryRisks += 1
    }
  }
  for (const med of medsResult.data ?? []) {
    if (healthCounts[med.person_id]) healthCounts[med.person_id].medicationCount += 1
  }
  for (const allergy of allergiesResult.data ?? []) {
    if (healthCounts[allergy.person_id])
      healthCounts[allergy.person_id].allergyCount += 1
  }

  const upcomingAppointments: Record<string, UpcomingAppointmentPreview[]> =
    Object.fromEntries(personIds.map((id) => [id, []]))

  for (const appointment of appointmentsResult.data ?? []) {
    const personAppointments = upcomingAppointments[appointment.person_id]
    if (!personAppointments || personAppointments.length >= 3) continue
    personAppointments.push({
      id: appointment.id,
      title: appointment.title,
      appointmentDate: appointment.appointment_date,
      doctorName: appointment.doctor_name,
      location: appointment.location,
    })
  }

  // Build flat person nodes for the tree renderer
  const personNodes: PersonNodeData[] = persons.map((p) => ({
    personId: p.id,
    name: `${p.first_name}${p.last_name ? ' ' + p.last_name : ''}`,
    initials: `${p.first_name[0]}${p.last_name?.[0] ?? ''}`.toUpperCase(),
    age: getAgeLabel(p.date_of_birth),
    gender: p.gender,
    photoUrl: p.photo_url,
    upcomingAppointments: upcomingAppointments[p.id] ?? [],
    ...(healthCounts[p.id] ?? {
      activeConditions: 0,
      hereditaryConditions: 0,
      sharedHereditaryRisks: 0,
      medicationCount: 0,
      allergyCount: 0,
    }),
  }))

  const parentLinks = relationships.filter(
    (r) => r.relationship_type === 'parent'
  ).length
  const activeConditionCount = personNodes.reduce(
    (sum, person) => sum + person.activeConditions,
    0
  )
  const hereditaryRiskCount = personNodes.reduce(
    (sum, person) => sum + person.hereditaryConditions + person.sharedHereditaryRisks,
    0
  )
  const upcomingVisitCount = personNodes.reduce(
    (sum, person) => sum + person.upcomingAppointments.length,
    0
  )

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="gap-1 rounded-full px-3 py-1">
                <Users className="h-3 w-3" />
                {persons.length} members
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full bg-white px-3 py-1">
                <GitFork className="h-3 w-3" />
                {parentLinks} family links
              </Badge>
              <Badge variant="outline" className="gap-1 rounded-full bg-white px-3 py-1">
                <CalendarDays className="h-3 w-3" />
                {upcomingVisitCount} upcoming visits
              </Badge>
            </div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Family care map
            </p>
            <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
              Your family tree, health context included.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Pan, zoom, and click any profile card to open that person&apos;s health record.
              Hover on desktop to preview care details without leaving the tree.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link href="/members/new" className={buttonVariants({ size: 'lg' })}>
              <Plus className="h-4 w-4" />
              Add Member
            </Link>
            <Link
              href="/members"
              className={buttonVariants({ variant: 'outline', size: 'lg' })}
            >
              <Users className="h-4 w-4" />
              View Members
            </Link>
          </div>
        </div>
      </div>

      {persons.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-white/65 py-20 text-center shadow-sm backdrop-blur">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="secondary" className="mx-auto gap-1">
              Family tree is ready
            </Badge>
          </div>
          <p className="mb-4 text-muted-foreground">
            Add your first family member to start mapping relationships and health records.
          </p>
          <Link href="/members/new" className={buttonVariants({})}>
            Add your first member
          </Link>
        </div>
      ) : (
        <FamilyTree
          persons={personNodes}
          relationships={relationships}
          memberCount={persons.length}
          relationshipCount={relationships.length}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 shadow-sm backdrop-blur sm:grid-cols-3">
          <CareSignal label="Active conditions" value={activeConditionCount} tone="amber" />
          <CareSignal label="Hereditary risks" value={hereditaryRiskCount} tone="rose" />
          <CareSignal label="Upcoming visits" value={upcomingVisitCount} tone="blue" />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <Link href="/dashboard" className="rounded-2xl border border-white/70 bg-white/65 p-4 text-sm font-bold shadow-sm backdrop-blur transition-colors hover:bg-white">
            Back to dashboard
          </Link>
          <Link href="/appointments" className="rounded-2xl border border-white/70 bg-white/65 p-4 text-sm font-bold shadow-sm backdrop-blur transition-colors hover:bg-white">
            Review appointments
          </Link>
          <Link href="/settings" className="rounded-2xl border border-white/70 bg-white/65 p-4 text-sm font-bold shadow-sm backdrop-blur transition-colors hover:bg-white">
            Family settings
          </Link>
        </div>
      </div>
    </div>
  )
}

function CareSignal({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'amber' | 'rose' | 'blue'
}) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    blue: 'bg-blue-50 text-blue-700',
  }

  return (
    <div className="border-t border-slate-100 p-4 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span className={`grid size-10 place-items-center rounded-2xl text-lg font-black ${tones[tone]}`}>
          {value}
        </span>
        <p className="text-sm font-semibold text-slate-600">
          {value === 0 ? 'Nothing flagged right now' : 'Needs family visibility'}
        </p>
      </div>
    </div>
  )
}
