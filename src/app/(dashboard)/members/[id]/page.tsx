import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { HealthSummary } from '@/components/members/HealthSummary'
import { MemberMetricsPanel } from '@/components/members/MemberMetricsPanel'
import { VaccinationTracker } from '@/components/members/VaccinationTracker'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { AppointmentCountdown } from '@/components/appointments/AppointmentCountdown'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { differenceInYears, format } from 'date-fns'
import Link from 'next/link'
import { Activity, ArrowLeft, CalendarDays, FileText, GitFork, HeartPulse, Pencil, Pill, ShieldCheck, Syringe } from 'lucide-react'
import { Allergy, Appointment, HealthCondition, HealthMeasurement, Medication, Person, PersonHealthMetadata, Relationship, Vaccination } from '@/types'
import { describeRelationship } from '@/lib/relationships'
import { appointmentCategory } from '@/lib/appointments'

function uniqueVisibleRelationships(relationships: Relationship[]) {
  const seen = new Set<string>()

  return relationships.filter((relationship) => {
    const isReciprocal = relationship.relationship_type === 'spouse' || relationship.relationship_type === 'sibling'

    if (!isReciprocal) {
      return true
    }

    const ids = [relationship.person_id, relationship.related_person_id].sort()
    const key = `${relationship.relationship_type}:${ids.join(':')}`
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [personResult, conditionsResult, medsResult, allergiesResult, appointmentsResult, vaccinationsResult, metadataResult, measurementsResult] = await Promise.all([
    supabase.from('persons').select('*').eq('id', id).single(),
    supabase.from('health_conditions').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    supabase.from('medications').select('*').eq('person_id', id).order('created_at', { ascending: false }),
    supabase.from('allergies').select('*').eq('person_id', id),
    supabase.from('appointments').select('*').eq('person_id', id).order('appointment_date', { ascending: false }),
    supabase.from('vaccinations').select('*').eq('person_id', id).order('due_date', { ascending: true, nullsFirst: false }),
    supabase.from('person_health_metadata').select('*').eq('person_id', id).maybeSingle(),
    supabase.from('health_measurements').select('*').eq('person_id', id).order('measured_at', { ascending: false }),
  ])

  if (!personResult.data) notFound()

  const person = personResult.data as Person
  const [personsResult, relationshipsResult] = await Promise.all([
    supabase.from('persons').select('*').eq('family_id', person.family_id),
    supabase
      .from('relationships')
      .select('*')
      .eq('family_id', person.family_id)
      .or(`person_id.eq.${id},related_person_id.eq.${id}`),
  ])
  const conditions = (conditionsResult.data ?? []) as HealthCondition[]
  const medications = (medsResult.data ?? []) as Medication[]
  const allergies = (allergiesResult.data ?? []) as Allergy[]
  const appointments = (appointmentsResult.data ?? []) as Appointment[]
  const vaccinations = (vaccinationsResult.data ?? []) as Vaccination[]
  const metadata = (metadataResult.data ?? null) as PersonHealthMetadata | null
  const measurements = (measurementsResult.data ?? []) as HealthMeasurement[]
  const persons = (personsResult.data ?? []) as Person[]
  const relationships = (relationshipsResult.data ?? []) as Relationship[]
  const visibleRelationships = uniqueVisibleRelationships(relationships)
  const peopleById = Object.fromEntries(persons.map((member) => [member.id, member]))

  const initials = `${person.first_name[0]}${person.last_name?.[0] ?? ''}`.toUpperCase()
  const activeConditionCount = conditions.filter((condition) => condition.status === 'active' || condition.status === 'chronic').length
  const age = person.date_of_birth ? differenceInYears(new Date(), new Date(person.date_of_birth)) : null
  const isChild = age !== null && age < 18
  const latestMeasurement = measurements[0]
  const overdueVaccines = vaccinations.filter((vaccination) => {
    if (vaccination.status === 'overdue') return true
    return Boolean(vaccination.due_date && vaccination.due_date < new Date().toISOString().slice(0, 10))
  }).length
  const refillDueSoon = medications.filter((medication) => {
    if (!medication.refill_due_date) return false
    const due = new Date(medication.refill_due_date)
    const inThirty = new Date()
    inThirty.setDate(inThirty.getDate() + 30)
    return due <= inThirty
  }).length
  const nextAppointment = appointments
    .filter((appointment) => appointment.appointment_date >= new Date().toISOString() && !appointment.is_completed)
    .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0]
  const latestCompletedCheckup = appointments
    .filter((appointment) => appointment.is_completed && appointmentCategory(appointment) === 'Checkup')
    .sort((a, b) => {
      const bDate = new Date(b.completed_at ?? b.appointment_date).getTime()
      const aDate = new Date(a.completed_at ?? a.appointment_date).getTime()
      return bDate - aDate
    })[0]
  const latestCheckupDate = metadata?.last_checkup_date ?? latestCompletedCheckup?.completed_at ?? latestCompletedCheckup?.appointment_date ?? null
  const timeline = [
    ...appointments
      .filter((appointment) => appointment.completed_at || appointment.outcome_notes)
      .map((appointment) => ({
        date: appointment.completed_at ?? appointment.appointment_date,
        title: appointment.title,
        detail: appointment.outcome_notes ?? appointment.notes ?? 'Visit completed',
        kind: 'Appointment',
      })),
    ...vaccinations.map((vaccination) => ({
      date: vaccination.administered_date ?? vaccination.due_date ?? vaccination.created_at,
      title: vaccination.vaccine_name,
      detail: vaccination.dose_label ?? vaccination.status.replaceAll('_', ' '),
      kind: 'Vaccination',
    })),
    ...measurements.map((measurement) => ({
      date: measurement.measured_at,
      title: 'Measurement recorded',
      detail: [
        measurement.height_cm ? `${measurement.height_cm} cm` : null,
        measurement.weight_kg ? `${measurement.weight_kg} kg` : null,
        measurement.bmi ? `BMI ${measurement.bmi}` : null,
      ].filter(Boolean).join(' · ') || measurement.notes || 'Health measurement',
      kind: 'Measurement',
    })),
    ...conditions.map((condition) => ({
      date: condition.diagnosed_date ?? condition.created_at,
      title: condition.name,
      detail: `${condition.status}${condition.is_hereditary ? ' · hereditary' : ''}`,
      kind: 'Condition',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/members" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Members
        </Link>
        <Link href={`/members/${id}/edit`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
        </Link>
      </div>

      {/* Profile header */}
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 p-5 shadow-xl shadow-slate-900/10 backdrop-blur-xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {person.photo_url && <AvatarImage src={person.photo_url} alt={`${person.first_name} ${person.last_name ?? ''}`} />}
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
          <div className="grid grid-cols-3 gap-2 sm:min-w-72">
            <ProfileMetric icon={Activity} label="Conditions" value={activeConditionCount} />
            <ProfileMetric icon={Pill} label="Refills" value={refillDueSoon} />
            <ProfileMetric icon={Syringe} label="Vaccines" value={overdueVaccines} />
          </div>
        </div>
      </div>

      {isChild && (
        <Card className="border-blue-200 bg-blue-50/80">
          <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
            <PediatricMetric icon={Syringe} label="Vaccine attention" value={overdueVaccines > 0 ? `${overdueVaccines} overdue` : `${vaccinations.length} recorded`} />
            <PediatricMetric icon={HeartPulse} label="Growth percentile" value={latestMeasurement?.growth_percentile ? `${latestMeasurement.growth_percentile}%` : 'Add growth'} />
            <PediatricMetric icon={CalendarDays} label="Last checkup" value={latestCheckupDate ? format(new Date(latestCheckupDate), 'PP') : 'Add checkup'} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitFork className="h-4 w-4 text-primary" />
            Relationships
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visibleRelationships.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {visibleRelationships.map((relationship) => (
                <Badge key={relationship.id} variant="secondary">
                  {describeRelationship({ relationship, currentPersonId: id, peopleById })}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                No relationships have been added for this member yet.
              </p>
              <Link href={`/members/${id}/edit`} className={buttonVariants({ size: 'sm' })}>
                Add relationship
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="health">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
          <TabsTrigger value="health">Health Overview</TabsTrigger>
          <TabsTrigger value="vaccinations">Vaccinations ({vaccinations.length})</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <TrendCard label="Checkup recency" value={latestCheckupDate ? format(new Date(latestCheckupDate), 'PP') : 'Not recorded'} />
            <TrendCard label="Active conditions" value={`${activeConditionCount}`} />
            <TrendCard label="Upcoming care" value={`${nextAppointment ? 1 : 0}`} />
            <TrendCard label="Refill status" value={refillDueSoon > 0 ? `${refillDueSoon} soon` : 'Clear'} />
          </div>
          <HealthSummary
            personId={id}
            conditions={conditions}
            medications={medications}
            allergies={allergies}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-primary" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {person.notes ? (
                  <p className="text-sm leading-6 text-muted-foreground">{person.notes}</p>
                ) : (
                  <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
                    <p className="text-sm font-black">No notes yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add care preferences, context, or family observations from the edit screen.
                    </p>
                    <Link href={`/members/${id}/edit`} className={buttonVariants({ size: 'sm', className: 'mt-3' })}>
                      Add notes
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Care Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {nextAppointment ? (
                  <div className="rounded-2xl bg-primary/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black">Next appointment</p>
                      <AppointmentCountdown appointmentDate={nextAppointment.appointment_date} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{nextAppointment.title}</p>
                    <p className="mt-2 text-xs font-bold text-primary">
                      {format(new Date(nextAppointment.appointment_date), 'PPp')}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
                    <p className="text-sm font-black">No upcoming visit</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Schedule the next appointment to keep this profile active.
                    </p>
                    <Link href={`/appointments/new?person=${id}`} className={buttonVariants({ size: 'sm', className: 'mt-3' })}>
                      Add appointment
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-4">
          <VaccinationTracker personId={id} vaccinations={vaccinations} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-4">
          <MemberMetricsPanel
            personId={id}
            metadata={metadata}
            measurements={measurements}
            isChild={isChild}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Health Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="rounded-2xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                  Health events will appear here after visits, vaccines, measurements, and conditions are recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {timeline.slice(0, 12).map((item, index) => (
                    <div key={`${item.kind}-${item.date}-${index}`} className="rounded-2xl border bg-white/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-black">{item.title}</p>
                        <Badge variant="outline">{item.kind}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                      <p className="mt-2 text-xs font-bold text-primary">{format(new Date(item.date), 'PP')}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{appointments.length} total appointments</p>
            <Link href={`/appointments/new?person=${id}`} className={buttonVariants({ size: 'sm' })}>
              Add Appointment
            </Link>
          </div>
          <AppointmentList appointments={appointments} persons={persons} editable />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TrendCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-3 shadow-sm">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  )
}

function PediatricMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Syringe
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-white/75 p-3">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-blue-700">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 font-black text-blue-950">{value}</p>
    </div>
  )
}

function ProfileMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity
  label: string
  value: number
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white/80 p-3 text-center shadow-sm">
      <Icon className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-muted-foreground">{label}</p>
    </div>
  )
}
