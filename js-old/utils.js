// Utility functions for token processing and file operations

/**
 * Simple ZIP implementation for creating ZIP files in the browser
 * Adapted from the plugin's embedded ZIP functionality
 */
class SimpleZip {
  constructor() {
    this.files = [];
  }
  
  file(name, data) {
    this.files.push({ name, data });
    return this;
  }
  
  async generateAsync(options = {}) {
    return this.createZipBlob();
  }
  
  createZipBlob() {
    const encoder = new TextEncoder();
    let offset = 0;
    const centralDirectory = [];
    const fileData = [];
    
    // Process each file
    this.files.forEach(file => {
      const fileName = encoder.encode(file.name);
      const fileContent = encoder.encode(file.data);
      
      // Local file header
      const localFileHeader = new Uint8Array(30 + fileName.length);
      const view = new DataView(localFileHeader.buffer);
      
      // Local file header signature (0x04034b50)
      view.setUint32(0, 0x04034b50, true);
      // Version needed to extract (2.0)
      view.setUint16(4, 20, true);
      // General purpose bit flag
      view.setUint16(6, 0, true);
      // Compression method (0 = stored, no compression)
      view.setUint16(8, 0, true);
      // File last modification time
      view.setUint16(10, 0, true);
      // File last modification date
      view.setUint16(12, 0, true);
      // CRC-32
      view.setUint32(14, this.crc32(fileContent), true);
      // Compressed size
      view.setUint32(18, fileContent.length, true);
      // Uncompressed size
      view.setUint32(22, fileContent.length, true);
      // File name length
      view.setUint16(26, fileName.length, true);
      // Extra field length
      view.setUint16(28, 0, true);
      
      // Copy filename
      localFileHeader.set(fileName, 30);
      
      // Store for central directory
      centralDirectory.push({
        fileName,
        fileContent,
        localHeaderOffset: offset,
        crc: this.crc32(fileContent)
      });
      
      // Add to file data
      fileData.push(localFileHeader);
      fileData.push(fileContent);
      
      offset += localFileHeader.length + fileContent.length;
    });
    
    // Create central directory
    const centralDirStart = offset;
    const centralDirData = [];
    
    centralDirectory.forEach(entry => {
      const centralDirEntry = new Uint8Array(46 + entry.fileName.length);
      const view = new DataView(centralDirEntry.buffer);
      
      // Central directory file header signature (0x02014b50)
      view.setUint32(0, 0x02014b50, true);
      // Version made by
      view.setUint16(4, 20, true);
      // Version needed to extract
      view.setUint16(6, 20, true);
      // General purpose bit flag
      view.setUint16(8, 0, true);
      // Compression method
      view.setUint16(10, 0, true);
      // File last modification time
      view.setUint16(12, 0, true);
      // File last modification date
      view.setUint16(14, 0, true);
      // CRC-32
      view.setUint32(16, entry.crc, true);
      // Compressed size
      view.setUint32(20, entry.fileContent.length, true);
      // Uncompressed size
      view.setUint32(24, entry.fileContent.length, true);
      // File name length
      view.setUint16(28, entry.fileName.length, true);
      // Extra field length
      view.setUint16(30, 0, true);
      // File comment length
      view.setUint16(32, 0, true);
      // Disk number start
      view.setUint16(34, 0, true);
      // Internal file attributes
      view.setUint16(36, 0, true);
      // External file attributes
      view.setUint32(38, 0, true);
      // Relative offset of local header
      view.setUint32(42, entry.localHeaderOffset, true);
      
      // Copy filename
      centralDirEntry.set(entry.fileName, 46);
      
      centralDirData.push(centralDirEntry);
    });
    
    // End of central directory record
    const endOfCentralDir = new Uint8Array(22);
    const endView = new DataView(endOfCentralDir.buffer);
    
    // End of central dir signature (0x06054b50)
    endView.setUint32(0, 0x06054b50, true);
    // Number of this disk
    endView.setUint16(4, 0, true);
    // Number of the disk with the start of the central directory
    endView.setUint16(6, 0, true);
    // Total number of entries in the central directory on this disk
    endView.setUint16(8, centralDirectory.length, true);
    // Total number of entries in the central directory
    endView.setUint16(10, centralDirectory.length, true);
    // Size of the central directory
    const centralDirSize = centralDirData.reduce((sum, entry) => sum + entry.length, 0);
    endView.setUint32(12, centralDirSize, true);
    // Offset of start of central directory
    endView.setUint32(16, centralDirStart, true);
    // Comment length
    endView.setUint16(20, 0, true);
    
    // Combine all parts
    const totalSize = fileData.reduce((sum, data) => sum + data.length, 0) + 
                     centralDirSize + endOfCentralDir.length;
    const zipData = new Uint8Array(totalSize);
    
    let pos = 0;
    fileData.forEach(data => {
      zipData.set(data, pos);
      pos += data.length;
    });
    
    centralDirData.forEach(data => {
      zipData.set(data, pos);
      pos += data.length;
    });
    
    zipData.set(endOfCentralDir, pos);
    
    return new Blob([zipData], { type: 'application/zip' });
  }
  
