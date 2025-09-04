import { useState } from 'react'
import { Table, FileCode, SplitSquareVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TokenSidebar } from '@/components/TokenSidebar'
import { TokenTable } from '@/components/TokenTable'
import { TokenJsonEditor } from '@/components/TokenJsonEditor'
import { ResizablePanels } from '@/components/ui/resizable-panels'

type ViewMode = 'table' | 'json' | 'split'

export function BrowseTokensView() {
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  const renderContent = () => {
    switch (viewMode) {
      case 'table':
        return (
          <div className="flex flex-1 overflow-hidden">
            <TokenSidebar />
            <div className="flex-1 overflow-hidden">
              <TokenTable />
            </div>
          </div>
        )
      
      case 'json':
        return (
          <div className="flex flex-1 overflow-hidden">
            <TokenSidebar />
            <div className="flex-1 overflow-hidden">
              <TokenJsonEditor className="h-full" />
            </div>
          </div>
        )
      
      case 'split':
        return (
          <div className="flex flex-1 overflow-hidden">
            <TokenSidebar />
            <ResizablePanels 
              className="flex-1"
              defaultSize={60}
              minSize={30}
              maxSize={80}
            >
              <div className="overflow-hidden h-full">
                <TokenTable />
              </div>
              <div className="overflow-hidden h-full">
                <TokenJsonEditor className="h-full" />
              </div>
            </ResizablePanels>
          </div>
        )
      
      default:
        return (
          <div className="flex flex-1 overflow-hidden">
            <TokenSidebar />
            <div className="flex-1 overflow-hidden">
              <TokenTable />
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* View Mode Toggle */}
      <div className="border-b border-border bg-background">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">View:</span>
            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 text-sm"
              >
                <Table className="h-4 w-4 mr-2" />
                Table
              </Button>
              <Button
                variant={viewMode === 'json' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('json')}
                className="h-8 text-sm"
              >
                <FileCode className="h-4 w-4 mr-2" />
                JSON Editor
              </Button>
              <Button
                variant={viewMode === 'split' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('split')}
                className="h-8 text-sm"
              >
                <SplitSquareVertical className="h-4 w-4 mr-2" />
                Split View
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {viewMode === 'table' && 'Tabular view with sorting and filtering'}
            {viewMode === 'json' && 'Live JSON editor with real-time token updates'}
            {viewMode === 'split' && 'Resizable table and JSON editor view'}
          </div>
        </div>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}