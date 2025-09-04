import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { Token, TokenCollection, TokenState, TokenActions, NavigationPage } from '@/types/token'
import { FigmaExportEngine } from '@/lib/figmaExport'
import { W3CExportBuilder } from '@/lib/w3cExport'
import { getIntelligentScope } from '@/lib/scopeUtils'

type TokenStore = TokenState & TokenActions

export const useTokenStore = create<TokenStore>()(
  devtools(
    (set, get) => ({
      // State
      tokens: [],
      collections: [],
      selectedTokens: [],
      searchQuery: '',
      filterByType: '',
      expandedCollections: [],
      // Navigation state
      currentPage: 'browse-tokens',
      // Figma state
      figmaCollections: [],
      figmaExportResult: null,
      isExporting: false,
      lastExportConfig: null,

      // Actions
      setTokens: (tokens: Token[]) => {
        const collections = organizeTokensIntoCollections(tokens)
        set({ tokens, collections })
      },

      addTokens: (newTokens: Token[]) => {
        const currentTokens = get().tokens
        const allTokens = [...currentTokens, ...newTokens]
        const collections = organizeTokensIntoCollections(allTokens)
        set({ tokens: allTokens, collections })
      },

      clearTokens: () => {
        set({
          tokens: [],
          collections: [],
          selectedTokens: [],
          searchQuery: '',
          filterByType: '',
          expandedCollections: [],
          currentPage: 'browse-tokens',
          figmaCollections: [],
          figmaExportResult: null,
          isExporting: false,
          lastExportConfig: null
        })
      },

      setSelectedTokens: (tokenIds: string[]) => {
        set({ selectedTokens: tokenIds })
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      },

      setFilterByType: (type: string) => {
        set({ filterByType: type })
      },

      toggleCollection: (collectionId: string) => {
        const { expandedCollections } = get()
        const isExpanded = expandedCollections.includes(collectionId)
        
        if (isExpanded) {
          set({
            expandedCollections: expandedCollections.filter(id => id !== collectionId)
          })
        } else {
          set({
            expandedCollections: [...expandedCollections, collectionId]
          })
        }
      },

      loadFromJSON: (jsonData: any) => {
        // Convert imported JSON to Token format
        const tokens = parseTokensFromJSON(jsonData)
        get().setTokens(tokens)
      },

      // Stable version for useEffect - doesn't change between renders
      loadSampleData: (sampleData: any) => {
        const tokens = parseTokensFromJSON(sampleData)
        set(state => ({
          ...state,
          tokens,
          collections: organizeTokensIntoCollections(tokens)
        }))
      },

      // Navigation actions
      setCurrentPage: (page: NavigationPage) => {
        set({ currentPage: page })
      },

      // Figma export actions
      exportForFigma: async (config: any = {}) => {
        const state = get()
        set({ isExporting: true })
        
        try {
          const exportEngine = new FigmaExportEngine()
          const result = await exportEngine.transformTokensForFigma(state.tokens, config)
          
          set({ 
            figmaExportResult: result,
            figmaCollections: result.collections,
            lastExportConfig: config,
            isExporting: false 
          })
          
          return result
          
        } catch (error) {
          console.error('[Store] Figma export failed:', error)
          set({ 
            figmaExportResult: {
              success: false,
              error: error instanceof Error ? error.message : 'Export failed',
              collections: [],
              totalVariables: 0,
              totalModes: 0,
              metadata: {
                exportedAt: new Date().toISOString(),
                source: 'luckino-webapp',
                version: '1.0.0'
              }
            },
            isExporting: false 
          })
          throw error
        }
      },

      setFigmaExportResult: (result: any) => {
        set({ figmaExportResult: result })
      },

      clearFigmaExport: () => {
        set({ 
          figmaExportResult: null,
          figmaCollections: [],
          lastExportConfig: null 
        })
      },

      // W3C Export action
      exportToW3C: async (options: any = {}) => {
        const state = get()
        set({ isExporting: true })
        
        try {
          const w3cBuilder = new W3CExportBuilder()
          const w3cJson = w3cBuilder.buildW3CCompliantJSON(state.tokens, options)
          
          // Validate the output
          const validation = w3cBuilder.validateW3CCompliance(w3cJson)
          
          const result = {
            success: true,
            json: w3cJson,
            validation,
            metadata: {
              exportedAt: new Date().toISOString(),
              source: 'luckino-webapp-w3c',
              version: '1.0.0',
              tokensCount: state.tokens.length,
              collectionsCount: Object.keys(w3cJson).length
            }
          }
          
          set({ 
            figmaExportResult: result,
            isExporting: false 
          })
          
          return result
          
        } catch (error) {
          console.error('[Store] W3C export failed:', error)
          const errorResult = {
            success: false,
            error: error instanceof Error ? error.message : 'W3C export failed',
            json: {},
            validation: { valid: false, errors: [error instanceof Error ? error.message : 'Unknown error'] },
            metadata: {
              exportedAt: new Date().toISOString(),
              source: 'luckino-webapp-w3c',
              version: '1.0.0'
            }
          }
          
          set({ 
            figmaExportResult: errorResult,
            isExporting: false 
          })
          
          throw error
        }
      }
    }),
    {
      name: 'token-store',
    }
  )
)

// Helper function to organize tokens into collections
function organizeTokensIntoCollections(tokens: Token[]): TokenCollection[] {
  const collectionMap = new Map<string, Token[]>()

  tokens.forEach(token => {
    const collectionName = token.collection || 'global'
    if (!collectionMap.has(collectionName)) {
      collectionMap.set(collectionName, [])
    }
    collectionMap.get(collectionName)!.push(token)
  })

  return Array.from(collectionMap.entries()).map(([name, tokens]) => ({
    id: name,
    name,
    tokens,
    count: tokens.length
  }))
}

