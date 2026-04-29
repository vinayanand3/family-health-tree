'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CalendarDays, HeartPulse, LayoutDashboard, LogOut, Settings, TreePine, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  userEmail?: string
}

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/tree', label: 'Tree', icon: TreePine },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/appointments', label: 'Visits', icon: CalendarDays },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const initials = userEmail?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center px-5 gap-4">
        <Link href="/dashboard" className="flex md:hidden items-center gap-2">
          <HeartPulse className="h-4 w-4 text-primary" />
          <span className="font-bold">FamilyHealth</span>
        </Link>
        <div className="flex-1" />
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-white shadow-sm transition-opacity hover:opacity-80">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-2">
              <p className="text-xs font-medium truncate">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer gap-2">
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <nav className="md:hidden overflow-x-auto border-t border-border/60 bg-white/55 px-3 py-2">
        <div className="flex min-w-max gap-2">
          {mobileNavItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex h-10 items-center gap-2 rounded-full border px-3 text-xs font-bold transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border/70 bg-white/75 text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
