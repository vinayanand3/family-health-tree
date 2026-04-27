import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { buttonVariants } from '@/components/ui/button'
import { Users, CalendarDays, Activity, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Appointment } from '@/types'

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
  const upcomingAppointments = (appointmentsResult.data ?? []) as Appointment[]
  const hereditaryCount = conditionsResult.data?.filter(c => c.is_hereditary).length ?? 0
  const conditionCount = conditionsResult.data?.length ?? 0

  const familyRelation = familyMember.families as { name?: string } | { name?: string }[] | null
  const familyName = (Array.isArray(familyRelation) ? familyRelation[0]?.name : familyRelation?.name) ?? 'Your Family'

  return (
    <div className="space-y-7">
      <div className="rounded-3xl border border-border/70 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold text-primary">Family workspace</p>
            <h1 className="mt-2 text-3xl font-black">{familyName}</h1>
            <p className="text-muted-foreground">A shared command center for the people you care for.</p>
          </div>
          <Link href="/tree" className={buttonVariants({ variant: 'outline' })}>
            Open tree
            <ArrowRight className="h-4 w-4" />
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
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Upcoming appointments */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Upcoming Appointments</h2>
          <Link href="/appointments" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            View all
          </Link>
        </div>
        <AppointmentList appointments={upcomingAppointments} showPerson />
      </div>
    </div>
  )
}
