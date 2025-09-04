/**
 * VariableTable Component
 * Manages the variables table display and interactions
 */

class VariableTable {
  constructor(container, processor) {
    this.container = container;
    this.processor = processor;
    this.selectedVariables = new Set();
    this.currentFilter = '';
    this.currentCollection = 'all';
    this.sortColumn = 'name';
    this.sortDirection = 'asc';
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render([]);
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('variable-search');
    if (searchInput) {
      searchInput.addEventListener('input', this.debounce((e) => {
        this.currentFilter = e.target.value.toLowerCase();
        this.applyFilters();
      }, 300));
    }
    
    // Collection filter
    const collectionFilter = document.getElementById('collection-filter');
    if (collectionFilter) {
      collectionFilter.addEventListener('change', (e) => {
        this.currentCollection = e.target.value;
        this.applyFilters();
      });
    }
    
    // View toggles
    document.querySelectorAll('.view-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        this.switchView(e.target.dataset.view);
      });
    });
    
    // Sorting
    document.querySelectorAll('th.sortable').forEach(th => {
      th.addEventListener('click', (e) => {
        const column = e.target.dataset.sort;
        if (column) {
          this.sortBy(column);
        }
      });
    });
    
    // Select all
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', (e) => {
        this.selectAll(e.target.checked);
      });
    }
  }

  render(variables) {
    this.variables = variables || [];
    this.filteredVariables = [...this.variables];
    
    this.updateCollectionFilter();
    this.applyFilters();
    this.renderTable();
    this.updateCounts();
  }

  updateCollectionFilter() {
    const collections = [...new Set(this.variables.map(v => v.collection))];
    const select = document.getElementById('collection-filter');
    
    if (select) {
      const currentValue = select.value;
      select.innerHTML = '<option value="all">All collections</option>';
      
      collections.forEach(collection => {
        const option = document.createElement('option');
        option.value = collection;
        option.textContent = collection;
        select.appendChild(option);
      });
      
      if (collections.includes(currentValue)) {
        select.value = currentValue;
      }
    }
  }

  applyFilters() {
    let filtered = [...this.variables];
    
    // Apply text search
    if (this.currentFilter) {
      filtered = filtered.filter(variable => 
        variable.name.toLowerCase().includes(this.currentFilter) ||
        variable.path.toLowerCase().includes(this.currentFilter) ||
        variable.value.toString().toLowerCase().includes(this.currentFilter) ||
        variable.collection.toLowerCase().includes(this.currentFilter)
      );
    }
    
    // Apply collection filter
    if (this.currentCollection !== 'all') {
      filtered = filtered.filter(variable => 
        variable.collection === this.currentCollection
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[this.sortColumn];
      let bValue = b[this.sortColumn];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase();
      }
      
      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    this.filteredVariables = filtered;
    this.renderTable();
    this.updateCounts();
  }

  sortBy(column) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.updateSortUI();
    this.applyFilters();
  }

  updateSortUI() {
    // Update sort indicators
    document.querySelectorAll('th.sortable').forEach(th => {
      th.classList.remove('sorted', 'asc', 'desc');
      
      if (th.dataset.sort === this.sortColumn) {
        th.classList.add('sorted', this.sortDirection);
      }
    });
  }

  renderTable() {
    const tableBody = document.getElementById('variables-table-body');
    const emptyState = document.getElementById('table-empty-state');
    
    if (!tableBody || !emptyState) return;
    
    if (this.filteredVariables.length === 0) {
      tableBody.style.display = 'none';
      emptyState.style.display = 'flex';
      
      if (this.variables.length > 0) {
        // Has variables but filtered out
        emptyState.innerHTML = `
          <div class="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </div>
          <h3>No variables match your search</h3>
          <p>Try adjusting your search terms or filters</p>
          <button class="primary" onclick="tokenProcessor.components.variableTable.clearFilters()">
            Clear Filters
          </button>
        `;
      }
      
      return;
    }
    
    tableBody.style.display = '';
    emptyState.style.display = 'none';
    
    // Render rows
    tableBody.innerHTML = this.filteredVariables.map(variable => 
      this.renderVariableRow(variable)
    ).join('');
    
    // Add event listeners
    this.addRowEventListeners();
  }

  renderVariableRow(variable) {
    const isSelected = this.selectedVariables.has(variable.id);
    const typeIcon = this.getTypeIcon(variable.type);
    const valueDisplay = this.renderValueDisplay(variable);
    const scopePills = this.renderScopePills(variable.scopes);
    
    return `
      <tr class="variable-row ${isSelected ? 'selected' : ''}" 
          data-variable-id="${variable.id}" 
          data-type="${variable.type}" 
          data-collection="${variable.collection}">
        <td class="col-select" data-label="Select">
          <input type="checkbox" 
                 class="variable-checkbox" 
                 value="${variable.id}"
                 ${isSelected ? 'checked' : ''}>
        </td>
        <td class="col-type" data-label="Type">
          <span class="type-icon ${variable.type}-icon">${typeIcon}</span>
        </td>
        <td class="col-name" data-label="Name">
          <div class="variable-name">
            <span class="name-text" onclick="tokenProcessor.showVariableDetails('${variable.id}')">
              ${this.highlightSearchTerm(variable.name, this.currentFilter)}
            </span>
            <span class="collection-badge">${variable.collection}</span>
          </div>
        </td>
        <td class="col-values" data-label="Values">
          ${valueDisplay}
        </td>
        <td class="col-scope" data-label="Scope">
          ${scopePills}
        </td>
        <td class="col-actions" data-label="Actions">
          <button class="btn-action" onclick="tokenProcessor.showVariableDetails('${variable.id}')" title="Details">👁️</button>
          <button class="btn-action" onclick="tokenProcessor.copyVariable('${variable.id}')" title="Copy">📋</button>
          <button class="btn-action" onclick="tokenProcessor.deleteVariable('${variable.id}')" title="Delete">🗑️</button>
        </td>
      </tr>
    `;
  }

  renderValueDisplay(variable) {
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
    
    if (variable.type === 'dimension') {
      return `
        <div class="mode-values">
          <div class="mode-value" data-mode="default">
            <span class="dimension-value">${variable.value}</span>
          </div>
        </div>
      `;
    }
    
    return `
      <div class="mode-values">
        <div class="mode-value" data-mode="default">
          <span class="value-text">${this.truncateValue(variable.value)}</span>
        </div>
      </div>
    `;
  }

  renderScopePills(scopes) {
    if (!scopes || scopes.length === 0) {
      return '<div class="scope-pills"><span class="scope-pill">all</span></div>';
    }
    
    return `
      <div class="scope-pills">
        ${scopes.map(scope => 
          `<span class="scope-pill active">${scope}</span>`
        ).join('')}
      </div>
    `;
  }

  getTypeIcon(type) {
    const icons = {
      color: '🎨',
      dimension: '📏',
      fontFamily: '🔤',
      fontSize: '📝',
      fontWeight: '💪',
      lineHeight: '📊',
      shadow: '🌫️',
      typography: '✍️',
      number: '🔢',
      string: '📝',
      boolean: '☑️'
    };
    
    return icons[type] || '🔧';
  }

  addRowEventListeners() {
    // Selection checkboxes
    document.querySelectorAll('.variable-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleSelection(e.target.value, e.target.checked);
      });
    });
    
    // Row clicking for selection
    document.querySelectorAll('.variable-row').forEach(row => {
      row.addEventListener('click', (e) => {
        // Don't trigger on button clicks
        if (e.target.closest('button') || e.target.closest('input')) {
          return;
        }
        
        const variableId = row.dataset.variableId;
        const checkbox = row.querySelector('.variable-checkbox');
        const isSelected = !checkbox.checked;
        
        checkbox.checked = isSelected;
        this.toggleSelection(variableId, isSelected);
      });
    });
    
    // Double-click for details
    document.querySelectorAll('.variable-row').forEach(row => {
      row.addEventListener('dblclick', (e) => {
        const variableId = row.dataset.variableId;
        tokenProcessor.showVariableDetails(variableId);
      });
    });
  }

  toggleSelection(variableId, selected) {
    const row = document.querySelector(`[data-variable-id="${variableId}"]`);
    
    if (selected) {
      this.selectedVariables.add(variableId);
      row?.classList.add('selected');
    } else {
      this.selectedVariables.delete(variableId);
      row?.classList.remove('selected');
    }
    
    this.updateBulkActions();
    this.updateSelectAllState();
  }

  selectAll(selected) {
    this.filteredVariables.forEach(variable => {
      const checkbox = document.querySelector(`input[value="${variable.id}"]`);
      if (checkbox) {
        checkbox.checked = selected;
        this.toggleSelection(variable.id, selected);
      }
    });
  }

  updateSelectAllState() {
    const selectAllCheckbox = document.getElementById('select-all');
    if (!selectAllCheckbox) return;
    
    const visibleVariableIds = this.filteredVariables.map(v => v.id);
    const selectedVisibleCount = visibleVariableIds.filter(id => 
      this.selectedVariables.has(id)
    ).length;
    
    if (selectedVisibleCount === 0) {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = false;
    } else if (selectedVisibleCount === visibleVariableIds.length) {
      selectAllCheckbox.checked = true;
      selectAllCheckbox.indeterminate = false;
    } else {
      selectAllCheckbox.checked = false;
      selectAllCheckbox.indeterminate = true;
    }
  }

  updateBulkActions() {
    const bulkActions = document.getElementById('bulk-actions');
    const selectionCount = document.getElementById('selection-count');
    
    if (bulkActions && selectionCount) {
      const count = this.selectedVariables.size;
      bulkActions.style.display = count > 0 ? 'flex' : 'none';
      selectionCount.textContent = `${count} selected`;
    }
  }

  updateCounts() {
    const totalDisplay = document.getElementById('total-variables-display');
    if (totalDisplay) {
      const total = this.filteredVariables.length;
      const totalText = total === 1 ? 'variable' : 'variables';
      totalDisplay.textContent = `${total} ${totalText}`;
    }
  }

  switchView(viewType) {
    document.querySelectorAll('.view-toggle').forEach(toggle => {
      toggle.classList.toggle('active', toggle.dataset.view === viewType);
    });
    
    if (viewType === 'cards') {
      this.renderCardsView();
    } else {
      this.renderTable();
    }
  }

  renderCardsView() {
    const container = document.querySelector('.variables-table-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="variables-cards-grid">
        ${this.filteredVariables.map(variable => this.renderVariableCard(variable)).join('')}
      </div>
    `;
    
    this.addCardEventListeners();
  }

  renderVariableCard(variable) {
    const isSelected = this.selectedVariables.has(variable.id);
    const typeIcon = this.getTypeIcon(variable.type);
    const valueDisplay = this.renderValueDisplay(variable);
    
    return `
      <div class="variable-card ${isSelected ? 'selected' : ''}" 
           data-variable-id="${variable.id}">
        <div class="card-header">
          <div class="card-type">
            <span class="type-icon">${typeIcon}</span>
            <span class="type-label">${variable.type}</span>
          </div>
          <input type="checkbox" 
                 class="card-checkbox" 
                 value="${variable.id}"
                 ${isSelected ? 'checked' : ''}>
        </div>
        
        <div class="card-content">
          <h4 class="variable-name">${variable.name}</h4>
          <div class="variable-path">${variable.path}</div>
          
          <div class="card-value">
            ${valueDisplay}
          </div>
          
          <div class="card-meta">
            <span class="collection-badge">${variable.collection}</span>
            ${variable.description ? `<p class="description">${variable.description}</p>` : ''}
          </div>
        </div>
        
        <div class="card-actions">
          <button class="btn-action" onclick="tokenProcessor.showVariableDetails('${variable.id}')" title="Details">👁️</button>
          <button class="btn-action" onclick="tokenProcessor.copyVariable('${variable.id}')" title="Copy">📋</button>
          <button class="btn-action" onclick="tokenProcessor.deleteVariable('${variable.id}')" title="Delete">🗑️</button>
        </div>
      </div>
    `;
  }

  addCardEventListeners() {
    document.querySelectorAll('.card-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        this.toggleSelection(e.target.value, e.target.checked);
      });
    });
    
    document.querySelectorAll('.variable-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('input')) {
          return;
        }
        
        const variableId = card.dataset.variableId;
        tokenProcessor.showVariableDetails(variableId);
      });
    });
  }

  clearFilters() {
    this.currentFilter = '';
    this.currentCollection = 'all';
    
    const searchInput = document.getElementById('variable-search');
    const collectionFilter = document.getElementById('collection-filter');
    
    if (searchInput) searchInput.value = '';
    if (collectionFilter) collectionFilter.value = 'all';
    
    this.applyFilters();
  }

  getSelectedVariables() {
    return this.variables.filter(variable => 
      this.selectedVariables.has(variable.id)
    );
  }

  clearSelection() {
    this.selectedVariables.clear();
    document.querySelectorAll('.variable-checkbox').forEach(checkbox => {
      checkbox.checked = false;
    });
    document.querySelectorAll('.variable-row').forEach(row => {
      row.classList.remove('selected');
    });
    this.updateBulkActions();
    this.updateSelectAllState();
  }

  // Utility methods
  highlightSearchTerm(text, searchTerm) {
    if (!searchTerm || searchTerm.length < 2) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  truncateValue(value, maxLength = 30) {
    const str = String(value);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  }

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
}