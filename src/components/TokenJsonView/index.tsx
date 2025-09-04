import { useMemo, useState } from 'react'
import { ChevronRight, ChevronDown, Copy, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTokenStore } from '@/store/tokenStore'
import { Token } from '@/types/token'
import { TokenValue } from '@/components/TokenValue'

interface TokenJsonViewProps {
  className?: string
}

interface TreeNode {
  key: string
  path: string
  type: 'object' | 'token'
  children?: TreeNode[]
  token?: Token
  level: number
}

export function TokenJsonView({ className = '' }: TokenJsonViewProps) {
  const { tokens, searchQuery, filterByType } = useTokenStore()
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']))
  const [showValues, setShowValues] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  // Build tree structure from tokens
  const treeData = useMemo(() => {
    const filteredTokens = tokens.filter(token => {
      const matchesSearch = !searchQuery || 
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.value.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = !filterByType || token.type === filterByType
      
      return matchesSearch && matchesType
    })

    const tree: TreeNode = {
      key: 'root',
      path: '',
      type: 'object',
      children: [],
      level: 0
    }

    filteredTokens.forEach(token => {
      const pathParts = token.path.split('.')
      let currentNode = tree

      pathParts.forEach((part, index) => {
        const isLastPart = index === pathParts.length - 1
        const childPath = pathParts.slice(0, index + 1).join('.')
        
        let childNode = currentNode.children?.find(child => child.key === part)
        
        if (!childNode) {
          childNode = {
            key: part,
            path: childPath,
            type: isLastPart ? 'token' : 'object',
            children: isLastPart ? undefined : [],
            token: isLastPart ? token : undefined,
            level: index + 1
          }
          
          if (!currentNode.children) currentNode.children = []
          currentNode.children.push(childNode)
        }
        
        if (isLastPart) {
          childNode.token = token
          childNode.type = 'token'
        }
        
        currentNode = childNode
      })
    })

    return tree
  }, [tokens, searchQuery, filterByType])

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpandedNodes(newExpanded)
  }

  const handleCopy = async (value: string, tokenPath: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(tokenPath)
      setTimeout(() => setCopied(null), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const expandAll = () => {
    const getAllPaths = (node: TreeNode): string[] => {
      const paths = [node.path]
      if (node.children) {
        node.children.forEach(child => {
          paths.push(...getAllPaths(child))
        })
      }
      return paths
    }
    
    const allPaths = getAllPaths(treeData)
    setExpandedNodes(new Set(allPaths))
  }

  const collapseAll = () => {
    setExpandedNodes(new Set(['root']))
  }

  const renderNode = (node: TreeNode): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.path)
    const hasChildren = node.children && node.children.length > 0
    const indentLevel = node.level * 20

    if (node.type === 'token' && node.token) {
      return (
        <div key={node.path} className="group">
          <div 
            className="flex items-center py-1 px-2 hover:bg-muted/50 rounded"
            style={{ paddingLeft: `${indentLevel + 8}px` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-blue-600">"{node.key}"</span>
                <span className="text-muted-foreground">:</span>
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: getTypeColor(node.token.type) + '20',
                    borderColor: getTypeColor(node.token.type),
                    color: getTypeColor(node.token.type)
                  }}
                >
                  {node.token.type}
                </Badge>
              </div>
              {showValues && (
                <div className="mt-1 ml-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>$value:</span>
                  </div>
                  <TokenValue 
                    token={node.token} 
                    allTokens={tokens}
                    showPreview={true}
                    maxLength={40}
                  />
                </div>
              )}
              {node.token.description && (
                <div className="mt-1 ml-4">
                  <span className="text-xs text-muted-foreground">$description: </span>
                  <span className="text-xs italic">{node.token.description}</span>
                </div>
              )}
              {node.token.scope && node.token.scope.length > 0 && (
                <div className="mt-1 ml-4">
                  <span className="text-xs text-muted-foreground">scopes: </span>
                  <div className="inline-flex flex-wrap gap-1">
                    {node.token.scope.map((scope, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {scope.replace('_', ' ').toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={node.path}>
        <div 
          className="flex items-center py-1 px-2 hover:bg-muted/50 rounded cursor-pointer"
          style={{ paddingLeft: `${indentLevel}px` }}
          onClick={() => hasChildren && toggleExpanded(node.path)}
        >
          {hasChildren && (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 mr-1 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 mr-1 text-muted-foreground" />
              )}
            </>
          )}
          {!hasChildren && <div className="w-5" />}
          <span className="text-sm font-mono text-purple-600">"{node.key}"</span>
          <span className="text-muted-foreground mx-1">:</span>
          <span className="text-muted-foreground text-xs">
            {hasChildren ? `{${node.children?.length || 0} items}` : '{}'}
          </span>
        </div>
        {hasChildren && isExpanded && node.children?.map(child => renderNode(child))}
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">JSON Tree View</h2>
          <Badge variant="outline">
            {tokens.filter(token => {
              const matchesSearch = !searchQuery || 
                token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                token.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                token.value.toLowerCase().includes(searchQuery.toLowerCase())
              const matchesType = !filterByType || token.type === filterByType
              return matchesSearch && matchesType
            }).length} tokens
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowValues(!showValues)}>
            {showValues ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                Hide Values
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                Show Values
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="font-mono text-sm">
          {treeData.children?.map(child => renderNode(child))}
        </div>
      </div>
    </div>
  )
}

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