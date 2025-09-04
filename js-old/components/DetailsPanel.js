/**
 * DetailsPanel Component
 * Figma-style variable details sidebar panel
 */

class DetailsPanel {
  constructor(processor) {
    this.processor = processor;
    this.panel = document.getElementById('details-panel');
    this.currentVariable = null;
    this.isVisible = false;
    
    this.init();
  }

  init() {
    if (!this.panel) {
      console.warn('[DetailsPanel] Panel element not found');
      return;
    }
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Close button
    const closeBtn = document.getElementById('details-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isVisible && 
          !this.panel.contains(e.target) && 
          !e.target.closest('.variable-row') &&
          !e.target.closest('.variable-card')) {
        this.hide();
      }
    });
    
    // Syntax tab switching
    document.addEventListener('click', (e) => {
      if (e.target.matches('.syntax-tab')) {
        this.switchSyntaxTab(e.target.dataset.syntax);
      }
    });
    
    // Copy buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('#copy-variable-name')) {
        this.copyVariableName();
      } else if (e.target.matches('#copy-syntax')) {
        this.copySyntaxCode();
      }
    });
    
    // Variable name editing
    const nameInput = document.getElementById('variable-name-input');
    if (nameInput) {
      nameInput.addEventListener('input', (e) => {
        this.updateVariableName(e.target.value);
      });
    }
    
    // Description editing
    const descriptionTextarea = document.getElementById('variable-description');
    if (descriptionTextarea) {
      descriptionTextarea.addEventListener('input', (e) => {
        this.updateVariableDescription(e.target.value);
      });
    }
  }

  show(variable) {
    if (!variable || !this.panel) return;
    
    this.currentVariable = variable;
    this.renderVariableDetails();
    
    // Show panel with animation
    this.panel.style.display = 'flex';
    
    // Add body class for layout adjustment
    document.body.classList.add('panel-open');
    
    // Trigger animation
    requestAnimationFrame(() => {
      this.panel.classList.add('show');
      this.isVisible = true;
    });
    
    // Focus management
    const nameInput = document.getElementById('variable-name-input');
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  }

  hide() {
    if (!this.panel || !this.isVisible) return;
    
    this.panel.classList.remove('show');
    document.body.classList.remove('panel-open');
    
    // Wait for animation to complete
    setTimeout(() => {
      this.panel.style.display = 'none';
      this.isVisible = false;
      this.currentVariable = null;
    }, 200);
  }

  renderVariableDetails() {
    if (!this.currentVariable) return;
    
    const variable = this.currentVariable;
    
    // Update type indicator
    this.updateTypeIndicator(variable.type);
    
    // Update variable name
    const nameInput = document.getElementById('variable-name-input');
    if (nameInput) {
      nameInput.value = variable.name;
    }
    
    // Update description
    const descriptionTextarea = document.getElementById('variable-description');
    if (descriptionTextarea) {
      descriptionTextarea.value = variable.description || '';
    }
    
    // Update values section
    this.renderModeEditors(variable);
    
    // Update syntax preview
    this.updateSyntaxPreview();
  }

  updateTypeIndicator(type) {
    const indicator = document.getElementById('detail-type-indicator');
    if (!indicator) return;
    
    const typeConfig = this.getTypeConfig(type);
    indicator.className = `variable-type-indicator ${type}`;
    indicator.textContent = typeConfig.label;
    indicator.style.background = typeConfig.bgColor;
    indicator.style.color = typeConfig.textColor;
  }

  getTypeConfig(type) {
    const configs = {
      color: {
        label: 'Color',
        bgColor: 'var(--color-primary-alpha-10)',
        textColor: 'var(--color-primary)'
      },
      dimension: {
        label: 'Dimension',
        bgColor: 'var(--color-success-bg)',
        textColor: 'var(--color-success)'
      },
      fontFamily: {
        label: 'Font Family',
        bgColor: 'var(--color-warning-bg)',
        textColor: 'var(--color-warning)'
      },
      fontSize: {
        label: 'Font Size',
        bgColor: 'var(--color-warning-bg)',
        textColor: 'var(--color-warning)'
      },
      typography: {
        label: 'Typography',
        bgColor: 'var(--color-warning-bg)',
        textColor: 'var(--color-warning)'
      },
      shadow: {
        label: 'Shadow',
        bgColor: 'var(--color-gray-100)',
        textColor: 'var(--color-gray-600)'
      },
      number: {
        label: 'Number',
        bgColor: 'var(--color-gray-100)',
        textColor: 'var(--color-gray-600)'
      }
    };
    
    return configs[type] || {
      label: type.charAt(0).toUpperCase() + type.slice(1),
      bgColor: 'var(--color-gray-100)',
      textColor: 'var(--color-gray-600)'
    };
  }

  renderModeEditors(variable) {
    const container = document.getElementById('mode-editors');
    if (!container) return;
    
    // For now, we'll handle single mode (default)
    // In the future, this could be expanded for multi-mode support
    const modes = variable.modes || { default: variable.value };
    
    container.innerHTML = Object.entries(modes).map(([modeName, modeValue]) => 
      this.renderModeEditor(modeName, modeValue, variable.type)
    ).join('');
    
    // Add event listeners to mode editors
    this.addModeEditorListeners();
  }

  renderModeEditor(modeName, value, type) {
    const displayName = modeName === 'default' ? 'Default' : modeName;
    
    if (type === 'color') {
      return this.renderColorEditor(displayName, value);
    } else if (type === 'dimension') {
      return this.renderDimensionEditor(displayName, value);
    } else {
      return this.renderGenericEditor(displayName, value, type);
    }
  }

  renderColorEditor(modeName, value) {
    const colorValue = this.normalizeColorValue(value);
    
    return `
      <div class="mode-editor" data-mode="${modeName.toLowerCase()}">
        <div class="mode-header">
          <span class="mode-name">${modeName}</span>
          <div class="color-preview-large" style="background: ${colorValue}"></div>
        </div>
        <div class="mode-controls">
          <div class="color-input-group">
            <input type="color" 
                   class="color-picker" 
                   value="${this.toHexColor(colorValue)}"
                   data-mode="${modeName.toLowerCase()}">
            <input type="text" 
                   class="color-text" 
                   value="${colorValue}"
                   data-mode="${modeName.toLowerCase()}"
                   placeholder="Enter color value">
          </div>
          <div class="color-formats">
            <button class="format-btn" onclick="detailsPanel.convertColor('${modeName.toLowerCase()}', 'hex')">HEX</button>
            <button class="format-btn" onclick="detailsPanel.convertColor('${modeName.toLowerCase()}', 'rgb')">RGB</button>
            <button class="format-btn" onclick="detailsPanel.convertColor('${modeName.toLowerCase()}', 'hsl')">HSL</button>
          </div>
        </div>
      </div>
    `;
  }

  renderDimensionEditor(modeName, value) {
    const numericValue = parseFloat(value);
    const unit = value.toString().replace(/[\\d.-]/g, '') || 'px';
    
    return `
      <div class="mode-editor" data-mode="${modeName.toLowerCase()}">
        <div class="mode-header">
          <span class="mode-name">${modeName}</span>
          <span class="dimension-preview">${value}</span>
        </div>
        <div class="mode-controls">
          <div class="dimension-input-group">
            <input type="number" 
                   class="dimension-number" 
                   value="${numericValue}"
                   data-mode="${modeName.toLowerCase()}"
                   step="0.1">
            <select class="dimension-unit" data-mode="${modeName.toLowerCase()}">
              <option value="px" ${unit === 'px' ? 'selected' : ''}>px</option>
              <option value="rem" ${unit === 'rem' ? 'selected' : ''}>rem</option>
              <option value="em" ${unit === 'em' ? 'selected' : ''}>em</option>
              <option value="%" ${unit === '%' ? 'selected' : ''}">%</option>
              <option value="vh" ${unit === 'vh' ? 'selected' : ''}>vh</option>
              <option value="vw" ${unit === 'vw' ? 'selected' : ''}>vw</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  renderGenericEditor(modeName, value, type) {
    return `
      <div class="mode-editor" data-mode="${modeName.toLowerCase()}">
        <div class="mode-header">
          <span class="mode-name">${modeName}</span>
          <span class="value-type">${type}</span>
        </div>
        <div class="mode-controls">
          <input type="text" 
                 class="generic-value" 
                 value="${value}"
                 data-mode="${modeName.toLowerCase()}"
                 placeholder="Enter ${type} value">
        </div>
      </div>
    `;
  }

  addModeEditorListeners() {
    // Color picker changes
    document.querySelectorAll('.color-picker').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const textInput = e.target.parentElement.querySelector('.color-text');
        if (textInput) {
          textInput.value = e.target.value;
          this.updateVariableValue(e.target.dataset.mode, e.target.value);
        }
      });
    });
    
    // Color text input changes
    document.querySelectorAll('.color-text').forEach(input => {
      input.addEventListener('input', (e) => {
        const colorPicker = e.target.parentElement.querySelector('.color-picker');
        if (colorPicker && this.isValidColor(e.target.value)) {
          colorPicker.value = this.toHexColor(e.target.value);
        }
        this.updateVariableValue(e.target.dataset.mode, e.target.value);
      });
    });
    
    // Dimension inputs
    document.querySelectorAll('.dimension-number, .dimension-unit').forEach(input => {
      input.addEventListener('input', (e) => {
        const container = e.target.parentElement;
        const number = container.querySelector('.dimension-number').value;
        const unit = container.querySelector('.dimension-unit').value;
        const fullValue = `${number}${unit}`;
        
        this.updateVariableValue(e.target.dataset.mode, fullValue);
      });
    });
    
    // Generic value inputs
    document.querySelectorAll('.generic-value').forEach(input => {
      input.addEventListener('input', (e) => {
        this.updateVariableValue(e.target.dataset.mode, e.target.value);
      });
    });
  }

  switchSyntaxTab(syntax) {
    // Update tab states
    document.querySelectorAll('.syntax-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.syntax === syntax);
    });
    
    // Update syntax preview
    this.updateSyntaxPreview(syntax);
  }

  updateSyntaxPreview(syntax = 'css') {
    const preview = document.getElementById('syntax-preview');
    if (!preview || !this.currentVariable) return;
    
    const variable = this.currentVariable;
    let syntaxCode = '';
    
    switch (syntax) {
      case 'css':
        syntaxCode = `var(--${this.toCSSVariableName(variable.name)})`;
        break;
      case 'scss':
        syntaxCode = `$${this.toSCSSVariableName(variable.name)}`;
        break;
      case 'js':
        syntaxCode = `tokens.${this.toJSVariableName(variable.path)}`;
        break;
      default:
        syntaxCode = variable.name;
    }
    
    preview.textContent = syntaxCode;
  }

  toCSSVariableName(name) {
    return name.toLowerCase()
               .replace(/[^a-z0-9]/g, '-')
               .replace(/-+/g, '-')
               .replace(/^-|-$/g, '');
  }

  toSCSSVariableName(name) {
    return name.toLowerCase()
               .replace(/[^a-z0-9]/g, '-')
               .replace(/-+/g, '-')
               .replace(/^-|-$/g, '');
  }

  toJSVariableName(path) {
    return path.split('/')
               .map(part => part.replace(/[^a-zA-Z0-9]/g, ''))
               .join('.');
  }

  copyVariableName() {
    if (!this.currentVariable) return;
    
    navigator.clipboard.writeText(this.currentVariable.name).then(() => {
      this.showCopyFeedback('copy-variable-name');
    });
  }

  copySyntaxCode() {
    const preview = document.getElementById('syntax-preview');
    if (!preview) return;
    
    navigator.clipboard.writeText(preview.textContent).then(() => {
      this.showCopyFeedback('copy-syntax');
    });
  }

  showCopyFeedback(buttonId) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const originalText = button.textContent;
    button.textContent = '✓';
    button.style.color = 'var(--color-success)';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.color = '';
    }, 1000);
  }

  updateVariableName(newName) {
    if (!this.currentVariable || !newName.trim()) return;
    
    this.currentVariable.name = newName.trim();
    this.updateSyntaxPreview();
    
    // Notify processor of change
    if (this.processor && typeof this.processor.updateVariable === 'function') {
      this.processor.updateVariable(this.currentVariable.id, 'name', newName);
    }
  }

  updateVariableDescription(newDescription) {
    if (!this.currentVariable) return;
    
    this.currentVariable.description = newDescription;
    
    // Notify processor of change
    if (this.processor && typeof this.processor.updateVariable === 'function') {
      this.processor.updateVariable(this.currentVariable.id, 'description', newDescription);
    }
  }

  updateVariableValue(mode, newValue) {
    if (!this.currentVariable) return;
    
    if (mode === 'default' || !this.currentVariable.modes) {
      this.currentVariable.value = newValue;
    } else {
      this.currentVariable.modes[mode] = newValue;
    }
    
    // Notify processor of change
    if (this.processor && typeof this.processor.updateVariable === 'function') {
      this.processor.updateVariable(this.currentVariable.id, 'value', newValue);
    }
  }

  convertColor(mode, format) {
    if (!this.currentVariable) return;
    
    const currentValue = mode === 'default' ? this.currentVariable.value : 
                        this.currentVariable.modes[mode];
    
    let convertedValue = currentValue;
    
    try {
      switch (format) {
        case 'hex':
          convertedValue = this.toHexColor(currentValue);
          break;
        case 'rgb':
          convertedValue = this.toRgbColor(currentValue);
          break;
        case 'hsl':
          convertedValue = this.toHslColor(currentValue);
          break;
      }
      
      // Update the text input
      const textInput = document.querySelector(`[data-mode="${mode}"].color-text`);
      if (textInput) {
        textInput.value = convertedValue;
        this.updateVariableValue(mode, convertedValue);
      }
    } catch (error) {
      console.warn('[DetailsPanel] Color conversion failed:', error);
    }
  }

  // Color utility methods
  normalizeColorValue(value) {
    if (typeof value === 'string') {
      return value.trim();
    }
    return String(value);
  }

  toHexColor(color) {
    // Simple hex conversion - in production, use a proper color library
    if (color.startsWith('#')) return color;
    
    // Handle common color names
    const colorNames = {
      red: '#FF0000',
      green: '#00FF00',
      blue: '#0000FF',
      white: '#FFFFFF',
      black: '#000000'
    };
    
    return colorNames[color.toLowerCase()] || color;
  }

  toRgbColor(color) {
    // Simplified RGB conversion
    if (color.startsWith('rgb')) return color;
    
    // For demo purposes, return original if can't convert
    return color;
  }

  toHslColor(color) {
    // Simplified HSL conversion
    if (color.startsWith('hsl')) return color;
    
    // For demo purposes, return original if can't convert
    return color;
  }

  isValidColor(color) {
    // Basic color validation
    const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbPattern = /^rgb\\(/;
    const hslPattern = /^hsl\\(/;
    
    return hexPattern.test(color) || rgbPattern.test(color) || hslPattern.test(color);
  }

  // Public API methods
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else if (this.currentVariable) {
      this.show(this.currentVariable);
    }
  }

  isOpen() {
    return this.isVisible;
  }

  getCurrentVariable() {
    return this.currentVariable;
  }
}

// Global instance
let detailsPanel;