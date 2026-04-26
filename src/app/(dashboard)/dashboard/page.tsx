import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { buttonVariants } from '@/components/ui/button'
import { Users, CalendarDays, Activity, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { redirect } from 'next/navigation'

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
    .select('id')
    .eq('family_id', familyId)

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
  const upcomingAppointments = appointmentsResult.data ?? []
  const hereditaryCount = conditionsResult.data?.filter(c => c.is_hereditary).length ?? 0
  const conditionCount = conditionsResult.data?.length ?? 0

  const familyName = (familyMember.families as any)?.name ?? 'Your Family'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{familyName}</h1>
        <p className="text-muted-foreground">Family health overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{memberCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" /> Upcoming
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{upcomingAppointments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" /> Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{conditionCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Hereditary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{hereditaryCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Upcoming Appointments</h2>
          <Link href="/appointments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View all
          </Link>
        </div>
        <AppointmentList appointments={upcomingAppointments as any} showPerson />
      </div>
    </div>
  )
}
