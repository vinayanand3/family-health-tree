import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { AppointmentReminderControls } from '@/components/appointments/AppointmentReminderControls'
import { buttonVariants } from '@/components/ui/button'
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration'
import { Users, CalendarDays, Activity, AlertTriangle, ArrowRight, BellRing, MapPin, UserRound, TreePine, Plus, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Appointment } from '@/types'
import { differenceInCalendarDays, format, formatDistanceToNow } from 'date-fns'

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

  const personsResult = await supabase
    .from('persons')
    .select('id, first_name, last_name, photo_url')
    .eq('family_id', familyId)
    .order('created_at')

  const appointmentsResult = await supabase
    .from('appointments')
    .select('*, persons(first_name, last_name)')
    .eq('family_id', familyId)
    .eq('is_completed', false)
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date', { ascending: true })
    .limit(5)

  const personIds = personsResult.data?.map(p => p.id) ?? []
  const conditionsResult = personIds.length > 0
    ? await supabase.from('health_conditions').select('id, is_hereditary').in('person_id', personIds)
    : { data: [] }

  const memberCount = personsResult.data?.length ?? 0
  const upcomingAppointments = (appointmentsResult.data ?? []) as Appointment[]
  const nextAppointment = upcomingAppointments[0]
  const hereditaryCount = conditionsResult.data?.filter(c => c.is_hereditary).length ?? 0
  const conditionCount = conditionsResult.data?.length ?? 0

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
                Add health profile
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
                {(personsResult.data ?? []).slice(0, 5).map((person) => (
                  <div
                    key={person.id}
                    className="grid size-12 place-items-center overflow-hidden rounded-full border-4 border-white bg-primary/10 text-sm font-black text-primary shadow-sm"
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
                  </div>
                ))}
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          href="/members/new"
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
                    <span className="rounded-full bg-white/75 px-2.5 py-1 text-xs font-bold text-primary">
                      {differenceInCalendarDays(new Date(nextAppointment.appointment_date), new Date()) === 0
                        ? 'Today'
                        : formatDistanceToNow(new Date(nextAppointment.appointment_date), { addSuffix: true })}
                    </span>
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
                <Link href="/appointments" className="inline-flex items-center gap-2">
                  Review appointment
                <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <AppointmentReminderControls appointment={nextAppointment} />
            </div>
          </div>
      )}

      {/* Upcoming appointments */}
      <div>
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
