import { Token } from '@/types/token'

// Regex per identificare alias nella sintassi {token.path} o {token-path}
const ALIAS_REGEX = /\{([^}]+)\}/g

export interface TokenAlias {
  original: string
  reference: string
  resolved?: string
  isValid: boolean
}

/**
 * Rileva se un valore contiene alias
 */
export function hasAlias(value: string): boolean {
  return ALIAS_REGEX.test(value)
}

/**
 * Estrae tutti gli alias da un valore
 */
export function extractAliases(value: string): TokenAlias[] {
  const aliases: TokenAlias[] = []
  let match: RegExpExecArray | null

  // Reset regex for multiple matches
  ALIAS_REGEX.lastIndex = 0
  
  while ((match = ALIAS_REGEX.exec(value)) !== null) {
    aliases.push({
      original: match[0], // {token.path}
      reference: match[1], // token.path
      isValid: false // Will be resolved later
    })
  }
  
  return aliases
}

/**
 * Risolve gli alias usando la mappa dei token disponibili
 */
export function resolveAliases(value: string, tokens: Token[]): {
  resolved: string
  aliases: TokenAlias[]
  hasUnresolved: boolean
} {
  const aliases = extractAliases(value)
  const tokenMap = createTokenMap(tokens)
  let resolved = value
  let hasUnresolved = false

  aliases.forEach(alias => {
    const referencedToken = findTokenByPath(alias.reference, tokenMap)
    
    if (referencedToken) {
      alias.resolved = referencedToken.value
      alias.isValid = true
      
      // Replace in resolved value
      resolved = resolved.replace(alias.original, referencedToken.value)
    } else {
      alias.isValid = false
      hasUnresolved = true
      
      // Try alternative path formats
      const alternativeToken = findTokenByAlternativePaths(alias.reference, tokenMap)
      if (alternativeToken) {
        alias.resolved = alternativeToken.value
        alias.isValid = true
        resolved = resolved.replace(alias.original, alternativeToken.value)
        hasUnresolved = false
      }
    }
  })

  return {
    resolved,
    aliases,
    hasUnresolved
  }
}

/**
 * Crea una mappa dei token per accesso rapido
 */
function createTokenMap(tokens: Token[]): Map<string, Token> {
  const map = new Map<string, Token>()
  
  tokens.forEach(token => {
    // Add by path
    map.set(token.path, token)
    
    // Add alternative formats
    map.set(token.path.replace(/\./g, '-'), token) // dot to dash
    map.set(token.path.replace(/\./g, '_'), token) // dot to underscore
    map.set(token.name, token) // by name only
    
    // Add collection.name format
    map.set(`${token.collection}.${token.name}`, token)
  })
  
  return map
}

/**
 * Trova un token per path
 */
function findTokenByPath(path: string, tokenMap: Map<string, Token>): Token | undefined {
  return tokenMap.get(path)
}

/**
 * Trova un token provando percorsi alternativi
 */
function findTokenByAlternativePaths(reference: string, tokenMap: Map<string, Token>): Token | undefined {
  // Try common variations
  const variations = [
    reference,
    reference.replace(/-/g, '.'),
    reference.replace(/_/g, '.'),
    reference.replace(/\./g, '-'),
    reference.replace(/\./g, '_')
  ]
  
  for (const variation of variations) {
    const token = tokenMap.get(variation)
    if (token) return token
  }
  
  return undefined
}

/**
 * Valida tutti gli alias in un set di token
 */
export function validateTokenAliases(tokens: Token[]): {
  token: Token
  aliases: TokenAlias[]
  hasUnresolved: boolean
}[] {
  const results: {
    token: Token
    aliases: TokenAlias[]
    hasUnresolved: boolean
  }[] = []
  
  tokens.forEach(token => {
    if (hasAlias(token.value)) {
      const { aliases, hasUnresolved } = resolveAliases(token.value, tokens)
      results.push({
        token,
        aliases,
        hasUnresolved
      })
    }
  })
  
  return results
}

/**
 * Ottieni il valore finale risolto di un token
 */
export function getResolvedTokenValue(token: Token, allTokens: Token[], maxDepth = 10): {
  value: string
  isCircular: boolean
  resolvedAliases: TokenAlias[]
} {
  const seen = new Set<string>()
  let currentValue = token.value
  const resolvedAliases: TokenAlias[] = []
  let depth = 0
  
  while (hasAlias(currentValue) && depth < maxDepth) {
    if (seen.has(currentValue)) {
      return { 
        value: currentValue, 
        isCircular: true, 
        resolvedAliases 
      }
    }
    
    seen.add(currentValue)
    const { resolved, aliases } = resolveAliases(currentValue, allTokens)
    resolvedAliases.push(...aliases)
    currentValue = resolved
    depth++
  }
  
  return {
    value: currentValue,
    isCircular: false,
    resolvedAliases
  }
}

/**
 * Trova le dipendenze di un token (quali token referenzia)
 */
export function getTokenDependencies(token: Token, allTokens: Token[]): Token[] {
  const dependencies: Token[] = []
  const aliases = extractAliases(token.value)
  const tokenMap = createTokenMap(allTokens)
  
  aliases.forEach(alias => {
    const referencedToken = findTokenByPath(alias.reference, tokenMap) ||
                           findTokenByAlternativePaths(alias.reference, tokenMap)
    
    if (referencedToken && referencedToken.path !== token.path) {
      dependencies.push(referencedToken)
    }
  })
  
  return dependencies
}

/**
 * Trova i token che dipendono da un token specifico (reverse dependencies)
 */
export function getTokenDependents(token: Token, allTokens: Token[]): Token[] {
  const dependents: Token[] = []
  
  allTokens.forEach(candidateToken => {
    if (candidateToken.path === token.path) return
    
    const dependencies = getTokenDependencies(candidateToken, allTokens)
    if (dependencies.some(dep => dep.path === token.path)) {
      dependents.push(candidateToken)
    }
  })
  
  return dependents
}