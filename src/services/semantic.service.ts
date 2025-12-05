import type { AstNode, SemanticFinding } from '../types/compiler.types'
import { JAVA_TYPES } from '../constants/compiler.constants'

export function semanticCheck(ast: AstNode): SemanticFinding[] {
  const findings: SemanticFinding[] = []
  const scope = new Map<string, string>() // variable name -> type

  ast.children?.forEach((node) => {
    if (node.type === 'VariableDeclaration') {
      const typeNode = node.children?.find((child) => child.type === 'Type')
      const identifierNode = node.children?.find((child) => child.type === 'Identifier')
      const expressionNode = node.children?.find((child) => child.type === 'Expression')

      const declaredType = typeNode?.label
      const varName = identifierNode?.label
      const expression = expressionNode?.label

      if (!declaredType || !varName) return

      // Check if type is valid Java type
      if (!JAVA_TYPES.has(declaredType)) {
        findings.push({
          level: 'error',
          message: `'${declaredType}' is not a valid Java type`,
        })
        return
      }

      // Check for duplicate declaration
      if (scope.has(varName)) {
        findings.push({
          level: 'error',
          message: `Variable '${varName}' is already declared`,
        })
        return
      }

      // Register variable
      scope.set(varName, declaredType)
      findings.push({
        level: 'info',
        message: `Variable '${varName}' declared as ${declaredType}`,
      })

      // Type checking for assignment
      if (expression) {
        const valueType = inferJavaType(expression)
        
        if (valueType && !isTypeCompatible(declaredType, valueType)) {
          findings.push({
            level: 'error',
            message: `Type mismatch: cannot assign ${valueType} to ${declaredType}`,
          })
        }
      }
    }
  })

  if (findings.length === 0) {
    findings.push({
      level: 'info',
      message: 'No semantic errors found',
    })
  }

  return findings
}

function inferJavaType(expression: string): string | null {
  expression = expression.trim()
  
  // Boolean literals
  if (expression === 'true' || expression === 'false') return 'boolean'
  
  // String literals
  if (/^"(?:[^"\\]|\\.)*"$/.test(expression)) return 'String'
  
  // Character literals
  if (/^'(?:[^'\\]|\\.)'$/.test(expression)) return 'char'
  
  // Floating point with f/F suffix (e.g., 3.14f, 123f)
  if (/^-?\d+(?:\.\d+)?[fF]$/.test(expression)) return 'float'
  
  // Floating point with d/D suffix or decimal point (e.g., 3.14, 3.14d)
  if (/^-?\d+\.\d+[dD]?$/.test(expression)) return 'double'
  
  // Long suffix (e.g., 1000000L)
  if (/^-?\d+[lL]$/.test(expression)) return 'long'
  
  // Integer literals with bounds checking
  if (/^-?\d+$/.test(expression)) {
    const num = parseInt(expression, 10)
    if (num >= -128 && num <= 127) return 'byte'
    if (num >= -32768 && num <= 32767) return 'short'
    if (num >= -2147483648 && num <= 2147483647) return 'int'
    return 'long' // Out of int range, must be long
  }
  
  return null
}

function isTypeCompatible(declared: string, value: string): boolean {
  if (declared === value) return true
  
  // Widening conversions (byte -> short -> int -> long -> float -> double)
  const numericHierarchy = ['byte', 'short', 'int', 'long', 'float', 'double']
  const declaredIdx = numericHierarchy.indexOf(declared)
  const valueIdx = numericHierarchy.indexOf(value)
  
  if (declaredIdx !== -1 && valueIdx !== -1) {
    return declaredIdx >= valueIdx // Can widen to larger type
  }
  
  // char can be assigned to int, long, float, double (widening)
  if (value === 'char') {
    return ['int', 'long', 'float', 'double'].includes(declared)
  }
  
  return false
}