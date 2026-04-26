'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { appointmentSchema, AppointmentFormData } from '@/lib/validations/appointment'
import { Person } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'

interface AppointmentFormProps {
  persons: Person[]
  onSubmit: (data: AppointmentFormData) => Promise<void>
  defaultPersonId?: string
  isLoading?: boolean
}

export function AppointmentForm({ persons, onSubmit, defaultPersonId, isLoading }: AppointmentFormProps) {
  const [selectedPersonId, setSelectedPersonId] = useState(defaultPersonId ?? '')
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: { person_id: defaultPersonId ?? '' },
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

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Doctor / Specialist</Label>
          <Input {...register('doctor_name')} placeholder="Dr. Smith" />
        </div>
        <div className="space-y-1.5">
          <Label>Location</Label>
          <Input {...register('location')} placeholder="City Hospital" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Date & Time</Label>
        <Input type="datetime-local" {...register('appointment_date')} />
        {errors.appointment_date && <p className="text-xs text-destructive">{errors.appointment_date.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Notes</Label>
        <Textarea {...register('notes')} placeholder="Any notes..." rows={3} />
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Appointment'}
      </Button>
    </form>
  )
}
