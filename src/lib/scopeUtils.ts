import { Token } from '@/types/token'

// Scope mapping based on JSON token types - extracted from plugin/code.js
export const scopeMapping: Record<string, string[]> = {
  // Color scopes
  'color': ['ALL_FILLS', 'STROKE_COLOR', 'EFFECT_COLOR'],
  'fills': ['ALL_FILLS'],
  'fill': ['ALL_FILLS'],
  'stroke': ['STROKE_COLOR'], 
  'strokes': ['STROKE_COLOR'],
  'strokecolor': ['STROKE_COLOR'],
  'effect': ['EFFECT_COLOR'],
  'effects': ['EFFECT_COLOR'],
  'effectcolor': ['EFFECT_COLOR'],
  'shadow': ['EFFECT_COLOR'],
  'shadows': ['EFFECT_COLOR'],
  
  // Dimension/spacing scopes  
  'dimension': ['WIDTH_HEIGHT', 'GAP', 'CORNER_RADIUS'],
  'spacing': ['GAP'],
  'gap': ['GAP'],
  'size': ['WIDTH_HEIGHT'],
  'width': ['WIDTH_HEIGHT'],
  'height': ['WIDTH_HEIGHT'],
  'borderradius': ['CORNER_RADIUS'],
  'border-radius': ['CORNER_RADIUS'],
  'radius': ['CORNER_RADIUS'],
  'corner': ['CORNER_RADIUS'],
  
  // Typography scopes
  'typography': ['TEXT_CONTENT', 'FONT_FAMILY', 'FONT_SIZE', 'FONT_WEIGHT', 'LINE_HEIGHT'],
  'text': ['TEXT_CONTENT'],
  'fontfamily': ['FONT_FAMILY'],
  'font-family': ['FONT_FAMILY'],
  'fontsize': ['FONT_SIZE'],
  'font-size': ['FONT_SIZE'],
  'fontweight': ['FONT_WEIGHT'], 
  'font-weight': ['FONT_WEIGHT'],
  'lineheight': ['LINE_HEIGHT'],
  'line-height': ['LINE_HEIGHT'],
  'letterspacing': ['LETTER_SPACING'],
  'letter-spacing': ['LETTER_SPACING'],
  'paragraphspacing': ['PARAGRAPH_SPACING'],
  'paragraph-spacing': ['PARAGRAPH_SPACING'],
  'paragraphindent': ['PARAGRAPH_INDENT'],
  'paragraph-indent': ['PARAGRAPH_INDENT'],
  'fontstyle': ['FONT_STYLE'],
  'font-style': ['FONT_STYLE'],
  
  // Opacity scope
  'opacity': ['OPACITY'],
  
  // Float/numeric scopes
  'float': ['STROKE_FLOAT', 'EFFECT_FLOAT'],
  'number': ['STROKE_FLOAT', 'EFFECT_FLOAT', 'OPACITY', 'FONT_WEIGHT']
}

// Fallback scope compatibility based on Figma variable types
export const scopeCompatibility: Record<string, string[]> = {
  // Numeric values can be used for various properties
  'FLOAT': [
    'CORNER_RADIUS', 'WIDTH_HEIGHT', 'GAP', 'STROKE_FLOAT', 
    'OPACITY', 'EFFECT_FLOAT', 'FONT_WEIGHT', 'FONT_SIZE', 
    'LINE_HEIGHT', 'LETTER_SPACING', 'PARAGRAPH_SPACING', 'PARAGRAPH_INDENT'
  ],
  
  // Colors can be used for fills, strokes, and effects  
  'COLOR': [
    'ALL_SCOPES', 'ALL_FILLS', 'FRAME_FILL', 'SHAPE_FILL', 
    'TEXT_FILL', 'STROKE_COLOR', 'EFFECT_COLOR'
  ],
  
  // Strings for text content and font properties
  'STRING': ['TEXT_CONTENT', 'FONT_FAMILY', 'FONT_STYLE'],
  
  // Booleans typically for all scopes
  'BOOLEAN': ['ALL_SCOPES']
}

/**
 * Get scope array for a token type using intelligent mapping
 * This function replicates the applyScopeBasedOnType logic from the plugin
 */
