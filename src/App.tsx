import React, { useEffect } from 'react'
import { Header } from '@/components/Header'
import { BrowseTokensView } from '@/components/BrowseTokensView'
import { ExportManager } from '@/components/ExportManager'
import { useTokenStore } from '@/store/tokenStore'
import { NavigationPage } from '@/types/token'

// Sample data to show the UI
const sampleTokens = {
  global: {
    palette: {
      blue: {
        50: { $type: 'color', $value: '#eff6ff' },
        100: { $type: 'color', $value: '#dbeafe' },
        200: { $type: 'color', $value: '#bfdbfe' },
        300: { $type: 'color', $value: '#93c5fd' },
        400: { $type: 'color', $value: '#60a5fa' },
        500: { $type: 'color', $value: '#3b82f6' },
        600: { $type: 'color', $value: '#2563eb' },
        700: { $type: 'color', $value: '#1d4ed8' },
        800: { $type: 'color', $value: '#1e40af' },
        900: { $type: 'color', $value: '#1e3a8a' },
        950: { $type: 'color', $value: '#172554' }
      },
      purple: {
        500: { $type: 'color', $value: '#8b5cf6' },
        600: { $type: 'color', $value: '#7c3aed' }
      },
      green: {
        500: { $type: 'color', $value: '#10b981' }
      },
      yellow: {
        500: { $type: 'color', $value: '#f59e0b' }
      },
      red: {
        500: { $type: 'color', $value: '#ef4444' }
      }
    },
    spacing: {
      xs: { $type: 'dimension', $value: '4px' },
      sm: { $type: 'dimension', $value: '8px' },
      md: { $type: 'dimension', $value: '16px' },
      lg: { $type: 'dimension', $value: '24px' },
      xl: { $type: 'dimension', $value: '32px' }
    },
    typography: {
      fontFamily: {
        sans: { $type: 'fontFamily', $value: 'Inter, system-ui, sans-serif' },
        mono: { $type: 'fontFamily', $value: 'JetBrains Mono, monospace' }
      },
      fontSize: {
        xs: { $type: 'dimension', $value: '12px' },
        sm: { $type: 'dimension', $value: '14px' },
        base: { $type: 'dimension', $value: '16px' },
        lg: { $type: 'dimension', $value: '18px' },
        xl: { $type: 'dimension', $value: '20px' },
        '2xl': { $type: 'dimension', $value: '24px' }
      }
    },
    borderRadius: {
      none: { $type: 'dimension', $value: '0px' },
      sm: { $type: 'dimension', $value: '2px' },
      md: { $type: 'dimension', $value: '4px' },
      lg: { $type: 'dimension', $value: '8px' },
      full: { $type: 'dimension', $value: '9999px' }
    }
  },
  semantic: {
    color: {
      primary: { $type: 'color', $value: '{global.palette.blue.500}', $description: 'Primary brand color' },
      secondary: { $type: 'color', $value: '{global.palette.purple.500}', $description: 'Secondary accent color' },
      success: { $type: 'color', $value: '{global.palette.green.500}', $description: 'Success state color' },
      warning: { $type: 'color', $value: '{global.palette.yellow.500}', $description: 'Warning state color' },
      error: { $type: 'color', $value: '{global.palette.red.500}', $description: 'Error state color' },
      // Nested alias example
      primaryHover: { $type: 'color', $value: '{semantic.color.primary}', $description: 'Primary hover state - references another semantic color' }
    },
    spacing: {
      component: {
        padding: { $type: 'dimension', $value: '{global.spacing.md}' },
        margin: { $type: 'dimension', $value: '{global.spacing.lg}' },
        // Complex alias with multiple references
        containerSpacing: { $type: 'dimension', $value: 'calc({global.spacing.lg} + {global.spacing.sm})', $description: 'Combined spacing for containers' }
      }
    }
  },
  themes: {
    background: { 
      $type: 'color', 
      $value: JSON.stringify({ light: '#ffffff', dark: '#1a1a1a' }), 
      $description: 'Theme-aware background color' 
    },
    surface: { 
      $type: 'color', 
      $value: JSON.stringify({ light: '#f8f9fa', dark: '#2d2d2d' }), 
      $description: 'Theme-aware surface color' 
    },
    text: { 
      $type: 'color', 
      $value: JSON.stringify({ light: '#212529', dark: '#ffffff' }), 
      $description: 'Theme-aware text color' 
    },
    primary: { 
      $type: 'color', 
      $value: JSON.stringify({ light: '#3b82f6', dark: '#60a5fa' }), 
      $description: 'Theme-aware primary color' 
    }
  }
}

function App() {
  const { loadSampleData, currentPage, setCurrentPage } = useTokenStore()

  useEffect(() => {
    // Load sample data on app start - only once
    loadSampleData(sampleTokens)
  }, []) // Empty dependency array - runs only once on mount

  // Component mapping for cleaner, more declarative rendering
  const pageComponents: Record<NavigationPage, React.ReactElement> = {
    'browse-tokens': <BrowseTokensView />,
    'export-manager': <ExportManager />,
    'manage-collections': (
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Manage Collections</h1>
        <p className="text-muted-foreground">Collection management features coming soon...</p>
      </div>
    )
  }

  const renderMainContent = () => {
    return pageComponents[currentPage] || pageComponents['browse-tokens']
  }

  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 overflow-hidden">
        {renderMainContent()}
      </main>
    </div>
  )
}

export default App