  crc32(data) {
    let crc = 0xFFFFFFFF;
    const table = this.makeCRCTable();
    
    for (let i = 0; i < data.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ data[i]) & 0xFF];
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  
  makeCRCTable() {
    if (this._crcTable) return this._crcTable;
    
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[n] = c;
    }
    this._crcTable = table;
    return table;
  }
}

/**
 * Token format detection and conversion utilities
 */
const TokenUtils = {
  
  /**
   * Detect if JSON data is in Token Studio format
   */
  detectTokenStudioFormat(jsonData) {
    // Check for Token Studio specific properties
    if (jsonData.$themes || jsonData.$metadata) {
      return true;
    }
    
    // Check for tokens with "type" and "value" properties (Token Studio style)
    const hasTokenStudioTokens = this.hasTokenStudioTokens(jsonData);
    return hasTokenStudioTokens;
  },

  /**
   * Recursively check if object contains Token Studio format tokens
   */
  hasTokenStudioTokens(obj, depth = 0) {
    if (depth > 10) return false; // Prevent infinite recursion
    
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    // Check if this object looks like a Token Studio token
    if (obj.type && obj.value !== undefined) {
      return true;
    }
    
    // Recursively check child objects
    for (const key in obj) {
      if (key.startsWith('$')) continue; // Skip W3C properties
      
      if (this.hasTokenStudioTokens(obj[key], depth + 1)) {
        return true;
      }
    }
    
    return false;
  },

  /**
   * Convert Token Studio format to W3C Design Tokens format
   */
  convertTokenStudioFormat(tokenStudioData) {
    const converted = {};
    
    // Process each top-level key (excluding special Token Studio keys)
    Object.keys(tokenStudioData).forEach(key => {
      if (key.startsWith('$')) {
        // Preserve Token Studio metadata but don't convert
        return;
      }
      
      converted[key] = this.convertTokenStudioGroup(tokenStudioData[key]);
    });
    
    return converted;
  },

  /**
   * Convert a Token Studio group/token recursively
   */
  convertTokenStudioGroup(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    // Check if this is a token (has type and value)
    if (obj.type && obj.value !== undefined) {
      return {
        $type: this.mapTokenStudioType(obj.type),
        $value: this.convertTokenStudioValue(obj.value, obj.type),
        ...(obj.description && { $description: obj.description })
      };
    }
    
    // This is a group, recursively convert children
    const converted = {};
    Object.keys(obj).forEach(key => {
      converted[key] = this.convertTokenStudioGroup(obj[key]);
    });
    
    return converted;
  },

  /**
   * Map Token Studio types to W3C types
   */
  mapTokenStudioType(tokenStudioType) {
    const typeMap = {
      'color': 'color',
      'spacing': 'dimension',
      'dimension': 'dimension', 
      'size': 'dimension',
      'fontFamily': 'fontFamily',
      'fontWeight': 'fontWeight',
      'fontSize': 'dimension',
      'lineHeight': 'number',
      'letterSpacing': 'dimension',
      'typography': 'typography',
      'shadow': 'shadow',
      'border': 'border',
      'borderRadius': 'dimension',
      'duration': 'duration',
      'string': 'string',
      'number': 'number',
      'boolean': 'boolean'
    };
    
    return typeMap[tokenStudioType] || 'string';
  },

  /**
   * Convert Token Studio values to W3C format
   */
  convertTokenStudioValue(value, type) {
    // Handle different value types
    switch (type) {
      case 'spacing':
      case 'dimension':
      case 'fontSize':
      case 'borderRadius':
        // Convert numeric strings to pixel values
        if (typeof value === 'string' && /^\d+(\.\d+)?$/.test(value)) {
          return `${value}px`;
        }
        return value;
        
      case 'typography':
        // Typography objects should be converted to proper structure
        if (typeof value === 'object') {
          const converted = {};
          if (value.fontFamily) converted.fontFamily = value.fontFamily;
          if (value.fontWeight) converted.fontWeight = value.fontWeight;
          if (value.fontSize) converted.fontSize = `${value.fontSize}px`;
          if (value.lineHeight) converted.lineHeight = value.lineHeight;
          if (value.letterSpacing) converted.letterSpacing = `${value.letterSpacing}px`;
          return converted;
        }
        return value;
        
      default:
        return value;
    }
  },

  /**
   * Analyze JSON structure and provide insights
   */
  analyzeJson(jsonData) {
    const analysis = {
      isTokenStudio: false,
      tokenCount: 0,
      groupCount: 0,
      types: new Set(),
      hasAliases: false,
      hasMultiMode: false,
      themes: [],
      structure: {}
    };

    // Detect format
    analysis.isTokenStudio = this.detectTokenStudioFormat(jsonData);
    
    // Extract themes from Token Studio format
    if (jsonData.$themes && Array.isArray(jsonData.$themes)) {
      analysis.themes = jsonData.$themes.map(theme => theme.name || theme.id);
    }
    
    // Analyze structure recursively
    this.analyzeJsonStructure(jsonData, analysis, '');
    
    analysis.types = Array.from(analysis.types);
    
    return analysis;
  },

  /**
   * Recursively analyze JSON structure
   */
  analyzeJsonStructure(obj, analysis, path, depth = 0) {
    if (depth > 20 || typeof obj !== 'object' || obj === null) return;
    
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$')) return; // Skip metadata
      
      const currentPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null) {
        // Check if this is a token
        const isToken = (value.$type && value.$value !== undefined) || 
                       (value.type && value.value !== undefined);
        
        if (isToken) {
          analysis.tokenCount++;
          const tokenType = value.$type || value.type;
          if (tokenType) analysis.types.add(tokenType);
          
          // Check for aliases (references)
          const tokenValue = value.$value || value.value;
          if (typeof tokenValue === 'string' && /^{.+}$/.test(tokenValue)) {
            analysis.hasAliases = true;
          }
          
          // Check for multi-mode values
          if (typeof tokenValue === 'object' && tokenValue !== null && !Array.isArray(tokenValue)) {
            analysis.hasMultiMode = true;
          }
        } else {
          // This is a group
          analysis.groupCount++;
          this.analyzeJsonStructure(value, analysis, currentPath, depth + 1);
        }
      }
    });
  }
};

