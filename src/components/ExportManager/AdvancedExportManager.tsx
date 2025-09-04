import { useState, useMemo, useEffect } from 'react'
import { Download, Settings, FileJson, FileText, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useTokenStore } from '@/store/tokenStore'
import { Token, TokenCollection } from '@/types/token'
import Editor from '@monaco-editor/react'

interface ExportConfig {
  collections: TokenCollection[]
  modes: string[]
  types: Token['type'][]
  format: 'w3c' | 'token-studio' | 'figma' | 'css' | 'tailwind' | 'sass'
  exportType: 'single' | 'collection-separate' | 'mode-separate'
  includeScopes: boolean
  includeDescriptions: boolean
}

export function AdvancedExportManager() {
  const { tokens, collections } = useTokenStore()
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set())
  const [selectedModes, setSelectedModes] = useState<Set<string>>(new Set())
  const [selectedTypes, setSelectedTypes] = useState<Set<Token['type']>>(
    new Set(['COLOR', 'DIMENSION', 'TYPOGRAPHY', 'SPACING', 'BORDER_RADIUS', 'OPACITY'])
  )
  const [exportFormat, setExportFormat] = useState<ExportConfig['format']>('w3c')
  const [exportType, setExportType] = useState<ExportConfig['exportType']>('single')
  const [includeScopes, setIncludeScopes] = useState(true)
  const [includeDescriptions, setIncludeDescriptions] = useState(true)
  const [previewJson, setPreviewJson] = useState<string>('')
  const [copied, setCopied] = useState(false)

  // Available modes from selected collections
  const availableModes = useMemo(() => {
    const modes = new Set<string>()
    tokens.forEach(token => {
      // Extract modes from multi-mode values
      try {
        const parsed = JSON.parse(token.value)
        if (typeof parsed === 'object' && parsed !== null) {
          Object.keys(parsed).forEach(key => modes.add(key))
        } else {
          modes.add('default')
        }
      } catch {
        modes.add('default')
      }
    })
    return Array.from(modes)
  }, [tokens])

  // Filtered tokens based on selection
  const filteredTokens = useMemo(() => {
    return tokens.filter(token => {
      const collectionMatch = selectedCollections.size === 0 || selectedCollections.has(token.collection)
      const typeMatch = selectedTypes.has(token.type)
      return collectionMatch && typeMatch
    })
  }, [tokens, selectedCollections, selectedTypes])

  // Generate preview JSON
  useEffect(() => {
    const preview = generatePreviewJson(filteredTokens)
    setPreviewJson(JSON.stringify(preview, null, 2))
  }, [filteredTokens, exportFormat, selectedModes, includeScopes, includeDescriptions])

  const toggleCollection = (collectionId: string) => {
    const newSelected = new Set(selectedCollections)
    if (newSelected.has(collectionId)) {
      newSelected.delete(collectionId)
    } else {
      newSelected.add(collectionId)
    }
    setSelectedCollections(newSelected)
  }

  const toggleAllCollections = () => {
    if (selectedCollections.size === collections.length) {
      setSelectedCollections(new Set())
    } else {
      setSelectedCollections(new Set(collections.map(c => c.id)))
    }
  }

  const toggleMode = (mode: string) => {
    const newSelected = new Set(selectedModes)
    if (newSelected.has(mode)) {
      newSelected.delete(mode)
    } else {
      newSelected.add(mode)
    }
    setSelectedModes(newSelected)
  }

  const toggleAllModes = () => {
    if (selectedModes.size === availableModes.length) {
      setSelectedModes(new Set())
    } else {
      setSelectedModes(new Set(availableModes))
    }
  }

  const toggleType = (type: Token['type']) => {
    const newSelected = new Set(selectedTypes)
    if (newSelected.has(type)) {
      newSelected.delete(type)
    } else {
      newSelected.add(type)
    }
    setSelectedTypes(newSelected)
  }

  const toggleAllTypes = () => {
    const allTypes: Token['type'][] = ['COLOR', 'DIMENSION', 'TYPOGRAPHY', 'SPACING', 'BORDER_RADIUS', 'OPACITY', 'SHADOW']
    if (selectedTypes.size === allTypes.length) {
      setSelectedTypes(new Set())
    } else {
      setSelectedTypes(new Set(allTypes))
    }
  }

  const handleExport = () => {
    const exportData = generateExportData(filteredTokens)
    const filename = getExportFilename()
    const mimeType = getMimeType()
    
    downloadFile(exportData, filename, mimeType)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(previewJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const generatePreviewJson = (tokens: Token[]) => {
    switch (exportFormat) {
      case 'w3c':
        return generateW3CFormat(tokens)
      case 'token-studio':
        return generateTokenStudioFormat(tokens)
      case 'figma':
        return generateFigmaFormat(tokens)
      case 'css':
        return generateCSSFormat(tokens)
      case 'tailwind':
        return generateTailwindFormat(tokens)
      case 'sass':
        return generateSASSFormat(tokens)
      default:
        return generateW3CFormat(tokens)
    }
  }

  const generateExportData = (tokens: Token[]) => {
    const data = generatePreviewJson(tokens)
    if (exportFormat === 'css' || exportFormat === 'tailwind' || exportFormat === 'sass') {
      return data // These are already strings
    }
    return JSON.stringify(data, null, 2)
  }

  const getExportFilename = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    switch (exportFormat) {
      case 'css': return `design-tokens-${timestamp}.css`
      case 'tailwind': return `tailwind-tokens-${timestamp}.js`
      case 'sass': return `tokens-${timestamp}.scss`
      default: return `design-tokens-${timestamp}.json`
    }
  }

  const getMimeType = () => {
    switch (exportFormat) {
      case 'css': return 'text/css'
      case 'tailwind': return 'text/javascript'
      case 'sass': return 'text/scss'
      default: return 'application/json'
    }
  }

  return (
    <div className="flex-1 flex gap-6 p-6 overflow-hidden">
      {/* Left Panel - Configuration */}
      <div className="w-80 flex flex-col gap-4 overflow-y-auto">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Export Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportConfig['format'])}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="w3c">W3C Design Tokens</option>
                <option value="token-studio">Token Studio</option>
                <option value="figma">Figma Variables</option>
                <option value="css">CSS Variables</option>
                <option value="tailwind">Tailwind Config</option>
                <option value="sass">SASS Variables</option>
              </select>
            </div>

            {/* Export Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Export Structure</label>
              <select
                value={exportType}
                onChange={(e) => setExportType(e.target.value as ExportConfig['exportType'])}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="single">Single File</option>
                <option value="collection-separate">Separate by Collection</option>
                <option value="mode-separate">Separate by Mode</option>
              </select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-scopes"
                  checked={includeScopes}
                  onCheckedChange={(checked) => setIncludeScopes(!!checked)}
                />
                <label htmlFor="include-scopes" className="text-sm">Include scopes</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-descriptions"
                  checked={includeDescriptions}
                  onCheckedChange={(checked) => setIncludeDescriptions(!!checked)}
                />
                <label htmlFor="include-descriptions" className="text-sm">Include descriptions</label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collections Filter */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Collections</CardTitle>
              <Button variant="ghost" size="sm" onClick={toggleAllCollections}>
                {selectedCollections.size === collections.length ? 'None' : 'All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {collections.map((collection) => (
                <div key={collection.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`collection-${collection.id}`}
                    checked={selectedCollections.has(collection.id)}
                    onCheckedChange={() => toggleCollection(collection.id)}
                  />
                  <label
                    htmlFor={`collection-${collection.id}`}
                    className="text-sm flex-1 flex items-center justify-between"
                  >
                    {collection.name}
                    <span className="text-xs text-muted-foreground">({collection.count})</span>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modes Filter */}
        {availableModes.length > 1 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Modes</CardTitle>
                <Button variant="ghost" size="sm" onClick={toggleAllModes}>
                  {selectedModes.size === availableModes.length ? 'None' : 'All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {availableModes.map((mode) => (
                  <div key={mode} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mode-${mode}`}
                      checked={selectedModes.has(mode)}
                      onCheckedChange={() => toggleMode(mode)}
                    />
                    <label htmlFor={`mode-${mode}`} className="text-sm">
                      {mode}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Types Filter */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Token Types</CardTitle>
              <Button variant="ghost" size="sm" onClick={toggleAllTypes}>
                {selectedTypes.size === 7 ? 'None' : 'All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(['COLOR', 'DIMENSION', 'TYPOGRAPHY', 'SPACING', 'BORDER_RADIUS', 'OPACITY', 'SHADOW'] as Token['type'][]).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type}`}
                    checked={selectedTypes.has(type)}
                    onCheckedChange={() => toggleType(type)}
                  />
                  <label htmlFor={`type-${type}`} className="text-sm capitalize">
                    {type.toLowerCase().replace('_', ' ')}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - JSON Editor and Preview */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Export Preview</h2>
            <Badge variant="outline">
              {filteredTokens.length} tokens
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
            <Button onClick={handleExport} disabled={filteredTokens.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Card className="flex-1 min-h-0">
          <CardContent className="p-0 h-full">
            <Editor
              height="100%"
              language={exportFormat === 'css' || exportFormat === 'sass' ? 'css' : 
                       exportFormat === 'tailwind' ? 'javascript' : 'json'}
              value={exportFormat === 'css' || exportFormat === 'tailwind' || exportFormat === 'sass' 
                     ? previewJson 
                     : previewJson}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                  alwaysConsumeMouseWheel: false
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper functions for different export formats
function generateW3CFormat(tokens: Token[], includeScopes: boolean = false) {
  const result: any = {}
  
  tokens.forEach(token => {
    const pathParts = token.path.split('.')
    let current = result
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      if (!current[part]) current[part] = {}
      current = current[part]
    }
    
    const tokenName = pathParts[pathParts.length - 1]
    current[tokenName] = {
      $type: token.type.toLowerCase(),
      $value: token.value,
      ...(token.description && { $description: token.description }),
      ...(includeScopes && token.scope && { $extensions: { scope: token.scope } })
    }
  })
  
  return result
}

function generateTokenStudioFormat(tokens: Token[]) {
  const result: any = {}
  
  tokens.forEach(token => {
    const pathParts = token.path.split('.')
    let current = result
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i]
      if (!current[part]) current[part] = {}
      current = current[part]
    }
    
    const tokenName = pathParts[pathParts.length - 1]
    current[tokenName] = {
      type: token.type.toLowerCase(),
      value: token.value,
      ...(token.description && { description: token.description })
    }
  })
  
  return result
}

