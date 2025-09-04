// Main application logic for Luckino Design Token Processor webapp

class TokenProcessor {
  constructor() {
    this.currentTokenData = null;
    this.currentFormat = 'w3c';
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupDragAndDrop();
    this.initializeUI();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.getAttribute('data-tab'));
      });
    });

    // File import
    document.getElementById('import-variables-button').addEventListener('click', () => {
      document.getElementById('file-importer').click();
    });

    document.getElementById('browse-files').addEventListener('click', () => {
      document.getElementById('file-importer').click();
    });

    document.getElementById('file-importer').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileImport(e.target.files[0]);
      }
    });

    // Example loading
    document.getElementById('load-simple-example').addEventListener('click', () => {
      this.loadExample('simple');
      this.closeDropdown();
    });

    document.getElementById('load-multitheme-example').addEventListener('click', () => {
      this.loadExample('multiTheme');
      this.closeDropdown();
    });

    // Dropdown handling
    document.getElementById('load-example-trigger').addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleDropdown();
    });

    // Export buttons
    document.getElementById('export-json-button').addEventListener('click', () => {
      this.exportJSON();
    });

    document.getElementById('export-css-button').addEventListener('click', () => {
      this.exportCSS();
    });

    // Format selectors
    document.getElementById('json-export-format').addEventListener('change', (e) => {
      this.updateJSONExportPreview(e.target.value);
    });

    document.getElementById('css-export-format').addEventListener('change', (e) => {
      this.updateCSSExportPreview(e.target.value);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#load-example-dropdown')) {
        this.closeDropdown();
      }
    });
  }

  setupDragAndDrop() {
    const dropZone = document.getElementById('file-drop-zone');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('drag-over');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        this.handleFileImport(files[0]);
      }
    }, false);
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  initializeUI() {
    // Initialize with empty state
    this.updateTokenPreview();
    this.updateJSONExportPreview('w3c');
    this.updateCSSExportPreview('css');
  }

  switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');
  }

  toggleDropdown() {
    const dropdown = document.getElementById('load-example-dropdown');
    dropdown.classList.toggle('active');
  }

  closeDropdown() {
    const dropdown = document.getElementById('load-example-dropdown');
    dropdown.classList.remove('active');
  }

  async handleFileImport(file) {
    if (!FileUtils.isValidFile(file)) {
      NotificationUtils.showError('Invalid file type. Please select a JSON or ZIP file.');
      return;
    }

    this.showProcessingStatus('Reading file...');

    try {
      let content;
      
      if (file.name.toLowerCase().endsWith('.zip')) {
        // Handle ZIP files (for future implementation)
        NotificationUtils.showError('ZIP file support coming soon!');
        this.hideProcessingStatus();
        return;
      } else {
        // Handle JSON files
        content = await FileUtils.readFileAsText(file);
      }

      this.showProcessingStatus('Parsing JSON...');
      const jsonData = JSON.parse(content);

      this.showProcessingStatus('Analyzing tokens...');
      const analysis = TokenUtils.analyzeJson(jsonData);

      this.showProcessingStatus('Processing tokens...');
      let processedTokens = jsonData;
      
      // Convert Token Studio format if detected
      if (analysis.isTokenStudio) {
        processedTokens = TokenUtils.convertTokenStudioFormat(jsonData);
        NotificationUtils.showInfo(`Converted from Token Studio format (${analysis.tokenCount} tokens)`);
      }

      this.currentTokenData = processedTokens;
      this.hideProcessingStatus();

      // Update UI
      this.updateTokenPreview();
      this.updateJSONExportPreview();
      this.updateCSSExportPreview();

      NotificationUtils.showSuccess(`Successfully loaded ${analysis.tokenCount} tokens from ${analysis.groupCount} groups`);
      
    } catch (error) {
      this.hideProcessingStatus();
      console.error('File import error:', error);
      NotificationUtils.showError(`Failed to import file: ${error.message}`);
    }
  }

  loadExample(exampleType) {
    try {
      const exampleData = ExampleTokens[exampleType];
      if (!exampleData) {
        NotificationUtils.showError('Example not found');
        return;
      }

      this.currentTokenData = exampleData;
      
      // Update UI
      this.updateTokenPreview();
      this.updateJSONExportPreview();
      this.updateCSSExportPreview();

      const analysis = TokenUtils.analyzeJson(exampleData);
      NotificationUtils.showSuccess(`Loaded ${exampleType} example (${analysis.tokenCount} tokens)`);
      
    } catch (error) {
      console.error('Example loading error:', error);
      NotificationUtils.showError(`Failed to load example: ${error.message}`);
    }
  }

  updateTokenPreview() {
    const container = document.getElementById('token-preview-container');
    
    if (!this.currentTokenData) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Load a token file to see preview</p>
        </div>
      `;
      return;
    }

    const analysis = TokenUtils.analyzeJson(this.currentTokenData);
    const flatTokens = FormatUtils.flattenTokens(this.currentTokenData).slice(0, 10); // Show first 10 tokens

    let html = `
      <div class="token-summary">
        <div class="summary-item">
          <span class="label">Tokens:</span>
          <span class="value">${analysis.tokenCount}</span>
        </div>
        <div class="summary-item">
          <span class="label">Groups:</span>
          <span class="value">${analysis.groupCount}</span>
        </div>
        <div class="summary-item">
          <span class="label">Types:</span>
          <span class="value">${analysis.types.join(', ')}</span>
        </div>
      </div>
      
      <div class="token-list">
        <h4>Token Preview (first 10)</h4>
    `;

    flatTokens.forEach(([path, value, type]) => {
      const displayValue = typeof value === 'object' ? JSON.stringify(value) : value;
      const truncatedValue = displayValue.length > 50 ? displayValue.substring(0, 50) + '...' : displayValue;
      
      html += `
        <div class="token-item">
          <div class="token-name">${path}</div>
          <div class="token-details">
            <span class="token-type">${type || 'string'}</span>
            <span class="token-value">${truncatedValue}</span>
          </div>
        </div>
      `;
    });

    if (analysis.tokenCount > 10) {
      html += `<div class="token-item-more">... and ${analysis.tokenCount - 10} more tokens</div>`;
    }

    html += '</div>';
    
    container.innerHTML = html;
  }

  updateJSONExportPreview(format) {
    const container = document.getElementById('json-export-preview');
    const formatSelect = document.getElementById('json-export-format');
    const selectedFormat = format || formatSelect.value;

    if (!this.currentTokenData) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Load tokens to see export preview</p>
        </div>
      `;
      return;
    }

    try {
      let exportData;
      
      switch (selectedFormat) {
        case 'w3c':
          exportData = this.currentTokenData; // Already in W3C format
          break;
        case 'token-studio':
          exportData = this.convertToTokenStudioFormat(this.currentTokenData);
          break;
        case 'style-dictionary':
          exportData = this.convertToStyleDictionaryFormat(this.currentTokenData);
          break;
        default:
          exportData = this.currentTokenData;
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      const truncatedJson = jsonString.length > 2000 ? jsonString.substring(0, 2000) + '\n...\n}' : jsonString;

      container.innerHTML = `
        <div class="export-preview-content">
          <div class="export-info">
            <span class="format-label">${selectedFormat.toUpperCase()} Format</span>
            <span class="size-label">${(new Blob([jsonString]).size / 1024).toFixed(1)} KB</span>
          </div>
          <pre class="json-preview"><code>${this.highlightJSON(truncatedJson)}</code></pre>
        </div>
      `;
      
    } catch (error) {
      container.innerHTML = `
        <div class="error-state">
          <p>Error generating preview: ${error.message}</p>
        </div>
      `;
    }
  }

  updateCSSExportPreview(format) {
    const container = document.getElementById('css-export-preview');
    const formatSelect = document.getElementById('css-export-format');
    const selectedFormat = format || formatSelect.value;

    if (!this.currentTokenData) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Load tokens to see export preview</p>
        </div>
      `;
      return;
    }

    try {
      let exportData;
      let fileExtension;
      
      switch (selectedFormat) {
        case 'css':
          exportData = FormatUtils.convertToCSSVariables(this.currentTokenData);
          fileExtension = 'css';
          break;
        case 'scss':
          exportData = FormatUtils.convertToSCSSVariables(this.currentTokenData);
          fileExtension = 'scss';
          break;
        case 'tailwind':
          exportData = FormatUtils.convertToTailwindConfig(this.currentTokenData);
          fileExtension = 'js';
          break;
        default:
          exportData = FormatUtils.convertToCSSVariables(this.currentTokenData);
          fileExtension = 'css';
      }

      const truncatedData = exportData.length > 2000 ? exportData.substring(0, 2000) + '\n...' : exportData;

      container.innerHTML = `
        <div class="export-preview-content">
          <div class="export-info">
            <span class="format-label">${selectedFormat.toUpperCase()} Format</span>
            <span class="size-label">${(new Blob([exportData]).size / 1024).toFixed(1)} KB</span>
          </div>
          <pre class="code-preview"><code>${this.highlightCode(truncatedData, fileExtension)}</code></pre>
        </div>
      `;
      
    } catch (error) {
      container.innerHTML = `
        <div class="error-state">
          <p>Error generating preview: ${error.message}</p>
        </div>
      `;
    }
  }

  exportJSON() {
    if (!this.currentTokenData) {
      NotificationUtils.showError('No tokens to export. Please load a token file first.');
      return;
    }

    try {
      const format = document.getElementById('json-export-format').value;
      let exportData;
      let filename;

      switch (format) {
        case 'w3c':
          exportData = this.currentTokenData;
          filename = 'tokens-w3c.json';
          break;
        case 'token-studio':
          exportData = this.convertToTokenStudioFormat(this.currentTokenData);
          filename = 'tokens-studio.json';
          break;
        case 'style-dictionary':
          exportData = this.convertToStyleDictionaryFormat(this.currentTokenData);
          filename = 'tokens-style-dictionary.json';
          break;
        default:
          exportData = this.currentTokenData;
          filename = 'tokens.json';
      }

      const jsonString = JSON.stringify(exportData, null, 2);
      FileUtils.downloadFile(jsonString, filename, 'application/json');
      
      NotificationUtils.showSuccess(`Exported tokens as ${format.toUpperCase()} format`);
      
    } catch (error) {
      console.error('Export error:', error);
      NotificationUtils.showError(`Failed to export: ${error.message}`);
    }
  }

  exportCSS() {
    if (!this.currentTokenData) {
      NotificationUtils.showError('No tokens to export. Please load a token file first.');
      return;
    }

    try {
      const format = document.getElementById('css-export-format').value;
      let exportData;
      let filename;
      let mimeType;

      switch (format) {
        case 'css':
          exportData = FormatUtils.convertToCSSVariables(this.currentTokenData);
          filename = 'tokens.css';
          mimeType = 'text/css';
          break;
        case 'scss':
          exportData = FormatUtils.convertToSCSSVariables(this.currentTokenData);
          filename = 'tokens.scss';
          mimeType = 'text/scss';
          break;
        case 'tailwind':
          exportData = FormatUtils.convertToTailwindConfig(this.currentTokenData);
          filename = 'tailwind.config.js';
          mimeType = 'application/javascript';
          break;
        default:
          exportData = FormatUtils.convertToCSSVariables(this.currentTokenData);
          filename = 'tokens.css';
          mimeType = 'text/css';
      }

      FileUtils.downloadFile(exportData, filename, mimeType);
      
      NotificationUtils.showSuccess(`Exported tokens as ${format.toUpperCase()} format`);
      
    } catch (error) {
      console.error('Export error:', error);
      NotificationUtils.showError(`Failed to export: ${error.message}`);
    }
  }

  // Format conversion methods
  convertToTokenStudioFormat(w3cTokens) {
    const converted = {};
    
    const convertGroup = (obj, path = '') => {
      const result = {};
      
      Object.keys(obj).forEach(key => {
        if (key.startsWith('$')) return; // Skip metadata
        
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          if (value.$value !== undefined) {
            // This is a token
            result[key] = {
              value: value.$value,
              type: this.mapW3CTypeToTokenStudio(value.$type),
              ...(value.$description && { description: value.$description })
            };
          } else {
            // This is a group
            result[key] = convertGroup(value, path ? `${path}.${key}` : key);
          }
        }
      });
      
      return result;
    };
    
    return convertGroup(w3cTokens);
  }

  convertToStyleDictionaryFormat(w3cTokens) {
    // Style Dictionary expects similar structure to W3C but can have different metadata
    return {
      ...w3cTokens,
      // Add Style Dictionary specific metadata if needed
      platforms: {
        css: {
          transformGroup: "css",
          buildPath: "build/css/",
          files: [{
            destination: "variables.css",
            format: "css/variables"
          }]
        }
      }
    };
  }

  mapW3CTypeToTokenStudio(w3cType) {
    const typeMap = {
      'color': 'color',
      'dimension': 'spacing',
      'fontFamily': 'fontFamily',
      'fontWeight': 'fontWeight',
      'number': 'number',
      'string': 'string',
      'boolean': 'boolean',
      'typography': 'typography',
      'shadow': 'shadow',
      'border': 'border'
    };
    
    return typeMap[w3cType] || 'string';
  }

  // Syntax highlighting helpers
  highlightJSON(jsonString) {
    return jsonString
      .replace(/("([^"\\]|\\.)*")(\s*:)/g, '<span class="json-key">$1</span>$3')
      .replace(/:\s*("([^"\\]|\\.)*")/g, ': <span class="json-string">$1</span>')
      .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
      .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
      .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
      .replace(/([{}])/g, '<span class="json-brace">$1</span>')
      .replace(/([[\\]])/g, '<span class="json-bracket">$1</span>');
  }

  highlightCode(codeString, language) {
    // Basic syntax highlighting for CSS/SCSS/JS
    if (language === 'css' || language === 'scss') {
      return codeString
        .replace(/(--[\w-]+):/g, '<span class="css-property">$1</span>:')
        .replace(/(\$[\w-]+):/g, '<span class="scss-variable">$1</span>:')
        .replace(/(:[^;]+;)/g, '<span class="css-value">$1</span>')
        .replace(/([{}])/g, '<span class="css-brace">$1</span>');
    } else if (language === 'js') {
      return codeString
        .replace(/(module\.exports|theme|extend)/g, '<span class="js-keyword">$1</span>')
        .replace(/("([^"\\]|\\.)*")/g, '<span class="js-string">$1</span>')
        .replace(/([{}])/g, '<span class="js-brace">$1</span>');
    }
    
    return codeString;
  }

  showProcessingStatus(text) {
    const status = document.getElementById('processing-status');
    const textElement = document.getElementById('processing-text');
    
    textElement.textContent = text;
    status.style.display = 'flex';
  }

  hideProcessingStatus() {
    const status = document.getElementById('processing-status');
    status.style.display = 'none';
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TokenProcessor();
});