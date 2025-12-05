import { useRef, useState, type ReactNode } from 'react'

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
    findings.push({ level: 'info', message: `'${name}': ${type}` })
  }

  const checkAssignment = (lhs: string, rhs: string) => {
    const rhsType = inferType(rhs)
    const current = scope.get(lhs)
    if (!current) {
      findings.push({ level: 'warn', message: `'${lhs}' used before declaration` })
      if (rhsType) scope.set(lhs, rhsType)
      return
    }
    if (rhsType && current !== 'unknown' && rhsType !== current) {
      findings.push({ level: 'error', message: `Type mismatch: '${lhs}' is ${current}, got ${rhsType}` })
    }
    if (rhsType && current === 'unknown') {
      scope.set(lhs, rhsType)
      findings.push({ level: 'info', message: `'${lhs}' inferred as ${rhsType}` })
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
        findings.push({ level: 'warn', message: `Type annotation mismatch for '${name}'` })
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
        findings.push({ level: 'warn', message: `'${id}' used before declaration` })
      }
    })
  })

  return findings
}

function TokenTable({ tokens }: { tokens: Token[] }) {
  if (!tokens.length) return <p className="text-slate-600 text-sm">No tokens</p>
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
              <td className="px-3 py-2 text-slate-500 text-xs">{token.start}–{token.end}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SyntaxTree({ node }: { node: AstNode }) {
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

function SemanticList({ findings }: { findings: SemanticFinding[] }) {
  if (!findings.length) return <p className="text-slate-600 text-sm">No findings</p>
  return (
    <div className="space-y-2">
      {findings.map((finding, idx) => (
        <div
          key={idx}
          className={`rounded-lg border px-3 py-2 text-sm ${levelStyles[finding.level]}`}
        >
          <span className="text-xs uppercase tracking-wide opacity-75">{finding.level}</span>
          <p className="mt-0.5">{finding.message}</p>
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

  // Button states according to diagram specifications
  const hasFile = source.length > 0
  const canLex = hasFile && phase === 'idle'
  const canParse = phase === 'lexed'
  const canCheck = phase === 'parsed'
  const canClear = hasFile

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
  }

  const runLexical = () => {
    if (!canLex) return
    const result = lexSource(source)
    setTokens(result)
    setAst(null)
    setFindings([])
    setPhase('lexed')
  }

  const runSyntax = () => {
    if (!canParse) return
    const tree = buildAst(source)
    setAst(tree)
    setFindings([])
    setPhase('parsed')
  }

  const runSemantic = () => {
    if (!canCheck || !ast) return
    const issues = semanticCheck(ast)
    setFindings(issues)
    setPhase('checked')
  }

  const handleClear = () => {
    setFileName('')
    setSource('')
    setTokens([])
    setAst(null)
    setFindings([])
    setPhase('idle')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="h-screen bg-black overflow-hidden">
      <main className="h-full mx-auto max-w-7xl p-4 md:p-6">
        <div className="h-full flex flex-col lg:flex-row gap-4">
          {/* Controls - Left Side */}
          <div className="flex lg:flex-col gap-2 lg:gap-3 lg:w-48 shrink-0">
            <button
              onClick={handleFilePick}
              className="flex-1 lg:flex-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 hover:border-slate-600 transition-all duration-200"
            >
              Open File
            </button>
            <input ref={fileInputRef} type="file" accept=".txt,.js,.ts,.tsx,.json,.md" className="hidden" onChange={handleFileChange} />
            
            <button
              onClick={runLexical}
              disabled={!canLex}
              className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                canLex 
                  ? 'bg-sky-600 text-white hover:bg-sky-500 hover:scale-105 active:scale-95' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
              }`}
            >
              Lexical Analysis
            </button>
            
            <button
              onClick={runSyntax}
              disabled={!canParse}
              className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                canParse 
                  ? 'bg-purple-600 text-white hover:bg-purple-500 hover:scale-105 active:scale-95' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
              }`}
            >
              Syntax Analysis
            </button>
            
            <button
              onClick={runSemantic}
              disabled={!canCheck}
              className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                canCheck 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 active:scale-95' 
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
              }`}
            >
              Semantic Analysis
            </button>
            
            <button
              onClick={handleClear}
              disabled={!canClear}
              className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                canClear 
                  ? 'border border-slate-700 text-slate-300 hover:bg-slate-900 hover:border-slate-600 hover:text-white' 
                  : 'text-slate-700 cursor-not-allowed border border-slate-800'
              }`}
            >
              Clear
            </button>
          </div>

          {/* Main Content - Right Side */}
          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Code Text Area */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              <textarea
                value={source}
                readOnly
                placeholder="No file selected. Click 'Open File' to load source code."
                className="flex-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-3 md:p-4 text-xs md:text-sm text-slate-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-slate-700"
              />
              {fileName && (
                <div className="absolute top-2 right-6 text-md text-slate-500 bg-slate-950 px-2 py-1 rounded border-none">
                  {fileName}
                </div>
              )}
            </div>

            {/* Result Text Area */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="overflow-auto flex-1 rounded-lg border border-slate-800 bg-slate-950 p-3 md:p-4">
                {phase === 'idle' && (
                  <p className="text-slate-600 text-sm">No results yet. Load a file and run analysis.</p>
                )}
                {phase === 'lexed' && <TokenTable tokens={tokens} />}
                {phase === 'parsed' && ast && <SyntaxTree node={ast} />}
                {phase === 'checked' && <SemanticList findings={findings} />}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
