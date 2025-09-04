import { Upload, Download, Plus, Settings, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTokenStore } from '@/store/tokenStore'
import { useTheme } from '@/hooks/useTheme'
import { LogoIcon } from '@/components/LogoIcon'

type NavigationPage = 'browse-tokens' | 'manage-collections' | 'export-manager'

interface HeaderProps {
  currentPage: NavigationPage
  onPageChange: (page: NavigationPage) => void
}

export function Header({ currentPage, onPageChange }: HeaderProps) {
  const { tokens, clearTokens } = useTokenStore()
  const { theme, toggleTheme } = useTheme()

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        try {
          const text = await file.text()
          const jsonData = JSON.parse(text)
          useTokenStore.getState().loadFromJSON(jsonData)
        } catch (error) {
          console.error('Error importing file:', error)
          // TODO: Add error toast notification
        }
      }
    }
    input.click()
  }

  const handleExport = () => {
    if (tokens.length === 0) {
      console.warn('No tokens to export')
      return
    }

    // Convert tokens back to W3C format for export
    const exportData = convertTokensToW3C(tokens)
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'design-tokens.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LogoIcon size={32} />
            <h1 className="text-xl font-bold text-foreground">Luckino</h1>
          </div>
        </div>

        <nav className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sm ${currentPage === 'browse-tokens' ? 'bg-muted text-muted-foreground' : 'text-foreground'}`}
            onClick={() => onPageChange('browse-tokens')}
          >
            Browse Tokens
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sm ${currentPage === 'manage-collections' ? 'bg-muted text-muted-foreground' : 'text-foreground'}`}
            onClick={() => onPageChange('manage-collections')}
          >
            Manage Collections
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`text-sm ${currentPage === 'export-manager' ? 'bg-muted text-muted-foreground' : 'text-foreground'}`}
            onClick={() => onPageChange('export-manager')}
          >
            Export Manager
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-sm">
            <Plus className="h-4 w-4 mr-2" />
            New Collection
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleImport} className="text-sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>

          <div className="h-4 w-px bg-border mx-2" />
          
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="p-2">
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
          
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

// Helper function to convert tokens back to W3C format
function convertTokensToW3C(tokens: any[]) {
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
}