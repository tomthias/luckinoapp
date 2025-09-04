# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Goal: Figma Plugin → Modern React Web App

This webapp is a modern React + TypeScript + Tailwind CSS application that provides token management and export functionality, evolved from the original Luckino Import Export Figma plugin concept.

## 🏗️ Target Architecture

### **Current Architecture**
```
webapp/
├── src/
│   ├── components/        # React components (shadcn/ui)
│   │   ├── ui/           # Base UI components
│   │   ├── TokenSidebar/ # Token navigation sidebar
│   │   ├── TokenTable/   # Data table with sorting/filtering
│   │   ├── TokenJsonEditor/ # Monaco-based JSON editor
│   │   ├── ExportManager/ # Export functionality
│   │   └── Header/       # App navigation header
│   ├── hooks/            # React hooks
│   ├── lib/              # Utility functions
│   ├── store/            # Zustand state management
│   ├── types/            # TypeScript type definitions
│   └── App.tsx           # Main app component
├── index.html            # Vite entry point
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── vite.config.ts        # Vite build configuration
```

### **Current Status**
- ✅ **Core Implementation**: React + TypeScript webapp complete
- ✅ **UI Framework**: shadcn/ui components with Tailwind CSS
- ✅ **State Management**: Zustand store with token management
- ✅ **Export System**: Multiple format support (JSON, CSS, Tailwind)
- ✅ **JSON Editor**: Monaco Editor integration with live editing
- ✅ **Layout**: Responsive design with sidebar navigation

## 🔄 Plugin → Webapp Adaptation Strategy

### **Core Transformations Required**

#### **1. Remove Figma Dependencies**
```javascript
// ❌ Plugin Code (Remove)
figma.showUI(__html__);
figma.ui.postMessage({ type: 'data', payload });
const collections = await figma.variables.getLocalVariableCollectionsAsync();

// ✅ Webapp Code (Replace With)
// Operate on in-memory JSON data loaded via FileReader
document.getElementById('import-button').addEventListener('click', handleImport);
processTokensInMemory(loadedJsonData);
```

#### **2. Communication Pattern Changes**
```javascript
// ❌ Plugin Message System
figma.ui.onmessage = msg => {
  if (msg.type === 'import-json') handleImport(msg.data);
};

// ✅ Webapp Event System  
document.getElementById('import-variables-button').addEventListener('click', () => {
  const fileInput = document.getElementById('file-importer');
  fileInput.click();
});
```

#### **3. File Operations**
```javascript
// ✅ File Import
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = '.json,.zip';
fileInput.onchange = async (e) => {
  const file = e.target.files[0];
  const content = await file.text();
  const tokenData = JSON.parse(content);
  processTokenData(tokenData);
};

// ✅ File Export  
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

## 🔧 Development Commands

### **Setup & Development**
```bash
# React + TypeScript + Vite development
npm install                          # Install dependencies
npm run dev                          # Start development server
npm run build                        # Build for production
npm run lint                         # Run ESLint checks
npm run preview                      # Preview production build

# Development workflow
# App runs at http://localhost:5173 (or next available port)
# Hot module replacement for instant updates
```

### **Testing & Validation**
```bash
# Test with different token formats
# W3C Design Tokens, Token Studio, Style Dictionary formats

# Validate export functionality
# JSON, CSS, Tailwind CSS outputs
```

## 📋 Key Functions to Migrate

### **Pure Functions (Direct Copy)**
These functions from `plugin/code.js` work without Figma API:

#### **Format Detection & Conversion**
- `detectTokenStudioFormat()`
- `convertTokenStudioFormat()`
- `analyzeJson()`

#### **Export Transformations**
- `exportVariablesToJSONAdvanced()`
- `exportVariablesToCSSAdvanced()`
- `formatColorValue()`
- `convertToRem()`
- `applyFormatTransformation()`

#### **Utility Functions**
- `parseColor()` - Color format conversion
- `validateValueForVariableType()` - Type validation
- `SimpleZip` implementation - ZIP file creation

### **Functions Requiring Adaptation**
#### **Import Logic**
```javascript
// ❌ Plugin Version (creates Figma variables)
async function importVariables(jsonData) {
  const collection = figma.variables.createVariableCollection(name);
  const variable = figma.variables.createVariable(name, collection, type);
  variable.setValueForMode(modeId, value);
}