/**
 * File handling utilities
 */
const FileUtils = {
  
  /**
   * Download a file with given content and filename
   */
  downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  },

  /**
   * Read file content as text
   */
  async readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  },

  /**
   * Read file content as array buffer
   */
  async readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Validate file type
   */
  isValidFile(file) {
    const validTypes = ['application/json', 'application/zip', 'text/plain'];
    const validExtensions = ['.json', '.zip'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }
};

/**
 * Format conversion utilities
 */
const FormatUtils = {
  
  /**
   * Convert tokens to CSS Variables
   */
  convertToCSSVariables(tokens, prefix = ':root') {
    let css = `${prefix} {\n`;
    const flatTokens = this.flattenTokens(tokens);
    
    flatTokens.forEach(([path, value, type]) => {
      const cssValue = this.formatValueForCSS(value, type);
      css += `  --${path.replace(/\./g, '-')}: ${cssValue};\n`;
    });
    
    css += '}\n';
    return css;
  },

  /**
   * Convert tokens to SCSS Variables  
   */
  convertToSCSSVariables(tokens) {
    let scss = '';
    const flatTokens = this.flattenTokens(tokens);
    
    flatTokens.forEach(([path, value, type]) => {
      const scssValue = this.formatValueForCSS(value, type);
      scss += `$${path.replace(/\./g, '-')}: ${scssValue};\n`;
    });
    
    return scss;
  },

  /**
   * Convert tokens to Tailwind CSS theme configuration
   */
  convertToTailwindConfig(tokens) {
    const theme = {};
    const flatTokens = this.flattenTokens(tokens);
    
    flatTokens.forEach(([path, value, type]) => {
      const pathParts = path.split('.');
      const category = pathParts[0];
      const tokenName = pathParts.slice(1).join('-');
      
      if (!theme[category]) {
        theme[category] = {};
      }
      
      theme[category][tokenName] = this.formatValueForCSS(value, type);
    });
    
    return `module.exports = {
  theme: {
    extend: ${JSON.stringify(theme, null, 6)}
  }
}`;
  },

  /**
   * Flatten nested token structure
   */
  flattenTokens(obj, parentPath = '', result = []) {
    Object.keys(obj).forEach(key => {
      if (key.startsWith('$')) return; // Skip metadata
      
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const value = obj[key];
      
      if (typeof value === 'object' && value !== null) {
        if (value.$value !== undefined) {
          // This is a token
          result.push([currentPath, value.$value, value.$type]);
        } else {
          // This is a group, recurse
          this.flattenTokens(value, currentPath, result);
        }
      }
    });
    
    return result;
  },

  /**
   * Format token value for CSS output
   */
  formatValueForCSS(value, type) {
    if (typeof value === 'object' && value !== null) {
      // Handle multi-mode values - use first available value
      const firstValue = Object.values(value)[0];
      return this.formatValueForCSS(firstValue, type);
    }
    
    switch (type) {
      case 'color':
        return value;
        
      case 'dimension':
        if (typeof value === 'string' && value.includes('px')) {
          return value;
        }
        return typeof value === 'number' ? `${value}px` : value;
        
      case 'fontFamily':
        return value.includes(' ') ? `"${value}"` : value;
        
      default:
        return value;
    }
  }
};

