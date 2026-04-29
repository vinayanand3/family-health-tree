import Link from 'next/link'
import { HeartPulse, LayoutDashboard, CalendarDays, Users } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen overflow-hidden bg-background px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl flex-col items-center justify-center text-center">
        <div className="mb-5 grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
          <HeartPulse className="h-8 w-8" />
        </div>
        <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">FamilyHealth</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">This page is not in the family tree.</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          The link may be old, mistyped, or no longer connected to this workspace. Use one of these paths to get back to your family health records.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/dashboard" className={buttonVariants({})}>
            <LayoutDashboard className="h-4 w-4" />
            Go to dashboard
          </Link>
          <Link href="/members" className={buttonVariants({ variant: 'outline' })}>
            <Users className="h-4 w-4" />
            Members
          </Link>
          <Link href="/appointments" className={buttonVariants({ variant: 'outline' })}>
            <CalendarDays className="h-4 w-4" />
            Appointments
          </Link>
        </div>
      </div>
    </main>
  )
}
