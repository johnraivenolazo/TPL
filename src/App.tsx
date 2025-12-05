// Clean rewrite of App with gated phases and file-driven flow
import { useMemo, useRef, useState, type ReactNode } from 'react'
import './App.css'

type Token = {
  type: string
  lexeme: string
  start: number
  end: number
}

type AstNode = {
  type: string
  label?: string
  children?: AstNode[]
}

type SemanticFinding = {
  level: 'info' | 'warn' | 'error'
  message: string
}

type Level = SemanticFinding['level']
type PhaseState = 'idle' | 'lexed' | 'parsed' | 'checked'

const levelStyles: Record<Level, string> = {
  info: 'bg-emerald-900/60 text-emerald-200 border-emerald-700',
  warn: 'bg-amber-900/60 text-amber-100 border-amber-700',
  error: 'bg-rose-900/60 text-rose-100 border-rose-700',
}

const demoSource = `let total: number = 3 + items;
let items = 2;
if (flag) { count = total + items; } else { count = false; }
function add(a: number, b: number) { return a + b; }`

const keywordSet = new Set(['let', 'const', 'var', 'function', 'if', 'else', 'return', 'true', 'false'])
const operatorSet = new Set(['=', '+', '-', '*', '/', '==', '!=', '<=', '>=', '=>'])
const punctSet = new Set(['{', '}', '(', ')', '[', ']', ';', ',', ':'])

function inferType(text: string): 'number' | 'boolean' | null {
  if (!text) return null
  if (/^(true|false)$/i.test(text.trim())) return 'boolean'
  if (/^-?\d+(?:\.\d+)?$/.test(text.trim())) return 'number'
  return null
}

function lexSource(source: string): Token[] {
  const tokens: Token[] = []
  const regex = /\b[A-Za-z_][A-Za-z0-9_]*\b|-?\d+(?:\.\d+)?|==|!=|<=|>=|=>|[{}()[\];,+\-*/=:]/g
  for (const match of source.matchAll(regex)) {
    const lexeme = match[0]
    const start = match.index ?? 0
    const end = start + lexeme.length
    let type: string = 'identifier'
    if (keywordSet.has(lexeme)) type = 'keyword'
    else if (/^(true|false)$/i.test(lexeme)) type = 'boolean'
    else if (/^-?\d/.test(lexeme)) type = 'number'
    else if (operatorSet.has(lexeme)) type = 'operator'
    else if (punctSet.has(lexeme)) type = 'punctuation'
    tokens.push({ type, lexeme, start, end })
  }
  return tokens
}

function buildAst(source: string): AstNode {
  const statements = source
    .split(/;/)
    .map((stmt) => stmt.trim())
    .filter(Boolean)

  const children: AstNode[] = statements.map((stmt, idx) => {
    const assignmentParts = stmt.split('=')
    if (assignmentParts.length > 1) {
      const left = assignmentParts[0].trim()
      const right = assignmentParts.slice(1).join('=').trim()
      const rightChildren: AstNode[] = right
        ? right.split(/([+\-*/])/).filter(Boolean).map((part) => ({ type: 'ExpressionPart', label: part.trim() }))
        : []
      return {
        type: 'Assignment',
        label: left || `assignment-${idx + 1}`,
        children: [{ type: 'Expression', label: right || 'expression', children: rightChildren }],
      }
    }
    return { type: 'Statement', label: stmt || `stmt-${idx + 1}` }
  })

  return { type: 'Program', children: children.length ? children : [{ type: 'Empty', label: 'No statements' }] }
}

function extractIdentifiers(text: string): string[] {
  return Array.from(text.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g))
    .map((m) => m[0])
    .filter((name) => !keywordSet.has(name))
}

