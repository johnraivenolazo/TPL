import type { ReactNode } from 'react'
import type { AstNode } from '../types/compiler.types'

interface SyntaxTreeProps {
  node: AstNode
}

export function SyntaxTree({ node }: SyntaxTreeProps) {
  const renderNode = (current: AstNode, path: string): ReactNode => (
    <li className="space-y-1.5" key={path}>
      <div className="inline-flex gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-white">
        <span className="font-medium">{current.type}</span>
        {current.label && <span className="text-slate-400">{current.label}</span>}
      </div>
      {current.children && current.children.length > 0 && (
        <ul className="space-y-1.5 border-l-2 border-slate-800 pl-4 ml-2">
          {current.children.map((child, idx) => renderNode(child, `${path}-${idx}`))}
        </ul>
      )}
    </li>
  )

  return <ul className="space-y-1.5">{renderNode(node, 'root')}</ul>
}
