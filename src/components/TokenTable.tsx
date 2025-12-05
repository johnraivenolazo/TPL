import type { Token } from '../types/compiler.types'

interface TokenTableProps {
  tokens: Token[]
}

export function TokenTable({ tokens }: TokenTableProps) {
  if (!tokens.length) {
    return <p className="text-slate-600 text-sm">No tokens</p>
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Value</th>
            <th className="px-3 py-2">Position</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {tokens.map((token, idx) => (
            <tr key={idx} className="hover:bg-slate-900">
              <td className="px-3 py-2 text-slate-300">{token.type}</td>
              <td className="px-3 py-2 text-sky-400">{token.lexeme}</td>
              <td className="px-3 py-2 text-slate-500 text-xs">
                {token.start}–{token.end}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
