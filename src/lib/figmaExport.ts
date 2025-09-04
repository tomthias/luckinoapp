import { Token } from '@/types/token'
import { 
  FigmaVariable, 
  FigmaCollection, 
  FigmaMode, 
  FigmaExportResult, 
  FigmaExportConfig,
  FigmaScope,
  FigmaVariableType,
  ThemeDetectionResult,
  ScopeMapping,
  AliasResolutionContext,
  FigmaExportStats
} from '@/types/figma'

/**
 * Figma Export Engine
 * Transforms tokens into Figma Variables compatible format
 * Based on the original plugin logic with React webapp adaptations
 */
export class FigmaExportEngine {
  private scopeMappings: ScopeMapping[] = []
  
  constructor() {
    this.initializeScopeMappings()
  }

  /**
   * Initialize scope mappings based on plugin code analysis
   */
  private initializeScopeMappings(): void {
    this.scopeMappings = [
      {
        tokenType: 'COLOR',
        figmaScopes: ['ALL_SCOPES'],
        priority: 1
      },
      {
        tokenType: 'DIMENSION', 
        figmaScopes: ['WIDTH_HEIGHT', 'GAP'],
        priority: 2
      },
      {
        tokenType: 'BORDER_RADIUS',
        figmaScopes: ['CORNER_RADIUS'],
        priority: 3
      },
      {
        tokenType: 'SPACING',
        figmaScopes: ['GAP'],
        priority: 4
      },
      {
        tokenType: 'TYPOGRAPHY',
        figmaScopes: ['TEXT_CONTENT'],
        priority: 5
      },
      {
        tokenType: 'OPACITY',
        figmaScopes: ['OPACITY'],
        priority: 6
      },
      {
        tokenType: 'SHADOW',
        figmaScopes: ['EFFECT_COLOR'],
        priority: 7
      }
    ]
  }

