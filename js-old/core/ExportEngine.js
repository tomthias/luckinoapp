/**
 * ExportEngine - Advanced export system for design tokens
 * Supports multiple formats and export strategies
 * Adapted from Figma plugin for webapp usage
 */

class ExportEngine {
  constructor(tokenProcessor) {
    this.tokenProcessor = tokenProcessor;
    this.formats = {
      'w3c': new W3CExporter(),
      'token-studio': new TokenStudioExporter(),
      'style-dictionary': new StyleDictionaryExporter(),
      'css': new CSSExporter(),
      'tailwind': new TailwindExporter()
    };
  }
  
  /**
   * Export tokens to specified format
   * @param {Object} options - Export configuration
   * @returns {Object} Export results with files or single content
   */
  async export(options = {}) {
    const {
      format = 'w3c',
      exportType = 'single', // 'single', 'separate', 'collection-mode-separate'
      collections = [],
      variables = [],
      modes = ['Default'],
      types = ['color', 'dimension', 'string', 'number', 'boolean'],
      cssOptions = {},
      filename = 'tokens'
    } = options;
    
    console.log('[ExportEngine] Starting export:', { format, exportType, collectionsCount: collections.length, variablesCount: variables.length });
    
    try {
      // Get the appropriate exporter
      const exporter = this.formats[format];
      if (!exporter) {
        throw new Error(`Unsupported export format: ${format}`);
      }
      
      // Prepare data for export
      const exportData = this.prepareExportData(options);
      
      // Execute export based on type
      let result;
      switch (exportType) {
        case 'separate':
          result = await this.exportSeparate(exporter, exportData, options);
          break;
        case 'collection-mode-separate':
          result = await this.exportCollectionModeSeparate(exporter, exportData, options);
          break;
        case 'single':
        default:
          result = await this.exportSingle(exporter, exportData, options);
          break;
      }
      
      console.log('[ExportEngine] Export completed:', { success: result.success, filesCount: result.files?.length || 0 });
      return result;
      
    } catch (error) {
      console.error('[ExportEngine] Export failed:', error);
      return {
        success: false,
        error: error.message,
        files: []
      };
    }
  }
  
  /**
   * Prepare token data for export
   */
  prepareExportData(options) {
    const { collections, variables, types, modes } = options;
    
    // Filter variables by selected types
    const filteredVariables = variables.filter(variable => 
      types.includes(variable.type)
    );
    
    // Group variables by collection
    const collectionMap = new Map();
    
    for (const variable of filteredVariables) {
      const collectionName = variable.collection || 'Default';
      
      if (!collectionMap.has(collectionName)) {
        collectionMap.set(collectionName, {
          name: collectionName,
          id: variable.collectionId || `collection-${collectionName}`,
          variables: []
        });
      }
      
      collectionMap.get(collectionName).variables.push(variable);
    }
    
    return {
      collections: Array.from(collectionMap.values()),
      variables: filteredVariables,
      modes,
      types
    };
  }
  
  /**
   * Export as single file
   */
  async exportSingle(exporter, exportData, options) {
    const { filename } = options;
    
    try {
      const content = await exporter.exportSingle(exportData, options);
      const fileExtension = exporter.getFileExtension();
      
      return {
        success: true,
        files: [{
          filename: `${filename}.${fileExtension}`,
          content: content
        }],
        message: `Exported ${exportData.variables.length} tokens to single file`
      };
      
    } catch (error) {
      console.error('[ExportEngine] Single export failed:', error);
      throw error;
    }
  }
  
  /**
   * Export as separate files per collection
   */
  async exportSeparate(exporter, exportData, options) {
    const files = [];
    
    for (const collection of exportData.collections) {
      if (collection.variables.length === 0) continue;
      
      try {
        const collectionData = {
          collections: [collection],
          variables: collection.variables,
          modes: exportData.modes,
          types: exportData.types
        };
        
        const content = await exporter.exportSingle(collectionData, options);
        const fileExtension = exporter.getFileExtension();
        const sanitizedName = this.sanitizeFilename(collection.name);
        
        files.push({
          filename: `${sanitizedName}.${fileExtension}`,
          content: content
        });
        
      } catch (error) {
        console.error(`[ExportEngine] Failed to export collection ${collection.name}:`, error);
        // Continue with other collections
      }
    }
    
    return {
      success: true,
      files: files,
      message: `Exported ${files.length} collection files`
    };
  }
  
