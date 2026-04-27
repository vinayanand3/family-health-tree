export type UserRole = 'admin' | 'member' | 'viewer'
export type RelationshipType = 'parent' | 'child' | 'spouse' | 'sibling'
export type ConditionStatus = 'active' | 'resolved' | 'chronic'
export type AllergySeverity = 'mild' | 'moderate' | 'severe'

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
  doctor_name: string | null
  location: string | null
  appointment_date: string
  notes: string | null
  is_completed: boolean
  created_by: string
  created_at: string
  persons?: Pick<Person, 'first_name' | 'last_name'>
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
