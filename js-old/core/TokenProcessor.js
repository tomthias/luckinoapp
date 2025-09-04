/**
 * TokenProcessor - Core class for processing design tokens
 * Combines plugin functionality with modern webapp features
 */

class TokenProcessor {
  constructor() {
    // Application state
    this.state = {
      collections: [],
      variables: [],
      selectedVariables: new Set(),
      selectedCollections: new Set(),
      selectedModes: new Set(),
      currentFormat: 'w3c',
      loadedData: null,
      isProcessing: false,
      stats: {
        totalTokens: 0,
        totalCollections: 0,
        totalModes: 0,
        detectedFormat: null
      }
    };
    
    // Components
    this.components = {
      variableTable: null,
      detailsPanel: null,
      uploadZone: null,
      notifications: null
    };
    
    // Event handlers
    this.eventHandlers = new Map();
    
    this.init();
  }

  init() {
    console.log('[TokenProcessor] Initializing...');
    
    // Initialize import pipeline and export engine
    this.importPipeline = new ImportPipelineOrchestrator(this);
    this.exportEngine = new ExportEngine(this);
    
    this.setupEventListeners();
    this.initializeComponents();
    this.updateUI();
    
    // Enable real-time analysis
    this.enableRealTimeAnalysis();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-item').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.getAttribute('data-tab'));
      });
    });

    // File import
    const fileImporter = document.getElementById('file-importer');
    const browseBtn = document.getElementById('browse-files-btn');
    
    if (browseBtn && fileImporter) {
      browseBtn.addEventListener('click', () => {
        fileImporter.click();
      });
      
      fileImporter.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          this.handleFileImport(e.target.files[0]);
        }
      });
    }

    // Example loading
    this.setupExampleButtons();
    
    // Search functionality
    const searchInput = document.getElementById('variable-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce((e) => {
        this.filterVariables(e.target.value);
      }, 300));
    }
    
    // Collection filter
    const collectionFilter = document.getElementById('collection-filter');
    if (collectionFilter) {
      collectionFilter.addEventListener('change', (e) => {
        this.filterByCollection(e.target.value);
      });
    }
    
    // Export functionality
    this.setupExportButtons();
  }

  setupExampleButtons() {
    const examples = [
      { id: 'load-simple-example', type: 'simple' },
      { id: 'load-multitheme-example', type: 'multiTheme' },
      { id: 'load-typography-example', type: 'typography' }
    ];

    examples.forEach(({ id, type }) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', () => {
          this.loadExample(type);
        });
      }
    });
  }

  setupExportButtons() {
    const exportBtn = document.getElementById('export-tokens-btn');
    const previewBtn = document.getElementById('preview-export-btn');
    
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportTokens();
      });
    }
    
    if (previewBtn) {
      previewBtn.addEventListener('click', () => {
        this.previewExport();
      });
    }
  }

  initializeComponents() {
    // Initialize UI components
    this.components.notifications = new NotificationSystem();
    this.initializeDragDrop();
  }

  initializeDragDrop() {
    const uploadZone = document.getElementById('upload-zone');
    if (!uploadZone) return;

    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      uploadZone.addEventListener(eventName, () => {
        uploadZone.classList.remove('dragover');
      }, false);
    });

    uploadZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileImport(files[0]);
      }
    }, false);

    // Click to upload
    uploadZone.addEventListener('click', () => {
      document.getElementById('file-importer')?.click();
    });
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  async handleFileImport(file) {
    if (!this.isValidFile(file)) {
      this.showNotification('Invalid file type. Please upload a JSON file.', 'error');
      return;
    }

    this.showProgress('Reading file...');
    
    try {
      const content = await this.readFile(file);
      let jsonData;
      
      if (file.name.endsWith('.zip')) {
        // Handle ZIP files
        jsonData = await this.handleZipFile(file);
      } else {
        // Handle JSON files
        jsonData = JSON.parse(content);
      }
      
      await this.processTokenData(jsonData, file.name);
      
    } catch (error) {
      console.error('[TokenProcessor] Import error:', error);
      this.showNotification(`Failed to import file: ${error.message}`, 'error');
    } finally {
      this.hideProgress();
    }
  }

  async processTokenData(jsonData, filename) {
    this.showProgress('Processing tokens with enterprise pipeline...');
    this.state.isProcessing = true;
    
    try {
      // Use ImportPipelineOrchestrator for robust processing
      const pipelineResult = await this.importPipeline.execute(jsonData, {
        strategy: 'merge-smart',
        validateTypes: true,
        resolveAliases: true
      });
      
      if (!pipelineResult.success) {
        throw new Error(`Pipeline failed at stage ${pipelineResult.stage}: ${pipelineResult.error}`);
      }
      
      // Extract results from pipeline
      const { results, metrics, formatInfo, warnings } = pipelineResult;
      
      // Update state with pipeline results
      this.state.loadedData = jsonData;
      this.state.variables = results.variables || [];
      this.state.collections = Array.from(results.collections?.values() || []);
      this.state.stats = {
        totalTokens: results.stats?.totalTokens || results.variables?.length || 0,
        totalCollections: results.stats?.totalCollections || results.collections?.size || 0,
        totalModes: 1, // Default mode for webapp
        detectedFormat: formatInfo?.format || 'unknown',
        processingTime: metrics?.endTime - metrics?.startTime,
        confidence: formatInfo?.confidence || 0
      };
      
      // Log pipeline metrics
      console.log('[TokenProcessor] Pipeline completed:', {
        processedTokens: metrics.processedTokens,
        createdVariables: metrics.createdVariables,
        errors: metrics.errors.length,
        warnings: metrics.warnings.length,
        duration: metrics.endTime - metrics.startTime
      });
      
      // Update UI
      this.updateStats();
      this.updateVariablesTable();
      this.switchTab('variables');
      
      // Show success notification with details
      const tokenCount = this.state.variables.length;
      const collectionCount = this.state.collections.length;
      let message = `Successfully imported ${tokenCount} tokens`;
      if (collectionCount > 1) {
        message += ` from ${collectionCount} collections`;
      }
      message += ` from ${filename}`;
      
      if (formatInfo.confidence < 80) {
        message += ` (${formatInfo.format} format, ${formatInfo.confidence}% confidence)`;
      }
      
      this.showNotification(message, 'success');
      
      // Show warnings if any
      if (warnings && warnings.length > 0) {
        console.warn('[TokenProcessor] Import warnings:', warnings);
        const warningMessage = `Import completed with ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`;
        setTimeout(() => this.showNotification(warningMessage, 'warning'), 1500);
      }
      
    } catch (error) {
      console.error('[TokenProcessor] Processing error:', error);
      this.showNotification(`Failed to process tokens: ${error.message}`, 'error');
      throw error;
    } finally {
      this.state.isProcessing = false;
      this.hideProgress();
    }
  }

  detectFormat(jsonData) {
    // Check for W3C Design Tokens format
    if (this.hasW3CStructure(jsonData)) {
      return 'w3c';
    }
    
    // Check for Token Studio format
    if (this.hasTokenStudioStructure(jsonData)) {
      return 'token-studio';
    }
    
    // Check for Style Dictionary format
    if (this.hasStyleDictionaryStructure(jsonData)) {
      return 'style-dictionary';
    }
    
    return 'unknown';
  }

  hasW3CStructure(data) {
    // Look for W3C token structure patterns
    const hasTokenProperties = (obj) => {
      if (typeof obj !== 'object' || obj === null) return false;
      return obj.hasOwnProperty('$value') || obj.hasOwnProperty('$type');
    };
    
    const checkNestedStructure = (obj) => {
      if (hasTokenProperties(obj)) return true;
      
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (checkNestedStructure(obj[key])) return true;
        }
      }
      return false;
    };
    
    return checkNestedStructure(data);
  }

  hasTokenStudioStructure(data) {
    // Check for Token Studio specific patterns
    const hasTokenStudioProps = (obj) => {
      if (typeof obj !== 'object' || obj === null) return false;
      return obj.hasOwnProperty('value') && obj.hasOwnProperty('type');
    };
    
    // Check for global tokens structure
    if (data.global && typeof data.global === 'object') {
      return true;
    }
    
    // Check for nested token structure
    for (const key in data) {
      const value = data[key];
      if (typeof value === 'object' && value !== null) {
        if (hasTokenStudioProps(value)) return true;
      }
    }
    
    return false;
  }

  hasStyleDictionaryStructure(data) {
    // Style Dictionary typically has a flatter structure
    // Look for common SD patterns
    return data.hasOwnProperty('color') || 
           data.hasOwnProperty('size') || 
           data.hasOwnProperty('font');
  }

  convertTokenStudioFormat(data) {
    // Convert Token Studio format to W3C format
    const converted = {};
    
    const convertTokenValue = (token) => {
      const result = {
        $value: token.value,
        $type: this.mapTokenStudioType(token.type)
      };
      
      if (token.description) {
        result.$description = token.description;
      }
      
      return result;
    };
    
    const processLevel = (source, target) => {
      for (const key in source) {
        const value = source[key];
        
        if (value && typeof value === 'object') {
          if (value.value !== undefined && value.type !== undefined) {
            // This is a token
            target[key] = convertTokenValue(value);
          } else {
            // This is a group
            target[key] = {};
            processLevel(value, target[key]);
          }
        }
      }
    };
    
    processLevel(data, converted);
    return converted;
  }

  mapTokenStudioType(tokenStudioType) {
    const typeMap = {
      'color': 'color',
      'dimension': 'dimension',
      'fontFamily': 'fontFamily',
      'fontWeight': 'fontWeight',
      'fontSize': 'dimension',
      'lineHeight': 'number',
      'spacing': 'dimension',
      'borderRadius': 'dimension',
      'borderWidth': 'dimension',
      'opacity': 'number',
      'boxShadow': 'shadow',
      'typography': 'typography'
    };
    
    return typeMap[tokenStudioType] || tokenStudioType;
  }

  analyzeTokenStructure(data) {
    const collections = [];
    const variables = [];
    const modes = new Set(['default']);
    
    const processTokens = (obj, path = [], collectionName = 'Default') => {
      for (const key in obj) {
        const value = obj[key];
        
        if (this.isToken(value)) {
          // This is a token
          const variable = {
            id: this.generateId(),
            name: key,
            path: [...path, key].join('/'),
            collection: collectionName,
            type: this.getTokenType(value),
            value: this.getTokenValue(value),
            description: value.$description || '',
            modes: { default: this.getTokenValue(value) },
            scopes: this.inferScopes(this.getTokenType(value))
          };
          
          variables.push(variable);
        } else if (typeof value === 'object' && value !== null) {
          // This is a group - recurse
          processTokens(value, [...path, key], collectionName);
        }
      }
    };
    
    // Check if data has collection structure
    if (this.hasCollectionStructure(data)) {
      for (const collectionName in data) {
        collections.push({
          id: this.generateId(),
          name: collectionName,
          modes: ['default']
        });
        processTokens(data[collectionName], [], collectionName);
      }
    } else {
      // Single collection
      collections.push({
        id: this.generateId(),
        name: 'Default',
        modes: ['default']
      });
      processTokens(data, [], 'Default');
    }
    
    return {
      collections,
      variables,
      modes: Array.from(modes)
    };
  }

  hasCollectionStructure(data) {
    // Simple heuristic to detect if top-level keys are collections
    const topLevelKeys = Object.keys(data);
    if (topLevelKeys.length <= 1) return false;
    
    // Check if top-level values contain tokens
    for (const key of topLevelKeys) {
      const value = data[key];
      if (typeof value === 'object' && value !== null) {
        if (this.containsTokens(value)) {
          return true;
        }
      }
    }
    
    return false;
  }

  containsTokens(obj) {
    for (const key in obj) {
      const value = obj[key];
      if (this.isToken(value)) return true;
      if (typeof value === 'object' && value !== null) {
        if (this.containsTokens(value)) return true;
      }
    }
    return false;
  }

  isToken(value) {
    return value && 
           typeof value === 'object' && 
           (value.hasOwnProperty('$value') || value.hasOwnProperty('value'));
  }

  getTokenType(token) {
    return token.$type || token.type || this.inferType(token.$value || token.value);
  }

  getTokenValue(token) {
    return token.$value || token.value;
  }

  inferType(value) {
    if (typeof value === 'string') {
      // Color detection
      if (value.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/) ||
          value.match(/^rgb\\(/) ||
          value.match(/^rgba\\(/) ||
          value.match(/^hsl\\(/) ||
          value.match(/^hsla\\(/)) {
        return 'color';
      }
      
      // Dimension detection
      if (value.match(/^\\d+(\\.\\d+)?(px|rem|em|%)$/)) {
        return 'dimension';
      }
      
      return 'string';
    }
    
    if (typeof value === 'number') {
      return 'number';
    }
    
    return 'unknown';
  }

  inferScopes(type) {
    const scopeMap = {
      'color': ['fill', 'stroke', 'text'],
      'dimension': ['width', 'height', 'gap', 'radius'],
      'fontFamily': ['text'],
      'fontSize': ['text'],
      'fontWeight': ['text'],
      'lineHeight': ['text'],
      'shadow': ['effect'],
      'typography': ['text']
    };
    
    return scopeMap[type] || [];
  }

  generateId() {
    return 'var_' + Math.random().toString(36).substr(2, 9);
  }

  async loadExample(type) {
    this.showProgress('Loading example...');
    
    try {
      // Load example data (this would be imported from examples.js)
      const exampleData = await this.getExampleData(type);
      await this.processTokenData(exampleData, `${type}-example.json`);
    } catch (error) {
      console.error('[TokenProcessor] Example load error:', error);
      this.showNotification(`Failed to load example: ${error.message}`, 'error');
    } finally {
      this.hideProgress();
    }
  }

  async getExampleData(type) {
    // This would typically load from examples.js
    // For now, return sample data
    const examples = {
      simple: {
        colors: {
          primary: { $value: '#DF2AA9', $type: 'color' },
          secondary: { $value: '#6B7280', $type: 'color' }
        },
        spacing: {
          small: { $value: '8px', $type: 'dimension' },
          medium: { $value: '16px', $type: 'dimension' }
        }
      },
      multiTheme: {
        colors: {
          primary: {
            $value: '#DF2AA9',
            $type: 'color',
            $description: 'Primary brand color'
          },
          text: {
            $value: '#1F2937',
            $type: 'color',
            modes: {
              light: '#1F2937',
              dark: '#F9FAFB'
            }
          }
        }
      },
      typography: {
        fonts: {
          heading: { $value: 'Inter', $type: 'fontFamily' },
          body: { $value: 'Inter', $type: 'fontFamily' }
        },
        sizes: {
          h1: { $value: '32px', $type: 'dimension' },
          h2: { $value: '24px', $type: 'dimension' },
          body: { $value: '16px', $type: 'dimension' }
        }
      }
    };
    
    return examples[type] || examples.simple;
  }

  switchTab(tabName) {
    // Update tab states
    document.querySelectorAll('.tab-item').forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === tabName;
      tab.setAttribute('aria-selected', isActive);
      tab.classList.toggle('active', isActive);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      const isActive = content.id === `${tabName}-tab`;
      content.classList.toggle('active', isActive);
    });
  }

  updateStats() {
    const elements = {
      'total-tokens-stat': this.state.stats.totalTokens,
      'collections-stat': this.state.stats.totalCollections,
      'modes-stat': this.state.stats.totalModes,
      'format-stat': this.state.stats.detectedFormat || '-'
    };
    
    for (const [id, value] of Object.entries(elements)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }
    
    // Update tab counters
    const counters = {
      'import-counter': this.state.stats.totalTokens > 0 ? '✓' : '0',
      'variables-counter': this.state.stats.totalTokens,
      'typography-counter': this.state.variables.filter(v => v.type.includes('font') || v.type === 'typography').length,
    };
    
    for (const [id, value] of Object.entries(counters)) {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
      }
    }
    
    // Show/hide stats section
    const statsSection = document.getElementById('import-stats');
    if (statsSection) {
      statsSection.style.display = this.state.stats.totalTokens > 0 ? 'block' : 'none';
    }
  }

  updateVariablesTable() {
    const tableBody = document.getElementById('variables-table-body');
    const emptyState = document.getElementById('table-empty-state');
    
    if (!tableBody || !emptyState) return;
    
    if (this.state.variables.length === 0) {
      tableBody.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }
    
    tableBody.style.display = '';
    emptyState.style.display = 'none';
    
    // Generate table rows
    tableBody.innerHTML = this.state.variables.map(variable => 
      this.generateVariableRow(variable)
    ).join('');
    
    // Add event listeners to rows
    this.addTableEventListeners();
  }

  generateVariableRow(variable) {
    const typeIcon = this.getTypeIcon(variable.type);
    const valueDisplay = this.formatValueDisplay(variable);
    const scopePills = this.formatScopePills(variable.scopes);
    
    return `
      <tr class="variable-row" data-variable-id="${variable.id}" data-type="${variable.type}" data-collection="${variable.collection}">
        <td class="col-select">
          <input type="checkbox" class="variable-checkbox" value="${variable.id}">
        </td>
        <td class="col-type">
          <span class="type-icon ${variable.type}-icon">${typeIcon}</span>
        </td>
        <td class="col-name">
          <div class="variable-name">
            <span class="name-text" onclick="tokenProcessor.showVariableDetails('${variable.id}')">${variable.name}</span>
            <span class="collection-badge">${variable.collection}</span>
          </div>
        </td>
        <td class="col-values">
          ${valueDisplay}
        </td>
        <td class="col-scope">
          ${scopePills}
        </td>
        <td class="col-actions">
          <button class="btn-action" onclick="tokenProcessor.editVariable('${variable.id}')" title="Edit">✏️</button>
          <button class="btn-action" onclick="tokenProcessor.copyVariable('${variable.id}')" title="Copy">📋</button>
          <button class="btn-action" onclick="tokenProcessor.deleteVariable('${variable.id}')" title="Delete">🗑️</button>
        </td>
      </tr>
    `;
  }

  getTypeIcon(type) {
    const icons = {
      color: '🎨',
      dimension: '📏',
      fontFamily: '🔤',
      fontSize: '📝',
      fontWeight: '💪',
      shadow: '🌫️',
      typography: '✍️',
      number: '🔢'
    };
    
    return icons[type] || '🔧';
  }

  formatValueDisplay(variable) {
    if (variable.type === 'color') {
      return `
        <div class="mode-values">
          <div class="mode-value" data-mode="default">
            <div class="color-swatch" style="background: ${variable.value}"></div>
            <span class="color-value">${variable.value}</span>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="mode-values">
        <div class="mode-value" data-mode="default">
          <span class="value-text">${variable.value}</span>
        </div>
      </div>
    `;
  }

  formatScopePills(scopes) {
    return `
      <div class="scope-pills">
        ${scopes.map(scope => 
          `<span class="scope-pill active">${scope}</span>`
        ).join('')}
      </div>
    `;
  }

  addTableEventListeners() {
    // Checkbox selection
    const checkboxes = document.querySelectorAll('.variable-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.handleVariableSelection(e.target.value, e.target.checked);
      });
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.handleSelectAll(e.target.checked);
      });
    }
  }

  handleVariableSelection(variableId, selected) {
    if (selected) {
      this.state.selectedVariables.add(variableId);
    } else {
      this.state.selectedVariables.delete(variableId);
    }
    
    this.updateBulkActions();
  }

  handleSelectAll(selectAll) {
    const checkboxes = document.querySelectorAll('.variable-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAll;
      this.handleVariableSelection(checkbox.value, selectAll);
    });
  }

  updateBulkActions() {
    const bulkActions = document.getElementById('bulk-actions');
    const selectionCount = document.getElementById('selection-count');
    
    if (bulkActions && selectionCount) {
      const count = this.state.selectedVariables.size;
      bulkActions.style.display = count > 0 ? 'flex' : 'none';
      selectionCount.textContent = `${count} selected`;
    }
  }

  // Utility methods
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  async readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = e => reject(e);
      reader.readAsText(file);
    });
  }

  isValidFile(file) {
    const validTypes = ['application/json', 'text/json', 'application/zip'];
    const validExtensions = ['.json', '.zip'];
    
    return validTypes.includes(file.type) || 
           validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  }

  showProgress(message = 'Processing...') {
    const progressElement = document.getElementById('upload-status');
    const textElement = document.getElementById('status-text');
    
    if (progressElement && textElement) {
      textElement.textContent = message;
      progressElement.style.display = 'block';
    }
    
    this.state.isProcessing = true;
  }

  hideProgress() {
    const progressElement = document.getElementById('upload-status');
    if (progressElement) {
      progressElement.style.display = 'none';
    }
    
    this.state.isProcessing = false;
  }

  showNotification(message, type = 'info') {
    if (this.components.notifications) {
      this.components.notifications.show(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  // Placeholder methods for future implementation
  filterVariables(searchTerm) {
    console.log('[TokenProcessor] Filtering variables:', searchTerm);
    // TODO: Implement variable filtering
  }

  filterByCollection(collectionName) {
    console.log('[TokenProcessor] Filtering by collection:', collectionName);
    // TODO: Implement collection filtering
  }

  showVariableDetails(variableId) {
    console.log('[TokenProcessor] Showing variable details:', variableId);
    // TODO: Implement details panel
  }

  editVariable(variableId) {
    console.log('[TokenProcessor] Editing variable:', variableId);
    // TODO: Implement variable editing
  }

  copyVariable(variableId) {
    console.log('[TokenProcessor] Copying variable:', variableId);
    // TODO: Implement variable copying
  }

  deleteVariable(variableId) {
    console.log('[TokenProcessor] Deleting variable:', variableId);
    // TODO: Implement variable deletion
  }

  async exportTokens() {
    console.log('[TokenProcessor] Exporting tokens');
    
    if (!this.state.variables || this.state.variables.length === 0) {
      this.showNotification('No tokens to export. Please import tokens first.', 'warning');
      return;
    }
    
    try {
      // Get export settings from UI
      const exportSettings = this.getExportSettings();
      
      // Show progress
      this.showProgress('Exporting tokens...');
      
      // Export using ExportEngine
      const result = await this.exportEngine.export(exportSettings);
      
      if (result.success) {
        // Download the files
        this.exportEngine.downloadFiles(result);
        
        // Show success notification
        this.showNotification(result.message || 'Export completed successfully', 'success');
      } else {
        throw new Error(result.error || 'Export failed');
      }
      
    } catch (error) {
      console.error('[TokenProcessor] Export error:', error);
      this.showNotification(`Export failed: ${error.message}`, 'error');
    } finally {
      this.hideProgress();
    }
  }

  getExportSettings() {
    // Get settings from export panel UI
    const formatSelect = document.getElementById('export-format');
    const exportTypeSelect = document.getElementById('export-type');
    const filenameInput = document.getElementById('export-filename');
    
    // Get selected collections and variables
    const selectedCollections = this.state.selectedCollections.size > 0 
      ? this.state.collections.filter(c => this.state.selectedCollections.has(c.id))
      : this.state.collections;
      
    const selectedVariables = this.state.selectedVariables.size > 0
      ? this.state.variables.filter(v => this.state.selectedVariables.has(v.id))
      : this.state.variables;
    
    return {
      format: formatSelect?.value || 'w3c',
      exportType: exportTypeSelect?.value || 'single',
      collections: selectedCollections,
      variables: selectedVariables,
      modes: ['Default'], // For webapp, we use default mode
      types: ['color', 'dimension', 'string', 'number', 'boolean'],
      filename: filenameInput?.value || 'tokens',
      cssOptions: {
        includeComments: true,
        includeMetadata: true
      }
    };
  }

  async previewExport() {
    console.log('[TokenProcessor] Previewing export');
    
    if (!this.state.variables || this.state.variables.length === 0) {
      this.showNotification('No tokens to preview. Please import tokens first.', 'warning');
      return;
    }
    
    try {
      // Get export settings
      const exportSettings = this.getExportSettings();
      
      // Show progress
      this.showProgress('Generating preview...');
      
      // Generate preview using ExportEngine
      const result = await this.exportEngine.export(exportSettings);
      
      if (result.success && result.files && result.files.length > 0) {
        // Show preview in modal or panel
        const previewContent = result.files[0].content;
        this.showExportPreview(previewContent, exportSettings.format);
      } else {
        throw new Error(result.error || 'Preview generation failed');
      }
      
    } catch (error) {
      console.error('[TokenProcessor] Preview error:', error);
      this.showNotification(`Preview failed: ${error.message}`, 'error');
    } finally {
      this.hideProgress();
    }
  }
  
  showExportPreview(content, format) {
    // Create or update preview modal
    let modal = document.getElementById('export-preview-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'export-preview-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Export Preview (${format.toUpperCase()})</h3>
            <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <pre id="export-preview-content"></pre>
          </div>
          <div class="modal-footer">
            <button onclick="this.closest('.modal-overlay').remove()" class="btn">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    // Update content
    const previewElement = modal.querySelector('#export-preview-content');
    previewElement.textContent = content;
    
    // Show modal
    modal.style.display = 'flex';
  }
  
  /**
   * Real-time Analysis and Preview Functions
   */
  
  enableRealTimeAnalysis() {
    // Watch for data changes and update analytics
    this.setupAnalyticsObserver();
    this.startPeriodicUpdates();
  }
  
  setupAnalyticsObserver() {
    // Create observer for state changes
    this.stateObserver = new Proxy(this.state, {
      set: (target, property, value) => {
        const oldValue = target[property];
        target[property] = value;
        
        // Trigger real-time updates
        if (property === 'variables' && oldValue !== value) {
          this.debounceAnalysis();
        }
        
        return true;
      }
    });
  }
  
  debounceAnalysis() {
    // Debounce analysis to avoid too frequent updates
    if (this.analysisTimer) {
      clearTimeout(this.analysisTimer);
    }
    
    this.analysisTimer = setTimeout(() => {
      this.performRealTimeAnalysis();
    }, 300);
  }
  
  async performRealTimeAnalysis() {
    if (!this.state.variables || this.state.variables.length === 0) {
      this.clearAnalysis();
      return;
    }
    
    try {
      // Perform comprehensive analysis
      const analysis = await this.analyzeTokensInDepth(this.state.variables);
      
      // Update UI with analysis results
      this.updateAnalysisDisplay(analysis);
      this.updateStatistics(analysis);
      this.updateHealthScore(analysis);
      
      console.log('[TokenProcessor] Real-time analysis completed:', analysis);
      
    } catch (error) {
      console.error('[TokenProcessor] Real-time analysis failed:', error);
    }
  }
  
  async analyzeTokensInDepth(variables) {
    const analysis = {
      timestamp: Date.now(),
      totalTokens: variables.length,
      collections: new Map(),
      types: new Map(),
      scopes: new Map(),
      duplicates: [],
      orphaned: [],
      issues: [],
      coverage: {},
      healthScore: 0,
      suggestions: []
    };
    
    // Analyze by type
    for (const variable of variables) {
      const type = variable.type || 'unknown';
      analysis.types.set(type, (analysis.types.get(type) || 0) + 1);
      
      // Collection analysis
      const collection = variable.collection || 'Default';
      if (!analysis.collections.has(collection)) {
        analysis.collections.set(collection, { count: 0, types: new Set(), variables: [] });
      }
      const collectionData = analysis.collections.get(collection);
      collectionData.count++;
      collectionData.types.add(type);
      collectionData.variables.push(variable);
      
      // Scope analysis
      if (variable.scopes) {
        for (const scope of variable.scopes) {
          analysis.scopes.set(scope, (analysis.scopes.get(scope) || 0) + 1);
        }
      }
    }
    
    // Find duplicates
    analysis.duplicates = this.findDuplicateTokens(variables);
    
    // Find naming issues
    analysis.issues = this.findNamingIssues(variables);
    
    // Calculate coverage
    analysis.coverage = this.calculateTypeCoverage(variables);
    
    // Calculate health score
    analysis.healthScore = this.calculateHealthScore(analysis);
    
    // Generate suggestions
    analysis.suggestions = this.generateSuggestions(analysis);
    
    return analysis;
  }
  
  findDuplicateTokens(variables) {
    const duplicates = [];
    const valueMap = new Map();
    
    for (const variable of variables) {
      const key = `${variable.type}:${JSON.stringify(variable.value)}`;
      
      if (valueMap.has(key)) {
        duplicates.push({
          original: valueMap.get(key),
          duplicate: variable,
          type: 'value'
        });
      } else {
        valueMap.set(key, variable);
      }
    }
    
    return duplicates;
  }
  
  findNamingIssues(variables) {
    const issues = [];
    
    for (const variable of variables) {
      const name = variable.name;
      
      // Check naming conventions
      if (name.includes(' ')) {
        issues.push({
          variable,
          type: 'naming',
          severity: 'warning',
          message: 'Token name contains spaces'
        });
      }
      
      if (name.length < 3) {
        issues.push({
          variable,
          type: 'naming',
          severity: 'info',
          message: 'Token name is very short'
        });
      }
      
      if (name.length > 50) {
        issues.push({
          variable,
          type: 'naming',
          severity: 'warning',
          message: 'Token name is very long'
        });
      }
      
      // Check for inconsistent casing
      if (name !== name.toLowerCase() && name !== name.toUpperCase() && !this.isKebabCase(name) && !this.isCamelCase(name)) {
        issues.push({
          variable,
          type: 'naming',
          severity: 'info',
          message: 'Inconsistent naming convention'
        });
      }
    }
    
    return issues;
  }
  
  isKebabCase(str) {
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(str);
  }
  
  isCamelCase(str) {
    return /^[a-z][a-zA-Z0-9]*$/.test(str);
  }
  
  calculateTypeCoverage(variables) {
    const expectedTypes = ['color', 'dimension', 'string', 'number', 'boolean'];
    const coverage = {};
    
    for (const type of expectedTypes) {
      const count = variables.filter(v => v.type === type).length;
      coverage[type] = {
        count,
        percentage: variables.length > 0 ? Math.round((count / variables.length) * 100) : 0
      };
    }
    
    return coverage;
  }
  
  calculateHealthScore(analysis) {
    let score = 100;
    
    // Deduct for issues
    score -= analysis.issues.filter(i => i.severity === 'error').length * 10;
    score -= analysis.issues.filter(i => i.severity === 'warning').length * 5;
    score -= analysis.issues.filter(i => i.severity === 'info').length * 2;
    
    // Deduct for duplicates
    score -= analysis.duplicates.length * 5;
    
    // Bonus for good practices
    if (analysis.collections.size > 1) score += 5;
    if (analysis.types.size >= 3) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
  
  generateSuggestions(analysis) {
    const suggestions = [];
    
    if (analysis.duplicates.length > 0) {
      suggestions.push({
        type: 'optimization',
        priority: 'high',
        title: 'Remove duplicate tokens',
        description: `Found ${analysis.duplicates.length} duplicate token${analysis.duplicates.length > 1 ? 's' : ''}`,
        action: 'review-duplicates'
      });
    }
    
    if (analysis.issues.length > 5) {
      suggestions.push({
        type: 'quality',
        priority: 'medium',
        title: 'Improve naming consistency',
        description: `${analysis.issues.length} naming issues found`,
        action: 'review-naming'
      });
    }
    
    if (analysis.collections.size === 1 && analysis.totalTokens > 20) {
      suggestions.push({
        type: 'organization',
        priority: 'low',
        title: 'Consider organizing tokens into collections',
        description: 'All tokens are in one collection',
        action: 'organize-collections'
      });
    }
    
    return suggestions;
  }
  
  updateAnalysisDisplay(analysis) {
    // Update analysis panel if it exists
    const analysisPanel = document.getElementById('analysis-panel');
    if (!analysisPanel) return;
    
    // Update type distribution chart
    this.updateTypeChart(analysis.types);
    
    // Update collection breakdown
    this.updateCollectionBreakdown(analysis.collections);
    
    // Update issues list
    this.updateIssuesList(analysis.issues);
    
    // Update suggestions
    this.updateSuggestions(analysis.suggestions);
  }
  
  updateTypeChart(typesMap) {
    const chartContainer = document.getElementById('type-chart');
    if (!chartContainer) return;
    
    const types = Array.from(typesMap.entries());
    const total = types.reduce((sum, [, count]) => sum + count, 0);
    
    chartContainer.innerHTML = types.map(([type, count]) => {
      const percentage = Math.round((count / total) * 100);
      return `
        <div class="chart-bar">
          <div class="chart-label">${type}</div>
          <div class="chart-bar-fill" style="width: ${percentage}%"></div>
          <div class="chart-value">${count} (${percentage}%)</div>
        </div>
      `;
    }).join('');
  }
  
  updateCollectionBreakdown(collectionsMap) {
    const container = document.getElementById('collection-breakdown');
    if (!container) return;
    
    const collections = Array.from(collectionsMap.entries());
    
    container.innerHTML = collections.map(([name, data]) => `
      <div class="collection-item">
        <div class="collection-name">${name}</div>
        <div class="collection-stats">
          ${data.count} tokens • ${data.types.size} types
        </div>
      </div>
    `).join('');
  }
  
  updateIssuesList(issues) {
    const container = document.getElementById('issues-list');
    if (!container) return;
    
    if (issues.length === 0) {
      container.innerHTML = '<div class="no-issues">✅ No issues found!</div>';
      return;
    }
    
    container.innerHTML = issues.map(issue => `
      <div class="issue-item ${issue.severity}">
        <div class="issue-icon">${this.getIssueIcon(issue.severity)}</div>
        <div class="issue-content">
          <div class="issue-token">${issue.variable.name}</div>
          <div class="issue-message">${issue.message}</div>
        </div>
      </div>
    `).join('');
  }
  
  getIssueIcon(severity) {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  }
  
  updateSuggestions(suggestions) {
    const container = document.getElementById('suggestions-list');
    if (!container) return;
    
    if (suggestions.length === 0) {
      container.innerHTML = '<div class="no-suggestions">✨ Your tokens look great!</div>';
      return;
    }
    
    container.innerHTML = suggestions.map(suggestion => `
      <div class="suggestion-item ${suggestion.priority}">
        <div class="suggestion-header">
          <div class="suggestion-title">${suggestion.title}</div>
          <div class="suggestion-priority">${suggestion.priority}</div>
        </div>
        <div class="suggestion-description">${suggestion.description}</div>
        <button class="suggestion-action btn-sm" data-action="${suggestion.action}">
          Take Action
        </button>
      </div>
    `).join('');
    
    // Add event listeners for action buttons
    container.querySelectorAll('.suggestion-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleSuggestionAction(action);
      });
    });
  }
  
  handleSuggestionAction(action) {
    switch (action) {
      case 'review-duplicates':
        this.showDuplicateReview();
        break;
      case 'review-naming':
        this.showNamingReview();
        break;
      case 'organize-collections':
        this.showCollectionOrganizer();
        break;
    }
  }
  
  updateStatistics(analysis) {
    // Update stats display
    const statsElements = {
      'stat-total-tokens': analysis.totalTokens,
      'stat-collections': analysis.collections.size,
      'stat-types': analysis.types.size,
      'stat-issues': analysis.issues.length,
      'stat-duplicates': analysis.duplicates.length
    };
    
    for (const [elementId, value] of Object.entries(statsElements)) {
      const element = document.getElementById(elementId);
      if (element) {
        element.textContent = value;
      }
    }
  }
  
  updateHealthScore(analysis) {
    const scoreElement = document.getElementById('health-score');
    const scoreMeterElement = document.getElementById('health-score-meter');
    
    if (scoreElement) {
      scoreElement.textContent = analysis.healthScore;
    }
    
    if (scoreMeterElement) {
      scoreMeterElement.style.width = `${analysis.healthScore}%`;
      
      // Color based on score
      if (analysis.healthScore >= 90) {
        scoreMeterElement.className = 'health-meter excellent';
      } else if (analysis.healthScore >= 70) {
        scoreMeterElement.className = 'health-meter good';
      } else if (analysis.healthScore >= 50) {
        scoreMeterElement.className = 'health-meter fair';
      } else {
        scoreMeterElement.className = 'health-meter poor';
      }
    }
  }
  
  clearAnalysis() {
    // Clear all analysis displays
    const containers = [
      'type-chart',
      'collection-breakdown', 
      'issues-list',
      'suggestions-list'
    ];
    
    containers.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.innerHTML = '<div class="no-data">No data to analyze</div>';
      }
    });
  }
  
  startPeriodicUpdates() {
    // Update analytics every 30 seconds
    if (this.periodicUpdateTimer) {
      clearInterval(this.periodicUpdateTimer);
    }
    
    this.periodicUpdateTimer = setInterval(() => {
      if (this.state.variables && this.state.variables.length > 0) {
        this.performRealTimeAnalysis();
      }
    }, 30000);
  }
  
  stopPeriodicUpdates() {
    if (this.periodicUpdateTimer) {
      clearInterval(this.periodicUpdateTimer);
      this.periodicUpdateTimer = null;
    }
  }
}

// Simple notification system
class NotificationSystem {
  show(message, type = 'info') {
    const container = document.getElementById('snackbar-container');
    if (!container) return;
    
    const snackbar = document.createElement('div');
    snackbar.className = `snackbar ${type}`;
    snackbar.innerHTML = `
      <span>${message}</span>
      <button onclick="this.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer;">&times;</button>
    `;
    
    container.appendChild(snackbar);
    
    // Show animation
    setTimeout(() => snackbar.classList.add('show'), 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      snackbar.classList.remove('show');
      setTimeout(() => snackbar.remove(), 400);
    }, 5000);
  }
}

// Global instance
let tokenProcessor;