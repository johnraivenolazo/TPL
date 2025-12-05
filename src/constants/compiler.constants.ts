export const JAVA_TYPES = new Set([
  'int',
  'double',
  'float',
  'boolean',
  'char',
  'byte',
  'short',
  'long',
  'String',
])

export const JAVA_KEYWORDS = new Set([
  'int',
  'double',
  'float',
  'boolean',
  'char',
  'byte',
  'short',
  'long',
  'String',
  'true',
  'false',
])

export const OPERATORS = new Set([
  '=',
])

export const PUNCTUATION = new Set([
  ';',
  ',',
])

export const LEVEL_STYLES = {
  info: 'bg-emerald-900/60 text-emerald-200 border-emerald-700',
  warn: 'bg-amber-900/60 text-amber-100 border-amber-700',
  'error': 'bg-rose-900/60 text-rose-100 border-rose-700',
} as const

export const TOKEN_REGEX = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\d+\.\d+[fFdD]|-?\d+\.\d+|-?\d+[lLfFdD]|-?\d+|[A-Za-z_][A-Za-z0-9_]*|[=;,+\-*/(){}\[\]<>!&|]/g
