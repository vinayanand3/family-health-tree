'use client'

import { useCallback, useState } from 'react'
import Tree from 'react-d3-tree'
import { TreeNode } from '@/types'
import { useRouter } from 'next/navigation'
import { Activity, AlertTriangle, Pill, Search, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FamilyTreeProps {
  data: TreeNode
  memberCount: number
  relationshipCount: number
}

const nodeWidth = 220
const nodeHeight = 124

function CustomNode({ nodeDatum, onNodeClick }: { nodeDatum: TreeNode; onNodeClick: (id: string) => void }) {
  const healthSignals =
    (nodeDatum.activeConditions ?? 0) +
    (nodeDatum.hereditaryConditions ?? 0) +
    (nodeDatum.medicationCount ?? 0) +
    (nodeDatum.allergyCount ?? 0)

  return (
    <g>
      <foreignObject
        width={nodeWidth}
        height={nodeHeight}
        x={-nodeWidth / 2}
        y={-nodeHeight / 2}
      >
        <button
          type="button"
          className="h-full w-full cursor-pointer rounded-2xl border border-white/80 bg-white/95 p-3 text-left shadow-xl shadow-slate-900/10 outline-none transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10"
          onClick={() => nodeDatum.personId && onNodeClick(nodeDatum.personId)}
        >
          <div className="flex items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-sm font-black text-primary ring-4 ring-primary/10">
              {nodeDatum.initials ?? nodeDatum.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-foreground">{nodeDatum.name}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{nodeDatum.age ?? 'Profile'}</p>
            </div>
            <div className={cn(
              'size-2.5 rounded-full',
              healthSignals > 0 ? 'bg-primary shadow-sm shadow-primary' : 'bg-accent'
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
    <div className={cn('flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black', toneClass)}>
      <span className="[&_svg]:size-3">{icon}</span>
      {label}
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
      <div className="flex flex-col gap-3 border-b border-border/70 bg-white/75 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-black">Interactive care map</p>
          <p className="text-xs text-muted-foreground">
            {memberCount} profiles, {relationshipCount} parent links. Drag the canvas to explore.
          </p>
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
      <div ref={containerRef} className="health-grid h-[68vh] min-h-[560px] w-full bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,255,255,0.58))]">
      <Tree
        data={data}
        translate={translate}
        zoom={zoom}
        orientation="vertical"
        pathFunc="elbow"
        renderCustomNodeElement={(props) => (
          <CustomNode nodeDatum={props.nodeDatum as TreeNode} onNodeClick={handleNodeClick} />
        )}
        separation={{ siblings: 2.2, nonSiblings: 2.8 }}
        nodeSize={{ x: 260, y: 190 }}
        pathClassFunc={() => 'stroke-primary/35'}
        scaleExtent={{ min: 0.35, max: 1.3 }}
        zoomable
        draggable
      />
      </div>
    </div>
  )
}
