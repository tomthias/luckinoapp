// Main application initialization for Luckino Design Token Processor webapp

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('[App] Initializing Luckino Token Processor...');
  
  // Initialize theme first
  initializeTheme();
  
  // Initialize the main TokenProcessor
  tokenProcessor = new TokenProcessor();
  
  // Initialize components
  initializeComponents();
  
  // Setup global event handlers
  setupGlobalEventHandlers();
  
  console.log('[App] Application initialized successfully');
});

function initializeComponents() {
  // Initialize VariableTable component
  const tableContainer = document.getElementById('variables-table');
  if (tableContainer) {
    tokenProcessor.components.variableTable = new VariableTable(tableContainer, tokenProcessor);
  }
  
  // Initialize DetailsPanel component
  detailsPanel = new DetailsPanel(tokenProcessor);
  tokenProcessor.components.detailsPanel = detailsPanel;
  
  // Initialize UploadZone component
  const uploadZone = document.getElementById('upload-zone');
  if (uploadZone) {
    tokenProcessor.components.uploadZone = new UploadZone(uploadZone, tokenProcessor);
  }
}

function setupGlobalEventHandlers() {
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Help toggle
  const helpToggle = document.getElementById('help-toggle');
  if (helpToggle) {
    helpToggle.addEventListener('click', showHelp);
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  // Window resize handler for responsive adjustments
  window.addEventListener('resize', handleWindowResize);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update theme toggle icon
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const icon = newTheme === 'dark' ? '☀️' : '🌙';
    const iconSvg = themeToggle.querySelector('svg');
    if (iconSvg) {
      iconSvg.innerHTML = icon === '☀️' ? 
        '<text x="12" y="16" text-anchor="middle" font-size="14">☀️</text>' :
        '<text x="12" y="16" text-anchor="middle" font-size="14">🌙</text>';
    }
  }
}

function showHelp() {
  const helpContent = `
    <div class="help-content">
      <h3>Luckino Token Processor Help</h3>
      
      <div class="help-section">
        <h4>Supported Formats:</h4>
        <ul>
          <li><strong>W3C Design Tokens</strong> - Standard format with $value and $type</li>
          <li><strong>Token Studio</strong> - Figma Token Studio plugin format</li>
          <li><strong>Style Dictionary</strong> - Amazon Style Dictionary format</li>
        </ul>
      </div>
      
      <div class="help-section">
        <h4>How to Use:</h4>
        <ol>
          <li>Upload or drag & drop your token JSON file in the Import tab</li>
          <li>Review and edit your tokens in the Variables tab</li>
          <li>Click on any token to see details and edit values</li>
          <li>Export to your desired format from the Export tab</li>
        </ol>
      </div>
      
      <div class="help-section">
        <h4>Keyboard Shortcuts:</h4>
        <ul>
          <li><kbd>Ctrl/Cmd + U</kbd> - Upload file</li>
          <li><kbd>Ctrl/Cmd + E</kbd> - Export tokens</li>
          <li><kbd>Escape</kbd> - Close panels</li>
          <li><kbd>Ctrl/Cmd + /</kbd> - Show this help</li>
        </ul>
      </div>
    </div>
  `;
  
  if (tokenProcessor && tokenProcessor.components.notifications) {
    tokenProcessor.components.notifications.show(helpContent, 'info', 10000);
  }
}

function handleKeyboardShortcuts(e) {
  // Ctrl/Cmd + U - Upload file
  if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
    e.preventDefault();
    const fileInput = document.getElementById('file-importer');
    if (fileInput) {
      fileInput.click();
    }
  }
  
  // Ctrl/Cmd + E - Export tokens
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    if (tokenProcessor && tokenProcessor.state.variables.length > 0) {
      tokenProcessor.switchTab('export');
    }
  }
  
  // Ctrl/Cmd + / - Show help
  if ((e.ctrlKey || e.metaKey) && e.key === '/') {
    e.preventDefault();
    showHelp();
  }
  
  // Escape - Close panels
  if (e.key === 'Escape') {
    if (detailsPanel && detailsPanel.isOpen()) {
      detailsPanel.hide();
    }
  }
  
  // Delete key - Delete selected variables
  if (e.key === 'Delete' && tokenProcessor && tokenProcessor.components.variableTable) {
    const selectedVariables = tokenProcessor.components.variableTable.getSelectedVariables();
    if (selectedVariables.length > 0) {
      const confirmed = confirm(`Delete ${selectedVariables.length} selected variables?`);
      if (confirmed) {
        tokenProcessor.deleteVariables(selectedVariables.map(v => v.id));
      }
    }
  }
}

