/**
 * ImportPipelineOrchestrator
 * Robust import pipeline for processing design tokens with enterprise-level error handling
 * Adapted from Figma plugin for standalone webapp usage
 */

class ImportPipelineOrchestrator {
  constructor(tokenProcessor) {
    this.tokenProcessor = tokenProcessor;
    this.formatDetector = new JSONFormatDetector();
    this.typeSystem = new EnhancedTypeSystem();
    this.aliasResolver = new AdvancedAliasResolver();
    this.errorHandler = new ProductionErrorHandler();
    
    // Pipeline stages in sequential order
    this.pipelineStages = [
      { name: 'validation', handler: this.validateInput.bind(this) },
      { name: 'format-detection', handler: this.detectFormat.bind(this) },
      { name: 'preprocessing', handler: this.preprocessTokens.bind(this) },
      { name: 'alias-resolution', handler: this.resolveAliases.bind(this) },
      { name: 'type-processing', handler: this.processTypes.bind(this) },
      { name: 'structure-creation', handler: this.createStructure.bind(this) },
      { name: 'post-processing', handler: this.postProcess.bind(this) }
    ];
    
    // Metrics for tracking pipeline performance
    this.metrics = {
      startTime: null,
      endTime: null,
      processedTokens: 0,
      createdVariables: 0,
      updatedVariables: 0,
      errors: [],
      warnings: []
    };
  }
  
  /**
   * Execute the complete import pipeline
   * @param {Object} jsonData - Raw JSON token data
   * @param {Object} options - Import options
   * @returns {Object} Pipeline execution results
   */
  async execute(jsonData, options = {}) {
    console.log('[ImportPipelineOrchestrator] Starting robust import pipeline...');
    this.metrics.startTime = Date.now();
    
    // Reset metrics
    this.metrics = {
      startTime: this.metrics.startTime,
      endTime: null,
      processedTokens: 0,
      createdVariables: 0,
      updatedVariables: 0,
      errors: [],
      warnings: []
    };
    
    let context = {
      rawData: jsonData,
      processedData: null,
      formatInfo: null,
      options: {
        strategy: 'merge-smart',
        validateTypes: true,
        resolveAliases: true,
        createBackups: true,
        ...options
      },
      stage: 'initialization',
      results: {
        collections: new Map(),
        variables: [],
        tokens: [],
        skipped: [],
        errors: []
      }
    };
    
    try {
      // Execute pipeline stages sequentially
      for (const stage of this.pipelineStages) {
        context.stage = stage.name;
        console.log(`[ImportPipelineOrchestrator] Executing stage: ${stage.name}`);
        
        try {
          context = await this.executeStageWithErrorHandling(stage, context);
          if (context.shouldAbort) {
            throw new Error(`Pipeline aborted at stage: ${stage.name}`);
          }
        } catch (stageError) {
          console.error(`[ImportPipelineOrchestrator] Stage '${stage.name}' failed:`, stageError);
          this.metrics.errors.push({
            stage: stage.name,
            error: stageError.message,
            timestamp: Date.now()
          });
          
          if (this.isCriticalError(stageError, stage.name)) {
            throw stageError;
          }
          
          // Continue with degraded functionality
          this.metrics.warnings.push(`Stage ${stage.name} failed, continuing with reduced functionality`);
        }
      }
      
      this.metrics.endTime = Date.now();
      this.logPipelineResults(context);
      
      return {
        success: true,
        results: context.results,
        metrics: this.metrics,
        errors: this.metrics.errors,
        warnings: this.metrics.warnings,
        formatInfo: context.formatInfo
      };
      
    } catch (error) {
      this.metrics.endTime = Date.now();
      console.error('[ImportPipelineOrchestrator] Pipeline execution failed:', error);
      
      return {
        success: false,
        error: error.message,
        stage: context.stage,
        metrics: this.metrics,
        results: context.results
      };
    }
  }
  
