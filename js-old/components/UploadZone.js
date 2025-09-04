/**
 * UploadZone Component
 * Modern drag & drop file upload with progress tracking
 */

class UploadZone {
  constructor(element, processor) {
    this.element = element;
    this.processor = processor;
    this.isProcessing = false;
    this.allowedTypes = ['application/json', 'text/json', 'application/zip'];
    this.allowedExtensions = ['.json', '.zip'];
    
    this.init();
  }

  init() {
    if (!this.element) {
      console.warn('[UploadZone] Element not found');
      return;
    }
    
    this.setupEventListeners();
    this.setupFileInput();
    this.enablePasteSupport();
  }

  setupEventListeners() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.element.addEventListener(eventName, this.preventDefaults, false);
      document.body.addEventListener(eventName, this.preventDefaults, false);
    });

    // Enhanced drag enter/over handling
    ['dragenter', 'dragover'].forEach(eventName => {
      this.element.addEventListener(eventName, (e) => {
        if (!this.isProcessing) {
          this.element.classList.add('dragover');
          
          // Show file count indicator
          if (e.dataTransfer && e.dataTransfer.items) {
            this.showDragIndicator(e.dataTransfer.items.length);
          }
        }
      }, false);
    });

    // Enhanced drag leave handling with delay to prevent flicker
    this.element.addEventListener('dragleave', (e) => {
      // Only remove dragover if leaving the upload zone entirely
      if (!this.element.contains(e.relatedTarget)) {
        this.element.classList.remove('dragover');
        this.hideDragIndicator();
      }
    }, false);

    // Handle the actual file drop
    this.element.addEventListener('drop', (e) => {
      this.element.classList.remove('dragover');
      this.hideDragIndicator();
      this.handleDrop(e);
    }, false);
    
    // Handle click to browse
    this.element.addEventListener('click', this.handleClick.bind(this));
  }

  setupFileInput() {
    // Create or find the hidden file input
    let fileInput = document.getElementById('file-importer');
    
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'file-importer';
      fileInput.style.display = 'none';
      fileInput.accept = this.allowedExtensions.join(',');
      document.body.appendChild(fileInput);
    }
    
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFiles(e.target.files);
      }
    });
    
    // Also handle the browse button
    const browseBtn = document.getElementById('browse-files-btn');
    if (browseBtn) {
      browseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    const files = e.dataTransfer.files;
    this.handleFiles(files);
  }

  handleClick() {
    if (!this.isProcessing) {
      const fileInput = document.getElementById('file-importer');
      if (fileInput) {
        fileInput.click();
      }
    }
  }

  async handleFiles(files) {
    if (files.length === 0) return;
    
    // Show file preview animation
    if (files.length === 1) {
      this.showPreview(files[0]);
    }
    
    // Handle multiple files
    const validFiles = Array.from(files).filter(file => this.validateFile(file, false));
    
    if (validFiles.length === 0) {
      this.showError('No valid files found. Please upload JSON files or ZIP archives.');
      return;
    }
    
    if (validFiles.length > 1) {
      // Process multiple files
      await this.processMultipleFiles(validFiles);
    } else {
      // Process single file
      await this.processFile(validFiles[0]);
    }
  }

  validateFile(file, showError = true) {
    // Check file type
    const isValidType = this.allowedTypes.includes(file.type) ||
                       this.allowedExtensions.some(ext => 
                         file.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      if (showError) {
        this.showError(`Invalid file type: ${file.name}. Please upload JSON files or ZIP archives.`);
      }
      return false;
    }
    
    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      if (showError) {
        this.showError(`File too large: ${file.name}. Maximum size is 10MB.`);
      }
      return false;
    }
    
    return true;
  }
  
  async processMultipleFiles(files) {
    this.startProcessing();
    this.updateProgress(0, 'Processing multiple files...');
    
    try {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const progress = Math.round(((i) / files.length) * 80);
        this.updateProgress(progress, `Processing ${file.name}...`);
        
        try {
          let content, jsonData;
          
          if (file.name.toLowerCase().endsWith('.zip')) {
            jsonData = await this.handleZipFile(file);
          } else {
            content = await this.readFile(file);
            jsonData = JSON.parse(content);
          }
          
          results.push({
            filename: file.name,
            data: jsonData,
            success: true
          });
          
        } catch (error) {
          console.error(`[UploadZone] Failed to process ${file.name}:`, error);
          results.push({
            filename: file.name,
            error: error.message,
            success: false
          });
        }
      }
      
      this.updateProgress(90, 'Merging results...');
      
      // Merge successful results
      const successfulResults = results.filter(r => r.success);
      
      if (successfulResults.length === 0) {
        throw new Error('No files could be processed successfully');
      }
      
      // Merge all JSON data
      const mergedData = this.mergeTokenData(successfulResults);
      
      // Pass merged data to processor
      if (this.processor && typeof this.processor.processTokenData === 'function') {
        const filenames = successfulResults.map(r => r.filename).join(', ');
        await this.processor.processTokenData(mergedData, filenames);
      }
      
      this.updateProgress(100, 'Complete!');
      
      // Show summary
      const failed = results.filter(r => !r.success).length;
      let message = `Processed ${successfulResults.length} files successfully`;
      if (failed > 0) {
        message += ` (${failed} failed)`;
      }
      
      if (this.processor && typeof this.processor.showNotification === 'function') {
        this.processor.showNotification(message, failed > 0 ? 'warning' : 'success');
      }
      
      setTimeout(() => {
        this.finishProcessing(true);
      }, 500);
      
    } catch (error) {
      console.error('[UploadZone] Multiple file processing error:', error);
      this.showError(this.getErrorMessage(error));
      this.finishProcessing(false);
    }
  }
  
  mergeTokenData(results) {
    const merged = {};
    
    for (const result of results) {
      const data = result.data;
      const filename = result.filename.replace(/\.[^/.]+$/, ''); // Remove extension
      
      // If the data has top-level token structure, merge directly
      if (this.hasTokenStructure(data)) {
        Object.assign(merged, data);
      } else {
        // Wrap in filename-based collection
        merged[filename] = data;
      }
    }
    
    return merged;
  }
  
  hasTokenStructure(data) {
    // Check if data looks like it has token structure
    if (typeof data !== 'object' || data === null) return false;
    
    const sampleKey = Object.keys(data)[0];
    if (!sampleKey) return false;
    
    const sampleValue = data[sampleKey];
    
    // W3C tokens have $value or $type
    if (sampleValue && (sampleValue.$value !== undefined || sampleValue.$type !== undefined)) {
      return true;
    }
    
    // Token Studio tokens have value and type
    if (sampleValue && (sampleValue.value !== undefined && sampleValue.type !== undefined)) {
      return true;
    }
    
    // Check nested structure
    if (typeof sampleValue === 'object') {
      return this.hasTokenStructure(sampleValue);
    }
    
    return false;
  }

  async processFile(file) {
    this.startProcessing();
    
    try {
      this.updateProgress(0, 'Reading file...');
      
      let content, jsonData;
      
      if (file.name.toLowerCase().endsWith('.zip')) {
        jsonData = await this.handleZipFile(file);
      } else {
        content = await this.readFile(file);
        this.updateProgress(30, 'Parsing JSON...');
        jsonData = JSON.parse(content);
      }
      
      this.updateProgress(60, 'Analyzing tokens...');
      
      // Pass to processor
      if (this.processor && typeof this.processor.processTokenData === 'function') {
        await this.processor.processTokenData(jsonData, file.name);
      }
      
      this.updateProgress(100, 'Complete!');
      
      setTimeout(() => {
        this.finishProcessing(true);
      }, 500);
      
    } catch (error) {
      console.error('[UploadZone] Processing error:', error);
      this.showError(this.getErrorMessage(error));
      this.finishProcessing(false);
    }
  }

  async handleZipFile(file) {
    this.updateProgress(10, 'Extracting ZIP archive...');
    
    try {
      // For now, we'll implement basic ZIP handling
      // In production, you'd use a library like JSZip
      throw new Error('ZIP file support not yet implemented');
    } catch (error) {
      throw new Error(`Failed to process ZIP file: ${error.message}`);
    }
  }

  readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 20); // 0-20%
          this.updateProgress(progress, 'Reading file...');
        }
      };
      
      reader.readAsText(file);
    });
  }

  startProcessing() {
    this.isProcessing = true;
    this.element.classList.add('processing');
    
    // Show progress indicator
    const statusElement = this.element.querySelector('.upload-status');
    if (statusElement) {
      statusElement.style.display = 'block';
    }
    
    // Hide upload content
    const uploadContent = this.element.querySelector('.upload-content');
    if (uploadContent) {
      uploadContent.style.opacity = '0.5';
    }
  }

  updateProgress(percentage, message) {
    const progressFill = this.element.querySelector('.progress-fill');
    const statusText = this.element.querySelector('.status-text');
    
    if (progressFill) {
      progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }
    
    if (statusText) {
      statusText.textContent = message;
    }
  }

  finishProcessing(success) {
    setTimeout(() => {
      this.isProcessing = false;
      this.element.classList.remove('processing');
      
      // Hide progress indicator
      const statusElement = this.element.querySelector('.upload-status');
      if (statusElement) {
        statusElement.style.display = 'none';
      }
      
      // Restore upload content
      const uploadContent = this.element.querySelector('.upload-content');
      if (uploadContent) {
        uploadContent.style.opacity = '1';
      }
      
      // Reset progress
      this.updateProgress(0, 'Processing...');
    }, success ? 500 : 1000);
  }

  showError(message) {
    // Show error notification
    if (this.processor && typeof this.processor.showNotification === 'function') {
      this.processor.showNotification(message, 'error');
    } else {
      alert(message); // Fallback
    }
    
    // Add error state
    this.element.classList.add('error');
    setTimeout(() => {
      this.element.classList.remove('error');
    }, 3000);
  }

  getErrorMessage(error) {
    if (error.name === 'SyntaxError') {
      return 'Invalid JSON format. Please check your file and try again.';
    }
    
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return error.message || 'An unexpected error occurred while processing the file.';
  }

  // Animation methods for visual feedback
  animateUpload() {
    this.element.classList.add('animate-upload');
    setTimeout(() => {
      this.element.classList.remove('animate-upload');
    }, 600);
  }

  showSuccess() {
    this.element.classList.add('success');
    setTimeout(() => {
      this.element.classList.remove('success');
    }, 2000);
  }

  // Public API methods
  reset() {
    this.isProcessing = false;
    this.element.classList.remove('processing', 'error', 'success', 'dragover');
    this.finishProcessing(false);
  }

  setAllowedTypes(types, extensions) {
    this.allowedTypes = types;
    this.allowedExtensions = extensions;
    
    const fileInput = document.getElementById('file-importer');
    if (fileInput) {
      fileInput.accept = extensions.join(',');
    }
  }

  enable() {
    this.element.style.pointerEvents = 'auto';
    this.element.classList.remove('disabled');
  }

  disable() {
    this.element.style.pointerEvents = 'none';
    this.element.classList.add('disabled');
  }

  updateSupportedFormats(formats) {
    const formatsContainer = this.element.querySelector('.supported-formats');
    if (formatsContainer && Array.isArray(formats)) {
      formatsContainer.innerHTML = formats.map(format => 
        `<span class="format-badge">${format}</span>`
      ).join('');
    }
  }

  showPreview(file) {
    // Show a preview of the file being uploaded
    const content = this.element.querySelector('.upload-content');
    if (content) {
      const preview = document.createElement('div');
      preview.className = 'file-preview';
      preview.innerHTML = `
        <div class="preview-icon">📄</div>
        <div class="preview-info">
          <div class="preview-name">${file.name}</div>
          <div class="preview-size">${this.formatFileSize(file.size)}</div>
        </div>
      `;
      
      content.appendChild(preview);
      
      // Remove preview after animation
      setTimeout(() => {
        preview.remove();
      }, 3000);
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  showDragIndicator(fileCount) {
    let indicator = this.element.querySelector('.drag-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'drag-indicator';
      this.element.appendChild(indicator);
    }
    
    indicator.innerHTML = `
      <div class="drag-icon">📁</div>
      <div class="drag-text">
        Drop ${fileCount} file${fileCount > 1 ? 's' : ''} to upload
      </div>
    `;
    
    indicator.style.display = 'flex';
  }
  
  hideDragIndicator() {
    const indicator = this.element.querySelector('.drag-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
  
  // Enhanced file preview with animation
  showPreview(file) {
    const content = this.element.querySelector('.upload-content');
    if (!content) return;
    
    // Create preview element
    const preview = document.createElement('div');
    preview.className = 'file-preview animate-in';
    
    // Get file icon based on type
    const icon = this.getFileIcon(file);
    
    preview.innerHTML = `
      <div class="preview-icon">${icon}</div>
      <div class="preview-info">
        <div class="preview-name">${file.name}</div>
        <div class="preview-size">${this.formatFileSize(file.size)}</div>
        <div class="preview-type">${this.getFileTypeLabel(file)}</div>
      </div>
    `;
    
    content.appendChild(preview);
    
    // Remove preview after processing
    setTimeout(() => {
      if (preview.parentNode) {
        preview.classList.add('animate-out');
        setTimeout(() => preview.remove(), 300);
      }
    }, 2000);
  }
  
  getFileIcon(file) {
    if (file.name.toLowerCase().endsWith('.json')) {
      return '📄';
    } else if (file.name.toLowerCase().endsWith('.zip')) {
      return '📦';
    } else {
      return '📁';
    }
  }
  
  getFileTypeLabel(file) {
    if (file.name.toLowerCase().endsWith('.json')) {
      return 'JSON File';
    } else if (file.name.toLowerCase().endsWith('.zip')) {
      return 'ZIP Archive';
    } else {
      return 'Unknown';
    }
  }
  
  // Enhanced progress updates with better UX
  updateProgress(percentage, message) {
    const progressFill = this.element.querySelector('.progress-fill');
    const statusText = this.element.querySelector('.status-text');
    
    if (progressFill) {
      const clampedPercentage = Math.min(100, Math.max(0, percentage));
      progressFill.style.width = `${clampedPercentage}%`;
      
      // Add color transitions based on progress
      if (clampedPercentage < 30) {
        progressFill.style.background = 'var(--color-warning, #f59e0b)';
      } else if (clampedPercentage < 80) {
        progressFill.style.background = 'var(--color-primary, #3b82f6)';
      } else {
        progressFill.style.background = 'var(--color-success, #10b981)';
      }
    }
    
    if (statusText) {
      statusText.textContent = message;
      
      // Add pulsing animation during processing
      if (percentage < 100 && !statusText.classList.contains('pulse')) {
        statusText.classList.add('pulse');
      } else if (percentage === 100) {
        statusText.classList.remove('pulse');
      }
    }
  }
  
  // Add paste support for JSON content
  enablePasteSupport() {
    document.addEventListener('paste', async (e) => {
      if (!this.element.closest('.tab-content.active')) return; // Only in active import tab
      
      const items = Array.from(e.clipboardData?.items || []);
      const textItem = items.find(item => item.type === 'text/plain');
      
      if (textItem) {
        e.preventDefault();
        
        const text = await new Promise(resolve => textItem.getAsString(resolve));
        
        try {
          const jsonData = JSON.parse(text);
          
          // Create virtual file object
          const virtualFile = new File([text], 'pasted-content.json', {
            type: 'application/json'
          });
          
          this.showNotification('JSON content pasted successfully', 'info');
          await this.processFile(virtualFile);
          
        } catch (error) {
          this.showError('Pasted content is not valid JSON');
        }
      }
    });
  }
  
  showNotification(message, type = 'info') {
    if (this.processor && typeof this.processor.showNotification === 'function') {
      this.processor.showNotification(message, type);
    }
  }
}