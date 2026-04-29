'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, AppointmentFormData } from '@/lib/validations/appointment'
import { AppointmentType, Person } from '@/types'
import { APPOINTMENT_TYPES, appointmentTypeLabel } from '@/lib/appointments'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface AppointmentFormProps {
  persons: Person[]
  onSubmit: (data: AppointmentFormData) => Promise<void>
  defaultPersonId?: string
  defaultValues?: Partial<AppointmentFormData>
  isLoading?: boolean
  submitLabel?: string
  onCancel?: () => void
  includeOutcomeFields?: boolean
}

export function AppointmentForm({
  persons,
  onSubmit,
  defaultPersonId,
  defaultValues,
  isLoading,
  submitLabel = 'Save Appointment',
  onCancel,
  includeOutcomeFields = false,
}: AppointmentFormProps) {
  const [selectedPersonId, setSelectedPersonId] = useState(defaultValues?.person_id ?? defaultPersonId ?? '')
  const [selectedType, setSelectedType] = useState<AppointmentType | ''>(defaultValues?.appointment_type ?? '')
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { person_id: defaultPersonId ?? '', ...defaultValues },
  })

  const selectedPerson = persons.find(p => p.id === selectedPersonId)
  const selectedLabel = selectedPerson
    ? `${selectedPerson.first_name} ${selectedPerson.last_name}`
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Family Member</Label>
        <Select
          value={selectedPersonId || undefined}
          onValueChange={(v: string | null) => {
            const val = v ?? ''
            setSelectedPersonId(val)
            setValue('person_id', val)
          }}
        >
          <SelectTrigger className="w-full">
            <span className={selectedLabel ? 'text-sm' : 'text-sm text-muted-foreground'}>
              {selectedLabel ?? 'Select member'}
            </span>
          </SelectTrigger>
          <SelectContent>
            {persons.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.first_name} {p.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.person_id && <p className="text-xs text-destructive">{errors.person_id.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input {...register('title')} placeholder="e.g. Annual checkup" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={selectedType || undefined}
            onValueChange={(value: string | null) => {
              const type = (value ?? undefined) as AppointmentType | undefined
              setSelectedType(type ?? '')
              setValue('appointment_type', type)
            }}
          >
            <SelectTrigger className="w-full">
              <span className={selectedType ? 'text-sm' : 'text-sm text-muted-foreground'}>
                {selectedType ? appointmentTypeLabel(selectedType) : 'Select type'}
              </span>
            </SelectTrigger>
            <SelectContent>
              {APPOINTMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Doctor / Specialist</Label>
          <Input {...register('doctor_name')} placeholder="Dr. Smith" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input {...register('location')} placeholder="City Hospital" />
        </div>
        <div className="space-y-1.5">
          <Label>Date & Time</Label>
          <Input type="datetime-local" {...register('appointment_date')} />
          {errors.appointment_date && <p className="text-xs text-destructive">{errors.appointment_date.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea {...register('notes')} placeholder="Any notes..." rows={3} />
      </div>

      {includeOutcomeFields && (
        <div className="space-y-3 rounded-xl border bg-muted/20 p-3">
          <div className="space-y-1.5">
            <Label>Visit outcome</Label>
            <Textarea {...register('outcome_notes')} placeholder="What happened, what changed, what was prescribed..." rows={3} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" {...register('follow_up_needed')} className="h-4 w-4 rounded border-input" />
            Follow-up needed
          </label>
          <div className="space-y-1.5">
            <Label>Follow-up date</Label>
            <Input type="datetime-local" {...register('follow_up_date')} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        {onCancel && (
          <Button type="button" variant="outline" className="w-full" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
