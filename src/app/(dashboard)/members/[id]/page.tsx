import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { HealthSummary } from '@/components/members/HealthSummary'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format } from 'date-fns'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [personResult, conditionsResult, medsResult, allergiesResult, appointmentsResult] = await Promise.all([
    supabase.from('persons').select('*').eq('id', id).single(),
    supabase.from('health_conditions').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    supabase.from('medications').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    supabase.from('allergies').select('*').eq('person_id', id),
    supabase.from('appointments').select('*').eq('person_id', id).order('appointment_date', { ascending: false }),
  ])

  if (!personResult.data) notFound()

  const person = personResult.data
  const conditions = conditionsResult.data ?? []
  const medications = medsResult.data ?? []
  const allergies = allergiesResult.data ?? []
  const appointments = appointmentsResult.data ?? []

  const initials = `${person.first_name[0]}${person.last_name?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <Link href="/members" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Members
        </Link>
        <Link href={`/members/${id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
        </Link>
      </div>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold">{person.first_name} {person.last_name}</h1>
          <div className="flex gap-2 mt-1 flex-wrap">
            {person.gender && <Badge variant="secondary">{person.gender}</Badge>}
            {person.date_of_birth && (
              <Badge variant="outline">Born {format(new Date(person.date_of_birth), 'PP')}</Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="health">
        <TabsList>
          <TabsTrigger value="health">Health Overview</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4">
          <HealthSummary
            conditions={conditions as any}
            medications={medications as any}
            allergies={allergies as any}
          />
          {person.notes && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <p className="text-sm font-medium mb-1">Notes</p>
              <p className="text-sm text-muted-foreground">{person.notes}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{appointments.length} total appointments</p>
            <Link href={`/appointments/new?person=${id}`} className={buttonVariants({ size: 'sm' })}>
              Add Appointment
            </Link>
          </div>
          <AppointmentList appointments={appointments as any} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