  /**
   * Export as separate files per collection-mode combination
   */
  async exportCollectionModeSeparate(exporter, exportData, options) {
    const files = [];
    
    for (const collection of exportData.collections) {
      if (collection.variables.length === 0) continue;
      
      for (const mode of exportData.modes) {
        try {
          // Filter variables for this specific mode (if applicable)
          const modeVariables = collection.variables; // In webapp, we don't have mode-specific filtering yet
          
          const modeData = {
            collections: [{ ...collection, variables: modeVariables }],
            variables: modeVariables,
            modes: [mode],
            types: exportData.types
          };
          
          const content = await exporter.exportSingle(modeData, options);
          const fileExtension = exporter.getFileExtension();
          const sanitizedCollectionName = this.sanitizeFilename(collection.name);
          const sanitizedModeName = this.sanitizeFilename(mode);
          
          files.push({
            filename: `${sanitizedCollectionName}-${sanitizedModeName}.${fileExtension}`,
            content: content
          });
          
        } catch (error) {
          console.error(`[ExportEngine] Failed to export ${collection.name}-${mode}:`, error);
          // Continue with other collection-mode combinations
        }
      }
    }
    
    return {
      success: true,
      files: files,
      message: `Exported ${files.length} collection-mode files`
    };
  }
  
  /**
   * Download exported files
   */
  downloadFiles(exportResult) {
    if (!exportResult.success || !exportResult.files || exportResult.files.length === 0) {
      console.error('[ExportEngine] No files to download');
      return;
    }
    
    if (exportResult.files.length === 1) {
      // Single file download
      this.downloadSingleFile(exportResult.files[0]);
    } else {
      // Multiple files - create ZIP
      this.downloadAsZip(exportResult.files);
    }
  }
  
