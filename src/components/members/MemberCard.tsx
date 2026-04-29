import Link from 'next/link'
import { Person, HealthCondition } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { differenceInYears, format } from 'date-fns'
import { AlertTriangle, Activity, CalendarDays, ChevronRight, HeartPulse } from 'lucide-react'

interface MemberCardProps {
  person: Person
  conditions?: HealthCondition[]
}

export function MemberCard({ person, conditions = [] }: MemberCardProps) {
  const initials = `${person.first_name[0]}${person.last_name?.[0] ?? ''}`.toUpperCase()
  const hereditaryCount = conditions.filter((c) => c.is_hereditary).length
  const activeCount = conditions.filter((c) => c.status === 'active' || c.status === 'chronic').length
  const status = hereditaryCount > 0 ? 'Risk flag' : activeCount > 0 ? 'Needs care' : 'Steady'
  const statusClass = hereditaryCount > 0
    ? 'border-rose-200 bg-rose-50 text-rose-700'
    : activeCount > 0
      ? 'border-amber-200 bg-amber-50 text-amber-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700'
  const accentClass = hereditaryCount > 0
    ? 'border-l-rose-400'
    : activeCount > 0
      ? 'border-l-amber-400'
      : 'border-l-emerald-400'
  const avatarTones = [
    'bg-rose-100 text-rose-700 ring-rose-100',
    'bg-emerald-100 text-emerald-700 ring-emerald-100',
    'bg-blue-100 text-blue-700 ring-blue-100',
    'bg-amber-100 text-amber-700 ring-amber-100',
    'bg-violet-100 text-violet-700 ring-violet-100',
  ]
  const avatarTone = avatarTones[person.id.charCodeAt(0) % avatarTones.length]
  const age = person.date_of_birth ? differenceInYears(new Date(), new Date(person.date_of_birth)) : null

  return (
    <Link href={`/members/${person.id}`}>
      <Card className={`group h-full cursor-pointer border-l-4 bg-white/85 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10 ${accentClass}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-14 ring-4">
              {person.photo_url && <AvatarImage src={person.photo_url} alt={`${person.first_name} ${person.last_name ?? ''}`} />}
              <AvatarFallback className={`font-black ${avatarTone}`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate font-black leading-none">
                {person.first_name} {person.last_name}
              </p>
              {person.date_of_birth && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays className="h-3 w-3" />
                  {age} yrs · born {format(new Date(person.date_of_birth), 'yyyy')}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={`text-xs ${statusClass}`}>
              <HeartPulse className="mr-1 h-3 w-3" />
              {status}
            </Badge>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <Activity className="h-3 w-3" />
              {activeCount} condition{activeCount !== 1 ? 's' : ''}
            </Badge>
          )}
          {hereditaryCount > 0 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {hereditaryCount} hereditary
            </Badge>
          )}
          </div>
          <p className="text-xs font-bold text-primary">Open health profile</p>
        </CardContent>
      </Card>
    </Link>
  )
}