  /**
   * Main export function - transforms tokens to Figma format
   */
  async transformTokensForFigma(
    tokens: Token[], 
    config: FigmaExportConfig = { collections: [], includeAliases: true, resolveAliases: true }
  ): Promise<FigmaExportResult> {
    try {
      console.log('[FigmaExport] Starting transformation...', { tokensCount: tokens.length })
      
      // 1. Detect themes and modes
      const themeDetection = this.detectThemes(tokens)
      
      // 2. Group tokens by collection
      const collectionGroups = this.groupTokensByCollection(tokens)
      
      // 3. Transform each collection
      const figmaCollections: FigmaCollection[] = []
      
      for (const [collectionName, collectionTokens] of collectionGroups.entries()) {
        // Skip if not in selected collections (when specified)
        if (config.collections.length > 0 && !config.collections.includes(collectionName)) {
          continue
        }
        
        const figmaCollection = await this.transformCollection(
          collectionName,
          collectionTokens,
          themeDetection,
          config
        )
        
        if (figmaCollection) {
          figmaCollections.push(figmaCollection)
        }
      }
      
      // 4. Generate export statistics
      const stats = this.generateExportStats(figmaCollections)
      
      // 5. Validate and return result
      const result: FigmaExportResult = {
        success: true,
        collections: figmaCollections,
        totalVariables: stats.totalTokens,
        totalModes: stats.totalModes,
        metadata: {
          exportedAt: new Date().toISOString(),
          source: 'luckino-webapp',
          version: '1.0.0'
        }
      }
      
      console.log('[FigmaExport] Transformation completed:', {
        collections: figmaCollections.length,
        variables: stats.totalTokens,
        modes: stats.totalModes
      })
      
      return result
      
    } catch (error) {
      console.error('[FigmaExport] Transformation failed:', error)
      
      return {
        success: false,
        collections: [],
        totalVariables: 0,
        totalModes: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          exportedAt: new Date().toISOString(),
          source: 'luckino-webapp',
          version: '1.0.0'
        }
      }
    }
  }

  /**
   * Detect themes in token data for mode creation
   */
  private detectThemes(tokens: Token[]): ThemeDetectionResult {
    const themes = new Set<string>()
    const themeStructure: Record<string, string[]> = {}
    
    // Look for theme indicators in token paths or values
    tokens.forEach(token => {
      // Check for common theme patterns
      const themeMatches = token.path.match(/\.(light|dark|theme-\w+)\./i)
      if (themeMatches) {
        const theme = themeMatches[1].toLowerCase()
        themes.add(theme)
        
        if (!themeStructure[theme]) {
          themeStructure[theme] = []
        }
        themeStructure[theme].push(token.path)
      }
      
      // Check for alias references to themes
      if (token.value.includes('{') && token.value.includes('}')) {
        const aliasMatch = token.value.match(/\{([^}]+)\}/g)
        if (aliasMatch) {
          aliasMatch.forEach(alias => {
            const cleanAlias = alias.slice(1, -1)
            const themeMatch = cleanAlias.match(/\.(light|dark|theme-\w+)\./i)
            if (themeMatch) {
              themes.add(themeMatch[1].toLowerCase())
            }
          })
        }
      }
    })
    
    return {
      hasThemes: themes.size > 0,
      themes: Array.from(themes),
      themeStructure
    }
  }

  /**
   * Group tokens by collection
   */
  private groupTokensByCollection(tokens: Token[]): Map<string, Token[]> {
    const collections = new Map<string, Token[]>()
    
    tokens.forEach(token => {
      const collectionName = token.collection || 'Default'
      
      if (!collections.has(collectionName)) {
        collections.set(collectionName, [])
      }
      
      collections.get(collectionName)!.push(token)
    })
    
    return collections
  }

  /**
   * Transform a collection of tokens into Figma format
   */
  private async transformCollection(
    collectionName: string,
    tokens: Token[],
    themeDetection: ThemeDetectionResult,
    config: FigmaExportConfig
  ): Promise<FigmaCollection | null> {
    
    const collectionId = this.generateId(`collection-${collectionName}`)
    
    // Create modes based on theme detection
    const modes = this.createModes(themeDetection, collectionId)
    const defaultMode = modes[0]
    
    // Transform tokens to Figma variables
    const figmaVariables: FigmaVariable[] = []
    
    for (const token of tokens) {
      const figmaVariable = this.transformTokenToFigmaVariable(token, collectionName, collectionId)
      if (figmaVariable) {
        figmaVariables.push(figmaVariable)
      }
    }
    
    // Resolve aliases if configured
    if (config.resolveAliases) {
      await this.resolveAliases(figmaVariables, tokens)
    }
    
    // Populate mode values
    this.populateModeValues(modes, figmaVariables, tokens)
    
    return {
      id: collectionId,
      name: collectionName,
      modes,
      defaultModeId: defaultMode.id,
      variables: figmaVariables
    }
  }

  /**
   * Transform individual token to Figma variable
   */
  private transformTokenToFigmaVariable(
    token: Token, 
    collectionName: string, 
    collectionId: string
  ): FigmaVariable | null {
    
    const variableId = this.generateId(`var-${token.path}`)
    const figmaType = this.mapToFigmaType(token.type)
    const figmaScopes = this.mapToFigmaScopes(token.type)
    
    // Detect if token is an alias
    const isAlias = this.isAliasToken(token.value)
    const aliasTarget = isAlias ? this.extractAliasTarget(token.value) : undefined
    
    return {
      id: variableId,
      name: token.name,
      type: figmaType,
      scopes: figmaScopes,
      description: token.description,
      resolvedType: token.type,
      collection: collectionName,
      collectionId,
      variableId,
      originalToken: token,
      isAlias,
      aliasTarget
    }
  }

  /**
   * Create modes based on theme detection
   */
  private createModes(themeDetection: ThemeDetectionResult, collectionId: string): FigmaMode[] {
    const modes: FigmaMode[] = []
    
    if (themeDetection.hasThemes && themeDetection.themes.length > 0) {
      // Create a mode for each detected theme
      themeDetection.themes.forEach(theme => {
        modes.push({
          id: this.generateId(`mode-${theme}`),
          name: theme.charAt(0).toUpperCase() + theme.slice(1),
          variables: {}
        })
      })
    } else {
      // Create default mode
      modes.push({
        id: this.generateId(`mode-default`),
        name: 'Default',
        variables: {}
      })
    }
    
    return modes
  }

  /**
   * Map token type to Figma variable type
   */
  private mapToFigmaType(tokenType: string): FigmaVariableType {
    const typeMap: Record<string, FigmaVariableType> = {
      'COLOR': 'COLOR',
      'DIMENSION': 'FLOAT',
      'SPACING': 'FLOAT',
      'BORDER_RADIUS': 'FLOAT',
      'OPACITY': 'FLOAT',
      'TYPOGRAPHY': 'STRING',
      'SHADOW': 'STRING'
    }
    
    return typeMap[tokenType] || 'STRING'
  }

  /**
   * Map token type to Figma scopes
   */
  private mapToFigmaScopes(tokenType: string): FigmaScope[] {
    const mapping = this.scopeMappings.find(m => m.tokenType === tokenType)
    return mapping ? mapping.figmaScopes : ['ALL_SCOPES']
  }

  /**
   * Check if token value is an alias reference
   */
  private isAliasToken(value: string): boolean {
    return typeof value === 'string' && value.includes('{') && value.includes('}')
  }

  /**
   * Extract alias target from token value
   */
  private extractAliasTarget(value: string): string | undefined {
    const match = value.match(/\{([^}]+)\}/)
    return match ? match[1] : undefined
  }

  /**
   * Resolve aliases in Figma variables
   */
  private async resolveAliases(figmaVariables: FigmaVariable[], tokens: Token[]): Promise<void> {
    const tokenMap = new Map<string, Token>()
    tokens.forEach(token => tokenMap.set(token.path, token))
    
    const context: AliasResolutionContext = {
      tokenMap,
      resolvedValues: new Map(),
      resolutionStack: []
    }
    
    for (const variable of figmaVariables) {
      if (variable.isAlias && variable.aliasTarget) {
        const resolvedValue = this.resolveAlias(variable.aliasTarget, context)
        if (resolvedValue !== undefined) {
          context.resolvedValues.set(variable.id, resolvedValue)
        }
      }
    }
  }

  /**
   * Recursively resolve a single alias
   */
  private resolveAlias(aliasPath: string, context: AliasResolutionContext): any {
    // Prevent circular references
    if (context.resolutionStack.includes(aliasPath)) {
      console.warn(`[FigmaExport] Circular alias detected: ${aliasPath}`)
      return undefined
    }
    
    context.resolutionStack.push(aliasPath)
    
    try {
      const token = context.tokenMap.get(aliasPath)
      if (!token) {
        console.warn(`[FigmaExport] Alias target not found: ${aliasPath}`)
        return undefined
      }
      
      // If the target is also an alias, resolve recursively
      if (this.isAliasToken(token.value)) {
        const nestedTarget = this.extractAliasTarget(token.value)
        if (nestedTarget) {
          return this.resolveAlias(nestedTarget, context)
        }
      }
      
      return token.value
      
    } finally {
      context.resolutionStack.pop()
    }
  }

  /**
   * Populate mode values for variables
   */
  private populateModeValues(modes: FigmaMode[], variables: FigmaVariable[], tokens: Token[]): void {
    modes.forEach(mode => {
      variables.forEach(variable => {
        if (variable.originalToken) {
          // For now, use the same value for all modes
          // TODO: Implement theme-specific value selection
          mode.variables[variable.id] = variable.originalToken.value
        }
      })
    })
  }

  /**
   * Generate export statistics
   */
  private generateExportStats(collections: FigmaCollection[]): FigmaExportStats {
    const stats: FigmaExportStats = {
      totalTokens: 0,
      totalCollections: collections.length,
      totalModes: 0,
      typeDistribution: {} as Record<FigmaVariableType, number>,
      scopeDistribution: {} as Record<FigmaScope, number>,
      aliasCount: 0,
      resolvedAliasCount: 0,
      unresolvedAliasCount: 0
    }
    
    collections.forEach(collection => {
      stats.totalModes += collection.modes.length
      stats.totalTokens += collection.variables.length
      
      collection.variables.forEach(variable => {
        // Count types
        stats.typeDistribution[variable.type] = (stats.typeDistribution[variable.type] || 0) + 1
        
        // Count scopes
        variable.scopes.forEach(scope => {
          stats.scopeDistribution[scope] = (stats.scopeDistribution[scope] || 0) + 1
        })
        
        // Count aliases
        if (variable.isAlias) {
          stats.aliasCount++
        }
      })
    })
    
    return stats
  }

  /**
   * Generate consistent IDs
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }
}