  /**
   * Download single file
   */
  downloadSingleFile(file) {
    const blob = new Blob([file.content], { 
      type: this.getMimeType(file.filename) 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * Download multiple files as ZIP
   */
  async downloadAsZip(files) {
    try {
      // Simple ZIP implementation - in production you'd use a proper library
      const zipContent = await this.createSimpleZip(files);
      
      const blob = new Blob([zipContent], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tokens.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('[ExportEngine] ZIP creation failed:', error);
      
      // Fallback: download files individually
      for (const file of files) {
        this.downloadSingleFile(file);
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  /**
   * Create simple ZIP archive (basic implementation)
   */
  async createSimpleZip(files) {
    // This is a simplified ZIP implementation
    // In production, use a proper library like JSZip
    
    let zipContent = '';
    
    // Add files to simple archive format
    for (const file of files) {
      zipContent += `\n--- FILE: ${file.filename} ---\n`;
      zipContent += file.content;
      zipContent += `\n--- END: ${file.filename} ---\n`;
    }
    
    return zipContent;
  }
  
  /**
   * Utility methods
   */
  
  sanitizeFilename(name) {
    return name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  }
  
  getMimeType(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'json':
        return 'application/json';
      case 'css':
        return 'text/css';
      case 'js':
        return 'application/javascript';
      default:
        return 'text/plain';
    }
  }
}

/**
 * Base Exporter class
 */
class BaseExporter {
  getFileExtension() {
    return 'json';
  }
  
  async exportSingle(data, options) {
    throw new Error('exportSingle must be implemented by subclass');
  }
}

/**
 * W3C Design Tokens Exporter
 */
class W3CExporter extends BaseExporter {
  async exportSingle(data, options) {
    const tokens = {};
    
    for (const variable of data.variables) {
      // Create nested structure from variable name
      const path = variable.name.split('.');
      let current = tokens;
      
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      }
      
      // Add the token
      const tokenName = path[path.length - 1];
      current[tokenName] = {
        $type: variable.type,
        $value: variable.value
      };
      
      if (variable.description) {
        current[tokenName].$description = variable.description;
      }
    }
    
    return JSON.stringify(tokens, null, 2);
  }
}

/**
 * Token Studio Exporter
 */
class TokenStudioExporter extends BaseExporter {
  async exportSingle(data, options) {
    const tokens = {};
    
    for (const variable of data.variables) {
      // Create nested structure from variable name
      const path = variable.name.split('.');
      let current = tokens;
      
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      }
      
      // Add the token in Token Studio format
      const tokenName = path[path.length - 1];
      current[tokenName] = {
        type: variable.type,
        value: variable.value
      };
      
      if (variable.description) {
        current[tokenName].description = variable.description;
      }
    }
    
    return JSON.stringify(tokens, null, 2);
  }
}

/**
 * Style Dictionary Exporter
 */
class StyleDictionaryExporter extends BaseExporter {
  async exportSingle(data, options) {
    const tokens = {};
    
    for (const variable of data.variables) {
      // Create nested structure from variable name
      const path = variable.name.split('.');
      let current = tokens;
      
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i];
        if (!current[segment]) {
          current[segment] = {};
        }
        current = current[segment];
      }
      
      // Add the token in Style Dictionary format
      const tokenName = path[path.length - 1];
      current[tokenName] = {
        value: variable.value
      };
      
      if (variable.type) {
        current[tokenName].type = variable.type;
      }
      
      if (variable.description) {
        current[tokenName].comment = variable.description;
      }
    }
    
    return JSON.stringify(tokens, null, 2);
  }
}

/**
 * CSS Variables Exporter
 */
class CSSExporter extends BaseExporter {
  getFileExtension() {
    return 'css';
  }
  
  async exportSingle(data, options) {
    const { cssOptions = {} } = options;
    
    let css = '';
    
    // Add header comment
    css += `/* Design tokens exported from Luckino */\n`;
    css += `/* Generated on ${new Date().toISOString()} */\n\n`;
    
    // Root selector
    css += `:root {\n`;
    
    // Add CSS custom properties
    for (const variable of data.variables) {
      const cssVariableName = this.toCSSVariableName(variable.name);
      const cssValue = this.formatValueForCSS(variable.value, variable.type);
      
      css += `  --${cssVariableName}: ${cssValue};\n`;
      
      if (variable.description) {
        css += `  /* ${variable.description} */\n`;
      }
    }
    
    css += `}\n`;
    
    return css;
  }
  
  toCSSVariableName(name) {
    return name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }
  
  formatValueForCSS(value, type) {
    if (type === 'dimension' && typeof value === 'string') {
      // Ensure dimension values have units
      if (/^\d+(\.\d+)?$/.test(value)) {
        return `${value}px`;
      }
    }
    
    return value;
  }
}

/**
 * Tailwind CSS Exporter
 */
class TailwindExporter extends BaseExporter {
  getFileExtension() {
    return 'js';
  }
  
  async exportSingle(data, options) {
    let config = '';
    
    // Add header
    config += `// Tailwind CSS configuration\n`;
    config += `// Generated from design tokens\n\n`;
    
    config += `module.exports = {\n`;
    config += `  theme: {\n`;
    config += `    extend: {\n`;
    
    // Group variables by type for Tailwind structure
    const grouped = this.groupVariablesByType(data.variables);
    
    // Colors
    if (grouped.color && grouped.color.length > 0) {
      config += `      colors: {\n`;
      for (const variable of grouped.color) {
        const key = this.toTailwindKey(variable.name);
        config += `        '${key}': '${variable.value}',\n`;
      }
      config += `      },\n`;
    }
    
    // Spacing (from dimensions)
    if (grouped.dimension && grouped.dimension.length > 0) {
      config += `      spacing: {\n`;
      for (const variable of grouped.dimension) {
        const key = this.toTailwindKey(variable.name);
        const value = this.formatDimensionForTailwind(variable.value);
        config += `        '${key}': '${value}',\n`;
      }
      config += `      },\n`;
    }
    
    // Font sizes (from string tokens that look like font sizes)
    const fontSizes = data.variables.filter(v => 
      v.type === 'string' && /font.*size|text.*size|size/i.test(v.name)
    );
    if (fontSizes.length > 0) {
      config += `      fontSize: {\n`;
      for (const variable of fontSizes) {
        const key = this.toTailwindKey(variable.name);
        config += `        '${key}': '${variable.value}',\n`;
      }
      config += `      },\n`;
    }
    
    config += `    },\n`;
    config += `  },\n`;
    config += `};\n`;
    
    return config;
  }
  
  groupVariablesByType(variables) {
    const grouped = {};
    
    for (const variable of variables) {
      const type = variable.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(variable);
    }
    
    return grouped;
  }
  
  toTailwindKey(name) {
    return name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
  }
  
  formatDimensionForTailwind(value) {
    if (typeof value === 'string' && value.endsWith('px')) {
      // Convert px to rem for Tailwind
      const pxValue = parseFloat(value);
      return `${pxValue / 16}rem`;
    }
    
    return value;
  }
}