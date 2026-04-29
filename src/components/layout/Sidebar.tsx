'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TreePine, Users, CalendarDays, Settings, HeartPulse } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    section: 'Workspace',
    items: [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    section: 'Family',
    items: [
      { href: '/tree', label: 'Family Tree', icon: TreePine },
      { href: '/members', label: 'Members', icon: Users },
    ],
  },
  {
    section: 'Care',
    items: [{ href: '/appointments', label: 'Appointments', icon: CalendarDays }],
  },
  {
    section: 'Account',
    items: [{ href: '/settings', label: 'Settings', icon: Settings }],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border/70 bg-white/65 min-h-screen backdrop-blur-xl">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/70">
        <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <span className="font-black text-lg leading-none">FamilyHealth</span>
          <p className="text-xs text-muted-foreground mt-1">Shared care tree</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-5">
        {navItems.map(({ section, items }) => (
          <div key={section} className="mb-5 last:mb-0">
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground/70">
              {section}
            </p>
            <div className="space-y-1">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all',
                    pathname === href || pathname.startsWith(`${href}/`)
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'
                      : 'text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
