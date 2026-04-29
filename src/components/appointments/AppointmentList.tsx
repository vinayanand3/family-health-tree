'use client'

import { ReactNode, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Appointment, Person } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { AppointmentReminderControls } from '@/components/appointments/AppointmentReminderControls'
import { AppointmentCountdown } from '@/components/appointments/AppointmentCountdown'
import { AppointmentFormData } from '@/lib/validations/appointment'
import { appointmentCategory } from '@/lib/appointments'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { differenceInCalendarDays, format, isPast } from 'date-fns'
import { BellRing, CalendarDays, CheckCircle2, ChevronDown, Edit3, FileText, MapPin, User } from 'lucide-react'

interface AppointmentListProps {
  appointments: Appointment[]
  showPerson?: boolean
  persons?: Person[]
  editable?: boolean
}

function toDateTimeLocal(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function compactPayload(data: AppointmentFormData) {
  return {
    person_id: data.person_id,
    title: data.title,
    appointment_type: data.appointment_type || null,
    doctor_name: data.doctor_name || null,
    location: data.location || null,
    appointment_date: data.appointment_date,
    notes: data.notes || null,
    outcome_notes: data.outcome_notes || null,
    follow_up_needed: data.follow_up_needed ?? false,
    follow_up_date: data.follow_up_date || null,
  }
}

export function AppointmentList({ appointments, showPerson = false, persons = [], editable = false }: AppointmentListProps) {
  const router = useRouter()
  const supabase = createClient()
  const [openId, setOpenId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const personOptions = useMemo(() => {
    if (persons.length > 0) return persons
    const fromAppointments = appointments
      .filter((appointment) => appointment.persons)
      .map((appointment) => ({
        id: appointment.person_id,
        family_id: appointment.family_id,
        user_id: null,
        first_name: appointment.persons!.first_name,
        last_name: appointment.persons!.last_name,
        date_of_birth: null,
        gender: null,
        photo_url: null,
        notes: null,
        created_at: appointment.created_at,
      }))
    return Array.from(new Map(fromAppointments.map((person) => [person.id, person])).values())
  }, [appointments, persons])

  async function updateAppointment(appointmentId: string, data: AppointmentFormData) {
    setSavingId(appointmentId)
    setError('')
    const { error: updateError } = await supabase
      .from('appointments')
      .update(compactPayload(data))
      .eq('id', appointmentId)

    setSavingId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }

    setEditingId(null)
    router.refresh()
  }

  async function markComplete(appointment: Appointment) {
    setSavingId(appointment.id)
    setError('')
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        is_completed: true,
        completed_at: appointment.completed_at ?? new Date().toISOString(),
      })
      .eq('id', appointment.id)

    setSavingId(null)
    if (updateError) {
      setError(updateError.message)
      return
    }

    router.refresh()
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No appointments found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((appt) => {
        const isOverdue = isPast(new Date(appt.appointment_date)) && !appt.is_completed
        const daysUntil = differenceInCalendarDays(new Date(appt.appointment_date), new Date())
        const needsAttention = !appt.is_completed && !isOverdue && daysUntil <= 7
        const isOpen = openId === appt.id
        const needsOutcome = (appt.appointment_date < new Date().toISOString() || appt.is_completed) && !appt.outcome_notes

        return (
          <Card
            key={appt.id}
            className={cn(
              'transition-all',
              needsAttention ? 'border-primary/30 bg-primary/5' : isOverdue ? 'border-rose-200' : '',
              isOpen && 'shadow-lg shadow-slate-900/10'
            )}
          >
            <CardContent className="py-4">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-left"
                onClick={() => {
                  setEditingId(null)
                  setOpenId(isOpen ? null : appt.id)
                }}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{appt.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {appointmentCategory(appt)}
                    </Badge>
                    <AppointmentCountdown appointmentDate={appt.appointment_date} isCompleted={appt.is_completed} />
                    {appt.is_completed && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Completed
                      </Badge>
                    )}
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                    {needsAttention && (
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                        <BellRing className="h-3 w-3" />
                        {daysUntil === 0 ? 'Today' : `${daysUntil} day${daysUntil === 1 ? '' : 's'}`}
                      </Badge>
                    )}
                    {needsOutcome && (
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-xs text-amber-700">
                        Log outcome
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(appt.appointment_date), 'PPp')}
                    </span>
                    {appt.doctor_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {appt.doctor_name}
                      </span>
                    )}
                    {appt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {appt.location}
                      </span>
                    )}
                    {showPerson && appt.persons && (
                      <span className="font-medium text-foreground">
                        {appt.persons.first_name} {appt.persons.last_name}
                      </span>
                    )}
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{appt.notes}</p>
                  )}
                </div>
                <ChevronDown className={cn('mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="mt-4 border-t pt-4" onClick={(event) => event.stopPropagation()}>
                  {editingId === appt.id ? (
                    <div className="rounded-2xl border bg-white/80 p-4">
                      <AppointmentForm
                        persons={personOptions}
                        defaultValues={{
                          person_id: appt.person_id,
                          title: appt.title,
                          appointment_type: appt.appointment_type ?? undefined,
                          doctor_name: appt.doctor_name ?? '',
                          location: appt.location ?? '',
                          appointment_date: toDateTimeLocal(appt.appointment_date),
                          notes: appt.notes ?? '',
                          outcome_notes: appt.outcome_notes ?? '',
                          follow_up_needed: appt.follow_up_needed ?? false,
                          follow_up_date: toDateTimeLocal(appt.follow_up_date),
                        }}
                        onSubmit={(data) => updateAppointment(appt.id, data)}
                        isLoading={savingId === appt.id}
                        submitLabel="Save changes"
                        onCancel={() => setEditingId(null)}
                        includeOutcomeFields
                      />
                    </div>
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                      <div className="space-y-3">
                        <DetailRow label="Type" value={appointmentCategory(appt)} />
                        <DetailRow label="Doctor" value={appt.doctor_name} />
                        <DetailRow label="Location" value={appt.location} />
                        <DetailRow label="Notes" value={appt.notes} />
                        <DetailRow label="Outcome" value={appt.outcome_notes} icon={<FileText className="h-3.5 w-3.5" />} />
                        {appt.follow_up_needed && (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm">
                            <p className="font-black text-amber-800">Follow-up needed</p>
                            <p className="mt-1 text-amber-700">
                              {appt.follow_up_date
                                ? format(new Date(appt.follow_up_date), 'PPp')
                                : 'Date has not been set yet'}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row lg:min-w-56 lg:flex-col">
                        <AppointmentReminderControls appointment={appt} />
                        {editable && (
                          <>
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(appt.id)}>
                              <Edit3 className="h-3.5 w-3.5" />
                              {needsOutcome ? 'Log visit outcome' : 'Edit'}
                            </Button>
                            {!appt.is_completed && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => markComplete(appt)}
                                disabled={savingId === appt.id}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark complete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string
  value: string | null
  icon?: ReactNode
}) {
  if (!value) return null
  return (
    <div className="rounded-2xl border bg-white/70 p-3 text-sm">
      <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 leading-6 text-foreground">{value}</p>
    </div>
  )
}
