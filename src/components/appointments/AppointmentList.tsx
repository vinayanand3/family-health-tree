import { Appointment } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, isPast } from 'date-fns'
import { CalendarDays, MapPin, User } from 'lucide-react'

interface AppointmentListProps {
  appointments: Appointment[]
  showPerson?: boolean
}

export function AppointmentList({ appointments, showPerson = false }: AppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        No appointments found.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {appointments.map((appt) => {
        const isOverdue = isPast(new Date(appt.appointment_date)) && !appt.is_completed

        return (
          <Card key={appt.id} className={isOverdue ? 'border-rose-200' : ''}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{appt.title}</p>
                    {appt.is_completed && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Completed
                      </Badge>
                    )}
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {format(new Date(appt.appointment_date), 'PPp')}
                    </span>
                    {appt.doctor_name && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {appt.doctor_name}
                      </span>
                    )}
                    {appt.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {appt.location}
                      </span>
                    )}
                    {showPerson && appt.persons && (
                      <span className="font-medium text-foreground">
                        {appt.persons.first_name} {appt.persons.last_name}
                      </span>
                    )}
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{appt.notes}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
