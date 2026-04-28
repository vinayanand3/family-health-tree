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
import { Activity, Heart, AlertCircle, Pill, GitFork } from 'lucide-react'
import { Relationship } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PersonNodeData = {
  personId: string
  name: string
  initials: string
  age: string
  gender: string | null
  activeConditions: number
  hereditaryConditions: number
  medicationCount: number
  allergyCount: number
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

const STATUS_BORDER: Record<string, string> = {
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

// ─── Person Node Component ────────────────────────────────────────────────────

function PersonNode({ data }: NodeProps<PersonFlowNode>) {
  const [hovered, setHovered] = useState(false)
  const router = useRouter()
  const status = healthStatus(data)
  const borderColor = STATUS_BORDER[status]
  const { bg, fg } = STATUS_AVATAR[status]
  const hasHealth =
    data.activeConditions > 0 ||
    data.hereditaryConditions > 0 ||
    data.medicationCount > 0 ||
    data.allergyCount > 0
  const genderSymbol =
    data.gender === 'male' ? '♂' : data.gender === 'female' ? '♀' : null

  return (
    <div className="relative">
      {/* Target handles */}
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        style={{ background: '#94a3b8', border: '2px solid #fff', width: 8, height: 8 }}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        style={{ background: '#f43f5e', border: '2px solid #fff', width: 8, height: 8 }}
      />

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-52 -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-xl"
        >
          <p className="text-sm font-bold text-slate-800">{data.name}</p>
          {data.age && <p className="mb-2 text-xs text-slate-500">{data.age}</p>}
          <div className="space-y-1">
            {data.activeConditions > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-amber-700">
                <Activity className="h-3 w-3" />
                {data.activeConditions} active condition{data.activeConditions !== 1 ? 's' : ''}
              </p>
            )}
            {data.hereditaryConditions > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-rose-700">
                <Heart className="h-3 w-3" />
                {data.hereditaryConditions} hereditary risk{data.hereditaryConditions !== 1 ? 's' : ''}
              </p>
            )}
            {data.medicationCount > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-blue-700">
                <Pill className="h-3 w-3" />
                {data.medicationCount} medication{data.medicationCount !== 1 ? 's' : ''}
              </p>
            )}
            {data.allergyCount > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-purple-700">
                <AlertCircle className="h-3 w-3" />
                {data.allergyCount} allergi{data.allergyCount !== 1 ? 'es' : 'y'}
              </p>
            )}
            {!hasHealth && (
              <p className="text-xs text-emerald-700">✓ No health concerns</p>
            )}
          </div>
          <p className="mt-2 text-[10px] text-slate-400">Click to open full profile →</p>
        </div>
      )}

      {/* Card */}
      <div
        style={{
          border: `2px solid ${borderColor}`,
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: hovered
            ? `0 8px 24px -4px ${borderColor}50, 0 4px 12px -2px rgba(0,0,0,0.1)`
            : '0 2px 8px -2px rgba(0,0,0,0.08)',
        }}
        className="w-44 cursor-pointer overflow-hidden rounded-2xl bg-white"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => router.push(`/members/${data.personId}`)}
      >
        {/* Top color bar */}
        <div style={{ height: 4, background: borderColor }} />

        <div className="p-3 pb-2">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-black"
              style={{ background: bg, color: fg }}
            >
              {data.initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold leading-tight text-slate-800">
                {data.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1">
                {data.age && <p className="text-xs text-slate-500">{data.age}</p>}
                {genderSymbol && (
                  <span className="text-xs text-slate-400">{genderSymbol}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Health badges */}
        {hasHealth && (
          <div className="flex flex-wrap gap-1 border-t border-slate-100 px-2.5 py-1.5">
            {data.activeConditions > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                <Activity className="h-2.5 w-2.5" />
                {data.activeConditions}
              </span>
            )}
            {data.hereditaryConditions > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                <Heart className="h-2.5 w-2.5" />
                {data.hereditaryConditions}
              </span>
            )}
            {data.medicationCount > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                <Pill className="h-2.5 w-2.5" />
                {data.medicationCount}
              </span>
            )}
            {data.allergyCount > 0 && (
              <span className="flex items-center gap-0.5 rounded-full bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">
                <AlertCircle className="h-2.5 w-2.5" />
                {data.allergyCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Source handles */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        style={{ background: '#94a3b8', border: '2px solid #fff', width: 8, height: 8 }}
      />
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        style={{ background: '#f43f5e', border: '2px solid #fff', width: 8, height: 8 }}
      />
    </div>
  )
}

const nodeTypes = { person: PersonNode }

// ─── Layout algorithm ─────────────────────────────────────────────────────────

const NODE_W = 176
const NODE_H = 120
const H_GAP = 80
const V_GAP = 150

function computeLayout(persons: PersonNodeData[], relationships: Relationship[]) {
  const ids = persons.map((p) => p.personId)
  const idSet = new Set(ids)

  const parentToChildren: Record<string, string[]> = {}
  const childToParents: Record<string, string[]> = {}
  const spouseOf: Record<string, string[]> = {}
  const spousePairs: [string, string][] = []
  const seenSpouse = new Set<string>()

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
  }

  // Assign generations via BFS
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
      if (gen[sp] === undefined) {
        gen[sp] = g
        queue.push(sp)
      }
    }
    for (const ch of parentToChildren[id] ?? []) {
      if (gen[ch] === undefined) {
        gen[ch] = g + 1
        queue.push(ch)
      }
    }
  }

  // Handle disconnected nodes
  for (const id of ids) {
    if (gen[id] === undefined) gen[id] = 0
  }

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
        ordered.push(id)
        placed.add(id)
        for (const sp of spouseOf[id] ?? []) {
          if (!placed.has(sp) && gen[sp] === 0) {
            ordered.push(sp)
            placed.add(sp)
          }
        }
      }
    } else {
      const sorted = grp
        .map((id) => {
          const parents = childToParents[id] ?? []
          const idealX =
            parents.length > 0
              ? parents.reduce((s, pid) => s + (positions[pid]?.x ?? 0), 0) / parents.length
              : 0
          return { id, idealX }
        })
        .sort((a, b) => a.idealX - b.idealX)

      for (const { id } of sorted) {
        if (placed.has(id)) continue
        ordered.push(id)
        placed.add(id)
        for (const sp of spouseOf[id] ?? []) {
          if (!placed.has(sp) && gen[sp] === g) {
            ordered.push(sp)
            placed.add(sp)
          }
        }
      }
    }

    const totalW =
      ordered.length * NODE_W + Math.max(0, ordered.length - 1) * H_GAP
    const startX = -totalW / 2
    ordered.forEach((id, i) => {
      positions[id] = {
        x: startX + i * (NODE_W + H_GAP),
        y: g * (NODE_H + V_GAP),
      }
    })
  }

  return { positions, parentToChildren, spousePairs }
}

