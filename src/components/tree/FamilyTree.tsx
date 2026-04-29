'use client'

import { useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Handle,
  Position,
  NodeProps,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Activity, CalendarDays, GitFork, Pill, ShieldAlert, Sparkles } from 'lucide-react'
import { Relationship } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PersonNodeData = {
  personId: string
  name: string
  initials: string
  age: string
  gender: string | null
  photoUrl: string | null
  activeConditions: number
  hereditaryConditions: number
  sharedHereditaryRisks: number
  medicationCount: number
  allergyCount: number
  upcomingAppointments: {
    id: string
    title: string
    appointmentDate: string
    doctorName: string | null
    location: string | null
  }[]
  onPreviewChange?: (person: PersonNodeData | null) => void
  [key: string]: unknown
}

type PersonFlowNode = Node<PersonNodeData, 'person'>

// ─── Health helpers ───────────────────────────────────────────────────────────

function healthStatus(d: PersonNodeData): 'hereditary' | 'active' | 'managed' | 'healthy' {
  if (d.hereditaryConditions > 0 || d.sharedHereditaryRisks > 0) return 'hereditary'
  if (d.activeConditions > 0) return 'active'
  if (d.medicationCount > 0 || d.allergyCount > 0) return 'managed'
  return 'healthy'
}

const STATUS_RING: Record<string, string> = {
  hereditary: '#f43f5e',
  active: '#f59e0b',
  managed: '#3b82f6',
  healthy: '#10b981',
}

const STATUS_AVATAR: Record<string, { bg: string; fg: string }> = {
  hereditary: { bg: '#fff1f2', fg: '#be123c' },
  active: { bg: '#fffbeb', fg: '#b45309' },
  managed: { bg: '#eff6ff', fg: '#1d4ed8' },
  healthy: { bg: '#f0fdf4', fg: '#065f46' },
}

const HEALTH_ITEMS = [
  { key: 'activeConditions' as const, color: '#f59e0b', singular: 'active condition' },
  { key: 'hereditaryConditions' as const, color: '#f43f5e', singular: 'hereditary risk' },
  { key: 'medicationCount' as const, color: '#3b82f6', singular: 'medication' },
  { key: 'allergyCount' as const, color: '#a855f7', singular: 'allergy' },
]

function formatAppointmentDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

// ─── Person Node ──────────────────────────────────────────────────────────────

