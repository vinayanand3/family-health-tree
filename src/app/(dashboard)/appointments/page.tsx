import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Plus } from 'lucide-react'

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
  const upcoming = (allAppointments ?? [])
    .filter((a) => a.appointment_date >= now && !a.is_completed)
    .reverse()
  const past = (allAppointments ?? []).filter(
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

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          <AppointmentList appointments={upcoming as any} showPerson />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <AppointmentList appointments={past as any} showPerson />
        </TabsContent>
      </Tabs>
    </div>
  )
}
