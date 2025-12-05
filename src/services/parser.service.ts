import type { AstNode } from '../types/compiler.types'
import { JAVA_TYPES } from '../constants/compiler.constants'

// Simplified parser for Java variable declarations
// Expected format: type identifier = value;
export function buildAst(source: string): AstNode {
  // Remove comments
  const cleanSource = source.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  
  const statements = cleanSource
    .split(/;/)
    .map((stmt) => stmt.trim())
    .filter(Boolean)

  const children: AstNode[] = []
  
  for (let idx = 0; idx < statements.length; idx++) {
    const stmt = statements[idx]
    
    // Match pattern: type identifier = expression
    const match = stmt.match(/^(\w+)\s+(\w+)\s*=\s*(.+)$/)
    
    if (!match) {
      throw new Error(`Syntax error: Invalid statement '${stmt}'. Expected format: type identifier = value;`)
    }
    
    const [, type, identifier, expression] = match
    
    // Validate type is a known Java type
    if (!JAVA_TYPES.has(type)) {
      throw new Error(`Syntax error: '${type}' is not a valid Java type`)
    }
    
    // Validate identifier doesn't start with a number
    if (/^\d/.test(identifier)) {
      throw new Error(`Syntax error: Identifier '${identifier}' cannot start with a number`)
    }
    
    // Validate identifier contains only valid characters
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(identifier)) {
      throw new Error(`Syntax error: Identifier '${identifier}' contains invalid characters`)
    }
    
    children.push({
      type: 'VariableDeclaration',
      label: `${type} ${identifier}`,
      children: [
        { type: 'Type', label: type },
        { type: 'Identifier', label: identifier },
        { type: 'Expression', label: expression.trim() },
      ],
    })
  }

  return {
    type: 'Program',
    children: children.length ? children : [{ type: 'Empty', label: 'No statements' }],
  }
}