function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const [hovered, setHovered] = useState(false)
  const status = healthStatus(data)
  const ringColor = STATUS_RING[status]
  const { bg, fg } = STATUS_AVATAR[status]
  const hasHealth =
    data.activeConditions > 0 ||
    data.hereditaryConditions > 0 ||
    data.sharedHereditaryRisks > 0 ||
    data.medicationCount > 0 ||
    data.allergyCount > 0

  const NODE_W = 152

  return (
    <div
      className="nodrag nopan"
      onMouseEnter={() => {
        setHovered(true)
        data.onPreviewChange?.(data)
      }}
      onMouseLeave={() => {
        setHovered(false)
        data.onPreviewChange?.(null)
      }}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: NODE_W,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      <Link
        href={`/members/${data.personId}`}
        className="nodrag nopan"
        aria-label={`Open ${data.name}'s health profile`}
        style={{
          position: 'absolute',
          inset: -14,
          zIndex: 20,
          borderRadius: 24,
          cursor: 'pointer',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 28,
          left: -10,
          width: 38,
          height: 18,
          borderRadius: '999px 0 999px 0',
          background: hovered ? '#bbf7d0' : '#dcfce7',
          opacity: 0.65,
          transform: 'rotate(-22deg)',
          transition: 'all 0.18s ease',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 28,
          right: -10,
          width: 38,
          height: 18,
          borderRadius: '0 999px 0 999px',
          background: hovered ? '#bbf7d0' : '#dcfce7',
          opacity: 0.65,
          transform: 'rotate(22deg)',
          transition: 'all 0.18s ease',
        }}
      />
      {/* Handles */}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ background: '#cbd5e1', border: '2px solid white', width: 8, height: 8, top: 0 }}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        style={{ background: '#e2e8f0', border: '2px solid white', width: 8, height: 8, top: '78%' }}
      />

      {/* ── Photo circle ────────────────────────────────── */}
      <div
        style={{
          width: 68,
          height: 68,
          borderRadius: '50%',
          border: `3px solid ${ringColor}`,
          boxShadow: hovered
            ? `0 0 0 4px ${ringColor}22, 0 4px 16px rgba(0,0,0,0.14)`
            : `0 0 0 2px white, 0 2px 10px rgba(0,0,0,0.12)`,
          overflow: 'hidden',
          background: bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 900,
          color: fg,
          position: 'relative',
          zIndex: 2,
          marginBottom: -18,
          transition: 'box-shadow 0.15s ease',
          flexShrink: 0,
        }}
      >
        {data.photoUrl ? (
          <img
            src={data.photoUrl}
            alt={data.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          data.initials
        )}
      </div>

      {/* ── Name card ───────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          background: 'white',
          borderRadius: 14,
          border: `1.5px solid ${hovered ? ringColor : '#e8edf3'}`,
          boxShadow: hovered
            ? `0 6px 28px ${ringColor}22, 0 2px 10px rgba(0,0,0,0.06)`
            : '0 1px 6px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
          transition: 'all 0.18s ease',
          paddingTop: 26,
          paddingBottom: 11,
          paddingLeft: 10,
          paddingRight: 10,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${ringColor}80, ${ringColor})`,
        }} />

        <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#0f172a',
          lineHeight: 1.35,
          marginBottom: 2,
          wordBreak: 'break-word',
        }}>
          {data.name}
        </p>

        {data.age && (
          <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1 }}>{data.age}</p>
        )}

        {/* Health indicator dots */}
        {hasHealth && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 7 }}>
            {HEALTH_ITEMS.filter(({ key }) => (data[key] as number) > 0).map(({ key, color }) => (
              <span
                key={key}
                title={key}
                style={{
                  display: 'inline-block',
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: color,
                }}
              />
            ))}
          </div>
        )}

        {data.sharedHereditaryRisks > 0 && (
          <div
            title="Shared hereditary pattern"
            style={{
              margin: '7px auto 0',
              width: 'fit-content',
              borderRadius: 999,
              background: '#fff1f2',
              color: '#be123c',
              border: '1px solid #fecdd3',
              padding: '2px 7px',
              fontSize: 10,
              fontWeight: 900,
              lineHeight: 1,
            }}
          >
            Shared risk
          </div>
        )}
      </div>

      {/* Source handles */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{ background: '#cbd5e1', border: '2px solid white', width: 8, height: 8, bottom: 0 }}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{ background: '#e2e8f0', border: '2px solid white', width: 8, height: 8, top: '78%' }}
      />
    </div>
  )
}

const nodeTypes = { person: PersonNode }