function semanticCheck(ast: AstNode): SemanticFinding[] {
  const findings: SemanticFinding[] = []
  const scope = new Map<string, 'number' | 'boolean' | 'unknown'>()

  const registerVar = (name: string, type: 'number' | 'boolean' | 'unknown') => {
    scope.set(name, type)
    findings.push({ level: 'info', message: `Declared '${name}' as ${type === 'unknown' ? 'unknown' : type}.` })
  }

  const checkAssignment = (lhs: string, rhs: string) => {
    const rhsType = inferType(rhs)
    const current = scope.get(lhs)
    if (!current) {
      findings.push({ level: 'warn', message: `Assignment to '${lhs}' before declaration.` })
      if (rhsType) scope.set(lhs, rhsType)
      return
    }
    if (rhsType && current !== 'unknown' && rhsType !== current) {
      findings.push({ level: 'error', message: `Type mismatch on '${lhs}': ${current} vs ${rhsType}.` })
    }
    if (rhsType && current === 'unknown') {
      scope.set(lhs, rhsType)
      findings.push({ level: 'info', message: `Inferred '${lhs}' as ${rhsType} from assignment.` })
    }
  }

  ast.children?.forEach((node) => {
    const label = node.label ?? ''
    const decl = label.match(/\b(let|const|var)\s+([A-Za-z_][A-Za-z0-9_]*)/)
    const annotated = label.match(/:\s*(number|boolean)/)
    if (decl) {
      const name = decl[2]
      const rhs = label.split('=')[1]?.trim() ?? ''
      const rhsType = inferType(rhs)
      const chosen: 'number' | 'boolean' | 'unknown' = (annotated?.[1] as 'number' | 'boolean' | undefined) || rhsType || 'unknown'
      registerVar(name, chosen)
      if (annotated && rhsType && annotated[1] !== rhsType) {
        findings.push({ level: 'warn', message: `Annotation vs value mismatch for '${name}'.` })
      }
      if (rhs) checkAssignment(name, rhs)
      return
    }

    if (node.type === 'Assignment') {
      const lhs = (label.split(' ').pop() || '').trim()
      const rhs = node.children?.[0]?.label ?? ''
      if (lhs) checkAssignment(lhs, rhs)
      return
    }

    const ids = extractIdentifiers(label)
    ids.forEach((id) => {
      if (!scope.has(id)) {
        findings.push({ level: 'warn', message: `Usage of '${id}' before declaration.` })
      }
    })
  })

  if (!findings.length) {
    findings.push({ level: 'info', message: 'No semantic issues detected in this toy analysis.' })
  }

  return findings
}

function countAstNodes(node: AstNode | null): number {
  if (!node) return 0
  if (!node.children || node.children.length === 0) return 1
  return 1 + node.children.reduce((acc, child) => acc + countAstNodes(child), 0)
}

