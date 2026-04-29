'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Appointment, Person } from '@/types'
import { AppointmentList } from '@/components/appointments/AppointmentList'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { AppointmentFormData } from '@/lib/validations/appointment'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration'
import { Plus, Search } from 'lucide-react'
import Link from 'next/link'

interface AppointmentsBrowserProps {
  upcoming: Appointment[]
  past: Appointment[]
  persons: Person[]
  familyId: string
}

export function AppointmentsBrowser({ upcoming, past, persons, familyId }: AppointmentsBrowserProps) {
  const router = useRouter()
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [showInlineForm, setShowInlineForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const filterAppointments = useCallback((appointments: Appointment[]) => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return appointments

    return appointments.filter((appointment) => {
      const personName = appointment.persons
        ? `${appointment.persons.first_name} ${appointment.persons.last_name ?? ''}`
        : ''
      return [
        appointment.title,
        appointment.doctor_name,
        appointment.location,
        appointment.notes,
        personName,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    })
  }, [query])

  const filteredUpcoming = useMemo(() => filterAppointments(upcoming), [filterAppointments, upcoming])
  const filteredPast = useMemo(() => filterAppointments(past), [filterAppointments, past])

  async function createAppointment(data: AppointmentFormData) {
    setSaving(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('appointments').insert({
      ...data,
      family_id: familyId,
      created_by: user!.id,
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setShowInlineForm(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by visit, doctor, location, or family member"
              className="h-11 rounded-2xl bg-white pl-9"
            />
          </label>
          <Button type="button" onClick={() => setShowInlineForm((current) => !current)}>
            <Plus className="h-4 w-4" />
            {showInlineForm ? 'Close Form' : 'Add Appointment'}
          </Button>
        </div>
      </div>

      {showInlineForm && (
        <Card className="border-primary/20 bg-white/85 shadow-xl shadow-slate-900/10">
          <CardHeader>
            <CardTitle className="text-base">Add appointment</CardTitle>
          </CardHeader>
          <CardContent>
            <AppointmentForm
              persons={persons}
              onSubmit={createAppointment}
              isLoading={saving}
              submitLabel="Create appointment"
              onCancel={() => setShowInlineForm(false)}
            />
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming ({filteredUpcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({filteredPast.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="mt-4">
          {filteredUpcoming.length === 0 ? (
            <AppointmentEmptyState
              title="No upcoming appointments match"
              copy="Try a different search, or add the next visit so everyone knows what is coming."
            />
          ) : (
            <AppointmentList appointments={filteredUpcoming} showPerson />
          )}
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          {filteredPast.length === 0 ? (
            <AppointmentEmptyState
              title="No past appointments match"
              copy="Past visits will appear here once appointments are completed or their date has passed."
            />
          ) : (
            <AppointmentList appointments={filteredPast} showPerson />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AppointmentEmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-white/65 px-4 py-14 text-center shadow-sm backdrop-blur">
      <EmptyStateIllustration variant="calendar" />
      <p className="mt-3 font-black">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{copy}</p>
      <Link href="/appointments/new" className={buttonVariants({ className: 'mt-5' })}>
        Add appointment
      </Link>
    </div>
  )
}
