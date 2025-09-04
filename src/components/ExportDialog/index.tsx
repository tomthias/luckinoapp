import { useState } from 'react'
import { Download, Loader2, CheckCircle, XCircle, Figma } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTokenStore } from '@/store/tokenStore'

interface ExportDialogProps {
  trigger?: React.ReactNode
}

export function ExportDialog({ trigger }: ExportDialogProps) {
  const { 
    tokens, 
    collections, 
    isExporting, 
    figmaExportResult,
    exportForFigma,
    clearFigmaExport 
  } = useTokenStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [includeAliases, setIncludeAliases] = useState(true)
  const [resolveAliases, setResolveAliases] = useState(true)

  const handleExport = async () => {
    try {
      const config = {
        collections: selectedCollections.length > 0 ? selectedCollections : [],
        includeAliases,
        resolveAliases,
      }
      
      const result = await exportForFigma(config)
      
      if (result.success) {
        // Download the JSON file
        const dataStr = JSON.stringify(result, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'figma-variables-export.json'
        link.click()
        URL.revokeObjectURL(url)
      }
      
    } catch (error) {
      console.error('[ExportDialog] Export failed:', error)
    }
  }

  const handleCollectionToggle = (collectionId: string) => {
    setSelectedCollections(prev => 
      prev.includes(collectionId) 
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    )
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Clear results when dialog closes
      setTimeout(() => clearFigmaExport(), 300)
    }
  }

  const defaultTrigger = (
    <Button variant="default" size="sm" className="bg-purple-600 hover:bg-purple-700">
      <Figma className="h-4 w-4 mr-2" />
      Export for Figma
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Figma className="h-5 w-5 text-purple-600" />
            Export for Figma Variables
          </DialogTitle>
          <DialogDescription>
            Transform your design tokens into Figma Variables format with proper collections, modes, and scopes.
          </DialogDescription>
        </DialogHeader>

        {!figmaExportResult ? (
          <div className="space-y-6">
            {/* Collection Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Select Collections</h3>
              <div className="space-y-2">
                {collections.map((collection) => (
                  <div key={collection.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={collection.id}
                      checked={selectedCollections.includes(collection.id)}
                      onCheckedChange={() => handleCollectionToggle(collection.id)}
                    />
                    <label
                      htmlFor={collection.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                    >
                      {collection.name}
                      <Badge variant="secondary" className="text-xs">
                        {collection.count} tokens
                      </Badge>
                    </label>
                  </div>
                ))}
                {collections.length === 0 && (
                  <p className="text-sm text-muted-foreground">No collections available</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to export all collections
              </p>
            </div>

            {/* Export Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Export Options</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-aliases"
                  checked={includeAliases}
                  onCheckedChange={(checked) => setIncludeAliases(!!checked)}
                />
                <label htmlFor="include-aliases" className="text-sm">
                  Include alias tokens
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="resolve-aliases"
                  checked={resolveAliases}
                  onCheckedChange={(checked) => setResolveAliases(!!checked)}
                />
                <label htmlFor="resolve-aliases" className="text-sm">
                  Resolve alias references
                </label>
              </div>
            </div>

            {/* Preview Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Export Preview</CardTitle>
                <CardDescription className="text-xs">
                  What will be exported to Figma
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Tokens:</span>
                    <span className="ml-2 font-medium">{tokens.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Collections:</span>
                    <span className="ml-2 font-medium">{collections.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Export Result */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {figmaExportResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {figmaExportResult.success ? 'Export Successful!' : 'Export Failed'}
              </span>
            </div>
            
            {figmaExportResult.success ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Export Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Variables:</span>
                      <span className="ml-2 font-medium">{figmaExportResult.totalVariables}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Collections:</span>
                      <span className="ml-2 font-medium">{figmaExportResult.collections?.length || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Modes:</span>
                      <span className="ml-2 font-medium">{figmaExportResult.totalModes}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Exported:</span>
                      <span className="ml-2 font-medium text-xs">
                        {new Date(figmaExportResult.metadata.exportedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-red-800">
                    {figmaExportResult.errors?.[0] || 'Unknown error occurred'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {!figmaExportResult ? (
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || tokens.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExporting ? 'Exporting...' : 'Export to Figma'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsOpen(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}