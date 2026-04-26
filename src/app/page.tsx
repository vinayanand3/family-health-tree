import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, TreePine, CalendarDays, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
            <span className="font-semibold text-lg">FamilyHealth</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className={buttonVariants({ variant: 'ghost' })}>
              Sign in
            </Link>
            <Link href="/signup" className={buttonVariants({})}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 text-sm px-3 py-1 rounded-full mb-6 border border-rose-200">
            <Heart className="h-3.5 w-3.5 fill-rose-500" />
            Built for families
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Your family&apos;s health,
            <br />
            <span className="text-rose-500">all in one place</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Track doctor appointments, medical conditions, medications, and health history for every
            member of your family — in a beautiful family tree.
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'px-6')}>
              Start for free
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-6')}>
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-rose-100 mb-4">
                <TreePine className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="font-semibold mb-2">Family Tree</h3>
              <p className="text-sm text-muted-foreground">
                Visual, interactive family tree with health information for every member.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-4">
                <CalendarDays className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Appointment Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Never miss a doctor&apos;s visit. Track upcoming appointments for everyone.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Private &amp; Secure</h3>
              <p className="text-sm text-muted-foreground">
                Your family&apos;s health data is private. Only invited family members can access it.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
