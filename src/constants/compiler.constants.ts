// Java primitive types and keywords
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
  error: 'bg-rose-900/60 text-rose-100 border-rose-700',
} as const

// Comprehensive token regex that handles:
// - String literals: "..."
// - Char literals: '...'  
// - Floating point WITH suffix: 3.14f, 3.14d, 3.14F, 3.14D
// - Floating point NO suffix: 3.14
// - Integer WITH suffix: 123L, 123l, 123f, 123F, 123d, 123D  
// - Integer NO suffix: 123
// - Identifiers and keywords: variable names
// - Operators and punctuation
// CRITICAL: Patterns with suffixes MUST come before patterns without suffixes
export const TOKEN_REGEX = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|-?\d+\.\d+[fFdD]|-?\d+\.\d+|-?\d+[lLfFdD]|-?\d+|[A-Za-z_][A-Za-z0-9_]*|[=;,+\-*/(){}\[\]<>!&|]/g
