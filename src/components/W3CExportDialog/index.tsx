import { useState } from 'react'
import { Download, Loader2, CheckCircle, XCircle, FileJson, AlertTriangle } from 'lucide-react'
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

interface W3CExportDialogProps {
  trigger?: React.ReactNode
}

export function W3CExportDialog({ trigger }: W3CExportDialogProps) {
  const { 
    tokens, 
    collections, 
    isExporting, 
    figmaExportResult,
    exportToW3C,
    clearFigmaExport 
  } = useTokenStore()
  
  const [isOpen, setIsOpen] = useState(false)
  const [enableMultiMode, setEnableMultiMode] = useState(true)
  const [extractModes, setExtractModes] = useState(true)
  const [defaultMode, setDefaultMode] = useState('Default')

  const handleExport = async () => {
    try {
      const options = {
        enableMultiMode,
        extractModes,
        defaultMode
      }
      
      const result = await exportToW3C(options)
      
      if (result.success) {
        // Download the W3C JSON file
        const dataStr = JSON.stringify(result.json, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/design-tokens+json' })
        
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'design-tokens.json'
        link.click()
        URL.revokeObjectURL(url)
      }
      
    } catch (error) {
      console.error('[W3CExportDialog] Export failed:', error)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Clear results when dialog closes
      setTimeout(() => clearFigmaExport(), 300)
    }
  }

  const defaultTrigger = (
    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
      <FileJson className="h-4 w-4 mr-2" />
      Export W3C JSON
    </Button>
  )

  // Check if result is W3C format by looking for validation
  const isW3CResult = figmaExportResult && 'validation' in figmaExportResult

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-blue-600" />
            Export W3C Design Tokens JSON
          </DialogTitle>
          <DialogDescription>
            Export your tokens as W3C Design Tokens specification compliant JSON - perfect for Figma Plugin import.
          </DialogDescription>
        </DialogHeader>

        {!isW3CResult ? (
          <div className="space-y-6">
            {/* Export Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Export Options</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-multi-mode"
                  checked={enableMultiMode}
                  onCheckedChange={(checked) => setEnableMultiMode(!!checked)}
                />
                <label htmlFor="enable-multi-mode" className="text-sm">
                  Enable multi-mode support (themes)
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="extract-modes"
                  checked={extractModes}
                  onCheckedChange={(checked) => setExtractModes(!!checked)}
                />
                <label htmlFor="extract-modes" className="text-sm">
                  Auto-detect modes from token structure
                </label>
              </div>
            </div>

            {/* Format Information */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900">W3C Design Tokens Format</CardTitle>
                <CardDescription className="text-xs text-blue-700">
                  Optimized for Figma Plugin compatibility
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 text-sm text-blue-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Uses <code className="px-1 py-0.5 bg-white rounded text-xs">$value</code> and <code className="px-1 py-0.5 bg-white rounded text-xs">$type</code> properties
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Hierarchical collection structure
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Perfect for Figma Luckino Plugin import
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Supports multi-mode values (light/dark themes)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Export Preview</CardTitle>
                <CardDescription className="text-xs">
                  What will be exported as W3C JSON
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
                {figmaExportResult.success ? 'W3C Export Successful!' : 'W3C Export Failed'}
              </span>
            </div>
            
            {figmaExportResult.success ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Export Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tokens:</span>
                        <span className="ml-2 font-medium">{figmaExportResult.metadata.tokensCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Collections:</span>
                        <span className="ml-2 font-medium">{figmaExportResult.metadata.collectionsCount}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Valid W3C:</span>
                        <span className="ml-2 font-medium">
                          {figmaExportResult.validation.valid ? (
                            <Badge className="bg-green-100 text-green-800">Yes</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">No</Badge>
                          )}
                        </span>
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

                {/* Validation Results */}
                {!figmaExportResult.validation.valid && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-amber-900 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Validation Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-1">
                        {figmaExportResult.validation.errors.map((error: string, index: number) => (
                          <p key={index} className="text-sm text-amber-800">• {error}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <p className="text-sm text-red-800">
                    {figmaExportResult.error || 'Unknown error occurred'}
                  </p>
                  {figmaExportResult.validation?.errors && (
                    <div className="mt-2 space-y-1">
                      {figmaExportResult.validation.errors.map((error: string, index: number) => (
                        <p key={index} className="text-xs text-red-700">• {error}</p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          {!isW3CResult ? (
            <>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || tokens.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isExporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isExporting ? 'Exporting...' : 'Export W3C JSON'}
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              {figmaExportResult.success && (
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Again
                </Button>
              )}
              <Button onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}