  /**
   * Execute a single pipeline stage with error handling
   */
  async executeStageWithErrorHandling(stage, context) {
    const stageStartTime = Date.now();
    
    try {
      const result = await stage.handler(context);
      const duration = Date.now() - stageStartTime;
      
      console.log(`[ImportPipelineOrchestrator] Stage '${stage.name}' completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - stageStartTime;
      console.error(`[ImportPipelineOrchestrator] Stage '${stage.name}' failed after ${duration}ms:`, error);
      throw error;
    }
  }
  
  /**
   * Stage 1: Validate Input Data
   */
  async validateInput(context) {
    console.log('[Pipeline-Validation] Validating input data...');
    
    if (!context.rawData || 
        typeof context.rawData !== 'object' || 
        Array.isArray(context.rawData) ||
        context.rawData === null) {
      throw new Error(`Invalid input: Expected valid JSON object, got ${typeof context.rawData}`);
    }
    
    // Structural validation
    const dataSize = JSON.stringify(context.rawData).length;
    if (dataSize > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Input data too large (max 10MB)');
    }
    
    // Check for empty data
    if (Object.keys(context.rawData).length === 0) {
      throw new Error('Input data is empty');
    }
    
    console.log(`[Pipeline-Validation] Input validated: ${dataSize} bytes, ${Object.keys(context.rawData).length} top-level keys`);
    return context;
  }
  
  /**
   * Stage 2: Detect Format
   */
  async detectFormat(context) {
    console.log('[Pipeline-FormatDetection] Detecting JSON format...');
    
    context.formatInfo = this.formatDetector.detectFormat(context.rawData);
    
    if (context.formatInfo.confidence < 50) {
      this.metrics.warnings.push('Low confidence in format detection');
      console.warn(`[Pipeline-FormatDetection] Low confidence (${context.formatInfo.confidence}%) - proceeding with best guess: ${context.formatInfo.format}`);
    }
    
    console.log(`[Pipeline-FormatDetection] Detected format: ${context.formatInfo.format} (${context.formatInfo.confidence}% confidence)`);
    console.log(`[Pipeline-FormatDetection] Format details:`, context.formatInfo.details);
    
    return context;
  }
  
  /**
   * Stage 3: Preprocess Tokens
   */
  async preprocessTokens(context) {
    console.log('[Pipeline-Preprocessing] Preprocessing tokens...');
    
    try {
      // Convert format if needed
      if (context.formatInfo.format === 'token-studio') {
        console.log('[Pipeline-Preprocessing] Converting Token Studio format to W3C format...');
        context.processedData = this.convertTokenStudioFormat(context.rawData);
      } else if (context.formatInfo.format === 'style-dictionary') {
        console.log('[Pipeline-Preprocessing] Converting Style Dictionary format to W3C format...');
        context.processedData = this.convertStyleDictionaryFormat(context.rawData);
      } else {
        context.processedData = context.rawData;
      }
      
      // Flatten nested structure for easier processing
      context.flatTokens = this.flattenTokenStructure(context.processedData);
      this.metrics.processedTokens = context.flatTokens.length;
      
      console.log(`[Pipeline-Preprocessing] Preprocessed ${context.flatTokens.length} tokens`);
      
    } catch (error) {
      console.error('[Pipeline-Preprocessing] Preprocessing failed:', error);
      throw new Error(`Preprocessing failed: ${error.message}`);
    }
    
    return context;
  }
  
  /**
   * Stage 4: Resolve Aliases
   */
  async resolveAliases(context) {
    if (!context.options.resolveAliases) {
      console.log('[Pipeline-AliasResolution] Alias resolution disabled, skipping...');
      return context;
    }
    
    console.log('[Pipeline-AliasResolution] Resolving token aliases...');
    
    try {
      const resolvedTokens = await this.aliasResolver.resolveAliases(context.flatTokens);
      context.flatTokens = resolvedTokens;
      
      console.log(`[Pipeline-AliasResolution] Resolved aliases in ${context.flatTokens.length} tokens`);
      
    } catch (error) {
      console.warn('[Pipeline-AliasResolution] Alias resolution failed:', error);
      this.metrics.warnings.push(`Alias resolution failed: ${error.message}`);
    }
    
    return context;
  }
  
  /**
   * Stage 5: Process Types
   */
  async processTypes(context) {
    console.log('[Pipeline-TypeProcessing] Processing token types...');
    
    try {
      for (const token of context.flatTokens) {
        // Detect type if not specified
        if (!token.type) {
          token.type = this.typeSystem.detectType(token.value);
        }
        
        // Validate type consistency
        if (context.options.validateTypes) {
          const isValid = this.typeSystem.validateTypeConsistency(token.type, token.value);
          if (!isValid) {
            this.metrics.warnings.push(`Type inconsistency for token ${token.path}: ${token.type} vs ${typeof token.value}`);
          }
        }
      }
      
      console.log(`[Pipeline-TypeProcessing] Processed types for ${context.flatTokens.length} tokens`);
      
    } catch (error) {
      console.error('[Pipeline-TypeProcessing] Type processing failed:', error);
      throw new Error(`Type processing failed: ${error.message}`);
    }
    
    return context;
  }
  
  /**
   * Stage 6: Create Structure (replaces variable creation for webapp)
   */
  async createStructure(context) {
    console.log('[Pipeline-StructureCreation] Creating webapp data structure...');
    
    try {
      // Group tokens by collection
      const collections = new Map();
      
      for (const token of context.flatTokens) {
        const collectionName = token.collection || 'Default';
        
        if (!collections.has(collectionName)) {
          collections.set(collectionName, {
            id: `collection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: collectionName,
            tokens: [],
            variables: []
          });
        }
        