/**
 * Notification utilities
 */
const NotificationUtils = {
  
  /**
   * Show snackbar notification
   */
  showSnackbar(message, type = 'info', duration = 3000) {
    const container = document.getElementById('snackbar-container');
    if (!container) return;
    
    const snackbar = document.createElement('div');
    snackbar.className = `snackbar ${type}`;
    snackbar.textContent = message;
    
    container.appendChild(snackbar);
    
    // Trigger animation
    requestAnimationFrame(() => {
      snackbar.classList.add('show');
    });
    
    // Auto remove
    setTimeout(() => {
      snackbar.classList.remove('show');
      setTimeout(() => {
        if (snackbar.parentNode) {
          snackbar.parentNode.removeChild(snackbar);
        }
      }, 400);
    }, duration);
  },

  /**
   * Show success notification
   */
  showSuccess(message, duration = 3000) {
    this.showSnackbar(message, 'success', duration);
  },

  /**
   * Show error notification
   */
  showError(message, duration = 5000) {
    this.showSnackbar(message, 'error', duration);
  },

  /**
   * Show info notification
   */
  showInfo(message, duration = 3000) {
    this.showSnackbar(message, 'info', duration);
  }
};

// Export utilities for global use
window.SimpleZip = SimpleZip;
window.TokenUtils = TokenUtils;
window.FileUtils = FileUtils; 
window.FormatUtils = FormatUtils;
window.NotificationUtils = NotificationUtils;