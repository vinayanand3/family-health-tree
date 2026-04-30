import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { AppointmentReminderControls } from '@/components/appointments/AppointmentReminderControls'
import { AppointmentCountdown } from '@/components/appointments/AppointmentCountdown'
import { buttonVariants } from '@/components/ui/button'
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration'
import { Users, CalendarDays, Activity, AlertTriangle, ArrowRight, BellRing, MapPin, UserRound, TreePine, Plus, UserPlus, Pill, ShieldCheck, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Appointment } from '@/types'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id, role, families(name)')
    .eq('user_id', user!.id)
    .single()

  if (!familyMember) {
    redirect('/settings')
  }

  const familyId = familyMember.family_id

  const [personsResult, appointmentsResult, allAppointmentsResult, familyMembersResult] = await Promise.all([
    supabase
      .from('persons')
      .select('id, first_name, last_name, photo_url')
      .eq('family_id', familyId)
      .order('created_at'),
    supabase
      .from('appointments')
      .select('*, persons(first_name, last_name)')
      .eq('family_id', familyId)
      .eq('is_completed', false)
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })
      .limit(5),
    supabase
      .from('appointments')
      .select('id, person_id, appointment_date, appointment_type, is_completed, follow_up_needed, follow_up_date, doctor_name, title')
      .eq('family_id', familyId),
    supabase
      .from('family_members')
      .select('id')
      .eq('family_id', familyId),
  ])

  const personIds = personsResult.data?.map(p => p.id) ?? []
  const [conditionsResult, medicationsResult, vaccinationsResult, metadataResult] = personIds.length > 0
    ? await Promise.all([
        supabase.from('health_conditions').select('id, person_id, name, status, is_hereditary').in('person_id', personIds),
        supabase.from('medications').select('id, person_id, refill_due_date').in('person_id', personIds),
        supabase.from('vaccinations').select('id, person_id, status, due_date').in('person_id', personIds),
        supabase.from('person_health_metadata').select('person_id, last_checkup_date').in('person_id', personIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }]

  const memberCount = personsResult.data?.length ?? 0
  const upcomingAppointments = (appointmentsResult.data ?? []) as Appointment[]
  const nextAppointment = upcomingAppointments[0]
  const hereditaryCount = conditionsResult.data?.filter(c => c.is_hereditary).length ?? 0
  const conditionCount = conditionsResult.data?.length ?? 0
  const today = new Date()
  const todayIso = today.toISOString()
  const inThirtyDays = new Date()
  inThirtyDays.setDate(inThirtyDays.getDate() + 30)
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const allAppointments = allAppointmentsResult.data ?? []
  const overdueAppointments = allAppointments.filter((appointment) =>
    appointment.appointment_date < todayIso && !appointment.is_completed
  ).length
  const overdueFollowUps = allAppointments.filter((appointment) =>
    appointment.follow_up_needed && appointment.follow_up_date && appointment.follow_up_date < todayIso
  ).length
  const overdueVaccinations = (vaccinationsResult.data ?? []).filter((vaccination) =>
    vaccination.status === 'overdue' || Boolean(vaccination.due_date && vaccination.due_date < today.toISOString().slice(0, 10))
  )
  const refillsDueSoon = (medicationsResult.data ?? []).filter((medication) => {
    if (!medication.refill_due_date) return false
    return new Date(medication.refill_due_date) <= inThirtyDays
  })
  const activeConditionCount = (conditionsResult.data ?? []).filter((condition) =>
    condition.status === 'active' || condition.status === 'chronic'
  ).length
  const recentCheckups = new Set(
    (metadataResult.data ?? [])
      .filter((metadata) => {
        if (!metadata.last_checkup_date) return false
        const checkupDate = new Date(metadata.last_checkup_date)
        const fifteenMonthsAgo = new Date()
        fifteenMonthsAgo.setMonth(fifteenMonthsAgo.getMonth() - 15)
        return checkupDate >= fifteenMonthsAgo
      })
      .map((metadata) => metadata.person_id)
  )
  const membersMissingRecentCheckups = (personsResult.data ?? []).filter((person) => !recentCheckups.has(person.id))
  const missingRecentCheckupNames = membersMissingRecentCheckups
    .map((person) => `${person.first_name} ${person.last_name ?? ''}`.trim())
  const missingRecentCheckups = Math.max(0, memberCount - recentCheckups.size)
  const familyHealthScore = Math.max(
    0,
    100 -
      overdueVaccinations.length * 10 -
      overdueAppointments * 10 -
      overdueFollowUps * 8 -
      refillsDueSoon.length * 6 -
      activeConditionCount * 3 -
      missingRecentCheckups * 4
  )
  const thisMonthAppointments = allAppointments.filter((appointment) => {
    const date = new Date(appointment.appointment_date)
    return date >= thisMonthStart && date < nextMonthStart
  }).length
  const monthlyAppointmentTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    return {
      label: date.toLocaleString('default', { month: 'short' }),
      value: allAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.appointment_date)
        return appointmentDate >= date && appointmentDate < end
      }).length,
    }
  })
  const careLoadTrend = [
    { label: 'Vacc', fullLabel: 'Overdue vaccines', value: overdueVaccinations.length },
    { label: 'Visits', fullLabel: 'Overdue visits', value: overdueAppointments },
    { label: 'Follow', fullLabel: 'Overdue follow-ups', value: overdueFollowUps },
    { label: 'Refills', fullLabel: 'Refills due soon', value: refillsDueSoon.length },
    { label: 'Cond', fullLabel: 'Active conditions', value: activeConditionCount },
  ]
  const lastMonthAppointments = allAppointments.filter((appointment) => {
    const date = new Date(appointment.appointment_date)
    return date >= lastMonthStart && date < thisMonthStart
  }).length
  const nextAction = overdueVaccinations.length > 0
    ? 'Review overdue vaccination'
    : overdueFollowUps > 0
      ? 'Complete appointment follow-up'
      : refillsDueSoon.length > 0
        ? 'Refill medication this month'
        : missingRecentCheckups > 0
          ? 'Add recent checkup dates'
          : (familyMembersResult.data?.length ?? 0) <= 1
            ? 'Invite a family member'
            : 'No urgent action'
  const nextActionHref = nextAction === 'Invite a family member'
    ? '/settings'
    : nextAction === 'Add recent checkup dates'
      ? '/members?health=checkups'
      : '/appointments'
  const personHealthStatus = new Map<string, 'red' | 'pink' | 'amber' | 'green'>(
    personIds.map((id) => [id, 'green'])
  )
  for (const condition of conditionsResult.data ?? []) {
    if (condition.is_hereditary) personHealthStatus.set(condition.person_id, 'pink')
    if (condition.status === 'active' || condition.status === 'chronic') personHealthStatus.set(condition.person_id, 'red')
  }
  for (const appointment of upcomingAppointments) {
    if (personHealthStatus.get(appointment.person_id) === 'green') personHealthStatus.set(appointment.person_id, 'amber')
  }
  for (const medication of refillsDueSoon) {
    if (personHealthStatus.get(medication.person_id) === 'green') personHealthStatus.set(medication.person_id, 'amber')
  }

  const familyRelation = familyMember.families as { name?: string } | { name?: string }[] | null
  const rawFamilyName = (Array.isArray(familyRelation) ? familyRelation[0]?.name : familyRelation?.name) ?? 'Your Family'
  const familyName = rawFamilyName
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ')
  const appointmentListItems = nextAppointment ? upcomingAppointments.slice(1) : upcomingAppointments

  return (
    <div className="space-y-7">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <div>
            <p className="text-sm font-bold text-primary">Family workspace</p>
            <h1 className="mt-2 text-3xl font-black leading-tight sm:text-5xl">{familyName} Health Hub</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A shared command center for appointments, health records, and the people you care for.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/members/new" className={buttonVariants({})}>
                <Plus className="h-4 w-4" />
                Add Family Member
              </Link>
              <Link href="/settings" className={buttonVariants({ variant: 'outline' })}>
                <UserPlus className="h-4 w-4" />
                Invite family
              </Link>
            </div>
          </div>
          <Link
            href="/tree"
            className="group relative min-h-52 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-rose-50 p-5 shadow-inner transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10"
          >
            <div className="absolute inset-x-8 bottom-10 h-24 rounded-t-full border-t-4 border-emerald-300/70" />
            <div className="absolute left-1/2 top-14 h-28 w-1 -translate-x-1/2 rounded-full bg-emerald-300/70" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="grid size-11 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm">
                  <TreePine className="h-5 w-5" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-emerald-700">
                  Open full tree
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
              <div className="flex -space-x-3">
                {(personsResult.data ?? []).slice(0, 5).map((person) => {
                  const dotTone = personHealthStatus.get(person.id) ?? 'green'
                  const dotClasses = {
                    green: 'bg-emerald-500',
                    amber: 'bg-amber-500',
                    red: 'bg-red-500',
                    pink: 'bg-pink-500',
                  }
                  return (
                  <div
                    key={person.id}
                    className="relative grid size-12 place-items-center overflow-hidden rounded-full border-4 border-white bg-primary/10 text-sm font-black text-primary shadow-sm"
                  >
                    {person.photo_url ? (
                      <img
                        src={person.photo_url}
                        alt={`${person.first_name} ${person.last_name ?? ''}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      `${person.first_name[0]}${person.last_name?.[0] ?? ''}`.toUpperCase()
                    )}
                    <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-white ${dotClasses[dotTone]}`} />
                  </div>
                )})}
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          href="/members?health=checkups"
          icon={ShieldCheck}
          title="Family Health Score"
          value={`${familyHealthScore}`}
          copy={`${overdueVaccinations.length} overdue vaccines, ${refillsDueSoon.length} refills soon`}
          details={[
            `${overdueVaccinations.length} overdue vaccines`,
            `${overdueAppointments} overdue appointments`,
            `${overdueFollowUps} overdue follow-ups`,
            `${refillsDueSoon.length} refills due soon`,
            `${activeConditionCount} active conditions`,
            missingRecentCheckups === 0
              ? 'All members have recent checkups recorded'
              : `${missingRecentCheckups} missing recent checkups: ${missingRecentCheckupNames.join(', ')}`,
          ]}
        />
        <MetricCard
          href={nextActionHref}
          icon={BellRing}
          title="Next Action Needed"
          value={nextAction}
          copy={nextAction === 'Add recent checkup dates'
            ? `Missing for ${missingRecentCheckupNames.join(', ')}`
            : 'Prioritized from overdue care, refills, checkups, and family setup'}
        />
        <MetricCard
          href="/appointments"
          icon={TrendingUp}
          title="Appointments"
          value={`${thisMonthAppointments} this month`}
          copy={`${thisMonthAppointments - lastMonthAppointments >= 0 ? '+' : ''}${thisMonthAppointments - lastMonthAppointments} vs last month`}
        />
        <MetricCard
          href="/members"
          icon={Pill}
          title="Refills Needed"
          value={`${refillsDueSoon.length}`}
          copy="Medications due in the next 30 days"
        />
      </div>

      <div className="hidden gap-4 lg:grid lg:grid-cols-2">
        <ChartCard
          title="Appointment Trend"
          copy="Last six months of scheduled care"
          data={monthlyAppointmentTrend}
          tone="primary"
        />
        <ChartCard
          title="Care Load"
          copy="Open care items influencing the health score"
          data={careLoadTrend}
          tone="rose"
        />
      </div>

      <details className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur lg:hidden">
        <summary className="cursor-pointer text-sm font-black">Show dashboard charts</summary>
        <div className="mt-4 grid gap-4">
          <ChartCard
            title="Appointment Trend"
            copy="Last six months of scheduled care"
            data={monthlyAppointmentTrend}
            tone="primary"
          />
          <ChartCard
            title="Care Load"
            copy="Open care items influencing the health score"
            data={careLoadTrend}
            tone="rose"
          />
        </div>
      </details>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Link href="/members" aria-label="View all family members">
          <Card className="group h-full cursor-pointer bg-white/80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-bold flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-primary" /> Members
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{memberCount}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/appointments" aria-label="View upcoming appointments">
          <Card className="group h-full cursor-pointer bg-white/80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-bold flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-secondary-foreground" /> Upcoming
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/members?health=conditions" aria-label="View members with health conditions">
          <Card className="group h-full cursor-pointer bg-white/80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-bold flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-primary" /> Conditions
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{conditionCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {conditionCount === 0 ? 'Add the first condition' : 'Review health notes'}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/members?health=hereditary" aria-label="View members with hereditary markers">
          <Card className="group h-full cursor-pointer bg-white/80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground font-bold flex items-center justify-between gap-1.5">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Hereditary
                </span>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{hereditaryCount}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {hereditaryCount === 0 ? 'Track family risks' : 'Review risk markers'}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <NextStep
          href="/tree"
          icon={TreePine}
          title="Explore the tree"
          copy="Use the visual map to see family connections and jump into profiles."
        />
        <NextStep
          href="/members"
          icon={Activity}
          title="Add health context"
          copy="Record conditions, medications, allergies, and notes for each person."
        />
        <NextStep
          href="/settings"
          icon={UserPlus}
          title="Invite a relative"
          copy="Bring another family member into the shared workspace."
        />
      </div>

      {nextAppointment && (
          <div className="rounded-3xl border border-primary/25 bg-primary/10 p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
                  <BellRing className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">Upcoming appointment alert</p>
                    <AppointmentCountdown appointmentDate={nextAppointment.appointment_date} />
                  </div>
                  <p className="mt-1 text-sm font-medium">{nextAppointment.title}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(nextAppointment.appointment_date), 'PPp')}
                    </span>
                    {nextAppointment.doctor_name && (
                      <span className="flex items-center gap-1">
                        <UserRound className="h-3.5 w-3.5" />
                        {nextAppointment.doctor_name}
                      </span>
                    )}
                    {nextAppointment.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {nextAppointment.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-primary">
                <Link href="/appointments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                  Review appointment
                <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <AppointmentReminderControls appointment={nextAppointment} />
            </div>
          </div>
      )}

      {/* Upcoming appointments */}
      <details className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur md:hidden">
        <summary className="cursor-pointer text-sm font-black">Show more upcoming appointments</summary>
        <div className="mt-4">
          {appointmentListItems.length > 0 ? (
            <AppointmentList appointments={appointmentListItems} showPerson />
          ) : (
            <p className="text-sm text-muted-foreground">No other appointments scheduled.</p>
          )}
        </div>
      </details>

      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">More Upcoming Appointments</h2>
          <Link href="/appointments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View all
          </Link>
        </div>
        {appointmentListItems.length > 0 ? (
          <AppointmentList appointments={appointmentListItems} showPerson />
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-white/65 px-4 py-12 text-center shadow-sm backdrop-blur">
            <EmptyStateIllustration variant="calendar" />
            <p className="mt-3 font-black">No other appointments scheduled</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Add the next visit so everyone can coordinate around the same care schedule.
            </p>
            <Link href="/appointments/new" className={buttonVariants({ className: 'mt-5' })}>
              Add appointment
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function NextStep({
  href,
  icon: Icon,
  title,
  copy,
}: {
  href: string
  icon: typeof TreePine
  title: string
  copy: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10"
    >
      <div className="mb-4 grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="font-black">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted-foreground">{copy}</p>
    </Link>
  )
}

function MetricCard({
  href,
  icon: Icon,
  title,
  value,
  copy,
  details,
}: {
  href: string
  icon: typeof ShieldCheck
  title: string
  value: string
  copy: string
  details?: string[]
}) {
  return (
    <div className="group rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-slate-900/10">
      <Link href={href}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{title}</p>
        <p className="mt-2 text-lg font-black leading-tight">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
      </Link>
      {details && (
        <details className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-black text-foreground">How score works</summary>
          <ul className="mt-2 space-y-1">
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}

function ChartCard({
  title,
  copy,
  data,
  tone,
}: {
  title: string
  copy: string
  data: { label: string; value: number; fullLabel?: string }[]
  tone: 'primary' | 'rose'
}) {
  const maxValue = Math.max(1, ...data.map((item) => item.value))
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100
    const y = 84 - (item.value / maxValue) * 68
    return `${x},${y}`
  }).join(' ')
  const stroke = tone === 'rose' ? '#e11d48' : '#10b981'

  return (
    <Card className="bg-white/75">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{copy}</p>
      </CardHeader>
      <CardContent>
        <svg viewBox="0 0 100 84" className="h-28 w-full overflow-visible" role="img" aria-label={title}>
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {data.map((item, index) => {
            const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100
            const y = 84 - (item.value / maxValue) * 68
            return (
              <g key={item.label}>
                <circle cx={x} cy={y} r="3" fill={stroke} />
                <title>{`${item.fullLabel ?? item.label}: ${item.value}`}</title>
              </g>
            )
          })}
        </svg>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {data.map((item) => (
            <div key={item.label} className="rounded-2xl border bg-white/75 p-2 text-center">
              <p className="text-sm font-black">{item.value}</p>
              <p className="break-words text-[11px] font-bold leading-tight text-muted-foreground">
                {item.fullLabel ?? item.label}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
