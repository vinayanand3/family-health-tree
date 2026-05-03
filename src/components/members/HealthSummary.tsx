'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HealthCondition, Medication, Allergy, AllergySeverity, ConditionStatus } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration'
import { Pill, AlertTriangle, Activity, Plus, ClipboardCheck, CalendarDays } from 'lucide-react'

interface HealthSummaryProps {
  personId: string
  conditions: HealthCondition[]
  medications: Medication[]
  allergies: Allergy[]
}

type OpenForm = 'condition' | 'medication' | 'allergy' | null

const statusColors: Record<string, string> = {
  active: 'bg-red-100 text-red-700',
  chronic: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
}

const severityColors: Record<string, string> = {
  mild: 'bg-yellow-100 text-yellow-700',
  moderate: 'bg-orange-100 text-orange-700',
  severe: 'bg-red-100 text-red-700',
}

const statusLabels: Record<ConditionStatus, string> = {
  active: 'Active',
  chronic: 'Chronic',
  resolved: 'Resolved',
}

const severityLabels: Record<AllergySeverity, string> = {
  mild: 'Mild',
  moderate: 'Moderate',
  severe: 'Severe',
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? ''
  return text.length > 0 ? text : null
}

function AddButton({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant={active ? 'secondary' : 'outline'} size="sm" onClick={onClick}>
      <Plus className="h-3.5 w-3.5" />
      {active ? 'Close' : 'Add'}
    </Button>
  )
}

function daysUntil(value: string | null) {
  if (!value) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(value)
  due.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
}

function EmptyHealthState({
  icon: Icon,
  title,
  copy,
}: {
  icon: typeof Activity
  title: string
  copy: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center">
      <EmptyStateIllustration variant="health" />
      <Icon className="mx-auto mt-3 h-5 w-5 text-primary" />
      <p className="mt-2 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy}</p>
    </div>
  )
}

