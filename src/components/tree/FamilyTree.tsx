'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { TreeNode } from '@/types'
import { useRouter } from 'next/navigation'
import { HeartPulse, Leaf, Search, Sparkles, Users, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FamilyTreeProps {
  data: TreeNode
  memberCount: number
  relationshipCount: number
}

type VisualNode = {
  node: TreeNode
  x: number
  y: number
  depth: number
  children: VisualNode[]
}

type TooltipState = {
  visible: boolean
  x: number
  y: number
  title: string
  detail: string
  kind: 'member' | 'branch'
}

const emptyTooltip: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  title: '',
  detail: '',
  kind: 'member',
}

function countLeaves(node: TreeNode): number {
  if (!node.children || node.children.length === 0) return 1
  return node.children.reduce((total, child) => total + countLeaves(child), 0)
}

function buildLayout(root: TreeNode): VisualNode {
  const leafSpacing = 2.7
  const levelSpacing = 1.9
  const totalLeaves = countLeaves(root)
  let cursor = -((totalLeaves - 1) * leafSpacing) / 2

  function visit(node: TreeNode, depth: number): VisualNode {
    const children = (node.children ?? []).map((child) => visit(child, depth + 1))
    const x = children.length > 0
      ? children.reduce((sum, child) => sum + child.x, 0) / children.length
      : cursor

    if (children.length === 0) cursor += leafSpacing

    return {
      node,
      x,
      y: 2.25 - depth * levelSpacing,
      depth,
      children,
    }
  }

  return visit(root, 0)
}

function flattenLayout(root: VisualNode) {
  const nodes: VisualNode[] = []
  const links: Array<{ parent: VisualNode; child: VisualNode }> = []

  function walk(node: VisualNode) {
    nodes.push(node)
    for (const child of node.children) {
      links.push({ parent: node, child })
      walk(child)
    }
  }

  walk(root)
  return { nodes, links }
}

