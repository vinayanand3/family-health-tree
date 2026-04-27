import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { BellRing, CalendarDays, MapPin, Plus, UserRound } from 'lucide-react'
import { Appointment } from '@/types'
import { differenceInCalendarDays, format, formatDistanceToNow } from 'date-fns'

export default async function AppointmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: familyMember } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', user!.id)
    .single()

  if (!familyMember) redirect('/settings')

  const { data: allAppointments } = await supabase
    .from('appointments')
    .select('*, persons(first_name, last_name)')
    .eq('family_id', familyMember.family_id)
    .order('appointment_date', { ascending: false })

  const now = new Date().toISOString()
  const upcoming = ((allAppointments ?? []) as Appointment[])
    .filter((a) => a.appointment_date >= now && !a.is_completed)
    .reverse()
  const nextAppointment = upcoming[0]
  const past = ((allAppointments ?? []) as Appointment[]).filter(
    (a) => a.appointment_date < now || a.is_completed
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Appointments</h1>
          <p className="text-muted-foreground text-sm">{upcoming.length} upcoming</p>
        </div>
        <Link href="/appointments/new" className={buttonVariants({})}>
          <Plus className="h-4 w-4 mr-2" /> Add Appointment
        </Link>
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
            <p className="text-sm font-medium text-primary">Free in-app reminder</p>
          </div>
        </div>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          <AppointmentList appointments={upcoming} showPerson />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <AppointmentList appointments={past} showPerson />
        </TabsContent>
      </Tabs>
    </div>
  )
}
