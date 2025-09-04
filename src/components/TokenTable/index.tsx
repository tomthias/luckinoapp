import { useMemo, useState } from 'react'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table'
import { ArrowUpDown, Copy, MoreHorizontal, Plus } from 'lucide-react'

import { useTokenStore } from '@/store/tokenStore'
import { Token } from '@/types/token'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { NewVariableDialog } from '@/components/NewVariableDialog'
import { TokenValue } from '@/components/TokenValue'

const columnHelper = createColumnHelper<Token>()

export function TokenTable() {
  const { tokens, searchQuery, filterByType } = useTokenStore()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium"
            >
              Name
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          )
        },
        cell: (info) => (
          <div className="font-medium">
            {info.getValue()}
          </div>
        ),
      }),
      
      columnHelper.accessor('path', {
        header: 'Path',
        cell: (info) => (
          <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">
            {info.getValue()}
          </code>
        ),
      }),

      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <Badge 
            variant="outline" 
            className="capitalize"
            style={{ 
              backgroundColor: getTypeColor(info.getValue()) + '20',
              borderColor: getTypeColor(info.getValue()),
              color: getTypeColor(info.getValue())
            }}
          >
            {info.getValue().toLowerCase().replace('_', ' ')}
          </Badge>
        ),
      }),

      columnHelper.accessor('scope', {
        header: 'Scope',
        cell: (info) => {
          const scopes = info.getValue()
          if (!scopes || scopes.length === 0) {
            return <span className="text-xs text-muted-foreground">-</span>
          }
          return (
            <div className="flex flex-wrap gap-1 max-w-xs">
              {scopes.slice(0, 2).map((scope, index) => (
                <Badge 
                  key={index}
                  variant="secondary" 
                  className="text-xs px-1.5 py-0.5"
                  title={scopes.join(', ')}
                >
                  {scope.replace('_', ' ').toLowerCase()}
                </Badge>
              ))}
              {scopes.length > 2 && (
                <Badge 
                  variant="outline" 
                  className="text-xs px-1.5 py-0.5"
                  title={scopes.join(', ')}
                >
                  +{scopes.length - 2}
                </Badge>
              )}
            </div>
          )
        },
      }),

      columnHelper.display({
        id: 'mode1',
        header: 'Mode 1',
        cell: ({ row }) => <TokenModeCell token={row.original} mode="mode1" allTokens={tokens} />,
      }),

      columnHelper.display({
        id: 'mode2',
        header: 'Mode 2', 
        cell: ({ row }) => <TokenModeCell token={row.original} mode="mode2" allTokens={tokens} />,
      }),

      columnHelper.accessor('collection', {
        header: 'Collection',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue()}
          </span>
        ),
      }),

      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => (
          <span className="text-sm text-muted-foreground">
            {info.getValue() || '-'}
          </span>
        ),
      }),

      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => <TokenActions token={row.original} />,
      }),
    ],
    []
  )

  // Filter tokens based on search query and type filter
  const filteredTokens = useMemo(() => {
    let filtered = tokens

    if (searchQuery) {
      filtered = filtered.filter(token =>
        token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
        token.value.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterByType) {
      filtered = filtered.filter(token => token.type === filterByType)
    }

    return filtered
  }, [tokens, searchQuery, filterByType])

  const table = useReactTable({
    data: filteredTokens,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">Design Tokens</h1>
          <NewVariableDialog />
        </div>
        <p className="text-muted-foreground">
          Use the sidebar to filter tokens by collection and folder structure.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredTokens.length} / {tokens.length} tokens
          </span>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-300px)]">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="font-medium bg-background">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="hover:bg-muted/50 h-12 max-h-14"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No tokens found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

// Component for displaying token mode values
function TokenModeCell({ token, mode, allTokens }: { token: Token; mode: string; allTokens: Token[] }) {
  // Check if token has multi-mode values
  let modeValue: string | undefined
  
  try {
    // Try to parse the value as JSON (multi-mode format)
    const parsedValue = JSON.parse(token.value)
    if (typeof parsedValue === 'object' && parsedValue !== null) {
      // Look for common mode names
      const modeKeys = Object.keys(parsedValue)
      if (mode === 'mode1') {
        modeValue = parsedValue.light || parsedValue.default || parsedValue[modeKeys[0]]
      } else if (mode === 'mode2') {
        modeValue = parsedValue.dark || parsedValue[modeKeys[1]]
      }
    }
  } catch (e) {
    // If not JSON, use the single value for mode1 only
    if (mode === 'mode1') {
      modeValue = token.value
    }
  }

  if (!modeValue) {
    return <span className="text-muted-foreground text-xs">-</span>
  }

  // Create a synthetic token for the mode value
  const modeToken: Token = {
    ...token,
    value: modeValue,
    name: `${token.name}-${mode}`,
    path: `${token.path}-${mode}`
  }

  return (
    <TokenValue 
      token={modeToken} 
      allTokens={allTokens} 
      showPreview={true} 
      maxLength={30}
    />
  )
}

// Component for token actions
function TokenActions({ token }: { token: Token }) {
  return (
    <Button variant="ghost" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
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