export function getScopeForTokenType(
  tokenType: Token['type'], 
  jsonType?: string,
  tokenName?: string
): string[] {
  console.log(`[getScopeForTokenType] Processing type: ${tokenType}, jsonType: ${jsonType}, name: ${tokenName}`)
  
  // First, try to map based on JSON type if provided
  if (jsonType) {
    const key = jsonType.toLowerCase()
    const specificScope = scopeMapping[key]
    
    if (specificScope && specificScope.length > 0) {
      console.log(`[getScopeForTokenType] Found specific scope for "${key}":`, specificScope)
      return specificScope
    }
    
    // Try to infer from token name if JSON type didn't match
    if (tokenName) {
      const nameKey = tokenName.toLowerCase().replace(/[-_\s]/g, '')
      const nameScope = scopeMapping[nameKey] 
      if (nameScope && nameScope.length > 0) {
        console.log(`[getScopeForTokenType] Found scope from token name "${nameKey}":`, nameScope)
        return nameScope
      }
    }
  }
  
  // Fallback to compatibility mapping based on Figma type
  const fallbackScopes = scopeCompatibility[tokenType]
  if (fallbackScopes && fallbackScopes.length > 0) {
    console.log(`[getScopeForTokenType] Using fallback scopes for type "${tokenType}":`, fallbackScopes)
    return fallbackScopes
  }
  
  // Final fallback
  console.log(`[getScopeForTokenType] Using ALL_SCOPES as final fallback`)
  return ['ALL_SCOPES']
}

/**
 * Enhanced function that considers token path and value for smarter scope detection
 */
export function getIntelligentScope(token: Partial<Token>): string[] {
  const { type, path, value, name } = token
  
  if (!type) return ['ALL_SCOPES']
  
  // Analyze path for hints
  let pathHints: string[] = []
  if (path) {
    const pathParts = path.toLowerCase().split('.')
    pathHints = pathParts.filter(part => 
      scopeMapping[part] || 
      part.includes('spacing') || 
      part.includes('color') || 
      part.includes('border') ||
      part.includes('radius') ||
      part.includes('font') ||
      part.includes('text')
    )
  }
  
  // Try path-based detection first
  for (const hint of pathHints) {
    const hintScope = scopeMapping[hint]
    if (hintScope && hintScope.length > 0) {
      console.log(`[getIntelligentScope] Found scope from path hint "${hint}":`, hintScope)
      return hintScope
    }
  }
  
  // Analyze value for additional hints
  let valueType: string | undefined
  if (value) {
    if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
      valueType = 'color'
    } else if (value.includes('px') || value.includes('rem') || value.includes('em')) {
      valueType = 'dimension'
    } else if (value.includes(',') && (value.includes('sans') || value.includes('serif'))) {
      valueType = 'fontfamily'
    }
  }
  
  // Use standard mapping with enhanced detection
  return getScopeForTokenType(type, valueType, name)
}

/**
 * Convert scope array back to a semantic token type for export
 * This is useful for the reverse operation
 */
export function scopeToSemanticType(scopes: string[]): string | null {
  if (!scopes || scopes.length === 0) return null
  
  // Handle single scope mapping
  if (scopes.length === 1) {
    const scope = scopes[0]
    switch (scope) {
      case 'CORNER_RADIUS': return 'borderRadius'
      case 'GAP': return 'spacing'  
      case 'WIDTH_HEIGHT': return 'size'
      case 'ALL_FILLS': return 'color'
      case 'STROKE_COLOR': return 'color'
      case 'EFFECT_COLOR': return 'color'
      case 'TEXT_CONTENT': return 'text'
      case 'FONT_FAMILY': return 'fontFamily'
      case 'FONT_SIZE': return 'fontSize'
      case 'FONT_WEIGHT': return 'fontWeight'
      case 'LINE_HEIGHT': return 'lineHeight'
      case 'OPACITY': return 'opacity'
      default: return null
    }
  }
  
  // Handle multiple scopes by finding the most specific common type
  if (scopes.some(s => s.includes('FILL') || s.includes('STROKE') || s.includes('EFFECT'))) {
    return 'color'
  }
  
  if (scopes.some(s => s.includes('FONT') || s === 'TEXT_CONTENT')) {
    return 'typography' 
  }
  
  if (scopes.some(s => s === 'GAP' || s === 'WIDTH_HEIGHT' || s === 'CORNER_RADIUS')) {
    return 'dimension'
  }
  
  return null
}