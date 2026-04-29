'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HealthMeasurement, PersonHealthMetadata } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Activity, Edit3, HeartPulse, Phone, ShieldCheck, Trash2, X } from 'lucide-react'

interface MemberMetricsPanelProps {
  personId: string
  metadata: PersonHealthMetadata | null
  measurements: HealthMeasurement[]
  isChild: boolean
}

function emptyToNull(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? ''
  return text.length > 0 ? text : null
}

function numberOrNull(value: FormDataEntryValue | null) {
  const text = value?.toString().trim() ?? ''
  if (!text) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

function calculateBmi(heightCm: number | null, weightKg: number | null) {
  if (!heightCm || !weightKg) return null
  const heightM = heightCm / 100
  return Number((weightKg / (heightM * heightM)).toFixed(1))
}

export function MemberMetricsPanel({ personId, metadata, measurements, isChild }: MemberMetricsPanelProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [editingMeasurementId, setEditingMeasurementId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const latestMeasurement = useMemo(
    () => [...measurements].sort((a, b) => b.measured_at.localeCompare(a.measured_at))[0] ?? null,
    [measurements]
  )

  async function saveMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)

    const { error: upsertError } = await supabase.from('person_health_metadata').upsert({
      person_id: personId,
      blood_type: emptyToNull(form.get('blood_type')),
      last_checkup_date: emptyToNull(form.get('last_checkup_date')),
      emergency_contact_name: emptyToNull(form.get('emergency_contact_name')),
      emergency_contact_phone: emptyToNull(form.get('emergency_contact_phone')),
      emergency_contact_relationship: emptyToNull(form.get('emergency_contact_relationship')),
      insurance_provider: emptyToNull(form.get('insurance_provider')),
      insurance_member_id: emptyToNull(form.get('insurance_member_id')),
      updated_at: new Date().toISOString(),
    })

    setSaving(false)
    if (upsertError) {
      setError(upsertError.message)
      return
    }

    router.refresh()
  }

  async function updateMeasurement(event: FormEvent<HTMLFormElement>, measurementId: string) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const heightCm = numberOrNull(form.get('height_cm'))
    const weightKg = numberOrNull(form.get('weight_kg'))

    const { error: updateError } = await supabase.from('health_measurements').update({
      measured_at: emptyToNull(form.get('measured_at')),
      height_cm: heightCm,
      weight_kg: weightKg,
      bmi: calculateBmi(heightCm, weightKg),
      growth_percentile: numberOrNull(form.get('growth_percentile')),
      notes: emptyToNull(form.get('notes')),
    }).eq('id', measurementId)

    setSaving(false)
    if (updateError) {
      setError(updateError.message)
      return
    }

    setEditingMeasurementId(null)
    router.refresh()
  }

  async function deleteMeasurement(measurementId: string) {
    if (!window.confirm('Delete this measurement?')) return
    setSaving(true)
    setError('')
    const { error: deleteError } = await supabase
      .from('health_measurements')
      .delete()
      .eq('id', measurementId)

    setSaving(false)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    router.refresh()
  }

  async function addMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const form = new FormData(event.currentTarget)
    const heightCm = numberOrNull(form.get('height_cm'))
    const weightKg = numberOrNull(form.get('weight_kg'))

    const { error: insertError } = await supabase.from('health_measurements').insert({
      person_id: personId,
      measured_at: emptyToNull(form.get('measured_at')),
      height_cm: heightCm,
      weight_kg: weightKg,
      bmi: calculateBmi(heightCm, weightKg),
      growth_percentile: numberOrNull(form.get('growth_percentile')),
      notes: emptyToNull(form.get('notes')),
    })

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }

    event.currentTarget.reset()
    router.refresh()
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Health essentials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveMetadata} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Blood type</Label>
                <Input name="blood_type" defaultValue={metadata?.blood_type ?? ''} placeholder="O+, A-, unknown" />
              </div>
              <div className="space-y-1.5">
                <Label>Last checkup</Label>
                <Input name="last_checkup_date" type="date" defaultValue={metadata?.last_checkup_date ?? ''} />
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-3">
              <p className="mb-3 flex items-center gap-2 text-sm font-black">
                <Phone className="h-4 w-4 text-primary" />
                Emergency contact
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input name="emergency_contact_name" defaultValue={metadata?.emergency_contact_name ?? ''} placeholder="Name" />
                <Input name="emergency_contact_phone" defaultValue={metadata?.emergency_contact_phone ?? ''} placeholder="Phone" />
                <Input name="emergency_contact_relationship" defaultValue={metadata?.emergency_contact_relationship ?? ''} placeholder="Relationship" />
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-3">
              <p className="mb-3 text-sm font-black">Insurance</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input name="insurance_provider" defaultValue={metadata?.insurance_provider ?? ''} placeholder="Provider" />
                <Input name="insurance_member_id" defaultValue={metadata?.insurance_member_id ?? ''} placeholder="Member ID" />
              </div>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save essentials'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4 text-primary" />
            Growth and BMI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Metric label="Height" value={latestMeasurement?.height_cm ? `${latestMeasurement.height_cm} cm` : 'None'} />
            <Metric label="Weight" value={latestMeasurement?.weight_kg ? `${latestMeasurement.weight_kg} kg` : 'None'} />
            <Metric label={isChild ? 'Growth' : 'BMI'} value={isChild ? latestMeasurement?.growth_percentile ? `${latestMeasurement.growth_percentile}%` : 'None' : latestMeasurement?.bmi ? `${latestMeasurement.bmi}` : 'None'} />
          </div>

          {measurements.length >= 2 && (
            <MeasurementTrend measurements={measurements} isChild={isChild} />
          )}

          <form onSubmit={addMeasurement} className="space-y-3 rounded-2xl border bg-muted/20 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Measured date</Label>
                <Input name="measured_at" type="date" required />
              </div>
              <div className="space-y-1.5">
                <Label>Growth percentile</Label>
                <Input name="growth_percentile" type="number" step="0.1" min="0" max="100" placeholder={isChild ? '62' : 'Optional'} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input name="height_cm" type="number" step="0.1" min="0" placeholder="Height cm" />
              <Input name="weight_kg" type="number" step="0.1" min="0" placeholder="Weight kg" />
            </div>
            <Textarea name="notes" rows={2} placeholder="Growth notes, pediatric guidance, or context" />
            <Button type="submit" variant="outline" disabled={saving}>
              Add measurement
            </Button>
          </form>

          {measurements.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-black">Recent measurements</p>
              {measurements.slice(0, 5).map((measurement) => (
                <div key={measurement.id} className="rounded-2xl border bg-white/80 p-3">
                  {editingMeasurementId === measurement.id ? (
                    <form onSubmit={(event) => updateMeasurement(event, measurement.id)} className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input name="measured_at" type="date" required defaultValue={measurement.measured_at} />
                        <Input name="growth_percentile" type="number" step="0.1" min="0" max="100" defaultValue={measurement.growth_percentile ?? ''} placeholder="Growth percentile" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Input name="height_cm" type="number" step="0.1" min="0" defaultValue={measurement.height_cm ?? ''} placeholder="Height cm" />
                        <Input name="weight_kg" type="number" step="0.1" min="0" defaultValue={measurement.weight_kg ?? ''} placeholder="Weight kg" />
                      </div>
                      <Textarea name="notes" rows={2} defaultValue={measurement.notes ?? ''} />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button type="button" variant="outline" onClick={() => setEditingMeasurementId(null)} disabled={saving}>
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                          {saving ? 'Saving...' : 'Save changes'}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black">{measurement.measured_at}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[
                              measurement.height_cm ? `${measurement.height_cm} cm` : null,
                              measurement.weight_kg ? `${measurement.weight_kg} kg` : null,
                              measurement.bmi ? `BMI ${measurement.bmi}` : null,
                              measurement.growth_percentile ? `${measurement.growth_percentile}% growth` : null,
                            ].filter(Boolean).join(' · ') || 'No values recorded'}
                          </p>
                          {measurement.notes && (
                            <p className="mt-1 text-xs leading-5 text-muted-foreground">{measurement.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setEditingMeasurementId(measurement.id)}>
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => deleteMeasurement(measurement.id)} disabled={saving}>
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}

function MeasurementTrend({
  measurements,
  isChild,
}: {
  measurements: HealthMeasurement[]
  isChild: boolean
}) {
  const data = [...measurements]
    .sort((a, b) => a.measured_at.localeCompare(b.measured_at))
    .slice(-8)
    .map((measurement) => ({
      label: new Date(measurement.measured_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: isChild ? measurement.growth_percentile ?? measurement.bmi ?? 0 : measurement.bmi ?? measurement.weight_kg ?? 0,
    }))
  const max = Math.max(1, ...data.map((item) => item.value))
  const min = Math.min(0, ...data.map((item) => item.value))
  const range = Math.max(1, max - min)
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100
    const y = 84 - ((item.value - min) / range) * 68
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="rounded-2xl border bg-white/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black">{isChild ? 'Growth trend' : 'BMI trend'}</p>
        <p className="text-xs font-bold text-muted-foreground">{data.length} records</p>
      </div>
      <svg viewBox="0 0 100 92" className="h-28 w-full overflow-visible" role="img" aria-label={isChild ? 'Growth trend chart' : 'BMI trend chart'}>
        <polyline points={points} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100
          const y = 84 - ((item.value - min) / range) * 68
          return (
            <g key={`${item.label}-${index}`}>
              <circle cx={x} cy={y} r="3" fill="#10b981" />
              <text x={x} y="91" textAnchor="middle" className="fill-slate-500 text-[6px] font-bold">
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white/80 p-3 text-center">
      <HeartPulse className="mx-auto h-4 w-4 text-primary" />
      <p className="mt-1 text-sm font-black">{value}</p>
      <p className="mt-1 text-[11px] font-bold text-muted-foreground">{label}</p>
    </div>
  )
}
