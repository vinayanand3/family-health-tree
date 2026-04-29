export type UserRole = 'admin' | 'member' | 'viewer'
export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling'
export type ConditionStatus = 'active' | 'resolved' | 'chronic'
export type AllergySeverity = 'mild' | 'moderate' | 'severe'
export type VaccinationStatus = 'up_to_date' | 'due' | 'overdue' | 'scheduled'
export type AppointmentType = 'checkup' | 'follow_up' | 'specialist' | 'dental' | 'vision' | 'pediatric' | 'urgent' | 'other'

export interface Family {
  id: string
  name: string
  invite_code: string
  created_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string | null
  role: UserRole
  created_at: string
}

export interface Person {
  id: string
  family_id: string
  user_id: string | null
  first_name: string
  last_name: string | null
  date_of_birth: string | null
  gender: string | null
  photo_url: string | null
  notes: string | null
  created_at: string
}

export interface Relationship {
  id: string
  family_id: string
  person_id: string
  related_person_id: string
  relationship_type: RelationshipType
}

export interface HealthCondition {
  id: string
  person_id: string
  name: string
  is_hereditary: boolean
  diagnosed_date: string | null
  status: ConditionStatus
  notes: string | null
  created_at: string
}

export interface Medication {
  id: string
  person_id: string
  name: string
  dosage: string | null
  frequency: string | null
  start_date: string | null
  end_date: string | null
  refill_due_date: string | null
  pharmacy: string | null
  prescriber: string | null
  reminder_enabled: boolean
  notes: string | null
  created_at: string
}

export interface Allergy {
  id: string
  person_id: string
  allergen: string
  severity: AllergySeverity | null
  notes: string | null
}

export interface Appointment {
  id: string
  person_id: string
  family_id: string
  title: string
  appointment_type: AppointmentType | null
  doctor_name: string | null
  location: string | null
  appointment_date: string
  notes: string | null
  is_completed: boolean
  outcome_notes: string | null
  follow_up_needed: boolean
  follow_up_date: string | null
  completed_at: string | null
  created_by: string
  created_at: string
  persons?: Pick<Person, 'first_name' | 'last_name'>
}

export interface Vaccination {
  id: string
  person_id: string
  vaccine_name: string
  dose_label: string | null
  administered_date: string | null
  due_date: string | null
  status: VaccinationStatus
  provider: string | null
  notes: string | null
  created_at: string
}

export interface PersonHealthMetadata {
  person_id: string
  blood_type: string | null
  last_checkup_date: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
  insurance_provider: string | null
  insurance_member_id: string | null
  created_at: string
  updated_at: string
}

export interface HealthMeasurement {
  id: string
  person_id: string
  measured_at: string
  height_cm: number | null
  weight_kg: number | null
  bmi: number | null
  growth_percentile: number | null
  notes: string | null
  created_at: string
}

export interface UserNotificationPreference {
  user_id: string
  email_enabled: boolean
  sms_enabled: boolean
  phone_number: string | null
  push_enabled: boolean
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  created_at: string
  updated_at: string
}

export interface CareReminderDelivery {
  id: string
  reminder_key: string
  family_id: string
  user_id: string
  channel: 'email' | 'sms' | 'push'
  status: 'sent' | 'skipped' | 'failed'
  provider: string | null
  error: string | null
  sent_at: string
  created_at: string
}

export interface Document {
  id: string
  person_id: string
  name: string
  file_path: string
  file_type: string | null
  uploaded_by: string
  created_at: string
}

export interface PersonWithHealth extends Person {
  health_conditions: HealthCondition[]
  medications: Medication[]
  allergies: Allergy[]
  appointments: Appointment[]
}

export interface TreeNode {
  name: string
  attributes?: Record<string, string>
  children?: TreeNode[]
  personId?: string
  initials?: string
  age?: string
  activeConditions?: number
  hereditaryConditions?: number
  medicationCount?: number
  allergyCount?: number
}
