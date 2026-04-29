import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentsBrowser } from '@/components/appointments/AppointmentsBrowser'
import { AppointmentReminderControls } from '@/components/appointments/AppointmentReminderControls'
import { AddAppointmentTrigger } from '@/components/appointments/AddAppointmentTrigger'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, BellRing, CalendarDays, MapPin, Stethoscope, TrendingUp, UserRound } from 'lucide-react'
import { Appointment, Person } from '@/types'
import { differenceInCalendarDays, format, formatDistanceToNow } from 'date-fns'

function appointmentCategory(appointment: Appointment) {
  const text = `${appointment.title} ${appointment.doctor_name ?? ''}`.toLowerCase()
  if (text.includes('pediatric')) return 'Pediatric'
  if (text.includes('dental') || text.includes('dentist')) return 'Dental'
  if (text.includes('eye') || text.includes('vision') || text.includes('optom')) return 'Vision'
  if (text.includes('cardio')) return 'Cardiology'
  if (text.includes('derm')) return 'Dermatology'
  if (text.includes('checkup') || text.includes('physical') || text.includes('annual')) return 'Checkup'
  return 'General'
}

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user!.id)
    .single()

  if (!familyMember) redirect('/settings')

  const [appointmentsResult, personsResult] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, persons(first_name, last_name)')
      .eq('family_id', familyMember.family_id)
      .order('appointment_date', { ascending: false }),
    supabase
      .from('persons')
      .select('*')
      .eq('family_id', familyMember.family_id)
      .order('first_name'),
  ])

  const now = new Date().toISOString()
  const upcoming = ((appointmentsResult.data ?? []) as Appointment[])
    .filter((a) => a.appointment_date >= now && !a.is_completed)
    .reverse()
  const nextAppointment = upcoming[0]
  const past = ((appointmentsResult.data ?? []) as Appointment[]).filter(
    (a) => a.appointment_date < now || a.is_completed
  )
  const persons = (personsResult.data ?? []) as Person[]
  const completedCheckups = ((appointmentsResult.data ?? []) as Appointment[]).filter((appointment) => {
    const text = appointment.title.toLowerCase()
    return appointment.is_completed && (text.includes('checkup') || text.includes('physical') || text.includes('annual'))
  })
  const averageDaysSinceCheckup = completedCheckups.length > 0
    ? Math.round(
        completedCheckups.reduce((sum, appointment) => {
          const days = differenceInCalendarDays(new Date(), new Date(appointment.completed_at ?? appointment.appointment_date))
          return sum + Math.max(0, days)
        }, 0) / completedCheckups.length
      )
    : null
  const currentYear = new Date().getFullYear()
  const appointmentsThisYear = ((appointmentsResult.data ?? []) as Appointment[]).filter(
    (appointment) => new Date(appointment.appointment_date).getFullYear() === currentYear
  )
  const perMemberFrequency = persons.length > 0 ? (appointmentsThisYear.length / persons.length).toFixed(1) : '0'
  const categoryCounts = appointmentsThisYear.reduce<Record<string, number>>((counts, appointment) => {
    const category = appointmentCategory(appointment)
    counts[category] = (counts[category] ?? 0) + 1
    return counts
  }, {})
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-end md:justify-between">
        <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-primary">
              <CalendarDays className="h-3.5 w-3.5" />
              Care schedule
            </p>
          <h1 className="text-3xl font-black">Appointments</h1>
          <p className="mt-2 text-sm text-muted-foreground">
              {upcoming.length} upcoming · {past.length} past visits
            </p>
        </div>
        <AddAppointmentTrigger />
        </div>
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
                  <p className="font-bold">Next appointment</p>
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
            <AppointmentReminderControls appointment={nextAppointment} />
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <AnalyticsCard
          icon={TrendingUp}
          title="Frequency"
          value={`${perMemberFrequency} per member`}
          copy={`${appointmentsThisYear.length} appointments in ${currentYear}`}
        />
        <AnalyticsCard
          icon={Activity}
          title="Checkup recency"
          value={averageDaysSinceCheckup === null ? 'No completed checkups' : `${averageDaysSinceCheckup} days avg`}
          copy="Based on completed appointments tagged as checkup, physical, or annual"
        />
        <AnalyticsCard
          icon={Stethoscope}
          title="Care mix"
          value={topCategory ? topCategory[0] : 'No data yet'}
          copy={topCategory ? `${topCategory[1]} visit${topCategory[1] === 1 ? '' : 's'} this year` : 'Doctor and title heuristics will fill this in'}
        />
      </div>

      <AppointmentsBrowser
        upcoming={upcoming}
        past={past}
        persons={persons}
        familyId={familyMember.family_id}
      />
    </div>
  )
}

function AnalyticsCard({
  icon: Icon,
  title,
  value,
  copy,
}: {
  icon: typeof TrendingUp
  title: string
  value: string
  copy: string
}) {
  return (
    <Card className="bg-white/75">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-black">{value}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
      </CardContent>
    </Card>
  )
}
