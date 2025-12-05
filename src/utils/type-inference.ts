export function inferType(text: string): 'number' | 'boolean' | null {
  if (!text) return null
  if (/^(true|false)$/i.test(text.trim())) return 'boolean'
  if (/^-?\d+(?:\.\d+)?$/.test(text.trim())) return 'number'
  return null
}

export function extractIdentifiers(text: string, keywords: Set<string>): string[] {
  return Array.from(text.matchAll(/\b[A-Za-z_][A-Za-z0-9_]*\b/g))
    .map((m) => m[0])
    .filter((name) => !keywords.has(name))
}
