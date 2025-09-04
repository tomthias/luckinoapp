import { useState } from 'react'
import { Search, ChevronRight, ChevronDown, FolderOpen, Folder } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useTokenStore } from '@/store/tokenStore'
import { cn } from '@/lib/utils'
import { Token } from '@/types/token'

export function TokenSidebar() {
  const {
    collections,
    expandedCollections,
    searchQuery,
    setSearchQuery,
    toggleCollection,
    tokens
  } = useTokenStore()

  // Group tokens by type within each collection
  const getTokensByType = (collectionTokens: Token[]) => {
    const grouped = collectionTokens.reduce((acc, token) => {
      if (!acc[token.type]) {
        acc[token.type] = []
      }
      acc[token.type].push(token)
      return acc
    }, {} as Record<string, Token[]>)
    return grouped
  }

  const filteredCollections = collections.filter(collection => {
    if (!searchQuery) return true
    return collection.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           collection.tokens.some(token => 
             token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             token.path.toLowerCase().includes(searchQuery.toLowerCase())
           )
  })

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold mb-3 text-card-foreground">Token Library</h2>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{tokens.length} tokens</span>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground -translate-y-1/2" />
          <Input
            placeholder="Search tokens, collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9 bg-background border-border text-sm"
          />
        </div>
      </div>

      {/* Collections Tree */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-card">
        {filteredCollections.map((collection) => {
          const isExpanded = expandedCollections.includes(collection.id)
          const tokensByType = getTokensByType(collection.tokens)

          return (
            <Collapsible key={collection.id} open={isExpanded}>
              <CollapsibleTrigger
                className="flex items-center w-full p-2 hover:bg-accent hover:text-accent-foreground rounded-md group transition-colors"
                onClick={() => toggleCollection(collection.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                {isExpanded ? (
                  <FolderOpen className="h-4 w-4 mr-2 text-primary" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                )}
                <span className="text-sm font-medium flex-1 text-left text-card-foreground">
                  {collection.name}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {collection.count}
                </Badge>
              </CollapsibleTrigger>

              <CollapsibleContent className="ml-6">
                <div className="space-y-1 mt-1">
                  {Object.entries(tokensByType).map(([type, typeTokens]) => (
                    <Collapsible key={`${collection.id}-${type}`}>
                      <CollapsibleTrigger className="flex items-center w-full p-1.5 hover:bg-accent/50 hover:text-accent-foreground rounded-sm group text-left transition-colors">
                        <ChevronRight className="h-3 w-3 mr-2 text-muted-foreground group-data-[state=open]:rotate-90 transition-transform" />
                        <div className="flex items-center flex-1">
                          <TypeIcon type={type} className="h-3 w-3 mr-2" />
                          <span className="text-xs font-medium capitalize text-card-foreground">
                            {type.toLowerCase().replace('_', ' ')}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {typeTokens.length}
                          </Badge>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="ml-4">
                        <div className="space-y-0.5 mt-0.5">
                          {typeTokens.map((token) => (
                            <div
                              key={token.path}
                              className="flex items-center p-1.5 hover:bg-accent/30 hover:text-accent-foreground rounded-sm cursor-pointer group transition-colors"
                            >
                              <div className="flex items-center flex-1 min-w-0">
                                <span className="text-xs text-muted-foreground mr-2 flex-shrink-0">
                                  {token.name}
                                </span>
                                <TokenValue token={token} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>
    </div>
  )
}

// Type icon component
function TypeIcon({ type, className }: { type: string; className?: string }) {
  const iconColor = getTypeColor(type)
  
  return (
    <div
      className={cn(
        "rounded-full",
        className
      )}
      style={{ backgroundColor: iconColor }}
    />
  )
}

// Token value preview component
function TokenValue({ token }: { token: Token }) {
  if (token.type === 'COLOR') {
    return (
      <div className="flex items-center gap-1.5">
        <div 
          className="w-3 h-3 rounded border border-gray-200 flex-shrink-0"
          style={{ backgroundColor: token.value }}
        />
        <span className="text-xs text-muted-foreground font-mono truncate">
          {token.value}
        </span>
      </div>
    )
  }

  return (
    <span className="text-xs text-muted-foreground font-mono truncate">
      {token.value}
    </span>
  )
}

// Helper function to get color for token type
function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'COLOR': '#3b82f6',
    'DIMENSION': '#10b981',
    'SPACING': '#f59e0b',
    'TYPOGRAPHY': '#8b5cf6',
    'BORDER_RADIUS': '#06b6d4',
    'OPACITY': '#64748b',
    'SHADOW': '#6366f1'
  }
  
  return colors[type] || '#64748b'
}