// Helper function to parse tokens from JSON with robust validation
function parseTokensFromJSON(jsonData: any): Token[] {
  const tokens: Token[] = []
  const errors: string[] = []
  
  // Input validation
  if (!jsonData || typeof jsonData !== 'object') {
    console.warn('[parseTokensFromJSON] Invalid input: Expected an object, got:', typeof jsonData)
    return tokens
  }

  // Parse each top-level collection
  Object.keys(jsonData).forEach(collectionKey => {
    try {
      const collectionData = jsonData[collectionKey]
      if (collectionData && typeof collectionData === 'object') {
        parseObjectRecursive(collectionData, '', collectionKey, tokens, errors)
      } else {
        errors.push(`Collection '${collectionKey}' is not a valid object`)
      }
    } catch (error) {
      errors.push(`Error parsing collection '${collectionKey}': ${error}`)
      console.error(`[parseTokensFromJSON] Error parsing collection '${collectionKey}':`, error)
    }
  })

  // Log validation summary
  if (errors.length > 0) {
    console.warn(`[parseTokensFromJSON] Parsed ${tokens.length} tokens with ${errors.length} errors:`, errors)
  } else {
    console.info(`[parseTokensFromJSON] Successfully parsed ${tokens.length} tokens`)
  }

  return tokens
}

function parseObjectRecursive(obj: any, path: string, collection: string, tokens: Token[], errors: string[]): void {
  if (!obj || typeof obj !== 'object') return

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key

    try {
      if (value && typeof value === 'object') {
        if ('$type' in value && '$value' in value) {
          // W3C Design Token format - validate required properties
          if (!isValidTokenValue(value.$type, value.$value)) {
            errors.push(`Invalid W3C token at ${currentPath}: type='${value.$type}', value='${value.$value}'`)
            continue
          }

          const tokenType = mapTokenType(String(value.$type))
          const token: Token = {
            name: key,
            path: currentPath,
            type: tokenType,
            value: String(value.$value),
            collection,
            description: (value as any).$description,
            scope: getIntelligentScope({
              type: tokenType,
              path: currentPath,
              value: String(value.$value),
              name: key
            })
          }
          tokens.push(token)
        } else if ('type' in value && 'value' in value) {
          // Token Studio format - validate required properties
          if (!isValidTokenValue(value.type, value.value)) {
            errors.push(`Invalid Token Studio token at ${currentPath}: type='${value.type}', value='${value.value}'`)
            continue
          }

          const tokenType = mapTokenType(String(value.type))
          const token: Token = {
            name: key,
            path: currentPath,
            type: tokenType,
            value: String(value.value),
            collection,
            description: (value as any).description,
            scope: getIntelligentScope({
              type: tokenType,
              path: currentPath,
              value: String(value.value),
              name: key
            })
          }
          tokens.push(token)
        } else {
          // Continue recursion for nested objects
          parseObjectRecursive(value, currentPath, collection, tokens, errors)
        }
      }
    } catch (error) {
      errors.push(`Error processing token at ${currentPath}: ${error}`)
      console.error(`[parseObjectRecursive] Error at ${currentPath}:`, error)
    }
  }
}

// Validate token type and value
function isValidTokenValue(type: any, value: any): boolean {
  // Basic checks
  if (type == null || value == null) return false
  if (typeof type !== 'string' || type.trim() === '') return false
  
  // Value can be string, number, or object (for complex values)
  const validValueTypes = ['string', 'number', 'boolean']
  if (!validValueTypes.includes(typeof value) && typeof value !== 'object') {
    return false
  }

  // Type-specific validation
  const typeStr = String(type).toLowerCase()
  switch (typeStr) {
    case 'color':
      return isValidColorValue(value)
    case 'dimension':
    case 'sizing':
    case 'spacing':
      return isValidDimensionValue(value)
    case 'fontfamily':
    case 'fontweight':
    case 'fontsize':
    case 'typography':
      return true // Accept any string/number for typography
    case 'borderradius':
    case 'opacity':
      return true // Accept any string/number 
    case 'boxshadow':
    case 'shadow':
      return true // Accept any string/object for shadows
    default:
      return true // Accept unknown types but log warning
  }
}

function isValidColorValue(value: any): boolean {
  if (typeof value !== 'string') return false
  const colorStr = String(value).trim()
  
  // Basic color format checks
  return (
    colorStr.startsWith('#') || // Hex colors
    colorStr.startsWith('rgb') || // RGB/RGBA
    colorStr.startsWith('hsl') || // HSL/HSLA
    colorStr.startsWith('{') || // Token references
    /^[a-zA-Z]+$/.test(colorStr) // Named colors
  )
}

function isValidDimensionValue(value: any): boolean {
  if (typeof value === 'number') return true
  if (typeof value !== 'string') return false
  
  const dimStr = String(value).trim()
  
  // Dimension format checks
  return (
    /^\d+(\.\d+)?(px|rem|em|%|vh|vw|pt|pc|in|cm|mm|ex|ch|lh|vmin|vmax)$/i.test(dimStr) || // CSS units
    /^\d+(\.\d+)?$/.test(dimStr) || // Plain numbers
    dimStr.startsWith('{') || // Token references
    dimStr.includes('calc(') // CSS calc functions
  )
}

function mapTokenType(type: string): Token['type'] {
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