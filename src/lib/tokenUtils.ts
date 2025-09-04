import { Token } from '@/types/token'

export interface TokenAnalysis {
  isTokenStudio: boolean
  tokenCount: number
  groupCount: number
  types: string[]
  hasAliases: boolean
  hasMultiMode: boolean
  themes: string[]
  structure: Record<string, any>
}

export class TokenUtils {
  /**
   * Detect if JSON data is in Token Studio format
   */
  static detectTokenStudioFormat(jsonData: any): boolean {
    // Check for Token Studio specific properties
    if (jsonData.$themes || jsonData.$metadata) {
      return true
    }
    
    // Check for tokens with "type" and "value" properties (Token Studio style)
    const hasTokenStudioTokens = this.hasTokenStudioTokens(jsonData)
    return hasTokenStudioTokens
  }

  /**
   * Recursively check if object contains Token Studio format tokens
   */
  static hasTokenStudioTokens(obj: any, depth = 0): boolean {
    if (depth > 10) return false // Prevent infinite recursion
    
    if (typeof obj !== 'object' || obj === null) {
      return false
    }
    
    // Check if this object looks like a Token Studio token
    if (obj.type && obj.value !== undefined) {
      return true
    }
    
    // Recursively check child objects
    for (const key in obj) {
      if (key.startsWith('$')) continue // Skip W3C properties
      
      if (this.hasTokenStudioTokens(obj[key], depth + 1)) {
        return true
      }
    }
    
    return false
  }

  /**
   * Convert Token Studio format to W3C Design Tokens format
   */
  static convertTokenStudioFormat(tokenStudioData: any): any {
    const converted: any = {}
    
    // Process each top-level key (excluding special Token Studio keys)
    Object.keys(tokenStudioData).forEach(key => {
      if (key.startsWith('$')) {
        // Preserve Token Studio metadata but don't convert
        return
      }
      
      converted[key] = this.convertTokenStudioGroup(tokenStudioData[key])
    })
    
    return converted
  }

  /**
   * Convert a Token Studio group/token recursively
   */
  static convertTokenStudioGroup(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj
    }
    
    // Check if this is a token (has type and value)
    if (obj.type && obj.value !== undefined) {
      return {
        $type: this.mapTokenStudioType(obj.type),
        $value: this.convertTokenStudioValue(obj.value, obj.type),
        ...(obj.description && { $description: obj.description })
      }
    }
    
    // This is a group, recursively convert children
    const converted: any = {}
    Object.keys(obj).forEach(key => {
      converted[key] = this.convertTokenStudioGroup(obj[key])
    })
    
