'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TreePine,
  Users,
  CalendarDays,
  Settings,
  Heart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tree', label: 'Family Tree', icon: TreePine },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-60 border-r bg-background min-h-screen">
      <div className="flex items-center gap-2 px-6 py-5 border-b">
        <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
        <span className="font-semibold text-lg">FamilyHealth</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
