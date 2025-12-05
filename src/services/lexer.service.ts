import type { Token } from '../types/compiler.types'
import { JAVA_KEYWORDS, OPERATORS, PUNCTUATION, TOKEN_REGEX } from '../constants/compiler.constants'

export function lexSource(source: string): Token[] {
  const tokens: Token[] = []
  const processedPositions = new Set<number>()
  
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const rest = source.substring(i)
    
    if (/\s/.test(char)) {
      processedPositions.add(i)
      continue
    }
    
    if (rest.startsWith('//')) {
      const newlineIdx = source.indexOf('\n', i)
      const end = newlineIdx === -1 ? source.length : newlineIdx
      for (let j = i; j < end; j++) {
        processedPositions.add(j)
      }
      i = end - 1
      continue
    }
    
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
  
  for (const match of source.matchAll(TOKEN_REGEX)) {
    const lexeme = match[0]
    const start = match.index ?? 0
    const end = start + lexeme.length
    
    if (processedPositions.has(start)) {
      continue
    }
    
    for (let i = start; i < end; i++) {
      processedPositions.add(i)
    }
    
    let type: string = 'identifier'
    
    if (lexeme.startsWith('"') && lexeme.endsWith('"')) {
      type = 'string'
    }
    else if (lexeme.startsWith("'") && lexeme.endsWith("'")) {
      const content = lexeme.slice(1, -1)
      if (content.length === 1 || (content.length === 2 && content[0] === '\\')) {
        type = 'char'
      } else {
        const line = source.substring(0, start).split('\n').length
        const col = start - source.lastIndexOf('\n', start - 1)
        throw new Error(`Invalid char literal ${lexeme} at line ${line}, column ${col}. Char literals can only contain ONE character.`)
      }
    }
    else if (/^-?\d+\.\d+[fFdD]?$/.test(lexeme) || /^-?\d+[lLfFdD]?$/.test(lexeme)) {
      type = 'number'
    }
    else if (/^(true|false)$/.test(lexeme)) {
      type = 'boolean'
    }
    else if (JAVA_KEYWORDS.has(lexeme)) {
      type = 'keyword'
    }
    else if (OPERATORS.has(lexeme)) {
      type = 'operator'
    }
    else if (PUNCTUATION.has(lexeme)) {
      type = 'punctuation'
    }
    else if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(lexeme)) {
      type = 'identifier'
    }
    else {
      const line = source.substring(0, start).split('\n').length
      const col = start - source.lastIndexOf('\n', start - 1)
      throw new Error(`Invalid character '${lexeme}' at line ${line}, column ${col}`)
    }
    
    tokens.push({ type, lexeme, start, end })
  }
  
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    
    if (!processedPositions.has(i) && /\S/.test(char)) {
      const line = source.substring(0, i).split('\n').length
      const col = i - source.lastIndexOf('\n', i - 1)
      throw new Error(`Invalid character '${char}' at line ${line}, column ${col}`)
    }
  }
  
  return tokens
}