function buildFlowElements(persons: PersonNodeData[], relationships: Relationship[]) {
  if (persons.length === 0) return { nodes: [] as Node[], edges: [] as Edge[] }

  const { positions, parentToChildren, spousePairs } = computeLayout(
    persons,
    relationships
  )

  const nodes: Node[] = persons.map((p) => ({
    id: p.personId,
    type: 'person' as const,
    position: positions[p.personId] ?? { x: 0, y: 0 },
    data: p,
  }))

  const edges: Edge[] = []

  for (const [parentId, children] of Object.entries(parentToChildren)) {
    for (const childId of children) {
      edges.push({
        id: `pc-${parentId}-${childId}`,
        source: parentId,
        target: childId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'smoothstep',
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      })
    }
  }

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
      style: { stroke: '#f43f5e', strokeWidth: 2 },
      label: '♥',
      labelStyle: { fill: '#f43f5e', fontSize: 14, fontWeight: 'bold' },
      labelBgStyle: { fill: 'white', fillOpacity: 0.9 },
      labelBgPadding: [4, 4] as [number, number],
    })
  }

  return { nodes, edges }
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface FamilyTreeProps {
  persons: PersonNodeData[]
  relationships: Relationship[]
  memberCount: number
  relationshipCount: number
}

const LEGEND = [
  { color: '#10b981', label: 'Healthy' },
  { color: '#f59e0b', label: 'Conditions' },
  { color: '#f43f5e', label: 'Hereditary' },
  { color: '#3b82f6', label: 'Managed' },
]

export function FamilyTree({
  persons,
  relationships,
  memberCount,
  relationshipCount,
}: FamilyTreeProps) {
  const { nodes: initNodes, edges: initEdges } = useMemo(
    () => buildFlowElements(persons, relationships),
    [persons, relationships]
  )

  const [nodes, , onNodesChange] = useNodesState(initNodes)
  const [edges, , onEdgesChange] = useEdgesState(initEdges)

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm backdrop-blur">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-border/70 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black">
            <GitFork className="h-4 w-4 text-primary" />
            Genogram family tree
          </p>
          <p className="text-xs text-muted-foreground">
            {memberCount} members · {relationshipCount} connections · Hover
            any card for health info, click to open profile
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {LEGEND.map(({ color, label }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full border border-border/60 bg-white/70 px-3 py-1.5 font-medium text-muted-foreground"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: color }}
              />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 rounded-full border border-border/60 bg-white/70 px-3 py-1.5 font-medium text-muted-foreground">
            <span style={{ color: '#f43f5e', lineHeight: 1 }}>♥</span>
            Spouse
          </span>
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
          fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
          minZoom={0.2}
          maxZoom={2.5}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          style={{
            background:
              'radial-gradient(circle at 50% 20%, #ffffff, #f5fbf1 44%, #e6fbf4)',
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#d1fae5"
          />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => {
              const d = node.data as PersonNodeData
              return STATUS_BORDER[healthStatus(d)] ?? '#94a3b8'
            }}
            zoomable
            pannable
            style={{ border: '1px solid #e2e8f0', borderRadius: 12 }}
          />
        </ReactFlow>
      </div>
    </div>
  )
}
