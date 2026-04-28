import { z } from 'zod'

export const personSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.string().optional(),
  photo_url: z.string().optional(),
  notes: z.string().optional(),
})

export const healthConditionSchema = z.object({
  name: z.string().min(1, 'Condition name is required'),
  is_hereditary: z.boolean().default(false),
  diagnosed_date: z.string().optional(),
  status: z.enum(['active', 'resolved', 'chronic']).default('active'),
  notes: z.string().optional(),
})

export const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  notes: z.string().optional(),
})

export const allergySchema = z.object({
  allergen: z.string().min(1, 'Allergen is required'),
  severity: z.enum(['mild', 'moderate', 'severe']).optional(),
  notes: z.string().optional(),
})

export type PersonFormData = z.infer<typeof personSchema>
export type HealthConditionFormData = z.infer<typeof healthConditionSchema>
export type MedicationFormData = z.infer<typeof medicationSchema>
export type AllergyFormData = z.infer<typeof allergySchema>