function createTextTexture(text: string, subtext?: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 192
  const context = canvas.getContext('2d')!

  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = 'rgba(255, 255, 255, 0.94)'
  context.strokeStyle = 'rgba(220, 211, 195, 0.95)'
  context.lineWidth = 8
  roundRect(context, 24, 24, 464, 132, 34)
  context.fill()
  context.stroke()

  context.fillStyle = '#0f1d2e'
  context.font = '700 42px Arial'
  context.textAlign = 'center'
  context.fillText(text, 256, 82)

  if (subtext) {
    context.fillStyle = '#58677d'
    context.font = '500 26px Arial'
    context.fillText(subtext, 256, 124)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath()
  context.moveTo(x + radius, y)
  context.lineTo(x + width - radius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + radius)
  context.lineTo(x + width, y + height - radius)
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  context.lineTo(x + radius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - radius)
  context.lineTo(x, y + radius)
  context.quadraticCurveTo(x, y, x + radius, y)
  context.closePath()
}

function createLeafMaterial(node: TreeNode) {
  const hasHealthSignal =
    (node.activeConditions ?? 0) +
    (node.hereditaryConditions ?? 0) +
    (node.medicationCount ?? 0) +
    (node.allergyCount ?? 0) > 0

  return new THREE.MeshStandardMaterial({
    color: hasHealthSignal ? '#f8b4c0' : '#95dfb2',
    roughness: 0.82,
    metalness: 0.02,
    emissive: hasHealthSignal ? '#4a0715' : '#0c3b23',
    emissiveIntensity: hasHealthSignal ? 0.08 : 0.04,
  })
}

function branchLabel(parent: TreeNode, child: TreeNode) {
  if (!parent.personId) return `Family branch to ${child.name}`
  return `${parent.name} parent branch to ${child.name}`
}

function memberDetail(node: TreeNode) {
  const parts = [
    node.age ?? 'Profile',
    `${node.activeConditions ?? 0} conditions`,
    `${node.hereditaryConditions ?? 0} hereditary`,
  ]

  if ((node.medicationCount ?? 0) > 0) parts.push(`${node.medicationCount} medications`)
  if ((node.allergyCount ?? 0) > 0) parts.push(`${node.allergyCount} allergies`)
  return parts.join(' | ')
}

export function FamilyTree({ data, memberCount, relationshipCount }: FamilyTreeProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
  const controlsRef = useRef({ zoom: 1, panX: 0, panY: 0 })
  const hoverRef = useRef<THREE.Object3D | null>(null)
  const [zoom, setZoom] = useState(1)
  const [tooltip, setTooltip] = useState<TooltipState>(emptyTooltip)

  const layout = useMemo(() => buildLayout(data), [data])

  const updateCamera = useCallback(() => {
    const camera = cameraRef.current
    const container = containerRef.current
    if (!camera || !container) return

    const aspect = container.clientWidth / container.clientHeight
    const viewHeight = 7.2 / controlsRef.current.zoom
    const viewWidth = viewHeight * aspect

    camera.left = -viewWidth / 2 + controlsRef.current.panX
    camera.right = viewWidth / 2 + controlsRef.current.panX
    camera.top = viewHeight / 2 + controlsRef.current.panY
    camera.bottom = -viewHeight / 2 + controlsRef.current.panY
    camera.updateProjectionMatrix()
  }, [])

  useEffect(() => {
    controlsRef.current.zoom = zoom
    updateCamera()
  }, [updateCamera, zoom])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const currentContainer = container

    const { nodes, links } = flattenLayout(layout)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f8fbf3')

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight)
    renderer.domElement.className = 'block h-full w-full'
    currentContainer.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 100)
    camera.position.set(0, 0, 10)
    cameraRef.current = camera
    updateCamera()

    scene.add(new THREE.AmbientLight('#ffffff', 1.8))
    const sun = new THREE.DirectionalLight('#fff7e6', 2.4)
    sun.position.set(-3, 4, 7)
    scene.add(sun)

    const interactives: THREE.Object3D[] = []
    const branchMaterial = new THREE.MeshStandardMaterial({
      color: '#8b6f47',
      roughness: 0.72,
      metalness: 0.03,
    })
    const branchHoverMaterial = new THREE.MeshStandardMaterial({
      color: '#b58952',
      roughness: 0.62,
      metalness: 0.03,
      emissive: '#3b250e',
      emissiveIntensity: 0.1,
    })

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.56, 4.5, 18),
      new THREE.MeshStandardMaterial({ color: '#8a7359', roughness: 0.9 })
    )
    trunk.position.set(0, -2.65, -0.2)
    trunk.rotation.z = -0.02
    scene.add(trunk)

    const crown = new THREE.Group()
    const crownMaterial = new THREE.MeshStandardMaterial({ color: '#b9eccd', roughness: 0.9, transparent: true, opacity: 0.42 })
    for (let i = 0; i < 36; i += 1) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10), crownMaterial.clone())
      const angle = (i / 36) * Math.PI * 2
      const radius = 2.3 + Math.sin(i * 1.7) * 0.55
      leaf.position.set(Math.cos(angle) * radius, 1.02 + Math.sin(angle) * 0.88, -0.82)
      leaf.scale.set(1.8, 0.42, 0.24)
      leaf.rotation.z = angle
      crown.add(leaf)
    }
    scene.add(crown)

    for (const { parent, child } of links) {
      const start = new THREE.Vector3(parent.x, parent.y - 0.35, 0)
      const end = new THREE.Vector3(child.x, child.y + 0.28, 0)
      const control = new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2 + 0.45, 0.08)
      const curve = new THREE.CatmullRomCurve3([start, control, end])
      const geometry = new THREE.TubeGeometry(curve, 32, Math.max(0.05, 0.12 - child.depth * 0.018), 12, false)
      const branch = new THREE.Mesh(geometry, branchMaterial.clone())
      branch.userData = {
        kind: 'branch',
        title: branchLabel(parent.node, child.node),
        detail: parent.node.personId ? 'Parent and child relationship' : 'Top-level family branch',
        baseMaterial: branch.material,
        hoverMaterial: branchHoverMaterial,
      }
      scene.add(branch)
      interactives.push(branch)
    }

    for (const visual of nodes) {
      if (!visual.node.personId) continue

      const group = new THREE.Group()
      group.position.set(visual.x, visual.y, 0.35)
      group.userData = {
        kind: 'member',
        personId: visual.node.personId,
        title: visual.node.name,
        detail: memberDetail(visual.node),
      }

      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.04, 0.62, 8),
        new THREE.MeshStandardMaterial({ color: '#7a8d57', roughness: 0.86 })
      )
      stem.position.set(0, -0.25, -0.02)
      stem.rotation.z = visual.x >= 0 ? -0.55 : 0.55
      group.add(stem)

      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), createLeafMaterial(visual.node))
      leaf.scale.set(1.5, 0.52, 0.24)
      leaf.rotation.z = visual.x >= 0 ? -0.28 : 0.28
      leaf.userData = group.userData
      group.add(leaf)
      interactives.push(leaf)

      const initialsTexture = createTextTexture(visual.node.initials ?? visual.node.name.slice(0, 2).toUpperCase(), visual.node.age)
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: initialsTexture, transparent: true, opacity: 0.96 }))
      label.scale.set(1.18, 0.44, 1)
      label.position.set(0, -0.72, 0.32)
      group.add(label)

      if ((visual.node.hereditaryConditions ?? 0) > 0 || (visual.node.activeConditions ?? 0) > 0) {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 16, 12),
          new THREE.MeshStandardMaterial({ color: '#e11d48', emissive: '#e11d48', emissiveIntensity: 0.35 })
        )
        marker.position.set(0.52, 0.16, 0.3)
        marker.userData = group.userData
        group.add(marker)
        interactives.push(marker)
      }

      scene.add(group)
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    let isDragging = false
    let lastX = 0
    let lastY = 0
    let animationFrame = 0

    function setPointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    }

    function clearBranchHover() {
      if (hoverRef.current?.userData.kind === 'branch') {
        hoverRef.current.traverse((object) => {
          const mesh = object as THREE.Mesh
          if (mesh.isMesh && mesh.userData.baseMaterial) {
            mesh.material = mesh.userData.baseMaterial
          }
        })
      }
    }

    function onPointerMove(event: PointerEvent) {
      if (isDragging) {
        const dx = event.clientX - lastX
        const dy = event.clientY - lastY
        lastX = event.clientX
        lastY = event.clientY
        controlsRef.current.panX -= dx / 120 / controlsRef.current.zoom
        controlsRef.current.panY += dy / 120 / controlsRef.current.zoom
        updateCamera()
        return
      }

      setPointer(event)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(interactives, true)[0]

      if (!hit) {
        clearBranchHover()
        hoverRef.current = null
        renderer.domElement.style.cursor = 'grab'
        setTooltip(emptyTooltip)
        return
      }

      const target = hit.object
      const data = target.userData.kind ? target.userData : target.parent?.userData
      if (!data?.kind) return

      clearBranchHover()
      hoverRef.current = target
      if (data.kind === 'branch' && target instanceof THREE.Mesh) {
        target.material = data.hoverMaterial
      }

      renderer.domElement.style.cursor = data.kind === 'member' ? 'pointer' : 'help'
      const rect = renderer.domElement.getBoundingClientRect()
      setTooltip({
        visible: true,
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        title: data.title,
        detail: data.detail,
        kind: data.kind,
      })
    }

    function onPointerDown(event: PointerEvent) {
      isDragging = true
      lastX = event.clientX
      lastY = event.clientY
      renderer.domElement.setPointerCapture(event.pointerId)
      renderer.domElement.style.cursor = 'grabbing'
    }

    function onPointerUp(event: PointerEvent) {
      isDragging = false
      renderer.domElement.releasePointerCapture(event.pointerId)
      renderer.domElement.style.cursor = hoverRef.current ? 'pointer' : 'grab'
    }

    function onClick(event: MouseEvent) {
      setPointer(event as PointerEvent)
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(interactives, true)[0]
      const data = hit?.object.userData.kind ? hit.object.userData : hit?.object.parent?.userData
      if (data?.kind === 'member' && data.personId) {
        router.push(`/members/${data.personId}`)
      }
    }

    function onWheel(event: WheelEvent) {
      event.preventDefault()
      const nextZoom = Math.min(1.45, Math.max(0.55, controlsRef.current.zoom + (event.deltaY > 0 ? -0.08 : 0.08)))
      controlsRef.current.zoom = nextZoom
      setZoom(nextZoom)
      updateCamera()
    }

    function onResize() {
      renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight)
      updateCamera()
    }

    function animate() {
      animationFrame = window.requestAnimationFrame(animate)
      const elapsed = performance.now() / 1000
      crown.rotation.z = Math.sin(elapsed * 0.35) * 0.012
      scene.traverse((object) => {
        if (object.type === 'Group' && object.userData.kind === 'member') {
          object.rotation.z = Math.sin(elapsed * 0.9 + object.position.x) * 0.018
        }
      })
      renderer.render(scene, camera)
    }

    renderer.domElement.style.cursor = 'grab'
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointerup', onPointerUp)
    renderer.domElement.addEventListener('click', onClick)
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('resize', onResize)
    animate()

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', onResize)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      renderer.domElement.removeEventListener('click', onClick)
      renderer.domElement.removeEventListener('wheel', onWheel)
      currentContainer.removeChild(renderer.domElement)
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh
        if (mesh.geometry) mesh.geometry.dispose()
        const material = mesh.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
        else material?.dispose()
      })
      renderer.dispose()
    }
  }, [layout, router, updateCamera])

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white/70 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 border-b border-border/70 bg-white/80 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-black">
            <Sparkles className="h-4 w-4 text-primary" />
            Three dimensional family tree
          </p>
          <p className="text-xs text-muted-foreground">
            {memberCount} leaves, {relationshipCount} branches. Hover leaves and branches for context.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border bg-white/70 px-3 py-2 text-xs font-bold text-muted-foreground md:flex">
            <Users className="h-3.5 w-3.5 text-primary" />
            Click a leaf to open health details
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.max(0.55, value - 0.12))} title="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                controlsRef.current.panX = 0
                controlsRef.current.panY = 0
                setZoom(1)
              }}
              title="Reset view"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setZoom((value) => Math.min(1.45, value + 0.12))} title="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div className="relative h-[72vh] min-h-[640px] w-full overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#ffffff,#f5fbf1_44%,#e6fbf4)]">
        <div className="pointer-events-none absolute left-5 top-5 z-10 grid gap-2 text-xs font-bold text-muted-foreground md:grid-cols-3">
          <span className="rounded-full border bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
            Branches show relationships
          </span>
          <span className="rounded-full border bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
            Leaves show members
          </span>
          <span className="rounded-full border bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur">
            Markers show health signals
          </span>
        </div>
        <div ref={containerRef} className="h-full w-full" />
        {tooltip.visible && (
          <div
            className={cn(
              'pointer-events-none absolute z-20 max-w-[280px] rounded-2xl border bg-white/92 px-4 py-3 text-sm shadow-2xl shadow-slate-900/15 backdrop-blur',
              tooltip.kind === 'member' ? 'border-primary/25' : 'border-amber-300/60'
            )}
            style={{
              left: Math.min(Math.max(tooltip.x + 16, 12), 820),
              top: Math.max(tooltip.y - 18, 12),
            }}
          >
            <div className="mb-1 flex items-center gap-2 font-black">
              {tooltip.kind === 'member' ? <Leaf className="h-4 w-4 text-accent-foreground" /> : <HeartPulse className="h-4 w-4 text-primary" />}
              {tooltip.title}
            </div>
            <p className="text-xs text-muted-foreground">{tooltip.detail}</p>
          </div>
        )}
      </div>
    </div>
  )
}