        const collection = collections.get(collectionName);
        
        // Create variable structure for webapp
        const variable = {
          id: `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: token.path,
          type: token.type,
          value: token.value,
          collection: collectionName,
          collectionId: collection.id,
          description: token.description || '',
          scopes: token.scopes || this.getDefaultScopes(token.type),
          originalToken: token,
          isAlias: Boolean(token.isAlias),
          aliasTarget: token.aliasTarget || null,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        collection.tokens.push(token);
        collection.variables.push(variable);
        context.results.variables.push(variable);
        
        this.metrics.createdVariables++;
      }
      
      context.results.collections = collections;
      console.log(`[Pipeline-StructureCreation] Created ${collections.size} collections with ${this.metrics.createdVariables} variables`);
      
    } catch (error) {
      console.error('[Pipeline-StructureCreation] Structure creation failed:', error);
      throw new Error(`Structure creation failed: ${error.message}`);
    }
    
    return context;
  }
  
  /**
   * Stage 7: Post Processing
   */
  async postProcess(context) {
    console.log('[Pipeline-PostProcessing] Running post-processing...');
    
    try {
      // Sort variables by name
      context.results.variables.sort((a, b) => a.name.localeCompare(b.name));
      
      // Add statistics
      context.results.stats = {
        totalTokens: context.results.variables.length,
        totalCollections: context.results.collections.size,
        byType: this.getTypeStatistics(context.results.variables),
        processingTime: Date.now() - this.metrics.startTime
      };
      
      console.log(`[Pipeline-PostProcessing] Post-processing complete`);
      
    } catch (error) {
      console.warn('[Pipeline-PostProcessing] Post-processing failed:', error);
      this.metrics.warnings.push(`Post-processing failed: ${error.message}`);
    }
    
    return context;
  }
  
  /**
   * Helper Methods
   */
  
  isCriticalError(error, stageName) {
    const criticalStages = ['validation', 'format-detection', 'preprocessing'];
    return criticalStages.includes(stageName) || error.message.includes('Critical');
  }
  
  logPipelineResults(context) {
    const duration = this.metrics.endTime - this.metrics.startTime;
    
    console.log(`[ImportPipelineOrchestrator] Pipeline completed in ${duration}ms`);
    console.log(`[ImportPipelineOrchestrator] Processed ${this.metrics.processedTokens} tokens`);
    console.log(`[ImportPipelineOrchestrator] Created ${this.metrics.createdVariables} variables`);
    console.log(`[ImportPipelineOrchestrator] Updated ${this.metrics.updatedVariables} variables`);
    
    if (this.metrics.errors.length > 0) {
      console.log(`[ImportPipelineOrchestrator] ${this.metrics.errors.length} errors occurred`);
      this.metrics.errors.forEach(error => console.error(`  - ${error.stage}: ${error.error}`));
    }
    
    if (this.metrics.warnings.length > 0) {
      console.log(`[ImportPipelineOrchestrator] ${this.metrics.warnings.length} warnings occurred`);
      this.metrics.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
  }
  
  convertTokenStudioFormat(data) {
    // Implementation from TokenProcessor.js
    return this.tokenProcessor?.convertTokenStudioFormat?.(data) || data;
  }
  
  convertStyleDictionaryFormat(data) {
    // Basic Style Dictionary to W3C conversion
    const converted = {};
    
    const convertRecursive = (obj, path = []) => {
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && value.value !== undefined) {
          // This is a token
          const tokenPath = [...path, key].join('.');
          converted[tokenPath] = {
            $type: value.type || this.detectTypeFromValue(value.value),
            $value: value.value,
            $description: value.comment || value.description
          };
        } else if (value && typeof value === 'object') {
          // This is a group
          convertRecursive(value, [...path, key]);
        }
      }
    };
    
    convertRecursive(data);
    return converted;
  }
  
  flattenTokenStructure(data) {
    const flattened = [];
    
    const flattenRecursive = (obj, path = [], collection = 'Default') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = [...path, key];
        
        if (value && typeof value === 'object') {
          if (value.$value !== undefined || value.value !== undefined) {
            // This is a token
            flattened.push({
              path: currentPath.join('.'),
              name: key,
              value: value.$value || value.value,
              type: value.$type || value.type || this.detectTypeFromValue(value.$value || value.value),
              description: value.$description || value.description || '',
              collection: collection,
              scopes: value.$extensions?.scopes || this.getDefaultScopes(value.$type || value.type),
              isAlias: this.isAliasValue(value.$value || value.value),
              aliasTarget: this.extractAliasTarget(value.$value || value.value)
            });
          } else {
            // This is a group, recurse deeper
            flattenRecursive(value, currentPath, collection);
          }
        }
      }
    };
    
    flattenRecursive(data);
    return flattened;
  }
  
  detectTypeFromValue(value) {
    if (typeof value === 'string') {
      if (value.match(/^#[0-9a-fA-F]{3,8}$/)) return 'color';
      if (value.match(/^rgb|hsl|hsla/)) return 'color';
      if (value.match(/^\d+(\.\d+)?(px|rem|em|%|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax)$/)) return 'dimension';
      if (value.match(/^\d+$/)) return 'number';
      return 'string';
    }
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return 'unknown';
  }
  
  isAliasValue(value) {
    return typeof value === 'string' && (value.startsWith('{') && value.endsWith('}'));
  }
  
  extractAliasTarget(value) {
    if (this.isAliasValue(value)) {
      return value.slice(1, -1); // Remove { and }
    }
    return null;
  }
  
  getDefaultScopes(type) {
    const scopeMap = {
      'color': ['ALL_SCOPES'],
      'dimension': ['WIDTH_HEIGHT', 'GAP'],
      'string': ['TEXT_CONTENT'],
      'number': ['ALL_SCOPES'],
      'boolean': ['ALL_SCOPES']
    };
    
    return scopeMap[type] || ['ALL_SCOPES'];
  }
  
  getTypeStatistics(variables) {
    const stats = {};
    
    for (const variable of variables) {
      const type = variable.type || 'unknown';
      stats[type] = (stats[type] || 0) + 1;
    }
    
    return stats;
  }
}

// Support classes that ImportPipelineOrchestrator depends on

/**
 * JSON Format Detector
 */
class JSONFormatDetector {
  detectFormat(data) {
    let confidence = 0;
    let format = 'unknown';
    const details = {};
    
    // Check for W3C Design Tokens format
    const w3cScore = this.checkW3CFormat(data);
    if (w3cScore > confidence) {
      confidence = w3cScore;
      format = 'w3c-design-tokens';
      details.hasTypes = this.hasW3CTypes(data);
      details.hasValues = this.hasW3CValues(data);
    }
    
    // Check for Token Studio format
    const tokenStudioScore = this.checkTokenStudioFormat(data);
    if (tokenStudioScore > confidence) {
      confidence = tokenStudioScore;
      format = 'token-studio';
      details.hasMetadata = this.hasTokenStudioMetadata(data);
    }
    
    // Check for Style Dictionary format
    const styleDictScore = this.checkStyleDictionaryFormat(data);
    if (styleDictScore > confidence) {
      confidence = styleDictScore;
      format = 'style-dictionary';
      details.hasComments = this.hasStyleDictComments(data);
    }
    
    return {
      format,
      confidence: Math.round(confidence),
      details,
      raw: data
    };
  }
  
  checkW3CFormat(data) {
    let score = 0;
    let tokenCount = 0;
    let w3cTokens = 0;
    
    const checkRecursive = (obj) => {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          if (value.$value !== undefined) {
            tokenCount++;
            if (value.$type !== undefined) w3cTokens++;
          } else {
            checkRecursive(value);
          }
        }
      }
    };
    
    checkRecursive(data);
    
    if (tokenCount > 0) {
      score = (w3cTokens / tokenCount) * 100;
    }
    
    return score;
  }
  
  checkTokenStudioFormat(data) {
    let score = 0;
    let tokenCount = 0;
    let tsTokens = 0;
    
    const checkRecursive = (obj) => {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          if (value.value !== undefined && value.type !== undefined) {
            tokenCount++;
            tsTokens++;
          } else if (value.value !== undefined || value.type !== undefined) {
            tokenCount++;
            tsTokens += 0.5;
          } else {
            checkRecursive(value);
          }
        }
      }
    };
    
    checkRecursive(data);
    
    if (tokenCount > 0) {
      score = (tsTokens / tokenCount) * 100;
    }
    
    return score;
  }
  
  checkStyleDictionaryFormat(data) {
    let score = 30; // Base score for any nested object structure
    
    const hasComments = this.hasStyleDictComments(data);
    const hasCategories = this.hasStyleDictCategories(data);
    
    if (hasComments) score += 30;
    if (hasCategories) score += 40;
    
    return Math.min(score, 100);
  }
  
  hasW3CTypes(data) {
    const checkRecursive = (obj) => {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          if (value.$type !== undefined) return true;
          if (checkRecursive(value)) return true;
        }
      }
      return false;
    };
    
    return checkRecursive(data);
  }
  
  hasW3CValues(data) {
    const checkRecursive = (obj) => {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          if (value.$value !== undefined) return true;
          if (checkRecursive(value)) return true;
        }
      }
      return false;
    };
    
    return checkRecursive(data);
  }
  
  hasTokenStudioMetadata(data) {
    const checkRecursive = (obj) => {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          if (value.type !== undefined && value.value !== undefined) return true;
          if (checkRecursive(value)) return true;
        }
      }
      return false;
    };
    
    return checkRecursive(data);
  }
  
  hasStyleDictComments(data) {
    const checkRecursive = (obj) => {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          if (value.comment !== undefined) return true;
          if (checkRecursive(value)) return true;
        }
      }
      return false;
    };
    
    return checkRecursive(data);
  }
  
  hasStyleDictCategories(data) {
    const commonCategories = ['color', 'size', 'font', 'spacing', 'border', 'shadow', 'animation'];
    const topLevelKeys = Object.keys(data);
    
    return commonCategories.some(category => 
      topLevelKeys.some(key => key.toLowerCase().includes(category))
    );
  }
}

/**
 * Enhanced Type System
 */
class EnhancedTypeSystem {
  detectType(value) {
    if (typeof value === 'string') {
      if (value.match(/^#[0-9a-fA-F]{3,8}$/)) return 'color';
      if (value.match(/^rgb|hsl|hsla/)) return 'color';
      if (value.match(/^\d+(\.\d+)?(px|rem|em|%|pt|pc|in|cm|mm|ex|ch|vw|vh|vmin|vmax)$/)) return 'dimension';
      if (value.match(/^\d+$/)) return 'number';
      return 'string';
    }
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    return 'unknown';
  }
  
  validateTypeConsistency(declaredType, value) {
    const detectedType = this.detectType(value);
    return declaredType === detectedType || declaredType === 'unknown' || detectedType === 'unknown';
  }
}

/**
 * Advanced Alias Resolver
 */
class AdvancedAliasResolver {
  async resolveAliases(tokens) {
    const tokenMap = new Map();
    const resolvedTokens = [...tokens];
    
    // Create token map for quick lookup
    tokens.forEach(token => {
      tokenMap.set(token.path, token);
    });
    
    // Resolve aliases (simplified implementation)
    for (const token of resolvedTokens) {
      if (token.isAlias && token.aliasTarget) {
        const target = tokenMap.get(token.aliasTarget);
        if (target && !target.isAlias) {
          token.resolvedValue = target.value;
          token.resolvedType = target.type;
        }
      }
    }
    
    return resolvedTokens;
  }
}

/**
 * Production Error Handler
 */
class ProductionErrorHandler {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  
  handleError(error, context = {}) {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    };
    
    this.errors.push(errorEntry);
    console.error('[ProductionErrorHandler]', errorEntry);
    
    return errorEntry;
  }
  
  handleWarning(message, context = {}) {
    const warningEntry = {
      message,
      context,
      timestamp: Date.now()
    };
    
    this.warnings.push(warningEntry);
    console.warn('[ProductionErrorHandler]', warningEntry);
    
    return warningEntry;
  }
}