function generateFigmaFormat(tokens: Token[]) {
  return {
    collections: [{
      name: "Export Collection",
      modes: ["Default"],
      variables: tokens.map(token => ({
        name: token.name,
        type: token.type,
        scopes: token.scope || [],
        values: { "Default": token.value },
        description: token.description || ""
      }))
    }]
  }
}

function generateCSSFormat(tokens: Token[]) {
  let css = ':root {\n'
  tokens.forEach(token => {
    const cssVarName = token.path.replace(/\./g, '-').toLowerCase()
    css += `  --${cssVarName}: ${token.value};\n`
  })
  css += '}\n'
  return css
}

function generateTailwindFormat(tokens: Token[]) {
  const config = {
    theme: {
      extend: {
        colors: {} as any,
        spacing: {} as any,
        borderRadius: {} as any,
        opacity: {} as any
      }
    }
  }

  tokens.forEach(token => {
    const name = token.name.toLowerCase().replace(/\s+/g, '-')
    
    switch (token.type) {
      case 'COLOR':
        config.theme.extend.colors[name] = token.value
        break
      case 'DIMENSION':
      case 'SPACING':
        config.theme.extend.spacing[name] = token.value
        break
      case 'BORDER_RADIUS':
        config.theme.extend.borderRadius[name] = token.value
        break
      case 'OPACITY':
        config.theme.extend.opacity[name] = token.value
        break
    }
  })

  return `module.exports = ${JSON.stringify(config, null, 2)}`
}

function generateSASSFormat(tokens: Token[]) {
  let sass = '// Design Tokens - Generated Variables\n\n'
  tokens.forEach(token => {
    const sassVarName = token.path.replace(/\./g, '-').toLowerCase()
    sass += `$${sassVarName}: ${token.value};\n`
  })
  return sass
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}