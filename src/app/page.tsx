import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, TreePine, CalendarDays, Shield, Activity, ArrowRight, Sparkles } from 'lucide-react'

export default function LandingPage() {
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

      <section className="relative">
        <div className="health-grid absolute inset-0 opacity-45" />
        <div className="relative max-w-7xl mx-auto px-5 py-14 lg:py-20 grid lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/75 text-primary text-sm px-3 py-1.5 rounded-full mb-6 border border-primary/20 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Collaborative family health, mapped visually
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[0.95] max-w-3xl">
              Build a living family tree for every health story.
          </h1>
          <p className="text-lg text-muted-foreground mt-6 mb-8 max-w-2xl leading-8">
            Create your family tree, invite relatives, and keep appointments, conditions,
            medicines, allergies, and hereditary risks connected to the people they belong to.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/signup" className={cn(buttonVariants({ size: 'lg' }), 'px-6')}>
              Start your tree
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'px-6')}>
              Sign in
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-xl">
            {[
              ['Family members', 'Shared profiles'],
              ['Appointments', 'Everyone can help'],
              ['Hereditary risks', 'Easy to spot'],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-xl border border-border/70 bg-white/70 p-4 shadow-sm">
                <p className="text-sm font-bold">{title}</p>
                <p className="text-xs text-muted-foreground mt-1">{copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[660px]">
          <div className="absolute inset-x-2 top-4 rounded-3xl border border-white/70 bg-white/80 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div>
                <p className="text-sm font-bold">The Vinay&apos;s Family</p>
                <p className="text-xs text-muted-foreground">Health tree preview</p>
              </div>
              <div className="flex -space-x-2">
                {['VA', 'DG', 'RA'].map((initials) => (
                  <span key={initials} className="grid size-8 place-items-center rounded-full border-2 border-white bg-secondary text-[10px] font-bold text-secondary-foreground">
                    {initials}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative h-[560px]">
              <div className="absolute left-1/2 top-14 h-72 w-px -translate-x-1/2 bg-border" />
              <div className="absolute left-[28%] top-[45%] h-px w-[44%] bg-border" />
              <PreviewNode className="left-1/2 top-8 -translate-x-1/2" name="Vinay" meta="Care lead" tone="rose" stats="No active conditions" />
              <PreviewNode className="left-[22%] top-[52%]" name="Divija" meta="Parent" tone="blue" stats="2 appointments" />
              <PreviewNode className="right-[12%] top-[55%]" name="Vivin" meta="Child" tone="green" stats="1 hereditary flag" />
              <div className="absolute bottom-8 left-6 right-6 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-bold">Family health radar</p>
                    <p className="text-xs text-muted-foreground">Hereditary markers and appointments stay visible in the tree.</p>
                  </div>
                </div>
              </div>
            </div>
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

function PreviewNode({
  name,
  meta,
  stats,
  tone,
  className,
}: {
  name: string
  meta: string
  stats: string
  tone: 'rose' | 'blue' | 'green'
  className: string
}) {
  const toneClass = {
    rose: 'bg-primary/10 text-primary border-primary/20',
    blue: 'bg-secondary text-secondary-foreground border-secondary',
    green: 'bg-accent text-accent-foreground border-accent',
  }[tone]

  return (
    <div className={cn('absolute w-44 rounded-2xl border bg-white p-3 shadow-xl shadow-slate-900/10', className)}>
      <div className="flex items-center gap-3">
        <div className={cn('grid size-11 place-items-center rounded-xl border text-sm font-black', toneClass)}>
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-bold">{name}</p>
          <p className="text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-muted px-3 py-2 text-xs font-medium text-muted-foreground">
        {stats}
      </div>
    </div>
  )
}
