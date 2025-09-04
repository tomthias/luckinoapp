import { Token } from '@/types/token'

/**
 * W3C Design Tokens Export Builder
 * Creates perfectly plugin-compatible JSON following W3C Design Tokens specification
 * Optimized for Figma Luckino Plugin import system
 */

export interface W3CToken {
  $value: any
  $type: W3CTokenType
  $description?: string
}

export interface W3CCollection {
  [key: string]: W3CToken | W3CCollection
}

export interface W3CExportResult {
  [collectionName: string]: W3CCollection
}

export type W3CTokenType = 
  | 'color'
  | 'dimension' 
  | 'fontFamily'
  | 'fontWeight'
  | 'duration'
  | 'cubicBezier'
  | 'number'
  | 'string'
  | 'border'
  | 'shadow'
  | 'transition'
  | 'gradient'
  | 'typography'

/**
 * Type mapping based on plugin analysis
 */
const TOKEN_TYPE_MAPPING: Record<string, W3CTokenType> = {
  // Color tokens
  'COLOR': 'color',
  'color': 'color',
  
  // Dimension tokens  
  'DIMENSION': 'dimension',
  'dimension': 'dimension',
  'SPACING': 'dimension',
  'spacing': 'dimension',
  'BORDER_RADIUS': 'dimension',
  'borderRadius': 'dimension',
  'WIDTH': 'dimension',
  'HEIGHT': 'dimension',
  'size': 'dimension',
  
  // Typography tokens
  'FONT_FAMILY': 'fontFamily',
  'fontFamily': 'fontFamily',
  'FONT_WEIGHT': 'fontWeight', 
  'fontWeight': 'fontWeight',
  'TYPOGRAPHY': 'typography',
  'typography': 'typography',
  
  // Time-based tokens
  'DURATION': 'duration',
  'duration': 'duration',
  'CUBIC_BEZIER': 'cubicBezier',
  'cubicBezier': 'cubicBezier',
  'TRANSITION': 'transition',
  'transition': 'transition',
  
  // Numeric tokens
  'NUMBER': 'number',
  'number': 'number',
  'OPACITY': 'number',
  'opacity': 'number',
  'FLOAT': 'number',
  'float': 'number',
  
  // Complex tokens
  'BORDER': 'border',
  'border': 'border',
  'SHADOW': 'shadow',
  'shadow': 'shadow',
  'GRADIENT': 'gradient',
  'gradient': 'gradient',
  
  // Fallback
  'STRING': 'string',
  'string': 'string'
}

export class W3CExportBuilder {
  
  /**
   * Build W3C-compliant JSON from tokens
   * Perfectly compatible with Figma Plugin import system
   */
  buildW3CCompliantJSON(tokens: Token[], options?: {
    enableMultiMode?: boolean
    defaultMode?: string
    extractModes?: boolean
  }): W3CExportResult {
    console.log('[W3C Export] Building compliant JSON from', tokens.length, 'tokens')
    
    const opts = {
      enableMultiMode: true,
      defaultMode: 'Default',
      extractModes: true,
      ...options
    }
    
    const result: W3CExportResult = {}
    
    // Group tokens by collection
    const collectionGroups = this.groupTokensByCollection(tokens)
    
    // Detect available modes if enabled
    const detectedModes = opts.extractModes ? this.extractModesFromTokens(tokens) : new Set([opts.defaultMode])
    
    console.log('[W3C Export] Detected modes:', Array.from(detectedModes))
    
    // Process each collection
    for (const [collectionName, collectionTokens] of collectionGroups) {
      result[collectionName] = this.buildCollection(collectionTokens, detectedModes, opts)
    }
    
    console.log('[W3C Export] Built', Object.keys(result).length, 'collections')
    return result
  }
  
  /**
   * Group tokens by collection
   */
  private groupTokensByCollection(tokens: Token[]): Map<string, Token[]> {
    const collections = new Map<string, Token[]>()
    
    tokens.forEach(token => {
      const collectionName = token.collection || 'Design Tokens'
      
      if (!collections.has(collectionName)) {
        collections.set(collectionName, [])
      }
      
      collections.get(collectionName)!.push(token)
    })
    
    return collections
  }
  
