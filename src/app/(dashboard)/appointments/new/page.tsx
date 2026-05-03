'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'
import { AppointmentFormData } from '@/lib/validations/appointment'
import { localDateTimeToIso } from '@/lib/appointment-dates'
import { Person } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewAppointmentPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(false)
  const [familyId, setFamilyId] = useState<string | null>(null)

  useEffect(() => {
    async function loadPersons() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: fm } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user!.id)
        .single()

      if (fm) {
        setFamilyId(fm.family_id)
        const { data } = await supabase
          .from('persons')
          .select('*')
          .eq('family_id', fm.family_id)
          .order('first_name')
        setPersons(data ?? [])
      }
    }
    loadPersons()
  }, [supabase])

  async function handleSubmit(data: AppointmentFormData) {
    if (!familyId) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('appointments').insert({
      ...data,
      appointment_date: localDateTimeToIso(data.appointment_date),
      follow_up_date: data.follow_up_date ? localDateTimeToIso(data.follow_up_date) : null,
      family_id: familyId,
      created_by: user!.id,
    })

    router.push('/appointments')
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <Link href="/appointments" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
        <h1 className="text-2xl font-bold mt-2">New Appointment</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentForm persons={persons} onSubmit={handleSubmit} isLoading={loading} />
        </CardContent>
      </Card>
    </div>
  )
}
