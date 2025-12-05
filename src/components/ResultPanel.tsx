import type { AstNode, PhaseState, Token, SemanticFinding } from '../types/compiler.types'
import { TokenTable } from './TokenTable'
import { SyntaxTree } from './SyntaxTree'
import { SemanticList } from './SemanticList'

interface ResultPanelProps {
  phase: PhaseState
  tokens: Token[]
  ast: AstNode | null
  findings: SemanticFinding[]
}

export function ResultPanel({ phase, tokens, ast, findings }: ResultPanelProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="overflow-auto flex-1 rounded-lg border border-slate-800 bg-slate-950 p-3 md:p-4">
        {phase === 'idle' && (
          <p className="text-slate-600 text-sm">
            No results yet. Load a file and run analysis.
          </p>
        )}
        {phase === 'lexed' && <TokenTable tokens={tokens} />}
        {phase === 'parsed' && ast && <SyntaxTree node={ast} />}
        {phase === 'checked' && <SemanticList findings={findings} />}
      </div>
    </div>
  )
}
