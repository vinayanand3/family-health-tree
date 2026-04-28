import Link from 'next/link'
import { Person, HealthCondition } from '@/types'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Activity, ChevronRight } from 'lucide-react'

interface MemberCardProps {
  person: Person
  conditions?: HealthCondition[]
}

export function MemberCard({ person, conditions = [] }: MemberCardProps) {
  const initials = `${person.first_name[0]}${person.last_name?.[0] ?? ''}`.toUpperCase()
  const hereditaryCount = conditions.filter((c) => c.is_hereditary).length
  const activeCount = conditions.filter((c) => c.status === 'active').length

  return (
    <Link href={`/members/${person.id}`}>
      <Card className="h-full cursor-pointer bg-white/80 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/10">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 ring-4 ring-primary/10">
              {person.photo_url && <AvatarImage src={person.photo_url} alt={`${person.first_name} ${person.last_name ?? ''}`} />}
              <AvatarFallback className="bg-primary/10 text-primary font-black">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-none">
                {person.first_name} {person.last_name}
              </p>
              {person.date_of_birth && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(person.date_of_birth), { addSuffix: false })} old
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
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
          {activeCount === 0 && <span className="text-xs text-muted-foreground">No active conditions</span>}
        </CardContent>
      </Card>
    </Link>
  )
}
