import { useState } from 'react'
import { Link, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Token } from '@/types/token'
import { 
  hasAlias, 
  resolveAliases, 
  getResolvedTokenValue,
  getTokenDependencies
} from '@/lib/aliasUtils'

interface TokenValueProps {
  token: Token
  allTokens: Token[]
  showPreview?: boolean
  maxLength?: number
}

export function TokenValue({ 
  token, 
  allTokens, 
  showPreview = false, 
  maxLength = 50 
}: TokenValueProps) {
  const [showResolved, setShowResolved] = useState(false)

  // Check if token has aliases
  const tokenHasAlias = hasAlias(token.value)
  
  // Resolve aliases if present
  const aliasInfo = tokenHasAlias 
    ? resolveAliases(token.value, allTokens)
    : null

  // Get fully resolved value
  const resolvedInfo = tokenHasAlias 
    ? getResolvedTokenValue(token, allTokens)
    : null

  // Get dependencies
  const dependencies = tokenHasAlias 
    ? getTokenDependencies(token, allTokens)
    : []

  const displayValue = showResolved && resolvedInfo 
    ? resolvedInfo.value 
    : token.value

  const truncatedValue = displayValue.length > maxLength 
    ? `${displayValue.substring(0, maxLength)}...`
    : displayValue

  // Render simple value without aliases
  if (!tokenHasAlias) {
    return (
      <div className="flex items-center gap-2">
        {showPreview && renderValuePreview(token, displayValue)}
        <code className="text-xs bg-muted px-1 rounded font-mono">
          {truncatedValue}
        </code>
      </div>
    )
  }

  // Render value with alias support
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 max-w-full">
        {showPreview && renderValuePreview(token, resolvedInfo?.value || token.value)}
        
        <div className="flex items-center gap-1 min-w-0">
          <Badge 
            variant={aliasInfo?.hasUnresolved ? "destructive" : "secondary"}
            className="text-xs"
          >
            <Link className="h-3 w-3 mr-1" />
            Alias
          </Badge>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <code className="text-xs bg-muted px-1 rounded font-mono cursor-help truncate">
                {truncatedValue}
              </code>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-sm">
              <div className="space-y-2">
                <div>
                  <div className="font-semibold text-xs mb-1">Original Value:</div>
                  <code className="text-xs bg-muted px-1 rounded">{token.value}</code>
                </div>
                
                {aliasInfo && (
                  <div>
                    <div className="font-semibold text-xs mb-1">Aliases:</div>
                    <div className="space-y-1">
                      {aliasInfo.aliases.map((alias, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs">
                          {alias.isValid ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                          <code className="bg-muted px-1 rounded">{alias.original}</code>
                          {alias.isValid && (
                            <>
                              <span>→</span>
                              <code className="bg-muted px-1 rounded">{alias.resolved}</code>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {resolvedInfo && (
                  <div>
                    <div className="font-semibold text-xs mb-1">Resolved Value:</div>
                    <code className="text-xs bg-muted px-1 rounded">
                      {resolvedInfo.value}
                    </code>
                    {resolvedInfo.isCircular && (
                      <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Circular reference detected
                      </div>
                    )}
                  </div>
                )}

                {dependencies.length > 0 && (
                  <div>
                    <div className="font-semibold text-xs mb-1">Dependencies:</div>
                    <div className="space-y-1">
                      {dependencies.map((dep) => (
                        <div key={dep.path} className="text-xs flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />
                          <span>{dep.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          {aliasInfo && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? 'Show Original' : 'Show Resolved'}
            </Button>
          )}

          {aliasInfo?.hasUnresolved && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-3 w-3 text-red-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Some aliases could not be resolved</p>
              </TooltipContent>
            </Tooltip>
          )}

          {resolvedInfo?.isCircular && (
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertTriangle className="h-3 w-3 text-orange-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Circular reference detected in aliases</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}

function renderValuePreview(token: Token, value: string) {
  if (token.type === 'COLOR' && value.startsWith('#')) {
    return (
      <div 
        className="w-4 h-4 rounded border border-gray-200 flex-shrink-0"
        style={{ backgroundColor: value }}
      />
    )
  }
  
  return null
}