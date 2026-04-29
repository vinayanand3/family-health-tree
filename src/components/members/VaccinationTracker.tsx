'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Vaccination, VaccinationStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Syringe } from 'lucide-react'

interface VaccinationTrackerProps {
  personId: string
  vaccinations: Vaccination[]
}

const statusLabels: Record<VaccinationStatus, string> = {
  up_to_date: 'Up to date',
  due: 'Due',
  overdue: 'Overdue',
  scheduled: 'Scheduled',
}

const statusClasses: Record<VaccinationStatus, string> = {
  up_to_date: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  due: 'border-amber-200 bg-amber-50 text-amber-700',
  overdue: 'border-red-200 bg-red-50 text-red-700',
  scheduled: 'border-blue-200 bg-blue-50 text-blue-700',
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? ''
  return text.length > 0 ? text : null
}

export function VaccinationTracker({ personId, vaccinations }: VaccinationTrackerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<VaccinationStatus>('up_to_date')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function saveVaccination(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)

    const { error: insertError } = await supabase.from('vaccinations').insert({
      person_id: personId,
      vaccine_name: emptyToNull(form.get('vaccine_name')),
      dose_label: emptyToNull(form.get('dose_label')),
      administered_date: emptyToNull(form.get('administered_date')),
      due_date: emptyToNull(form.get('due_date')),
      status,
      provider: emptyToNull(form.get('provider')),
      notes: emptyToNull(form.get('notes')),
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    event.currentTarget.reset()
    setStatus('up_to_date')
    router.refresh()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Syringe className="h-4 w-4 text-primary" />
            Vaccination history
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vaccinations.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
              <p className="text-sm font-black">No vaccines recorded yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add administered, scheduled, due, or overdue vaccines to keep this profile complete.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vaccinations.map((vaccination) => (
                <div key={vaccination.id} className="rounded-2xl border bg-white/80 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black">{vaccination.vaccine_name}</p>
                      {vaccination.dose_label && (
                        <p className="text-sm text-muted-foreground">{vaccination.dose_label}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={statusClasses[vaccination.status]}>
                      {statusLabels[vaccination.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>Given: {vaccination.administered_date ?? 'Not recorded'}</span>
                    <span>Due: {vaccination.due_date ?? 'Not recorded'}</span>
                    <span>{vaccination.provider ?? 'Provider not recorded'}</span>
                  </div>
                  {vaccination.notes && (
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{vaccination.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Add vaccination</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveVaccination} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Vaccine</Label>
              <Input name="vaccine_name" required placeholder="MMR, flu, COVID-19" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="dose_label" placeholder="Dose 1, booster" />
              <Input name="provider" placeholder="Provider" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Administered</Label>
                <Input name="administered_date" type="date" />
              </div>
              <div className="space-y-1.5">
                <Label>Due date</Label>
                <Input name="due_date" type="date" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as VaccinationStatus)}>
                <SelectTrigger className="w-full">
                  <span>{statusLabels[status]}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="up_to_date">Up to date</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea name="notes" rows={3} placeholder="Lot, reaction, pediatric notes, or instructions" />
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save vaccination'}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
