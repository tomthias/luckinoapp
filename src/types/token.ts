export interface Token {
  name: string
  path: string
  type: 'COLOR' | 'DIMENSION' | 'TYPOGRAPHY' | 'SPACING' | 'BORDER_RADIUS' | 'OPACITY' | 'SHADOW'
  value: string
  collection: string
  description?: string
  scope?: string[]
}

export interface TokenCollection {
  id: string
  name: string
  tokens: Token[]
  count: number
}

export type NavigationPage = 'browse-tokens' | 'manage-collections' | 'export-manager'

export interface TokenState {
  tokens: Token[]
  collections: TokenCollection[]
  selectedTokens: string[]
  searchQuery: string
  filterByType: string
  expandedCollections: string[]
  // Navigation state
  currentPage: NavigationPage
  // Figma state
  figmaCollections: any[]
  figmaExportResult: any | null
  isExporting: boolean
  lastExportConfig: any | null
}

// Figma-related interfaces
export interface FigmaState {
  figmaCollections: any[]
  figmaExportResult: any | null
  isExporting: boolean
  lastExportConfig: any | null
}

export interface TokenActions {
  setTokens: (tokens: Token[]) => void
  addTokens: (tokens: Token[]) => void
  clearTokens: () => void
  setSelectedTokens: (tokenIds: string[]) => void
  setSearchQuery: (query: string) => void
  setFilterByType: (type: string) => void
  toggleCollection: (collectionId: string) => void
  loadFromJSON: (jsonData: any) => void
  loadSampleData: (sampleData: any) => void
  // Navigation actions
  setCurrentPage: (page: NavigationPage) => void
  // Figma export actions
  exportForFigma: (config?: any) => Promise<any>
  setFigmaExportResult: (result: any) => void
  clearFigmaExport: () => void
  // W3C export action
  exportToW3C: (options?: any) => Promise<any>
}