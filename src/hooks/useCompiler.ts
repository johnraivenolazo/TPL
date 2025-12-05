import { useState, useRef } from 'react'
import type { AstNode, PhaseState, Token, SemanticFinding, PhaseResult } from '../types/compiler.types'
import { lexSource } from '../services/lexer.service'
import { buildAst } from '../services/parser.service'
import { semanticCheck } from '../services/semantic.service'

export function useCompiler() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [fileName, setFileName] = useState('')
  const [source, setSource] = useState('')
  const [phase, setPhase] = useState<PhaseState>('idle')
  const [tokens, setTokens] = useState<Token[]>([])
  const [ast, setAst] = useState<AstNode | null>(null)
  const [findings, setFindings] = useState<SemanticFinding[]>([])
  const [phaseResults, setPhaseResults] = useState<PhaseResult[]>([])

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
    setPhaseResults([])
  }

  const runLexical = () => {
    if (!canLex) return
    try {
      const result = lexSource(source)
      setTokens(result)
      setAst(null)
      setFindings([])
      setPhase('lexed')
      setPhaseResults([{
        phase: 'lexical',
        status: 'pass',
        message: `Lexical Analysis: PASS - ${result.length} tokens generated`
      }])
    } catch (error) {
      setPhaseResults([{
        phase: 'lexical',
        status: 'error',
        message: `Lexical Analysis: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    }
  }

  const runSyntax = () => {
    if (!canParse) return
    try {
      const tree = buildAst(source)
      setAst(tree)
      setFindings([])
      setPhase('parsed')
      setPhaseResults(prev => [...prev, {
        phase: 'syntax',
        status: 'pass',
        message: 'Syntax Analysis: PASS - AST generated successfully'
      }])
    } catch (error) {
      setPhaseResults(prev => [...prev, {
        phase: 'syntax',
        status: 'error',
        message: `Syntax Analysis: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    }
  }

  const runSemantic = () => {
    if (!canCheck || !ast) return
    try {
      const issues = semanticCheck(ast)
      setFindings(issues)
      setPhase('checked')
      
      const hasErrors = issues.some(f => f.level === 'error')
      setPhaseResults(prev => [...prev, {
        phase: 'semantic',
        status: hasErrors ? 'error' : 'pass',
        message: hasErrors 
          ? 'Semantic Analysis: ERROR - Type errors found'
          : 'Semantic Analysis: PASS - No errors found'
      }])
    } catch (error) {
      setPhaseResults(prev => [...prev, {
        phase: 'semantic',
        status: 'error',
        message: `Semantic Analysis: ERROR - ${error instanceof Error ? error.message : 'Unknown error'}`
      }])
    }
  }

  const handleClear = () => {
    setFileName('')
    setSource('')
    setTokens([])
    setAst(null)
    setFindings([])
    setPhase('idle')
    setPhaseResults([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return {
    fileInputRef,
    fileName,
    source,
    phase,
    tokens,
    ast,
    findings,
    phaseResults,
    canLex,
    canParse,
    canCheck,
    canClear,
    handleFilePick,
    handleFileChange,
    runLexical,
    runSyntax,
    runSemantic,
    handleClear,
  }
}