    return converted
  }

  /**
   * Map Token Studio types to W3C types
   */
  static mapTokenStudioType(tokenStudioType: string): string {
    const typeMap: Record<string, string> = {
      'color': 'color',
      'spacing': 'dimension',
      'dimension': 'dimension', 
      'size': 'dimension',
      'fontFamily': 'fontFamily',
      'fontWeight': 'fontWeight',
      'fontSize': 'dimension',
      'lineHeight': 'number',
      'letterSpacing': 'dimension',
      'typography': 'typography',
      'shadow': 'shadow',
      'border': 'border',
      'borderRadius': 'dimension',
      'duration': 'duration',
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean'
    }
    
    return typeMap[tokenStudioType] || 'string'
  }

  /**
   * Convert Token Studio values to W3C format
   */
  static convertTokenStudioValue(value: any, type: string): any {
    // Handle different value types
    switch (type) {
      case 'spacing':
      case 'dimension':
      case 'fontSize':
      case 'borderRadius':
        // Convert numeric strings to pixel values
        if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
          return `${value}px`
        }
        return value
        
      case 'typography':
        // Typography objects should be converted to proper structure
        if (typeof value === 'object') {
          const converted: any = {}
          if (value.fontFamily) converted.fontFamily = value.fontFamily
          if (value.fontWeight) converted.fontWeight = value.fontWeight
          if (value.fontSize) converted.fontSize = `${value.fontSize}px`
          if (value.lineHeight) converted.lineHeight = value.lineHeight
          if (value.letterSpacing) converted.letterSpacing = `${value.letterSpacing}px`
          return converted
        }
        return value
        
      default:
        return value
    }
  }

  /**
   * Analyze JSON structure and provide insights
   */
  static analyzeJson(jsonData: any): TokenAnalysis {
    const analysis: TokenAnalysis = {
      isTokenStudio: false,
      tokenCount: 0,
      groupCount: 0,
      types: [],
      hasAliases: false,
      hasMultiMode: false,
      themes: [],
      structure: {}
    }

    // Detect format
    analysis.isTokenStudio = this.detectTokenStudioFormat(jsonData)
    
    // Extract themes from Token Studio format
    if (jsonData.$themes && Array.isArray(jsonData.$themes)) {
      analysis.themes = jsonData.$themes.map((theme: any) => theme.name || theme.id)
    }
    
    // Analyze structure recursively
    const typesSet = new Set<string>()
    this.analyzeJsonStructure(jsonData, analysis, '', typesSet)
    analysis.types = Array.from(typesSet)
    
    return analysis
  }

  /**
   * Recursively analyze JSON structure
   */
  static analyzeJsonStructure(obj: any, analysis: TokenAnalysis, path: string, typesSet: Set<string>, depth = 0): void {
    if (depth > 20 || typeof obj !== 'object' || obj === null) return
    
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$')) return // Skip metadata
      
      const currentPath = path ? `${path}.${key}` : key
      const value = obj[key]
      
      if (typeof value === 'object' && value !== null) {
        // Check if this is a token
        const isToken = (value.$type && value.$value !== undefined) || 
                       (value.type && value.value !== undefined)
        
        if (isToken) {
          analysis.tokenCount++
          const tokenType = value.$type || value.type
          if (tokenType) typesSet.add(tokenType)
          
          // Check for aliases (references to other tokens)
          const tokenValue = value.$value || value.value
          if (typeof tokenValue === 'string' && tokenValue.includes('{')) {
            analysis.hasAliases = true
          }
        } else {
          analysis.groupCount++
          this.analyzeJsonStructure(value, analysis, currentPath, typesSet, depth + 1)
        }
      }
    })
  }

  /**
   * Parse tokens from JSON and convert to Token array
   */
  static parseTokensFromJSON(jsonData: any, collection = 'default'): Token[] {
    const tokens: Token[] = []
    
    // Convert Token Studio format if needed
    let processedData = jsonData
    if (this.detectTokenStudioFormat(jsonData)) {
      processedData = this.convertTokenStudioFormat(jsonData)
    }
    
    this.parseObjectRecursive(processedData, '', collection, tokens)
    return tokens
  }

  /**
   * Recursively parse object and extract tokens
   */
  static parseObjectRecursive(obj: any, path: string, collection: string, tokens: Token[]): void {
    if (typeof obj !== 'object' || obj === null) return

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key

      if (value && typeof value === 'object') {
        if ('$type' in value && '$value' in value) {
          // W3C Design Token format
          tokens.push({
            name: key,
            path: currentPath,
            type: this.mapTokenType(String(value.$type)),
            value: String(value.$value),
            collection,
            description: (value as any).$description
          })
        } else if ('type' in value && 'value' in value) {
          // Token Studio format (shouldn't happen after conversion, but handle it)
          tokens.push({
            name: key,
            path: currentPath,
            type: this.mapTokenType(String(value.type)),
            value: String(value.value),
            collection,
            description: (value as any).description
          })
        } else {
          // Continue recursion
          this.parseObjectRecursive(value, currentPath, collection, tokens)
        }
      }
    }
  }

  /**
   * Map token type strings to our Token type enum
   */
  static mapTokenType(type: string): Token['type'] {
    switch (type?.toLowerCase()) {
      case 'color':
        return 'COLOR'
      case 'dimension':
      case 'sizing':
        return 'DIMENSION'
      case 'fontfamily':
      case 'fontweight':
      case 'fontsize':
      case 'typography':
        return 'TYPOGRAPHY'
      case 'spacing':
        return 'SPACING'
      case 'borderradius':
        return 'BORDER_RADIUS'
      case 'opacity':
        return 'OPACITY'
      case 'boxshadow':
      case 'shadow':
        return 'SHADOW'
      default:
        return 'COLOR'
    }
  }

  /**
   * Format color values for display
   */
  static formatColorValue(value: string): string {
    // Handle different color formats
    if (value.startsWith('#')) {
      return value.toUpperCase()
    }
    if (value.startsWith('rgb') || value.startsWith('hsl')) {
      return value
    }
    return value
  }

  /**
   * Convert pixel values to rem
   */
  static convertToRem(value: string, baseFontSize = 16): string {
    const match = value.match(/^(\d+(?:\.\d+)?)px$/)
    if (match) {
      const pixels = parseFloat(match[1])
      const rem = pixels / baseFontSize
      return `${rem}rem`
    }
    return value
  }
}