import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTokenStore } from '@/store/tokenStore'
import { Token } from '@/types/token'
import { getIntelligentScope } from '@/lib/scopeUtils'

interface NewVariableDialogProps {
  trigger?: React.ReactNode
}

export function NewVariableDialog({ trigger }: NewVariableDialogProps) {
  const { addTokens } = useTokenStore()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    path: '',
    type: 'COLOR' as Token['type'],
    value: '',
    collection: 'global',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.value.trim()) {
      return
    }

    const newToken: Token = {
      name: formData.name.trim(),
      path: formData.path.trim() || formData.name.trim(),
      type: formData.type,
      value: formData.value.trim(),
      collection: formData.collection.trim() || 'global',
      description: formData.description.trim(),
      scope: getIntelligentScope({
        type: formData.type,
        path: formData.path.trim() || formData.name.trim(),
        value: formData.value.trim(),
        name: formData.name.trim()
      })
    }

    addTokens([newToken])
    
    // Reset form
    setFormData({
      name: '',
      path: '',
      type: 'COLOR',
      value: '',
      collection: 'global',
      description: ''
    })
    
    setOpen(false)
  }

  const handleCancel = () => {
    // Reset form
    setFormData({
      name: '',
      path: '',
      type: 'COLOR',
      value: '',
      collection: 'global',
      description: ''
    })
    setOpen(false)
  }

  const getTypeColor = (type: string): string => {
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

  const defaultTrigger = (
    <Button className="bg-blue-600 hover:bg-blue-700">
      <Plus className="h-4 w-4 mr-2" />
      New Variable
    </Button>
  )

  // Preview the scope that will be assigned
  const previewScope = formData.name.trim() ? getIntelligentScope({
    type: formData.type,
    path: formData.path.trim() || formData.name.trim(),
    value: formData.value.trim(),
    name: formData.name.trim()
  }) : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Design Token</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <Input
                placeholder="e.g. primary-blue"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Collection</label>
              <Input
                placeholder="e.g. global"
                value={formData.collection}
                onChange={(e) => setFormData(prev => ({ ...prev, collection: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Path</label>
            <Input
              placeholder="e.g. colors.primary.500 (optional, defaults to name)"
              value={formData.path}
              onChange={(e) => setFormData(prev => ({ ...prev, path: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Nested path using dot notation. Leave empty to use the name.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Token['type'] }))}
              >
                <option value="COLOR">Color</option>
                <option value="DIMENSION">Dimension</option>
                <option value="SPACING">Spacing</option>
                <option value="TYPOGRAPHY">Typography</option>
                <option value="BORDER_RADIUS">Border Radius</option>
                <option value="OPACITY">Opacity</option>
                <option value="SHADOW">Shadow</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value *</label>
              <Input
                placeholder="e.g. #3b82f6, 16px, Inter"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Optional description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          {/* Preview Section */}
          <div className="border rounded-lg p-4 bg-muted/20">
            <h4 className="text-sm font-medium mb-2">Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Type:</span>
                <Badge 
                  variant="outline" 
                  className="capitalize"
                  style={{ 
                    backgroundColor: getTypeColor(formData.type) + '20',
                    borderColor: getTypeColor(formData.type),
                    color: getTypeColor(formData.type)
                  }}
                >
                  {formData.type.toLowerCase().replace('_', ' ')}
                </Badge>
              </div>
              
              {formData.value && formData.type === 'COLOR' && formData.value.startsWith('#') && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Color:</span>
                  <div 
                    className="w-4 h-4 rounded border border-gray-200"
                    style={{ backgroundColor: formData.value }}
                  />
                  <code className="text-xs">{formData.value}</code>
                </div>
              )}
              
              {previewScope.length > 0 && (
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">Scope:</span>
                  <div className="flex flex-wrap gap-1">
                    {previewScope.map((scope, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {scope.replace('_', ' ').toLowerCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name.trim() || !formData.value.trim()}
            >
              Create Token
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}