function TokenTable({ tokens }: { tokens: Token[] }) {
  if (!tokens.length) return <p className="text-slate-400">No tokens produced.</p>
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner">
      <table className="min-w-full text-left text-sm text-slate-200">
        <thead className="bg-slate-900/80 text-[11px] uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Lexeme</th>
            <th className="px-3 py-2">Span</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {tokens.map((token, idx) => (
            <tr key={`${token.lexeme}-${idx}`} className="hover:bg-slate-900/80">
              <td className="px-3 py-2 font-semibold text-slate-100">{token.type}</td>
              <td className="px-3 py-2 text-sky-200">{token.lexeme}</td>
              <td className="px-3 py-2 text-slate-400">[{token.start}, {token.end})</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SyntaxTree({ node }: { node: AstNode }) {
  const renderNode = (current: AstNode, path: string): ReactNode => (
    <li className="space-y-2" key={path}>
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-100">
        <span className="text-slate-300">{current.type}</span>
        {current.label && <span className="text-slate-400">· {current.label}</span>}
      </div>
      {current.children && current.children.length > 0 && (
        <ul className="space-y-2 border-l border-slate-800 pl-4">
          {current.children.map((child, idx) => renderNode(child, `${path}-${idx}`))}
        </ul>
      )}
    </li>
  )

  return <ul className="space-y-2">{renderNode(node, 'root')}</ul>
}

function SemanticList({ findings }: { findings: SemanticFinding[] }) {
  if (!findings.length) return <p className="text-slate-400">No semantic findings.</p>
  return (
    <div className="space-y-2">
      {findings.map((finding, idx) => (
        <div
          key={`${finding.level}-${idx}`}
          className={`flex items-start gap-3 rounded-xl border px-3 py-2 shadow-sm ${levelStyles[finding.level]}`}
        >
          <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-current opacity-80" aria-hidden />
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-300/80">{finding.level}</p>
            <p className="text-sm text-slate-50">{finding.message}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function App() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [source, setSource] = useState('')
  const [phase, setPhase] = useState<PhaseState>('idle')
  const [tokens, setTokens] = useState<Token[]>([])
  const [ast, setAst] = useState<AstNode | null>(null)
  const [findings, setFindings] = useState<SemanticFinding[]>([])
  const [message, setMessage] = useState<{ level: Level; text: string } | null>(null)

  const canLex = source.length > 0 && phase === 'idle'
  const canParse = phase === 'lexed'
  const canCheck = phase === 'parsed'
  const canClear = source.length > 0 || tokens.length > 0 || findings.length > 0 || ast !== null

  const progress = useMemo(() => {
    const steps: { label: string; active: boolean }[] = [
      { label: 'Lexical', active: phase === 'lexed' || phase === 'parsed' || phase === 'checked' },
      { label: 'Syntax', active: phase === 'parsed' || phase === 'checked' },
      { label: 'Semantic', active: phase === 'checked' },
    ]
    return steps
  }, [phase])

  const resultPhase = useMemo(() => {
    if (phase === 'checked') return 'Semantic Analysis'
    if (phase === 'parsed') return 'Syntax Analysis'
    if (phase === 'lexed') return 'Lexical Analysis'
    return 'Awaiting input'
  }, [phase])

  const handleFilePick = () => fileInputRef.current?.click()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setFileName(file.name)
    setSource(text)
    setPhase('idle')
    setTokens([])
    setAst(null)
    setFindings([])
    setMessage({ level: 'info', text: 'File loaded. Run lexical analysis to begin.' })
  }

  const runLexical = () => {
    if (!canLex) return
    const result = lexSource(source)
    setTokens(result)
    setAst(null)
    setFindings([])
    setPhase('lexed')
    setMessage({ level: 'info', text: `Lexical analysis produced ${result.length} token(s).` })
  }

  const runSyntax = () => {
    if (!canParse) return
    const tree = buildAst(source)
    setAst(tree)
    setFindings([])
    setPhase('parsed')
    setMessage({ level: 'info', text: 'Syntax analysis built a compact AST.' })
  }

  const runSemantic = () => {
    if (!canCheck || !ast) return
    const issues = semanticCheck(ast)
    setFindings(issues)
    setPhase('checked')
    setMessage({ level: 'info', text: 'Semantic analysis completed.' })
  }

  const handleClear = () => {
    setFileName('')
    setSource('')
    setTokens([])
    setAst(null)
    setFindings([])
    setPhase('idle')
    setMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="relative min-h-screen bg-surface">
      <div className="absolute inset-0 glass-sheen" aria-hidden />
      <main className="relative mx-auto max-w-6xl px-6 py-12 space-y-8 bg-grid">
        <header className="space-y-4 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 shadow-card backdrop-blur grid-overlay">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-300">Front-end only</span>
            <span className="rounded-full bg-emerald-900/50 px-3 py-1 text-xs text-emerald-200 border border-emerald-700">Lexical · Syntax · Semantic</span>
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300">No codegen • No opt</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-50 leading-snug md:text-4xl">Upload → tokenize → parse → semantic-check</h1>
            <p className="max-w-4xl text-sm text-slate-300">
              Gated pipeline for clarity. Load a file (or quick demo), then step through lexical, syntax, and semantic phases. Results and counts update live.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Phase</p>
                <p className="text-lg font-semibold text-slate-50">{resultPhase}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Tokens</p>
                <p className="text-lg font-semibold text-slate-50">{tokens.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-sm text-slate-200 shadow-inner">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">AST Nodes</p>
                <p className="text-lg font-semibold text-slate-50">{countAstNodes(ast)}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-card backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Controls</p>
                <h2 className="text-xl font-semibold text-slate-50">Phase runner</h2>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300">Gated flow</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleFilePick}
                className="w-full rounded-xl border border-sky-500 bg-sky-900/40 px-3 py-2 text-sm font-semibold text-sky-100 shadow-sm transition hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              >
                Open File
              </button>
              <input ref={fileInputRef} type="file" accept=".txt,.js,.ts,.tsx,.json,.md" className="hidden" onChange={handleFileChange} />
              <p className="text-xs text-slate-400">Loads code into the Code Text Area. Buttons stay disabled until a file is loaded.</p>
              <button
                onClick={() => {
                  setSource(demoSource)
                  setFileName('demo.txt')
                  setPhase('idle')
                  setTokens([])
                  setAst(null)
                  setFindings([])
                  setMessage({ level: 'info', text: 'Demo source loaded. Run lexical analysis to begin.' })
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
              >
                Load demo source
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={runLexical}
                disabled={!canLex}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-500/60 ${
                  canLex ? 'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500' : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600'
                }`}
              >
                Lexical Analysis
              </button>
              <p className="text-xs text-slate-400">Enables after a file is opened. Tokenizes source.</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={runSyntax}
                disabled={!canParse}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
                  canParse ? 'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500' : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600'
                }`}
              >
                Syntax Analysis
              </button>
              <p className="text-xs text-slate-400">Enables after lexical succeeds. Builds a compact AST.</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={runSemantic}
                disabled={!canCheck}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500/60 ${
                  canCheck ? 'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500' : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600'
                }`}
              >
                Semantic Analysis
              </button>
              <p className="text-xs text-slate-400">Enables after syntax succeeds. Checks scope/type consistency.</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleClear}
                disabled={!canClear}
                className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-rose-500/60 ${
                  canClear ? 'border-slate-700 bg-slate-900/80 text-slate-100 hover:border-slate-500' : 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-600'
                }`}
              >
                Clear
              </button>
              <p className="text-xs text-slate-400">Resets source and results.</p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-xs text-slate-300 shadow-inner">
              <p className="font-semibold text-slate-100 mb-2">Progress</p>
              <div className="flex flex-wrap gap-2">
                {progress.map((step, idx) => (
                  <span
                    key={step.label}
                    className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.12em] ${
                      step.active ? 'border-sky-500 bg-sky-900/50 text-sky-100' : 'border-slate-700 bg-slate-900/60 text-slate-400'
                    }`}
                  >
                    {idx + 1}. {step.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-xs text-slate-300 shadow-inner">
              <p className="font-semibold text-slate-100">Status</p>
              <p className="mt-1 text-slate-300">{message ? message.text : 'Awaiting file load.'}</p>
              {fileName && <p className="mt-1 text-slate-400">File: {fileName}</p>}
              <p className="mt-1 text-slate-400">Phase: {phase}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-card backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Code Text Area</p>
                  <h3 className="text-lg font-semibold text-slate-50">Source</h3>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300">Read-only preview</span>
              </div>
              <div className="mt-3 max-h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-100 shadow-inner">
                {source ? source : <span className="text-slate-500">Load a file to display its contents.</span>}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 shadow-card backdrop-blur">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Result Text Area</p>
                  <h3 className="text-lg font-semibold text-slate-50">{resultPhase}</h3>
                </div>
                <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-300">Latest run</span>
              </div>

              <div className="mt-3 space-y-4">
                {phase === 'lexed' && <TokenTable tokens={tokens} />}
                {phase === 'parsed' && ast && (
                  <div className="max-h-[420px] overflow-auto pr-2">
                    <SyntaxTree node={ast} />
                  </div>
                )}
                {phase === 'checked' && <SemanticList findings={findings} />}
                {phase === 'idle' && <p className="text-slate-500">Results will appear here after you run a phase.</p>}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
