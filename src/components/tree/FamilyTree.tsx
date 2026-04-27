'use client'

import { useCallback, useState } from 'react'
import Tree from 'react-d3-tree'
import { TreeNode } from '@/types'
import { useRouter } from 'next/navigation'
import { Activity, AlertTriangle, HeartPulse, Pill, Search, Sparkles, TreePine, Users, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FamilyTreeProps {
  data: TreeNode
  memberCount: number
  relationshipCount: number
}

const nodeWidth = 220
const nodeHeight = 124
const hubSize = 132

function CustomNode({ nodeDatum, onNodeClick }: { nodeDatum: TreeNode; onNodeClick: (id: string) => void }) {
  if (!nodeDatum.personId) {
    return (
      <g>
        <foreignObject
          width={hubSize}
          height={hubSize}
          x={-hubSize / 2}
          y={-hubSize / 2}
        >
          <div className="relative grid h-full w-full place-items-center rounded-full border border-primary/20 bg-white/90 text-center shadow-2xl shadow-primary/10 backdrop-blur">
            <div className="absolute inset-2 rounded-full border border-dashed border-accent/60" />
            <div>
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm shadow-primary/25">
                <TreePine className="h-6 w-6" />
              </div>
              <p className="mt-2 text-sm font-black">{nodeDatum.name}</p>
              <p className="text-[11px] font-medium text-muted-foreground">family root</p>
            </div>
          </div>
        </foreignObject>
      </g>
    )
  }

  const healthSignals =
    (nodeDatum.activeConditions ?? 0) +
    (nodeDatum.hereditaryConditions ?? 0) +
    (nodeDatum.medicationCount ?? 0) +
    (nodeDatum.allergyCount ?? 0)

  return (
    <g>
      <foreignObject width={nodeWidth} height={nodeHeight} x={-nodeWidth / 2} y={-nodeHeight / 2}>
        <button
          type="button"
          className="group relative h-full w-full cursor-pointer rounded-[1.6rem] border border-white/80 bg-white/95 p-3 text-left shadow-xl shadow-slate-900/10 outline-none backdrop-blur transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
          onClick={() => nodeDatum.personId && onNodeClick(nodeDatum.personId)}
        >
          <div className="pointer-events-none absolute right-4 top-3 size-2.5 rounded-full bg-accent shadow-sm shadow-accent transition group-hover:scale-125" />
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-black text-primary ring-4 ring-primary/10">
              {nodeDatum.initials ?? nodeDatum.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-foreground">{nodeDatum.name}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{nodeDatum.age ?? 'Profile'}</p>
            </div>
            <HeartPulse className={cn(
              'h-4 w-4',
              healthSignals > 0 ? 'text-primary' : 'text-accent-foreground/70'
            )} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Signal icon={<Activity />} label={`${nodeDatum.activeConditions ?? 0}`} tone="rose" />
            <Signal icon={<Pill />} label={`${nodeDatum.medicationCount ?? 0}`} tone="blue" />
            <Signal icon={<AlertTriangle />} label={`${nodeDatum.hereditaryConditions ?? 0}`} tone="amber" />
          </div>
        </button>
      </foreignObject>
    </g>
  )
}

function Signal({
  icon,
  label,
  tone,
}: {
  icon: React.ReactNode
  label: string
  tone: 'rose' | 'blue' | 'amber'
}) {
  const toneClass = {
    rose: 'bg-primary/10 text-primary',
    blue: 'bg-secondary text-secondary-foreground',
    amber: 'bg-amber-100 text-amber-700',
  }[tone]

  return (
    <div className={cn('flex items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-black', toneClass)}>
      <span className="[&_svg]:size-3">{icon}</span>
      {label}
    </div>
  )
}

function GardenBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,0.96),rgba(255,255,255,0.74)_38%,rgba(223,252,242,0.48)_72%,rgba(255,255,255,0.88))]" />
      <svg className="absolute inset-x-0 bottom-0 h-[88%] w-full opacity-80" viewBox="0 0 1200 720" preserveAspectRatio="none" aria-hidden="true">
        <path d="M604 700 C592 590 596 496 606 390 C610 315 606 250 600 170" fill="none" stroke="rgba(104,76,43,0.22)" strokeWidth="34" strokeLinecap="round" />
        <path d="M604 392 C470 360 342 322 190 235" fill="none" stroke="rgba(104,76,43,0.18)" strokeWidth="18" strokeLinecap="round" />
        <path d="M606 394 C742 350 860 318 1030 230" fill="none" stroke="rgba(104,76,43,0.18)" strokeWidth="18" strokeLinecap="round" />
        <path d="M600 272 C520 230 420 188 280 116" fill="none" stroke="rgba(104,76,43,0.14)" strokeWidth="12" strokeLinecap="round" />
        <path d="M604 270 C690 230 790 184 930 110" fill="none" stroke="rgba(104,76,43,0.14)" strokeWidth="12" strokeLinecap="round" />
        {[
          [180, 230], [250, 170], [340, 250], [440, 190], [760, 188], [890, 250], [970, 165], [1060, 232],
          [300, 335], [430, 330], [795, 330], [920, 330], [510, 120], [690, 125],
        ].map(([cx, cy], index) => (
          <g key={`${cx}-${cy}`} transform={`translate(${cx} ${cy}) rotate(${index % 2 === 0 ? -22 : 24})`}>
            <ellipse cx="0" cy="0" rx="34" ry="14" fill="rgba(116,196,143,0.22)" />
            <ellipse cx="18" cy="-18" rx="28" ry="12" fill="rgba(116,196,143,0.18)" />
            <ellipse cx="-24" cy="-18" rx="28" ry="12" fill="rgba(116,196,143,0.16)" />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background/80 to-transparent" />
    </div>
  )
}

export function FamilyTree({ data, memberCount, relationshipCount }: FamilyTreeProps) {
  const router = useRouter()
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.78)

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setTranslate({ x: el.offsetWidth / 2, y: 120 })
    }
  }, [])

  const handleNodeClick = (personId: string) => {
    router.push(`/members/${personId}`)
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-border/70 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black">
            <Sparkles className="h-4 w-4 text-primary" />
            Living family garden
          </p>
          <p className="text-xs text-muted-foreground">
            {memberCount} profiles, {relationshipCount} parent links. Drag the garden to explore.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border bg-white/70 px-3 py-2 text-xs font-bold text-muted-foreground md:flex">
            <Users className="h-3.5 w-3.5 text-primary" />
            Click a profile to open health details
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.max(0.35, value - 0.1))} title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom(0.78)} title="Reset zoom">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.min(1.3, value + 0.1))} title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div ref={containerRef} className="relative h-[70vh] min-h-[620px] w-full">
        <GardenBackdrop />
        <div className="pointer-events-none absolute left-5 top-5 z-10 flex flex-col gap-2 text-xs font-bold text-muted-foreground">
          <span className="rounded-full border bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur">Root and elders</span>
          <span className="rounded-full border bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur">Parents and partners</span>
          <span className="rounded-full border bg-white/75 px-3 py-1.5 shadow-sm backdrop-blur">Children</span>
        </div>
        <Tree
          data={data}
          translate={translate}
          zoom={zoom}
          orientation="vertical"
          pathFunc="diagonal"
          renderCustomNodeElement={(props) => (
            <CustomNode nodeDatum={props.nodeDatum as TreeNode} onNodeClick={handleNodeClick} />
          )}
          separation={{ siblings: 2.4, nonSiblings: 3.1 }}
          nodeSize={{ x: 280, y: 200 }}
          pathClassFunc={() => 'family-tree-link'}
          scaleExtent={{ min: 0.35, max: 1.3 }}
          zoomable
          draggable
        />
      </div>
    </div>
  )
}