function handleWindowResize() {
  // Adjust layout for responsive design
  const detailsPanel = document.getElementById('details-panel');
  if (detailsPanel && window.innerWidth <= 768) {
    // On mobile, make details panel full-width
    detailsPanel.style.width = '100vw';
  } else if (detailsPanel) {
    // Reset to default width
    detailsPanel.style.width = '';
  }
}

// Initialize theme from localStorage
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  document.documentElement.setAttribute('data-theme', theme);
}

// Global TokenProcessor extensions for variable management
if (typeof TokenProcessor !== 'undefined') {
  // Extend TokenProcessor with additional methods for the webapp
  TokenProcessor.prototype.showVariableDetails = function(variableId) {
    const variable = this.state.variables.find(v => v.id === variableId);
    if (variable && this.components.detailsPanel) {
      this.components.detailsPanel.show(variable);
    }
  };
  
  TokenProcessor.prototype.editVariable = function(variableId) {
    this.showVariableDetails(variableId);
  };
  
  TokenProcessor.prototype.copyVariable = function(variableId) {
    const variable = this.state.variables.find(v => v.id === variableId);
    if (!variable) return;
    
    const textToCopy = `${variable.name}: ${variable.value}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.showNotification(`Copied "${variable.name}" to clipboard`, 'success');
      }).catch(() => {
        this.fallbackCopyToClipboard(textToCopy);
      });
    } else {
      this.fallbackCopyToClipboard(textToCopy);
    }
  };
  
  TokenProcessor.prototype.deleteVariable = function(variableId) {
    const variable = this.state.variables.find(v => v.id === variableId);
    if (!variable) return;
    
    const confirmed = confirm(`Delete variable "${variable.name}"?`);
    if (confirmed) {
      this.deleteVariables([variableId]);
    }
  };
  
  TokenProcessor.prototype.deleteVariables = function(variableIds) {
    // Remove variables from state
    this.state.variables = this.state.variables.filter(v => 
      !variableIds.includes(v.id)
    );
    
    // Update stats
    this.state.stats.totalTokens = this.state.variables.length;
    
    // Update UI
    this.updateStats();
    if (this.components.variableTable) {
      this.components.variableTable.render(this.state.variables);
    }
    
    // Close details panel if deleted variable was shown
    if (detailsPanel && detailsPanel.isOpen()) {
      const currentVariable = detailsPanel.getCurrentVariable();
      if (currentVariable && variableIds.includes(currentVariable.id)) {
        detailsPanel.hide();
      }
    }
    
    const count = variableIds.length;
    this.showNotification(
      `Deleted ${count} variable${count > 1 ? 's' : ''}`, 
      'success'
    );
  };
  
  TokenProcessor.prototype.updateVariable = function(variableId, property, value) {
    const variable = this.state.variables.find(v => v.id === variableId);
    if (!variable) return;
    
    // Update the variable
    variable[property] = value;
    
    // Update UI if needed
    if (this.components.variableTable) {
      this.components.variableTable.render(this.state.variables);
    }
    
    console.log(`[TokenProcessor] Updated variable ${variableId}.${property} = ${value}`);
  };
  
  TokenProcessor.prototype.fallbackCopyToClipboard = function(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showNotification('Copied to clipboard', 'success');
    } catch (err) {
      this.showNotification('Failed to copy to clipboard', 'error');
    }
    
    document.body.removeChild(textArea);
  };
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('[App] Unhandled promise rejection:', event.reason);
  
  if (tokenProcessor && tokenProcessor.components.notifications) {
    tokenProcessor.components.notifications.show(
      'An unexpected error occurred. Please try refreshing the page.',
      'error'
    );
  }
  
  // Prevent the default console error
  event.preventDefault();
});

// Global error handler
window.addEventListener('error', function(event) {
  console.error('[App] Global error:', event.error);
  
  if (tokenProcessor && tokenProcessor.components.notifications) {
    tokenProcessor.components.notifications.show(
      'An error occurred. Some features may not work correctly.',
      'warning'
    );
  }
});

// Export for global access
window.tokenProcessor = null;
window.detailsPanel = null;

// Development helpers (removed in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.debugTokenProcessor = function() {
    console.log('[Debug] TokenProcessor state:', tokenProcessor?.state);
    console.log('[Debug] Components:', tokenProcessor?.components);
  };
  
  window.loadTestTokens = function() {
    if (tokenProcessor) {
      tokenProcessor.loadExample('simple');
    }
  };
  
  console.log('[Dev] Debug helpers available: debugTokenProcessor(), loadTestTokens()');
}