  /**
   * Extract modes from tokens based on path patterns and values
   */
  private extractModesFromTokens(tokens: Token[]): Set<string> {
    const modes = new Set<string>()
    
    tokens.forEach(token => {
      // Check for mode indicators in path
      const pathModeMatch = token.path.match(/\.(light|dark|mobile|desktop|theme-\w+)\./i)
      if (pathModeMatch) {
        modes.add(pathModeMatch[1].toLowerCase())
      }
      
      // Check for multi-mode values (objects with theme keys)
      if (typeof token.value === 'object' && token.value !== null) {
        const keys = Object.keys(token.value)
        const themeKeys = keys.filter(key => 
          /^(light|dark|mobile|desktop|theme-\w+|default|base)$/i.test(key)
        )
        themeKeys.forEach(key => modes.add(key.toLowerCase()))
      }
      
      // Check for alias references to modes
      if (typeof token.value === 'string' && this.isAliasReference(token.value)) {
        const aliasMatch = token.value.match(/\{[^}]*\.(light|dark|mobile|desktop|theme-\w+)\.[^}]*\}/i)
        if (aliasMatch) {
          modes.add(aliasMatch[1].toLowerCase())
        }
      }
    })
    
    // Add default if no modes detected
    if (modes.size === 0) {
      modes.add('default')
    }
    
    return modes
  }

  /**
   * Build a collection structure recursively
   */
  private buildCollection(tokens: Token[], detectedModes: Set<string>, options: any): W3CCollection {
    const collection: W3CCollection = {}
    
    // Create hierarchical structure based on token paths
    tokens.forEach(token => {
      this.insertTokenIntoStructure(collection, token, detectedModes, options)
    })
    
    return collection
  }
  
  /**
   * Insert token into hierarchical structure
   * Follows the plugin's expected path format
   */
  private insertTokenIntoStructure(collection: W3CCollection, token: Token, detectedModes: Set<string>, options: any): void {
    // Parse token path into segments
    const pathSegments = this.parseTokenPath(token.path)
    
    // Navigate/create structure
    let current: any = collection
    
    // Navigate through path segments (except last one)
    for (let i = 0; i < pathSegments.length - 1; i++) {
      const segment = pathSegments[i]
      
      if (!current[segment]) {
        current[segment] = {}
      }
      
      current = current[segment]
    }
    
    // Insert the actual token at the final segment
    const tokenName = pathSegments[pathSegments.length - 1]
    current[tokenName] = this.buildW3CToken(token, detectedModes, options)
  }
  
  /**
   * Parse token path into segments
   * Handles both dot notation and slash notation
   */
  private parseTokenPath(path: string): string[] {
    // Remove collection prefix if present
    let cleanPath = path
    if (path.includes('/')) {
      const parts = path.split('/')
      cleanPath = parts.slice(1).join('/')
    }
    
    // Split by dots or remaining slashes
    return cleanPath.split(/[./]/).filter(segment => segment.length > 0)
  }
  
  /**
   * Build W3C token structure with multi-mode support
   */
  private buildW3CToken(token: Token, detectedModes: Set<string>, options: any): W3CToken {
    const w3cType = this.mapToW3CType(token.type)
    const processedValue = this.processTokenValue(token.value, w3cType, detectedModes, options)
    
    const w3cToken: W3CToken = {
      $value: processedValue,
      $type: w3cType
    }
    
    // Add description if available
    if (token.description) {
      w3cToken.$description = token.description
    }
    
    return w3cToken
  }
  
  /**
   * Map internal token type to W3C type
   */
  private mapToW3CType(tokenType: string): W3CTokenType {
    const mapped = TOKEN_TYPE_MAPPING[tokenType.toUpperCase()]
    if (!mapped) {
      console.warn(`[W3C Export] Unknown token type: ${tokenType}, falling back to 'string'`)
      return 'string'
    }
    return mapped
  }
  
  /**
   * Process token value according to W3C specification and plugin expectations
   */
  private processTokenValue(value: any, type: W3CTokenType, detectedModes: Set<string>, options: any): any {
    // Handle alias references - preserve them as-is for plugin processing
    if (typeof value === 'string' && this.isAliasReference(value)) {
      return value
    }
    
    // Handle multi-mode values (plugin format)
    if (options.enableMultiMode && this.isMultiModeValue(value)) {
      return this.processMultiModeValue(value, type, detectedModes)
    }
    
    switch (type) {
      case 'color':
        return this.processColorValue(value)
        
      case 'dimension':
        return this.processDimensionValue(value)
        
      case 'fontFamily':
        return this.processFontFamilyValue(value)
        
      case 'fontWeight':
        return this.processFontWeightValue(value)
        
      case 'duration':
        return this.processDurationValue(value)
        
      case 'number':
        return this.processNumberValue(value)
        
      case 'cubicBezier':
        return this.processCubicBezierValue(value)
        
      default:
        return value
    }
  }
  
  /**
   * Check if value is an alias reference
   */
  private isAliasReference(value: string): boolean {
    return value.includes('{') && value.includes('}')
  }
  
  /**
   * Process color values for plugin compatibility
   */
  private processColorValue(value: any): any {
    if (typeof value === 'string') {
      // Handle hex, rgb, hsl, named colors
      return value
    }
    
    if (typeof value === 'object' && value !== null) {
      // Handle RGB objects from design tools
      if ('r' in value || 'red' in value) {
        return value
      }
      
      // Handle multi-mode color values
      if (this.isMultiModeValue(value)) {
        return value
      }
    }
    
    return value
  }
  
  /**
   * Process dimension values
   */
  private processDimensionValue(value: any): string {
    if (typeof value === 'number') {
      return `${value}px`
    }
    
    if (typeof value === 'string') {
      // Ensure proper unit notation
      if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value}px`
      }
      return value
    }
    
    return String(value)
  }
  
  /**
   * Process font family values
   */
  private processFontFamilyValue(value: any): string | string[] {
    if (Array.isArray(value)) {
      return value
    }
    
    if (typeof value === 'string') {
      // Split comma-separated font stacks
      if (value.includes(',')) {
        return value.split(',').map(font => font.trim())
      }
      return value
    }
    
    return String(value)
  }
  
  /**
   * Process font weight values
   */
  private processFontWeightValue(value: any): string | number {
    if (typeof value === 'number') {
      return value
    }
    
    if (typeof value === 'string') {
      // Convert named weights to numbers if needed
      const namedWeights: Record<string, number> = {
        'thin': 100,
        'extralight': 200,
        'ultralight': 200,
        'light': 300,
        'normal': 400,
        'regular': 400,
        'medium': 500,
        'semibold': 600,
        'demibold': 600,
        'bold': 700,
        'extrabold': 800,
        'ultrabold': 800,
        'black': 900,
        'heavy': 900
      }
      
      const lowerValue = value.toLowerCase()
      if (namedWeights[lowerValue]) {
        return namedWeights[lowerValue]
      }
      
      return value
    }
    
    return value
  }
  
  /**
   * Process duration values
   */
  private processDurationValue(value: any): string {
    if (typeof value === 'number') {
      return `${value}ms`
    }
    
    if (typeof value === 'string') {
      // Ensure proper unit (ms or s)
      if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value}ms`
      }
      return value
    }
    
    return String(value)
  }
  
  /**
   * Process number values
   */
  private processNumberValue(value: any): number {
    if (typeof value === 'number') {
      return value
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value)
      if (!isNaN(parsed)) {
        return parsed
      }
    }
    
    return 0
  }
  
  /**
   * Process cubic bezier values
   */
  private processCubicBezierValue(value: any): number[] | string {
    if (Array.isArray(value) && value.length === 4) {
      return value.map(v => parseFloat(v) || 0)
    }
    
    if (typeof value === 'string') {
      // Parse CSS cubic-bezier() format
      const match = value.match(/cubic-bezier\(([\d.,\s]+)\)/)
      if (match) {
        const values = match[1].split(',').map(v => parseFloat(v.trim()))
        if (values.length === 4) {
          return values
        }
      }
      return value
    }
    
    return [0.25, 0.1, 0.25, 1.0] // Default ease
  }
  
  /**
   * Process multi-mode values for plugin compatibility
   * Formats: { light: value, dark: value } -> plugin expects exactly this format
   */
  private processMultiModeValue(value: any, type: W3CTokenType, detectedModes: Set<string>): any {
    if (typeof value !== 'object' || value === null) {
      return value
    }
    
    const processedModeValue: Record<string, any> = {}
    const modes = Array.from(detectedModes)
    
    // Process each mode value according to its type
    for (const [mode, modeValue] of Object.entries(value)) {
      const normalizedMode = mode.toLowerCase()
      
      // Only include modes that were detected/expected
      if (modes.includes(normalizedMode) || modes.length === 0) {
        // Process the individual mode value according to its type
        switch (type) {
          case 'color':
            processedModeValue[normalizedMode] = this.processColorValue(modeValue)
            break
          case 'dimension':
            processedModeValue[normalizedMode] = this.processDimensionValue(modeValue)
            break
          case 'fontFamily':
            processedModeValue[normalizedMode] = this.processFontFamilyValue(modeValue)
            break
          case 'fontWeight':
            processedModeValue[normalizedMode] = this.processFontWeightValue(modeValue)
            break
          case 'duration':
            processedModeValue[normalizedMode] = this.processDurationValue(modeValue)
            break
          case 'number':
            processedModeValue[normalizedMode] = this.processNumberValue(modeValue)
            break
          default:
            processedModeValue[normalizedMode] = modeValue
        }
      }
    }
    
    // If we have processed values, return the multi-mode object
    // This matches the plugin's expected format: { light: value, dark: value }
    if (Object.keys(processedModeValue).length > 0) {
      return processedModeValue
    }
    
    // Fallback to original value
    return value
  }

  /**
   * Check if value is multi-mode (theme-based)
   */
  private isMultiModeValue(value: any): boolean {
    if (typeof value !== 'object' || value === null) {
      return false
    }
    
    // Skip RGB color objects
    if ('r' in value || 'g' in value || 'b' in value || 'red' in value || 'green' in value || 'blue' in value) {
      return false
    }
    
    // Skip arrays
    if (Array.isArray(value)) {
      return false
    }
    
    // Check for common theme keys
    const themeKeys = ['light', 'dark', 'default', 'base', 'mobile', 'desktop']
    const keys = Object.keys(value)
    
    return keys.some(key => 
      themeKeys.some(theme => 
        key.toLowerCase().includes(theme)
      )
    ) || keys.every(key => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(key)) // All keys look like mode names
  }
  
  /**
   * Validate W3C compliance
   */
  validateW3CCompliance(json: W3CExportResult): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    try {
      this.validateStructure(json, '', errors)
    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Validate structure recursively
   */
  private validateStructure(obj: any, path: string, errors: string[]): void {
    if (typeof obj !== 'object' || obj === null) {
      return
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key
      
      // Skip meta properties
      if (key.startsWith('$')) {
        continue
      }
      
      if (this.isW3CToken(value)) {
        // Validate token
        if (!value.$value) {
          errors.push(`Missing $value at ${currentPath}`)
        }
        if (!value.$type) {
          errors.push(`Missing $type at ${currentPath}`)
        }
      } else if (typeof value === 'object') {
        // Recurse into nested structure
        this.validateStructure(value, currentPath, errors)
      }
    }
  }
  
  /**
   * Check if object is a W3C token
   */
  private isW3CToken(obj: any): obj is W3CToken {
    return obj && typeof obj === 'object' && ('$value' in obj || '$type' in obj)
  }
}

/**
 * Convenience function for quick export
 */
export function exportToW3C(tokens: Token[]): W3CExportResult {
  const builder = new W3CExportBuilder()
  return builder.buildW3CCompliantJSON(tokens)
}

/**
 * Export with validation
 */
export function exportToW3CWithValidation(tokens: Token[]): {
  json: W3CExportResult
  validation: { valid: boolean; errors: string[] }
} {
  const builder = new W3CExportBuilder()
  const json = builder.buildW3CCompliantJSON(tokens)
  const validation = builder.validateW3CCompliance(json)
  
  return { json, validation }
}