'use client'

import { formatAppointmentDateTime } from '@/lib/appointment-dates'

export function AppointmentDateTime({ value }: { value: string }) {
  const label = formatAppointmentDateTime(value)

  return (
    <time dateTime={value} suppressHydrationWarning>
      {label}
    </time>
  )
}
