import { useState, useEffect, useMemo } from 'react'
import { Editor } from '@monaco-editor/react'
import { Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTokenStore } from '@/store/tokenStore'
import { useTheme } from '@/hooks/useTheme'

interface TokenJsonEditorProps {
  className?: string
}

export function TokenJsonEditor({ className = '' }: TokenJsonEditorProps) {
  const { tokens, loadFromJSON } = useTokenStore()
  const { theme } = useTheme()
  const [editorContent, setEditorContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Convert current tokens to W3C JSON format
  const tokensToW3C = useMemo(() => {
    const result: any = {}
    
    tokens.forEach(token => {
      const pathParts = token.path.split('.')
      let current = result
      
      // Navigate/create the nested structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i]
        if (!current[part]) {
          current[part] = {}
        }
        current = current[part]
      }
      
      // Set the token value
      const tokenName = pathParts[pathParts.length - 1]
      current[tokenName] = {
        $type: token.type.toLowerCase(),
        $value: token.value,
        ...(token.description && { $description: token.description })
      }
    })
    
    return result
  }, [tokens])

  // Initialize editor content
  useEffect(() => {
    const jsonString = JSON.stringify(tokensToW3C, null, 2)
    setEditorContent(jsonString)
    setHasChanges(false)
  }, [tokensToW3C])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorContent(value)
      setError(null)
      
      // Check if content has changed from original
      const originalJson = JSON.stringify(tokensToW3C, null, 2)
      setHasChanges(value !== originalJson)
      
      // Try to validate JSON
      try {
        JSON.parse(value)
      } catch (e) {
        setError('Invalid JSON syntax')
      }
    }
  }

  const handleSave = async () => {
    if (error) return
    
    setIsLoading(true)
    try {
      const parsedJson = JSON.parse(editorContent)
      await loadFromJSON(parsedJson)
      setHasChanges(false)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse JSON')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRevert = () => {
    const jsonString = JSON.stringify(tokensToW3C, null, 2)
    setEditorContent(jsonString)
    setHasChanges(false)
    setError(null)
  }

  const getStatusInfo = () => {
    if (error) {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        text: 'Syntax Error',
        variant: 'destructive' as const
      }
    }
    
    if (hasChanges) {
      return {
        icon: <RefreshCw className="h-4 w-4" />,
        text: 'Unsaved Changes',
        variant: 'secondary' as const
      }
    }
    
    return {
      icon: <CheckCircle className="h-4 w-4" />,
      text: 'Saved',
      variant: 'outline' as const
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">JSON Editor</h2>
          <Badge variant="outline">
            {tokens.length} tokens
          </Badge>
          <Badge 
            variant={statusInfo.variant}
            className="flex items-center gap-1"
          >
            {statusInfo.icon}
            {statusInfo.text}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRevert}
            disabled={!hasChanges || isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Revert
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={!!error || !hasChanges || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Apply Changes'}
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 border-b">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="json"
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          value={editorContent}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            folding: true,
            bracketPairColorization: { enabled: true },
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: false,
            // JSON specific options
            quickSuggestions: {
              strings: true,
              comments: false,
              other: true
            },
            suggest: {
              showKeywords: false,
              showSnippets: false
            }
          }}
        />
      </div>
      
    </div>
  )
}