export function HealthSummary({ personId, conditions, medications, allergies }: HealthSummaryProps) {
  const router = useRouter()
  const supabase = createClient()
  const [openForm, setOpenForm] = useState<OpenForm>(null)
  const [conditionStatus, setConditionStatus] = useState<ConditionStatus>('active')
  const [allergySeverity, setAllergySeverity] = useState<AllergySeverity>('mild')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isNewProfile = conditions.length === 0 && medications.length === 0 && allergies.length === 0

  function toggleForm(form: OpenForm) {
    setError('')
    setOpenForm(openForm === form ? null : form)
  }

  async function saveCondition(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase.from('health_conditions').insert({
      person_id: personId,
      name: emptyToNull(form.get('name')),
      status: conditionStatus,
      is_hereditary: form.get('is_hereditary') === 'on',
      diagnosed_date: emptyToNull(form.get('diagnosed_date')),
      notes: emptyToNull(form.get('notes')),
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setOpenForm(null)
    router.refresh()
  }

  async function saveMedication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase.from('medications').insert({
      person_id: personId,
      name: emptyToNull(form.get('name')),
      dosage: emptyToNull(form.get('dosage')),
      frequency: emptyToNull(form.get('frequency')),
      start_date: emptyToNull(form.get('start_date')),
      end_date: emptyToNull(form.get('end_date')),
      refill_due_date: emptyToNull(form.get('refill_due_date')),
      pharmacy: emptyToNull(form.get('pharmacy')),
      prescriber: emptyToNull(form.get('prescriber')),
      reminder_enabled: form.get('reminder_enabled') === 'on',
      notes: emptyToNull(form.get('notes')),
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setOpenForm(null)
    router.refresh()
  }

  async function saveAllergy(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')

    const form = new FormData(event.currentTarget)
    const { error: insertError } = await supabase.from('allergies').insert({
      person_id: personId,
      allergen: emptyToNull(form.get('allergen')),
      severity: allergySeverity,
      notes: emptyToNull(form.get('notes')),
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    setOpenForm(null)
    router.refresh()
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {isNewProfile && (
        <Card className="md:col-span-3 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Start building this health profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {[
                ['Add condition', 'condition'],
                ['Add medication', 'medication'],
                ['Add allergy', 'allergy'],
                ['Add appointment', 'appointment'],
                ['Add notes', 'notes'],
              ].map(([label, target]) => {
                if (target === 'appointment') {
                  return (
                    <a
                      key={label}
                      href={`/appointments/new?person=${personId}`}
                      className="rounded-2xl border bg-white/75 px-3 py-3 text-sm font-black transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-md active:translate-y-0"
                    >
                      {label}
                    </a>
                  )
                }

                if (target === 'notes') {
                  return (
                    <a
                      key={label}
                      href={`/members/${personId}/edit`}
                      className="rounded-2xl border bg-white/75 px-3 py-3 text-sm font-black transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-md active:translate-y-0"
                    >
                      {label}
                    </a>
                  )
                }

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleForm(target as OpenForm)}
                    className="rounded-2xl border bg-white/75 px-3 py-3 text-left text-sm font-black transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-md active:translate-y-0"
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-rose-500" />
            Conditions
          </CardTitle>
          <AddButton active={openForm === 'condition'} onClick={() => toggleForm('condition')} />
        </CardHeader>
        <CardContent className="space-y-4">
          {conditions.length === 0 ? (
            <EmptyHealthState
              icon={Activity}
              title="No conditions recorded"
              copy="Add diagnoses, chronic issues, or resolved concerns when they matter."
            />
          ) : (
            <ul className="space-y-2">
              {conditions.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    {c.is_hereditary && (
                      <span className="flex items-center gap-1 text-xs text-amber-600">
                        <AlertTriangle className="h-3 w-3" /> Hereditary
                      </span>
                    )}
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {openForm === 'condition' && (
            <form onSubmit={saveCondition} className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Condition name</Label>
                <Input name="name" required placeholder="Asthma, diabetes, migraine" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={conditionStatus} onValueChange={(value) => setConditionStatus(value as ConditionStatus)}>
                    <SelectTrigger className="w-full">
                      <span>{statusLabels[conditionStatus]}</span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="chronic">Chronic</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Diagnosed date</Label>
                  <Input name="diagnosed_date" type="date" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="is_hereditary" type="checkbox" className="h-4 w-4 rounded border-input" />
                Hereditary or family risk
              </label>
              <Textarea name="notes" placeholder="Notes, triggers, doctor guidance..." rows={2} />
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save condition'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Pill className="h-4 w-4 text-blue-500" />
            Medications
          </CardTitle>
          <AddButton active={openForm === 'medication'} onClick={() => toggleForm('medication')} />
        </CardHeader>
        <CardContent className="space-y-4">
          {medications.length === 0 ? (
            <EmptyHealthState
              icon={Pill}
              title="No medications recorded"
              copy="Track current medicines, dosage, frequency, and refill context."
            />
          ) : (
            <ul className="space-y-2">
              {medications.map((m) => (
                <li key={m.id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{m.name}</p>
                    {m.refill_due_date && (
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        (daysUntil(m.refill_due_date) ?? 99) < 0
                          ? 'bg-red-100 text-red-700'
                          : (daysUntil(m.refill_due_date) ?? 99) <= 30
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-50 text-blue-700'
                      }`}>
                        Refill {daysUntil(m.refill_due_date)! < 0 ? 'overdue' : `in ${daysUntil(m.refill_due_date)}d`}
                      </span>
                    )}
                  </div>
                  {(m.dosage || m.frequency) && (
                    <p className="text-xs text-muted-foreground">
                      {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {(m.prescriber || m.pharmacy) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[m.prescriber, m.pharmacy].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}

          {openForm === 'medication' && (
            <form onSubmit={saveMedication} className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Medication name</Label>
                <Input name="name" required placeholder="Medication name" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Dosage</Label>
                  <Input name="dosage" placeholder="10 mg" />
                </div>
                <div className="space-y-1.5">
                  <Label>Frequency</Label>
                  <Input name="frequency" placeholder="Once daily" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Start date</Label>
                  <Input name="start_date" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label>End date</Label>
                  <Input name="end_date" type="date" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Refill due</Label>
                  <Input name="refill_due_date" type="date" />
                </div>
                <div className="space-y-1.5">
                  <Label>Pharmacy</Label>
                  <Input name="pharmacy" placeholder="CVS, Walgreens, local pharmacy" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Prescriber</Label>
                <Input name="prescriber" placeholder="Dr. Smith" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="reminder_enabled" type="checkbox" className="h-4 w-4 rounded border-input" />
                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                Remind family before refill
              </label>
              <Textarea name="notes" placeholder="Notes, side effects, refill details..." rows={2} />
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save medication'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Allergies
          </CardTitle>
          <AddButton active={openForm === 'allergy'} onClick={() => toggleForm('allergy')} />
        </CardHeader>
        <CardContent className="space-y-4">
          {allergies.length === 0 ? (
            <EmptyHealthState
              icon={AlertTriangle}
              title="No allergies recorded"
              copy="Add allergies and severity so care decisions are easier later."
            />
          ) : (
            <ul className="space-y-2">
              {allergies.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.allergen}</p>
                  {a.severity && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[a.severity]}`}>
                      {a.severity}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {openForm === 'allergy' && (
            <form onSubmit={saveAllergy} className="space-y-3 rounded-xl border bg-muted/20 p-3">
              <div className="space-y-1.5">
                <Label>Allergen</Label>
                <Input name="allergen" required placeholder="Peanuts, penicillin, pollen" />
              </div>
              <div className="space-y-1.5">
                <Label>Severity</Label>
                <Select value={allergySeverity} onValueChange={(value) => setAllergySeverity(value as AllergySeverity)}>
                  <SelectTrigger className="w-full">
                    <span>{severityLabels[allergySeverity]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea name="notes" placeholder="Reaction, treatment plan, emergency notes..." rows={2} />
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save allergy'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {error && <p className="md:col-span-3 text-sm text-destructive">{error}</p>}
    </div>
  )
}
