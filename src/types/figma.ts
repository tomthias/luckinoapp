import { Token } from './token'

// Figma Variable Types
export type FigmaVariableType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN'

// Figma Scopes - based on plugin code analysis
export type FigmaScope = 
  | 'ALL_SCOPES'
  | 'FILL'
  | 'STROKE' 
  | 'TEXT_FILL'
  | 'WIDTH_HEIGHT'
  | 'GAP'
  | 'CORNER_RADIUS'
  | 'TEXT_CONTENT'
  | 'OPACITY'
  | 'EFFECT_COLOR'
  | 'STROKE_STYLES'
  | 'FILL_STYLES'

// Core Figma Variable interface
export interface FigmaVariable {
  id: string
  name: string
  type: FigmaVariableType
  scopes: FigmaScope[]
  description?: string
  resolvedType: string
  collection: string
  collectionId: string
  variableId: string
  // Original token reference for traceability
  originalToken?: Token
  // Alias information
  isAlias: boolean
  aliasTarget?: string
}

// Figma Mode interface
export interface FigmaMode {
  id: string
  name: string
  // Mapping of variableId to resolved value
  variables: Record<string, any>
}

// Figma Collection interface
export interface FigmaCollection {
  id: string
  name: string
  modes: FigmaMode[]
  defaultModeId: string
  variables: FigmaVariable[]
}

// Export configuration options
export interface FigmaExportConfig {
  collections: string[]
  selectedModes?: string[]
  includeAliases: boolean
  resolveAliases: boolean
  scopeOverrides?: Record<string, FigmaScope[]>
  customModeMapping?: Record<string, string>
}

// Export result structure
export interface FigmaExportResult {
  success: boolean
  collections: FigmaCollection[]
  totalVariables: number
  totalModes: number
  errors?: string[]
  warnings?: string[]
  metadata: {
    exportedAt: string
    source: 'luckino-webapp'
    version: string
  }
}

// Theme detection result
export interface ThemeDetectionResult {
  hasThemes: boolean
  themes: string[]
  themeStructure: Record<string, string[]> // theme -> token paths
}

// Scope mapping configuration
export interface ScopeMapping {
  tokenType: string
  figmaScopes: FigmaScope[]
  priority: number
}

// Alias resolution context
export interface AliasResolutionContext {
  tokenMap: Map<string, Token>
  resolvedValues: Map<string, any>
  resolutionStack: string[]
}

// Statistics for export analysis
export interface FigmaExportStats {
  totalTokens: number
  totalCollections: number
  totalModes: number
  typeDistribution: Record<FigmaVariableType, number>
  scopeDistribution: Record<FigmaScope, number>
  aliasCount: number
  resolvedAliasCount: number
  unresolvedAliasCount: number
}