function HealthPreviewPanel({ person }: { person: PersonNodeData | null }) {
  if (!person) {
    return (
      <div className="pointer-events-none absolute right-4 top-4 z-20 hidden w-[300px] rounded-2xl border border-white/80 bg-white/85 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-xl lg:block">
        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
          <Sparkles className="h-3.5 w-3.5 text-rose-500" />
          Live preview
        </div>
        <p className="text-sm font-black text-slate-900">Hover a family member</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          Health markers, care notes, and upcoming visits appear here without covering the tree.
        </p>
      </div>
    )
  }

  const status = healthStatus(person)
  const ringColor = STATUS_RING[status]
  const { bg, fg } = STATUS_AVATAR[status]
  const hasHealth =
    person.activeConditions > 0 ||
    person.hereditaryConditions > 0 ||
    person.sharedHereditaryRisks > 0 ||
    person.medicationCount > 0 ||
    person.allergyCount > 0

  return (
    <div className="pointer-events-none absolute right-4 top-4 z-20 hidden w-[320px] rounded-2xl border border-white/80 bg-white/90 p-4 shadow-2xl shadow-slate-900/15 backdrop-blur-xl lg:block">
      <div className="flex items-start gap-3">
        <div
          className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full text-sm font-black"
          style={{ border: `2px solid ${ringColor}`, background: bg, color: fg }}
        >
          {person.photoUrl ? (
            <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
          ) : (
            person.initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-950">{person.name}</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">{person.age}</p>
          {person.gender && (
            <p className="mt-1 text-[11px] font-bold capitalize text-slate-400">{person.gender}</p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PreviewMetric icon={Activity} label="Conditions" value={person.activeConditions} color="#f59e0b" />
        <PreviewMetric icon={ShieldAlert} label="Risks" value={person.hereditaryConditions + person.sharedHereditaryRisks} color="#f43f5e" />
        <PreviewMetric icon={Pill} label="Meds" value={person.medicationCount} color="#3b82f6" />
        <PreviewMetric icon={Sparkles} label="Allergies" value={person.allergyCount} color="#a855f7" />
      </div>

      {person.sharedHereditaryRisks > 0 && (
        <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
          Shared hereditary pattern appears in this family.
        </div>
      )}

      {!hasHealth && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          No health concerns recorded
        </div>
      )}

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 flex items-center gap-2 text-xs font-black text-slate-900">
          <CalendarDays className="h-3.5 w-3.5 text-rose-600" />
          Upcoming visits
        </p>
        {person.upcomingAppointments.length > 0 ? (
          <div className="space-y-2">
            {person.upcomingAppointments.slice(0, 3).map((appointment) => (
              <div key={appointment.id} className="rounded-xl bg-orange-50 px-3 py-2">
                <p className="line-clamp-2 text-xs font-black leading-4 text-slate-900">
                  {appointment.title}
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-4 text-slate-500">
                  {formatAppointmentDate(appointment.appointmentDate)}
                  {appointment.doctorName ? ` · ${appointment.doctorName}` : ''}
                </p>
                {appointment.location && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">{appointment.location}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
            No upcoming appointments
          </p>
        )}
      </div>

      <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] font-bold text-slate-400">
        Click the card to open the full profile
      </div>
    </div>
  )
}

function PreviewMetric({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity
  label: string
  value: number
  color: string
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
        <Icon className="h-3 w-3" style={{ color }} />
        {label}
      </div>
      <p className="text-lg font-black leading-none text-slate-950">{value}</p>
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const NODE_W = 152
const NODE_H = 138   // 68 photo - 18 overlap + ~88 card
const H_GAP = 80
const V_GAP = 160

function computeLayout(persons: PersonNodeData[], relationships: Relationship[]) {
  const ids = persons.map((p) => p.personId)
  const idSet = new Set(ids)

  const parentToChildren: Record<string, string[]> = {}
  const childToParents: Record<string, string[]> = {}
  const spouseOf: Record<string, string[]> = {}
  const spousePairs: [string, string][] = []
  const seenSpouse = new Set<string>()
  const siblingPairs: [string, string][] = []
  const seenSibling = new Set<string>()

  for (const r of relationships) {
    const a = r.person_id
    const b = r.related_person_id
    if (!idSet.has(a) || !idSet.has(b)) continue

    if (r.relationship_type === 'parent') {
      ;(parentToChildren[a] ??= []).push(b)
      ;(childToParents[b] ??= []).push(a)
    }
    if (r.relationship_type === 'spouse') {
      const key = [a, b].sort().join(':')
      if (!seenSpouse.has(key)) {
        seenSpouse.add(key)
        spousePairs.push([a, b])
        ;(spouseOf[a] ??= []).push(b)
        ;(spouseOf[b] ??= []).push(a)
      }
    }
    if (r.relationship_type === 'sibling') {
      const key = [a, b].sort().join(':')
      if (!seenSibling.has(key)) {
        seenSibling.add(key)
        siblingPairs.push([a, b])
      }
    }
  }

  const gen: Record<string, number> = {}
  const visited = new Set<string>()
  const hasParent = new Set(ids.filter((id) => (childToParents[id]?.length ?? 0) > 0))
  const roots = ids.filter((id) => !hasParent.has(id))
  const queue: string[] = [...roots]
  for (const r of roots) gen[r] = 0

  while (queue.length > 0) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const g = gen[id] ?? 0
    for (const sp of spouseOf[id] ?? []) {
      if (gen[sp] === undefined) { gen[sp] = g; queue.push(sp) }
    }
    for (const ch of parentToChildren[id] ?? []) {
      if (gen[ch] === undefined) { gen[ch] = g + 1; queue.push(ch) }
    }
  }
  for (const id of ids) { if (gen[id] === undefined) gen[id] = 0 }

  const maxG = Math.max(0, ...Object.values(gen))
  const genGroups: string[][] = Array.from({ length: maxG + 1 }, () => [])
  for (const id of ids) genGroups[gen[id]].push(id)

  const positions: Record<string, { x: number; y: number }> = {}

  for (let g = 0; g <= maxG; g++) {
    const grp = genGroups[g]
    const placed = new Set<string>()
    const ordered: string[] = []

    if (g === 0) {
      for (const id of grp) {
        if (placed.has(id)) continue
        ordered.push(id); placed.add(id)
        for (const sp of spouseOf[id] ?? []) {
          if (!placed.has(sp) && gen[sp] === 0) { ordered.push(sp); placed.add(sp) }
        }
      }
    } else {
      const sorted = grp
        .map((id) => {
          const parents = childToParents[id] ?? []
          const idealX = parents.length > 0
            ? parents.reduce((s, pid) => s + (positions[pid]?.x ?? 0), 0) / parents.length
            : 0
          return { id, idealX }
        })
        .sort((a, b) => a.idealX - b.idealX)

      for (const { id } of sorted) {
        if (placed.has(id)) continue
        ordered.push(id); placed.add(id)
        for (const sp of spouseOf[id] ?? []) {
          if (!placed.has(sp) && gen[sp] === g) { ordered.push(sp); placed.add(sp) }
        }
      }
    }

    const totalW = ordered.length * NODE_W + Math.max(0, ordered.length - 1) * H_GAP
    const startX = -totalW / 2
    ordered.forEach((id, i) => {
      positions[id] = {
        x: startX + i * (NODE_W + H_GAP),
        y: g * (NODE_H + V_GAP),
      }
    })
  }

  return { positions, parentToChildren, spousePairs, siblingPairs }
}

const RELATION_LABEL_STYLE = {
  fill: '#334155',
  fontSize: 11,
  fontWeight: 800,
} as const

const RELATION_LABEL_BG = {
  fill: '#fffaf2',
  fillOpacity: 0.98,
  stroke: '#e6d8c8',
  strokeWidth: 1,
} as const

function buildFlowElements(
  persons: PersonNodeData[],
  relationships: Relationship[],
  onPreviewChange?: (person: PersonNodeData | null) => void
) {
  if (persons.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] }

  const { positions, parentToChildren, spousePairs, siblingPairs } = computeLayout(persons, relationships)
  const personById = new Map(persons.map((person) => [person.personId, person]))
  const hasSharedRiskLink = (a: string, b: string) =>
    (personById.get(a)?.sharedHereditaryRisks ?? 0) > 0 &&
    (personById.get(b)?.sharedHereditaryRisks ?? 0) > 0

  const nodes: Node[] = persons.map((p) => ({
    id: p.personId,
    type: 'person' as const,
    position: positions[p.personId] ?? { x: 0, y: 0 },
    data: { ...p, onPreviewChange },
  }))

  const edges: Edge[] = []

  // Parent → child edges
  for (const [parentId, children] of Object.entries(parentToChildren)) {
    for (const childId of children) {
      const sharedRisk = hasSharedRiskLink(parentId, childId)
      edges.push({
        id: `pc-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: {
          stroke: sharedRisk ? '#f43f5e' : '#95b8a5',
          strokeWidth: sharedRisk ? 3 : 2.2,
          strokeDasharray: sharedRisk ? '7 5' : undefined,
        },
        label: sharedRisk ? 'Shared risk' : 'Parent',
        labelStyle: sharedRisk ? { fill: '#be123c', fontSize: 11, fontWeight: 900 } : RELATION_LABEL_STYLE,
        labelBgStyle: sharedRisk ? { fill: '#fff1f2', fillOpacity: 0.98, stroke: '#fecdd3', strokeWidth: 1 } : RELATION_LABEL_BG,
        labelBgPadding: [8, 4] as [number, number],
        labelBgBorderRadius: 10,
      })
    }
  }

  // Spouse edges, horizontal line between the two cards
  for (const [a, b] of spousePairs) {
    const posA = positions[a] ?? { x: 0, y: 0 }
    const posB = positions[b] ?? { x: 0, y: 0 }
    const leftId = posA.x <= posB.x ? a : b
    const rightId = leftId === a ? b : a
    const sharedRisk = hasSharedRiskLink(a, b)
    edges.push({
      id: `sp-${a}-${b}`,
      source: leftId,
      target: rightId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'straight',
      style: {
        stroke: sharedRisk ? '#f43f5e' : '#dc6f75',
        strokeWidth: sharedRisk ? 3 : 2.2,
        strokeDasharray: sharedRisk ? '7 5' : undefined,
      },
      label: sharedRisk ? 'Shared risk' : '♥ Spouse',
      labelStyle: { fill: '#be123c', fontSize: 11, fontWeight: 900 },
      labelBgStyle: { fill: '#fff1f2', fillOpacity: 0.98, stroke: '#fecdd3', strokeWidth: 1 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 10,
    })
  }

  // Sibling edges, shown as dotted side links when the family records them
  for (const [a, b] of siblingPairs) {
    const posA = positions[a] ?? { x: 0, y: 0 }
    const posB = positions[b] ?? { x: 0, y: 0 }
    const leftId = posA.x <= posB.x ? a : b
    const rightId = leftId === a ? b : a
    edges.push({
      id: `sib-${a}-${b}`,
      source: leftId,
      target: rightId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'smoothstep',
      style: { stroke: '#38bdf8', strokeWidth: 2, strokeDasharray: '5 5' },
      label: 'Sibling',
      labelStyle: { fill: '#0369a1', fontSize: 11, fontWeight: 900 },
      labelBgStyle: { fill: '#f0f9ff', fillOpacity: 0.98, stroke: '#bae6fd', strokeWidth: 1 },
      labelBgPadding: [8, 4] as [number, number],
      labelBgBorderRadius: 10,
    })
  }

  return { nodes, edges }
}

// ─── Legend ───────────────────────────────────────────────────────────────────

const HEALTH_LEGEND = [
  { color: '#10b981', label: 'Healthy' },
  { color: '#f59e0b', label: 'Active conditions' },
  { color: '#f43f5e', label: 'Hereditary risks' },
  { color: '#3b82f6', label: 'Medications' },
]

const RELATION_LEGEND = [
  { color: '#95b8a5', label: 'Parent', dash: 'solid' },
  { color: '#dc6f75', label: 'Spouse', dash: 'solid' },
  { color: '#38bdf8', label: 'Sibling', dash: '5 5' },
]

// ─── Main component ───────────────────────────────────────────────────────────

export interface FamilyTreeProps {
  persons: PersonNodeData[]
  relationships: Relationship[]
  memberCount: number
  relationshipCount: number
}

export function FamilyTree({
  persons,
  relationships,
  memberCount,
  relationshipCount,
}: FamilyTreeProps) {
  const router = useRouter()
  const [previewPerson, setPreviewPerson] = useState<PersonNodeData | null>(null)
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFlowElements(persons, relationships, setPreviewPerson),
    [persons, relationships]
  )

  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)
  const activeConditionCount = persons.reduce((sum, person) => sum + person.activeConditions, 0)
  const hereditaryRiskCount = persons.reduce((sum, person) => sum + person.hereditaryConditions, 0)
  const appointmentCount = persons.reduce((sum, person) => sum + person.upcomingAppointments.length, 0)

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-2xl shadow-slate-900/10 backdrop-blur-xl">
      {/* Header */}
      <div className="border-b border-slate-100 bg-white/85 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-black text-slate-950">
              <GitFork className="h-4 w-4 text-rose-600" />
              Living relationship tree
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {memberCount} members · {relationshipCount} connections · Hover a card for care details · Click to open profile
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            <TreeStat label="Active" value={activeConditionCount} color="#f59e0b" />
            <TreeStat label="Risks" value={hereditaryRiskCount} color="#f43f5e" />
            <TreeStat label="Visits" value={appointmentCount} color="#3b82f6" />
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {HEALTH_LEGEND.map(({ color, label }) => (
            <span
              key={label}
              className="flex shrink-0 items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500"
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </span>
          ))}
          {RELATION_LEGEND.map(({ color, label, dash }) => (
            <span
              key={label}
              className="flex shrink-0 items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-slate-500"
            >
              <span
                style={{
                  width: 18,
                  height: 2,
                  borderRadius: 99,
                  background: dash === 'solid' ? color : undefined,
                  borderTop: dash === 'solid' ? undefined : `2px dashed ${color}`,
                  flexShrink: 0,
                }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="relative h-[72vh] min-h-[520px] sm:min-h-[640px]">
        <HealthPreviewPanel person={previewPerson} />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.32, maxZoom: 1.08 }}
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={(_, node) => router.push(`/members/${(node.data as PersonNodeData).personId}`)}
          onPaneMouseEnter={() => setPreviewPerson(null)}
          style={{ background: 'radial-gradient(circle at 50% 8%, #fff7ed 0%, #f8fffb 34%, #f8fafc 72%, #f3f4f6 100%)' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#e8e0d8" />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => STATUS_RING[healthStatus(node.data as PersonNodeData)] ?? '#94a3b8'}
            zoomable
            pannable
            style={{ border: '1px solid #e8edf3', borderRadius: 12, background: 'white' }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}

function TreeStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-3 py-2 shadow-sm sm:min-w-24">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: color }} />
        <p className="text-lg font-black leading-none text-slate-950">{value}</p>
      </div>
    </div>
  )
}
