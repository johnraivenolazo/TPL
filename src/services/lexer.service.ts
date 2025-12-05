import type { Token } from '../types/compiler.types'
import { JAVA_KEYWORDS, OPERATORS, PUNCTUATION, TOKEN_REGEX } from '../constants/compiler.constants'

export function lexSource(source: string): Token[] {
  const tokens: Token[] = []
  const processedPositions = new Set<number>()
  
  // First pass: Mark comments and whitespace as processed
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const rest = source.substring(i)
    
    // Mark whitespace
    if (/\s/.test(char)) {
      processedPositions.add(i)
      continue
    }
    
    // Skip single-line comments
    if (rest.startsWith('//')) {
      const newlineIdx = source.indexOf('\n', i)
      const end = newlineIdx === -1 ? source.length : newlineIdx
      for (let j = i; j < end; j++) {
        processedPositions.add(j)
      }
      i = end - 1
      continue
    }
    
    // Skip multi-line comments
    if (rest.startsWith('/*')) {
      const endIdx = source.indexOf('*/', i + 2)
      if (endIdx !== -1) {
        for (let j = i; j <= endIdx + 1; j++) {
          processedPositions.add(j)
        }
        i = endIdx + 1
        continue
      }
    }
  }
  
  // Process tokens with improved regex
  for (const match of source.matchAll(TOKEN_REGEX)) {
    const lexeme = match[0]
    const start = match.index ?? 0
    const end = start + lexeme.length
    
    // Skip tokens that are within already processed positions (comments/whitespace)
    if (processedPositions.has(start)) {
      continue
    }
    
    // Mark positions as processed
    for (let i = start; i < end; i++) {
      processedPositions.add(i)
    }
    
    let type: string = 'identifier'
    
    // String literal
    if (lexeme.startsWith('"') && lexeme.endsWith('"')) {
      type = 'string'
    }
    // Character literal - MUST be exactly ONE character (or escape sequence)
    else if (lexeme.startsWith("'") && lexeme.endsWith("'")) {
      const content = lexeme.slice(1, -1)
      // Valid: 'a' (1 char) or '\n' (escape sequence)
      if (content.length === 1 || (content.length === 2 && content[0] === '\\')) {
        type = 'char'
      } else {
        // Invalid: 'abc' or 'hello'
        const line = source.substring(0, start).split('\n').length
        const col = start - source.lastIndexOf('\n', start - 1)
        throw new Error(`Invalid char literal ${lexeme} at line ${line}, column ${col}. Char literals can only contain ONE character.`)
      }
    }
    // Numbers (with optional suffixes: f, F, l, L, d, D)
    else if (/^-?\d+\.\d+[fFdD]?$/.test(lexeme) || /^-?\d+[lLfFdD]?$/.test(lexeme)) {
      type = 'number'
    }
    // Boolean literals
    else if (/^(true|false)$/.test(lexeme)) {
      type = 'boolean'
    }
    // Keywords
    else if (JAVA_KEYWORDS.has(lexeme)) {
      type = 'keyword'
    }
    // Operators
    else if (OPERATORS.has(lexeme)) {
      type = 'operator'
    }
    // Punctuation
    else if (PUNCTUATION.has(lexeme)) {
      type = 'punctuation'
    }
    // Identifier - valid variable names (already matched by regex)
    else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(lexeme)) {
      type = 'identifier'
    }
    // Unknown token - invalid character
    else {
      const line = source.substring(0, start).split('\n').length
      const col = start - source.lastIndexOf('\n', start - 1)
      throw new Error(`Invalid character '${lexeme}' at line ${line}, column ${col}`)
    }
    
    tokens.push({ type, lexeme, start, end })
  }
  
  // Final pass: Check for any unprocessed non-whitespace characters
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    
    // Check for invalid characters (must be unprocessed and non-whitespace)
    if (!processedPositions.has(i) && /\S/.test(char)) {
      const line = source.substring(0, i).split('\n').length
      const col = i - source.lastIndexOf('\n', i - 1)
      throw new Error(`Invalid character '${char}' at line ${line}, column ${col}`)
    }
  }
  
  return tokens
}
