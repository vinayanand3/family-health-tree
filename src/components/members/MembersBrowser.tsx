'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HealthCondition, Person } from '@/types'
import { MemberCard } from '@/components/members/MemberCard'
import { Input } from '@/components/ui/input'
import { buttonVariants } from '@/components/ui/button'
import { EmptyStateIllustration } from '@/components/ui/EmptyStateIllustration'
import { Activity, CalendarCheck2, Search, ShieldAlert, Users } from 'lucide-react'

interface MembersBrowserProps {
  persons: Person[]
  conditionsByPerson: Record<string, HealthCondition[]>
  missingRecentCheckupIds: string[]
  initialFilter: 'conditions' | 'hereditary' | 'checkups' | null
}

export function MembersBrowser({ persons, conditionsByPerson, missingRecentCheckupIds, initialFilter }: MembersBrowserProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'conditions' | 'hereditary' | 'checkups'>(
    initialFilter ?? 'all'
  )
  const missingRecentCheckups = useMemo(() => new Set(missingRecentCheckupIds), [missingRecentCheckupIds])

  function updateFilter(filter: 'all' | 'conditions' | 'hereditary' | 'checkups') {
    setStatusFilter(filter)
    router.replace(filter === 'all' ? '/members' : `/members?health=${filter}`, { scroll: false })
  }

  const filteredPersons = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return persons.filter((person) => {
      const name = `${person.first_name} ${person.last_name ?? ''}`.toLowerCase()
      const conditions = conditionsByPerson[person.id] ?? []
      const matchesQuery = !normalizedQuery || name.includes(normalizedQuery)
      const matchesFilter =
        statusFilter === 'all' ||
        (statusFilter === 'conditions' && conditions.length > 0) ||
        (statusFilter === 'hereditary' && conditions.some((condition) => condition.is_hereditary)) ||
        (statusFilter === 'checkups' && missingRecentCheckups.has(person.id))

      return matchesQuery && matchesFilter
    })
  }, [conditionsByPerson, missingRecentCheckups, persons, query, statusFilter])

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search family members"
              className="h-11 rounded-2xl bg-white pl-9"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            <FilterButton
              active={statusFilter === 'all'}
              onClick={() => updateFilter('all')}
              icon={Users}
              label="All"
            />
            <FilterButton
              active={statusFilter === 'conditions'}
              onClick={() => updateFilter('conditions')}
              icon={Activity}
              label="Conditions"
            />
            <FilterButton
              active={statusFilter === 'hereditary'}
              onClick={() => updateFilter('hereditary')}
              icon={ShieldAlert}
              label="Hereditary"
            />
            <FilterButton
              active={statusFilter === 'checkups'}
              onClick={() => updateFilter('checkups')}
              icon={CalendarCheck2}
              label="Missing checkups"
            />
          </div>
        </div>
      </div>

      {filteredPersons.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-white/65 px-4 py-16 text-center shadow-sm backdrop-blur">
          <EmptyStateIllustration variant="family" />
          <p className="mt-3 font-black">No members match this view</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Try a different search or filter, or add a family member to keep building the shared care map.
          </p>
          <Link href="/members/new" className={buttonVariants({ className: 'mt-5' })}>
            Add member
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredPersons.map((person) => (
            <MemberCard
              key={person.id}
              person={person}
              conditions={conditionsByPerson[person.id] ?? []}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Users
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition-all ${
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/20'
          : 'border-border bg-white text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}
