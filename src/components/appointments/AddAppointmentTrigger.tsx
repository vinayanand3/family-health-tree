'use client'

import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function AddAppointmentTrigger() {
  return (
    <Button
      type="button"
      onClick={() => window.dispatchEvent(new Event('familyhealth:add-appointment'))}
    >
      <Plus className="h-4 w-4" />
      Add Appointment
    </Button>
  )
}
