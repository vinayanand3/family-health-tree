interface EmptyStateIllustrationProps {
  variant?: 'tree' | 'calendar' | 'health' | 'family'
}

export function EmptyStateIllustration({ variant = 'tree' }: EmptyStateIllustrationProps) {
  const tones = {
    tree: {
      bg: 'from-emerald-50 to-rose-50',
      trunk: 'bg-emerald-500',
      leafA: 'bg-emerald-200',
      leafB: 'bg-rose-200',
      center: '♡',
    },
    calendar: {
      bg: 'from-blue-50 to-amber-50',
      trunk: 'bg-blue-500',
      leafA: 'bg-blue-200',
      leafB: 'bg-amber-200',
      center: '•',
    },
    health: {
      bg: 'from-rose-50 to-emerald-50',
      trunk: 'bg-rose-500',
      leafA: 'bg-rose-200',
      leafB: 'bg-emerald-200',
      center: '+',
    },
    family: {
      bg: 'from-violet-50 to-emerald-50',
      trunk: 'bg-violet-500',
      leafA: 'bg-violet-200',
      leafB: 'bg-emerald-200',
      center: '♡',
    },
  }[variant]

  return (
    <div className={`relative mx-auto h-24 w-32 overflow-hidden rounded-3xl bg-gradient-to-br ${tones.bg}`}>
      <div className={`absolute bottom-4 left-1/2 h-12 w-2 -translate-x-1/2 rounded-full ${tones.trunk}`} />
      <div className={`absolute left-7 top-7 h-12 w-12 rounded-full ${tones.leafA}`} />
      <div className={`absolute right-7 top-7 h-12 w-12 rounded-full ${tones.leafB}`} />
      <div className="absolute left-1/2 top-8 grid size-12 -translate-x-1/2 place-items-center rounded-full border-4 border-white bg-white text-lg font-black text-primary shadow-sm">
        {tones.center}
      </div>
    </div>
  )
}
