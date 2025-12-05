export type Token = {
  type: string
  lexeme: string
  start: number
  end: number
}

export type AstNode = {
  type: string
  label?: string
  children?: AstNode[]
}

export type SemanticFinding = {
  level: 'info' | 'warn' | 'error'
  message: string
}

export type PhaseState = 'idle' | 'lexed' | 'parsed' | 'checked'

export type PhaseResult = {
  phase: 'lexical' | 'syntax' | 'semantic'
  status: 'pass' | 'error'
  message: string
}
