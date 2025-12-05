import type { SemanticFinding } from '../types/compiler.types'
import { LEVEL_STYLES } from '../constants/compiler.constants'

interface SemanticListProps {
  findings: SemanticFinding[]
}

export function SemanticList({ findings }: SemanticListProps) {
  if (!findings.length) {
    return <p className="text-slate-600 text-sm">No findings</p>
  }

  return (
    <div className="space-y-2">
      {findings.map((finding, idx) => (
        <div
          key={idx}
          className={`rounded-lg border px-3 py-2 text-sm ${LEVEL_STYLES[finding.level]}`}
        >
          <span className="text-xs uppercase tracking-wide opacity-75">
            {finding.level}
          </span>
          <p className="mt-0.5">{finding.message}</p>
        </div>
      ))}
    </div>
  )
}
