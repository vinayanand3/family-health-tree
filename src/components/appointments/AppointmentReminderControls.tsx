'use client'

import { useEffect, useState } from 'react'
import { Appointment } from '@/types'
import { Button } from '@/components/ui/button'
import { BellRing, CalendarPlus, Check } from 'lucide-react'

interface AppointmentReminderControlsProps {
  appointment: Appointment
}

type ReminderState = 'idle' | 'scheduled' | 'denied' | 'unsupported'

function reminderStorageKey(id: string) {
  return `familyhealth_reminder_${id}`
}

function calendarDate(value: string) {
  return new Date(value).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

function buildCalendarFile(appointment: Appointment) {
  const start = new Date(appointment.appointment_date)
  const end = new Date(start.getTime() + 60 * 60 * 1000)
  const personName = appointment.persons
    ? `${appointment.persons.first_name} ${appointment.persons.last_name ?? ''}`.trim()
    : 'Family member'
  const description = [appointment.notes, appointment.doctor_name ? `Doctor: ${appointment.doctor_name}` : null]
    .filter(Boolean)
    .join('\\n')

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//FamilyHealth//Appointments//EN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@familyhealth`,
    `DTSTAMP:${calendarDate(new Date().toISOString())}`,
    `DTSTART:${calendarDate(start.toISOString())}`,
    `DTEND:${calendarDate(end.toISOString())}`,
    `SUMMARY:${appointment.title} (${personName})`,
    appointment.location ? `LOCATION:${appointment.location}` : null,
    description ? `DESCRIPTION:${description}` : null,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')
}

export function AppointmentReminderControls({ appointment }: AppointmentReminderControlsProps) {
  const [state, setState] = useState<ReminderState>('idle')

  function getReminderTime() {
    return Math.max(Date.now(), new Date(appointment.appointment_date).getTime() - 30 * 60 * 1000)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window)) {
      return
    }

    const stored = window.localStorage.getItem(reminderStorageKey(appointment.id))
    if (stored) {
      window.setTimeout(() => setState('scheduled'), 0)
      const timeout = Number(stored) - Date.now()
      if (timeout > 0 && timeout < 2147483647 && Notification.permission === 'granted') {
        const id = window.setTimeout(() => {
          new Notification(`FamilyHealth reminder: ${appointment.title}`, {
            body: 'This appointment is coming up soon.',
          })
          window.localStorage.removeItem(reminderStorageKey(appointment.id))
          setState('idle')
        }, timeout)
        return () => window.clearTimeout(id)
      }
    }
  }, [appointment.id, appointment.title])

  async function scheduleReminder() {
    if (!('Notification' in window)) {
      setState('unsupported')
      return
    }

    const permission = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()

    if (permission !== 'granted') {
      setState('denied')
      return
    }

    const reminderTime = getReminderTime()
    window.localStorage.setItem(reminderStorageKey(appointment.id), String(reminderTime))
    setState('scheduled')

    const timeout = reminderTime - Date.now()
    if (timeout <= 1000) {
      new Notification(`FamilyHealth reminder: ${appointment.title}`, {
        body: 'This appointment is coming up soon.',
      })
      return
    }

    if (timeout < 2147483647) {
      window.setTimeout(() => {
        new Notification(`FamilyHealth reminder: ${appointment.title}`, {
          body: 'This appointment is coming up soon.',
        })
        window.localStorage.removeItem(reminderStorageKey(appointment.id))
        setState('idle')
      }, timeout)
    }
  }

  function downloadCalendarFile() {
    const file = new Blob([buildCalendarFile(appointment)], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = `${appointment.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-2xl bg-white/75 px-4 py-3">
      <p className="text-sm font-black text-primary">Reminder setup</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Use a browser alert 30 minutes before the visit, or add it to your calendar.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={scheduleReminder} disabled={state === 'scheduled' || state === 'unsupported'}>
          {state === 'scheduled' ? <Check className="h-3.5 w-3.5" /> : <BellRing className="h-3.5 w-3.5" />}
          {state === 'scheduled' ? 'Reminder on' : 'Browser reminder'}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={downloadCalendarFile}>
          <CalendarPlus className="h-3.5 w-3.5" />
          Calendar file
        </Button>
      </div>
      {state === 'denied' && (
        <p className="mt-2 text-xs font-medium text-rose-600">
          Browser notifications are blocked. Enable them in browser settings or use the calendar file.
        </p>
      )}
      {state === 'unsupported' && (
        <p className="mt-2 text-xs font-medium text-amber-700">
          This browser does not support notifications. Use the calendar file instead.
        </p>
      )}
    </div>
  )
}
