import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, TreePine, CalendarDays, Shield, ArrowRight, Sparkles } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex flex-col overflow-hidden">
      <nav className="border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/25">
              <Heart className="h-5 w-5 fill-current" />
            </div>
            <span className="font-bold text-lg">FamilyHealth</span>
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

      <section className="relative min-h-[760px] overflow-hidden">
        <Image
          src="/family-tree-landing.png"
          alt="Watercolor family tree illustration"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/88 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/95" />

        <div className="relative mx-auto flex min-h-[760px] max-w-7xl flex-col justify-center px-5 py-16">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/80 px-3 py-1.5 text-sm text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Collaborative family health, mapped visually
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] md:text-7xl">
              Build a living family tree for every health story.
            </h1>
            <p className="mb-8 mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
              Create your family tree, invite relatives, and keep appointments, conditions,
              medicines, allergies, and hereditary risks connected to the people they belong to.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'px-6')}>
                Start your tree
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-xl grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                ['Family members', 'Shared profiles'],
                ['Appointments', 'Everyone can help'],
                ['Hereditary risks', 'Easy to spot'],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-xl border border-border/70 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/70 bg-white/60 py-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="grid md:grid-cols-3 gap-5">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 mb-5">
                <TreePine className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Family Tree</h3>
              <p className="text-sm text-muted-foreground">
                A visual map of your family with profile cards, health markers, and quick navigation.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-secondary mb-5">
                <CalendarDays className="h-6 w-6 text-secondary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Appointment Tracking</h3>
              <p className="text-sm text-muted-foreground">
                Keep upcoming visits visible so any family member can help coordinate care.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-accent mb-5">
                <Shield className="h-6 w-6 text-accent-foreground" />
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
