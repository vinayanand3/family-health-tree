'use client'

import { useCallback, useState } from 'react'
import Tree from 'react-d3-tree'
import { TreeNode } from '@/types'
import { useRouter } from 'next/navigation'

interface FamilyTreeProps {
  data: TreeNode
}

function CustomNode({ nodeDatum, onNodeClick }: { nodeDatum: any; onNodeClick: (id: string) => void }) {
  return (
    <g>
      <circle
        r={28}
        fill="hsl(var(--primary))"
        fillOpacity={0.1}
        stroke="hsl(var(--primary))"
        strokeWidth={2}
        className="cursor-pointer"
        onClick={() => nodeDatum.personId && onNodeClick(nodeDatum.personId)}
      />
      <text
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        dy={4}
      >
        {nodeDatum.name?.split(' ')[0]}
      </text>
      {nodeDatum.name?.split(' ')[1] && (
        <text
          fill="hsl(var(--muted-foreground))"
          textAnchor="middle"
          fontSize={9}
          dy={18}
        >
          {nodeDatum.name?.split(' ').slice(1).join(' ')}
        </text>
      )}
    </g>
  )
}

export function FamilyTree({ data }: FamilyTreeProps) {
  const router = useRouter()
  const [translate, setTranslate] = useState({ x: 0, y: 0 })

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      setTranslate({ x: el.offsetWidth / 2, y: 80 })
    }
  }, [])

  const handleNodeClick = (personId: string) => {
    router.push(`/members/${personId}`)
  }

  return (
    <div ref={containerRef} className="w-full h-[600px] border rounded-lg bg-muted/20">
      <Tree
        data={data}
        translate={translate}
        orientation="vertical"
        pathFunc="step"
        renderCustomNodeElement={(props) => (
          <CustomNode nodeDatum={props.nodeDatum} onNodeClick={handleNodeClick} />
        )}
        separation={{ siblings: 1.5, nonSiblings: 2 }}
        nodeSize={{ x: 120, y: 100 }}
      />
    </div>
  )
}
