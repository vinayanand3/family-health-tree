import { z } from 'zod'

export const appointmentSchema = z.object({
  person_id: z.string().min(1, 'Person is required'),
  title: z.string().min(1, 'Title is required'),
  doctor_name: z.string().optional(),
  location: z.string().optional(),
  appointment_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
  outcome_notes: z.string().optional(),
  follow_up_needed: z.boolean().optional(),
  follow_up_date: z.string().optional(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>
