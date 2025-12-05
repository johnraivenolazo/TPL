import type { PhaseResult } from '../types/compiler.types'

interface StatusIndicatorProps {
  results: PhaseResult[]
}

export function StatusIndicator({ results }: StatusIndicatorProps) {
  if (results.length === 0) return null

  return (
    <div className="space-y-2 mb-6">
      {results.map((result, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-black/40 border border-gray-800"
        >
          <span className="text-sm text-gray-400 capitalize min-w-[100px]">
            {result.phase} Phase:
          </span>
          <span
            className={`px-3 py-1 rounded text-xs font-bold ${
              result.status === 'pass'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                : 'bg-red-500/20 text-red-400 border border-red-500/50'
            }`}
          >
            {result.status.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500 flex-1">
            {result.message}
          </span>
        </div>
      ))}
    </div>
  )
}
