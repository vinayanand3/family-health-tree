'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AppointmentCountdownProps {
  appointmentDate: string
  isCompleted?: boolean
  className?: string
}

function countdownLabel(appointmentDate: string, isCompleted: boolean, now: Date) {
  if (isCompleted) return { label: 'Completed', tone: 'complete' as const }

  const diffMs = new Date(appointmentDate).getTime() - now.getTime()
  const oneMinute = 60 * 1000
  const oneHour = 60 * oneMinute
  const oneDay = 24 * oneHour

  if (diffMs <= 0 && diffMs > -oneHour) return { label: 'Now', tone: 'now' as const }
  if (diffMs <= -oneHour) return { label: 'Past due', tone: 'late' as const }
  if (diffMs < oneHour) {
    const minutes = Math.max(1, Math.ceil(diffMs / oneMinute))
    return { label: `${minutes} minute${minutes === 1 ? '' : 's'}`, tone: 'soon' as const }
  }
  if (diffMs < oneDay) {
    const hours = Math.max(1, Math.ceil(diffMs / oneHour))
    return { label: `${hours} hour${hours === 1 ? '' : 's'}`, tone: 'soon' as const }
  }
  const days = Math.max(1, Math.ceil(diffMs / oneDay))
  return { label: `${days} day${days === 1 ? '' : 's'}`, tone: 'later' as const }
}

export function AppointmentCountdown({ appointmentDate, isCompleted = false, className }: AppointmentCountdownProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const { label, tone } = countdownLabel(appointmentDate, isCompleted, now)
  const toneClass = {
    complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    now: 'border-primary/30 bg-primary/10 text-primary',
    late: 'border-red-200 bg-red-50 text-red-700',
    soon: 'border-amber-200 bg-amber-50 text-amber-700',
    later: 'border-blue-200 bg-blue-50 text-blue-700',
  }[tone]

  return (
    <Badge variant="outline" className={cn('gap-1 rounded-full font-black', toneClass, className)}>
      {label}
    </Badge>
  )
}