// ✅ Webapp Version (processes in memory)
function importVariables(jsonData) {
  const processedData = {
    collections: [],
    variables: [],
    metadata: { importedAt: Date.now() }
  };
  
  // Analyze and structure data for export
  return processedData;
}
```

## 🎨 Modern React UI Architecture

### **Component Structure**
1. **shadcn/ui Components**: Pre-built, accessible UI components
2. **Tailwind CSS**: Utility-first styling with theme support
3. **TypeScript**: Full type safety throughout the application
```tsx
// Modern React component example
export function TokenSidebar() {
  const { collections, searchQuery, setSearchQuery } = useTokenStore()
  
  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold mb-3 text-card-foreground">
          Token Library
        </h2>
        {/* Component content */}
      </div>
    </div>
  )
}
```

### **Theme System**
1. **CSS Custom Properties**: Dark/light theme support
2. **Tailwind Integration**: Semantic color tokens
3. **Component Theming**: Consistent design language

### **Tab System Preservation**
- ✅ **Import JSON Tab**: File upload + format detection  
- ✅ **Export JSON Tab**: Multi-format download
- ✅ **Export CSS Tab**: CSS/Tailwind generation

## 🔄 Data Flow Architecture

### **Webapp Data Pipeline**
```
File Upload → JSON Parse → Format Detection → In-Memory Processing → Export Generation → File Download
```

### **State Management**
```typescript
// Zustand store with TypeScript
interface TokenStore {
  tokens: Token[]                    // Processed token array
  collections: Collection[]          // Organized collections
  searchQuery: string               // Filter tokens by search
  expandedCollections: string[]     // UI state for sidebar
  setSearchQuery: (query: string) => void
  toggleCollection: (id: string) => void
  loadFromJSON: (jsonData: any) => void
  // ... additional methods
}
```

## 📊 Format Support (Preserved)

### **Input Formats**
- ✅ **W3C Design Tokens**: `$type`/`$value` syntax
- ✅ **Token Studio**: `type`/`value` with metadata
- ✅ **Generic JSON**: Basic key-value structures

### **Output Formats** 
- ✅ **W3C Design Tokens**: Standards-compliant export
- ✅ **Token Studio**: Compatible format
- ✅ **CSS Variables**: `--property: value`
- ✅ **Tailwind CSS**: Theme configuration
- ✅ **Style Dictionary**: Multi-platform tokens

## 🛠️ Critical Implementation Steps

### **Phase 1: Core Structure**
1. Create `index.html` with extracted UI
2. Set up `css/style.css` with responsive improvements
3. Create basic `js/main.js` with event handlers

### **Phase 2: Token Processing**
1. Migrate pure functions from plugin
2. Implement file upload/processing
3. Add format detection and conversion

### **Phase 3: Export System**
1. Implement multi-format export
2. Add ZIP creation for multiple files
3. Create download functionality

### **Phase 4: UI Enhancement**
1. Add drag-and-drop file handling
2. Implement progress indicators  
3. Add example token loading

## 🔧 Webapp-Specific Features

### **Enhanced File Handling**
```javascript
// Drag and drop support
document.addEventListener('dragover', (e) => e.preventDefault());
document.addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = Array.from(e.dataTransfer.files);
  for (const file of files) {
    if (file.name.endsWith('.json') || file.name.endsWith('.zip')) {
      await processFile(file);
    }
  }
});
```

### **Real-time Preview**
```javascript
// Live preview of generated tokens
function updatePreview(tokenData, format) {
  const previewElement = document.getElementById('token-preview');
  const formattedOutput = applyFormatTransformation(tokenData, format);
  previewElement.textContent = JSON.stringify(formattedOutput, null, 2);
}
```

### **Sample Data Integration**
```javascript
// js/examples.js - Pre-loaded example tokens
const exampleTokens = {
  'w3c-basic': { /* W3C format example */ },
  'token-studio': { /* Token Studio example */ },
  'design-system': { /* Complete design system */ }
};
```

## 🚨 Critical Differences from Plugin

### **No Variable Creation**
- Webapp **analyzes and transforms** JSON data
- **No Figma variable objects** created
- Focus on **format conversion** and **export generation**

### **Browser Environment Benefits**
- ✅ **Full DOM access** for rich UI
- ✅ **File system APIs** for upload/download
- ✅ **No sandbox restrictions**
- ✅ **External libraries** allowed (if needed)

### **Limitations**
- ❌ **No Figma integration** (by design)
- ❌ **No variable binding** to design elements
- ❌ **No real-time Figma sync**

## 🎯 Success Criteria

### **Functional Requirements**
- ✅ Upload and parse JSON token files
- ✅ Detect and convert Token Studio format
- ✅ Export to all supported formats  
- ✅ Handle ZIP archives for multi-file export
- ✅ Preserve all transformation logic from plugin

### **User Experience**
- ✅ Familiar interface matching plugin UI
- ✅ Drag-and-drop file handling
- ✅ Real-time preview of exports
- ✅ Example token loading
- ✅ Responsive design for desktop browsers

This webapp will serve as a standalone design token processor, complementing the Figma plugin for teams who need token transformation without Figma access.