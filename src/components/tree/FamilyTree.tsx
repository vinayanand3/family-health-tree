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
import { useRouter } from 'next/navigation'
import { CalendarDays, GitFork } from 'lucide-react'
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
  medicationCount: number
  allergyCount: number
  upcomingAppointments: {
    id: string
    title: string
    appointmentDate: string
    doctorName: string | null
    location: string | null
  }[]
  [key: string]: unknown
}

type PersonFlowNode = Node<PersonNodeData, 'person'>

// ─── Health helpers ───────────────────────────────────────────────────────────

function healthStatus(d: PersonNodeData): 'hereditary' | 'active' | 'managed' | 'healthy' {
  if (d.hereditaryConditions > 0) return 'hereditary'
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
  const router = useRouter()
  const status = healthStatus(data)
  const ringColor = STATUS_RING[status]
  const { bg, fg } = STATUS_AVATAR[status]
  const hasHealth =
    data.activeConditions > 0 ||
    data.hereditaryConditions > 0 ||
    data.medicationCount > 0 ||
    data.allergyCount > 0

  const NODE_W = 152
  const openProfile = () => router.push(`/members/${data.personId}`)

  return (
    <div
      className="nodrag nopan"
      role="button"
      tabIndex={0}
      aria-label={`Open ${data.name}'s health profile`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={openProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openProfile()
        }
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

      {/* Hover tooltip */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 12,
            width: 210,
            background: 'white',
            borderRadius: 16,
            border: '1px solid #f1f5f9',
            boxShadow: '0 12px 40px -8px rgba(0,0,0,0.18), 0 4px 16px -4px rgba(0,0,0,0.08)',
            padding: '12px 14px',
            zIndex: 100,
            pointerEvents: 'none',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {/* Mini avatar */}
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              border: `2px solid ${ringColor}`,
              overflow: 'hidden', flexShrink: 0,
              background: bg, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 900, color: fg,
            }}>
              {data.photoUrl ? (
                <img src={data.photoUrl} alt={data.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : data.initials}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>{data.name}</p>
              {data.age && <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{data.age}</p>}
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: '#f1f5f9', marginBottom: 8 }} />

          {/* Health rows */}
          {HEALTH_ITEMS.filter(({ key }) => (data[key] as number) > 0).map(({ key, color, singular }) => {
            const count = data[key] as number
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#475569' }}>
                  {count} {singular}{count !== 1 ? (singular.endsWith('y') ? 'ies' : 's') : ''}
                </span>
              </div>
            )
          })}
          {!hasHealth && (
            <p style={{ fontSize: 12, color: '#10b981', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✓</span> No health concerns recorded
            </p>
          )}

          {data.gender && (
            <div style={{ marginTop: 7, fontSize: 11, color: '#64748b' }}>
              Gender: <span style={{ color: '#0f172a', fontWeight: 700, textTransform: 'capitalize' }}>{data.gender}</span>
            </div>
          )}

          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #f1f5f9' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 11, fontWeight: 800, color: '#0f172a' }}>
              <CalendarDays style={{ width: 12, height: 12, color: '#e11d48' }} />
              Upcoming appointments
            </p>
            {data.upcomingAppointments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.upcomingAppointments.slice(0, 3).map((appointment) => (
                  <div key={appointment.id} style={{ borderRadius: 10, background: '#fff7ed', padding: '7px 8px' }}>
                    <p style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', lineHeight: 1.25 }}>
                      {appointment.title}
                    </p>
                    <p style={{ marginTop: 2, fontSize: 10, color: '#64748b', lineHeight: 1.25 }}>
                      {formatAppointmentDate(appointment.appointmentDate)}
                      {appointment.doctorName ? ` · ${appointment.doctorName}` : ''}
                    </p>
                    {appointment.location && (
                      <p style={{ marginTop: 1, fontSize: 10, color: '#94a3b8', lineHeight: 1.25 }}>
                        {appointment.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: '#94a3b8' }}>No upcoming appointments</p>
            )}
          </div>

          <div style={{ marginTop: 8, paddingTop: 7, borderTop: '1px solid #f1f5f9', fontSize: 10, color: '#94a3b8' }}>
            Click to open full health profile →
          </div>
        </div>
      )}

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

function buildFlowElements(persons: PersonNodeData[], relationships: Relationship[]) {
  if (persons.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] }

  const { positions, parentToChildren, spousePairs, siblingPairs } = computeLayout(persons, relationships)

  const nodes: Node[] = persons.map((p) => ({
    id: p.personId,
    type: 'person' as const,
    position: positions[p.personId] ?? { x: 0, y: 0 },
    data: p,
  }))

  const edges: Edge[] = []

  // Parent → child edges
  for (const [parentId, children] of Object.entries(parentToChildren)) {
    for (const childId of children) {
      edges.push({
        id: `pc-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: '#95b8a5', strokeWidth: 2.2 },
        label: 'Parent',
        labelStyle: RELATION_LABEL_STYLE,
        labelBgStyle: RELATION_LABEL_BG,
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
    edges.push({
      id: `sp-${a}-${b}`,
      source: leftId,
      target: rightId,
      sourceHandle: 'right',
      targetHandle: 'left',
      type: 'straight',
      style: { stroke: '#dc6f75', strokeWidth: 2.2 },
      label: '♥ Spouse',
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
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFlowElements(persons, relationships),
    [persons, relationships]
  )

  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  return (
    <div
      style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid #e8edf3', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', background: 'white' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 20px',
          borderBottom: '1px solid #f1f5f9',
          background: 'white',
        }}
      >
        <div>
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            <GitFork style={{ width: 15, height: 15, color: '#e11d48' }} />
            Living relationship tree
          </p>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            {memberCount} members · {relationshipCount} connections · Hover a card for health info · Click to open profile
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HEALTH_LEGEND.map(({ color, label }) => (
            <span
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 11px', borderRadius: 20,
                border: '1px solid #f1f5f9', background: '#fafafa',
                fontSize: 11, fontWeight: 600, color: '#64748b',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {label}
            </span>
          ))}
          {RELATION_LEGEND.map(({ color, label, dash }) => (
            <span
              key={label}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '4px 11px', borderRadius: 20,
                border: '1px solid #f1f5f9', background: '#fffaf2',
                fontSize: 11, fontWeight: 700, color: '#64748b',
              }}
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
      <div style={{ height: '72vh', minHeight: 640 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.28, maxZoom: 1.1 }}
          minZoom={0.15}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          onNodeClick={(_, node) => router.push(`/members/${(node.data as PersonNodeData).personId}`)}
          style={{ background: 'radial-gradient(circle at 50% 12%, #fffaf1 0%, #f6fff9 32%, #f8f5f0 72%, #f2ede8 100%)' }}
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
