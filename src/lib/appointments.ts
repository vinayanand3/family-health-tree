import { Appointment, AppointmentType } from '@/types'

export const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
  { value: 'checkup', label: 'Checkup' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'dental', label: 'Dental' },
  { value: 'vision', label: 'Vision' },
  { value: 'pediatric', label: 'Pediatric' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'other', label: 'Other' },
]

const TYPE_LABELS = Object.fromEntries(
  APPOINTMENT_TYPES.map((type) => [type.value, type.label])
) as Record<AppointmentType, string>

export function appointmentTypeLabel(type: AppointmentType | null | undefined) {
  return type ? TYPE_LABELS[type] : 'General'
}

export function appointmentCategory(appointment: Pick<Appointment, 'title' | 'doctor_name' | 'appointment_type'>) {
  if (appointment.appointment_type) return appointmentTypeLabel(appointment.appointment_type)

  const text = `${appointment.title} ${appointment.doctor_name ?? ''}`.toLowerCase()
  if (text.includes('pediatric')) return 'Pediatric'
  if (text.includes('dental') || text.includes('dentist')) return 'Dental'
  if (text.includes('eye') || text.includes('vision') || text.includes('optom')) return 'Vision'
  if (text.includes('cardio')) return 'Specialist'
  if (text.includes('derm')) return 'Specialist'
  if (text.includes('follow')) return 'Follow-up'
  if (text.includes('checkup') || text.includes('physical') || text.includes('annual')) return 'Checkup'
  if (text.includes('urgent') || text.includes('er ')) return 'Urgent'
  return 'General'
}
