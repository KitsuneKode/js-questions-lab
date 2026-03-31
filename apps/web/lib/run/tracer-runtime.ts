/**
 * Tracer Runtime Source
 *
 * This module provides the source code that gets injected into the web worker
 * to enable expression-level tracing. The tracer emits enhanced timeline events
 * with source locations for the Visual Debugger.
 */

/**
 * Generates the tracer runtime source code for injection into the worker.
 * The runtime provides __tracer global with methods called by instrumented code.
 */
export function generateTracerRuntimeSource(): string {
  return `
    // Tracer Runtime - Injected for Visual Debugger
    (function() {
      const scopeStack = [];
      const variableSnapshots = new Map();
      
      function serializeValue(value, depth = 0) {
        if (depth > 2) {
          return { type: 'object', preview: '[...]' };
        }
        
        if (value === undefined) {
          return { type: 'undefined', preview: 'undefined' };
        }
        
        if (value === null) {
          return { type: 'null', preview: 'null' };
        }
        
        const valueType = typeof value;
        
        if (valueType === 'function') {
          const name = value.name || 'anonymous';
          return { type: 'function', preview: \`[Function: \${name}]\` };
        }
        
        if (valueType === 'string') {
          const preview = value.length > 50 ? value.slice(0, 50) + '...' : value;
          return { type: 'primitive', preview: \`"\${preview}"\`, value };
        }
        
        if (valueType === 'number' || valueType === 'boolean') {
          return { type: 'primitive', preview: String(value), value };
        }
        
        if (valueType === 'symbol') {
          return { type: 'primitive', preview: value.toString() };
        }
        
        if (Array.isArray(value)) {
          if (value.length === 0) {
            return { type: 'array', preview: '[]' };
          }
          if (value.length <= 3) {
            const items = value.map(v => serializeValue(v, depth + 1).preview).join(', ');
            return { type: 'array', preview: \`[\${items}]\` };
          }
          return { type: 'array', preview: \`Array(\${value.length})\` };
        }
        
        if (valueType === 'object') {
          const keys = Object.keys(value);
          if (keys.length === 0) {
            return { type: 'object', preview: '{}' };
          }
          if (keys.length <= 2) {
            const items = keys.map(k => \`\${k}: \${serializeValue(value[k], depth + 1).preview}\`).join(', ');
            return { type: 'object', preview: \`{\${items}}\` };
          }
          const constructor = value.constructor?.name || 'Object';
          return { type: 'object', preview: \`\${constructor} {\${keys.length} keys}\` };
        }
        
        return { type: 'object', preview: String(value) };
      }
      
      function captureCurrentScope() {
        return scopeStack.map(scope => ({
          type: scope.type,
          name: scope.name,
          variables: Object.fromEntries(
            Object.entries(scope.variables || {}).map(([k, v]) => [k, serializeValue(v)])
          )
        }));
      }
      
      function pushEnhancedTimeline(kind, phase, label, line, column, extra = {}) {
        if (typeof pushTimeline === 'function') {
          // Use the existing pushTimeline but with enhanced data
          const eventData = {
            kind,
            phase,
            label,
            loc: line !== undefined ? { line, column: column || 0 } : undefined,
            context: extra.context,
            apiMeta: extra.apiMeta
          };
          
          // Post enhanced timeline message
          runnerScope.postMessage({
            source: 'jsq-worker',
            runId: runId,
            type: 'enhanced-timeline',
            event: {
              id: ++eventId,
              at: performance.now(),
              ...eventData
            }
          });
        }
      }
      
      self.__tracer = {
        trace: function(varName, line, column) {
          pushEnhancedTimeline('sync', 'instant', \`var \${varName}\`, line, column);
        },
        
        scopeEnter: function(funcName, line, column) {
          const scope = {
            type: 'function',
            name: funcName,
            variables: {},
            line,
            column
          };
          scopeStack.push(scope);
          
          pushEnhancedTimeline('scope', 'enter', funcName, line, column, {
            context: {
              functionName: funcName,
              scopeChain: captureCurrentScope(),
              thisBinding: 'window'
            }
          });
        },
        
        scopeExit: function(funcName, line, column) {
          const scope = scopeStack.pop();
          
          pushEnhancedTimeline('scope', 'exit', funcName, line, column, {
            context: {
              functionName: funcName,
              scopeChain: captureCurrentScope(),
              thisBinding: 'window'
            }
          });
        },
        
        beforeCall: function(callName, line, column) {
          pushEnhancedTimeline('sync', 'instant', \`call \${callName}\`, line, column);
        },
        
        afterCall: function(callName, line, column) {
          // Currently not used, but available for future use
        },
        
        captureVariable: function(name, value) {
          if (scopeStack.length > 0) {
            scopeStack[scopeStack.length - 1].variables[name] = value;
          }
          variableSnapshots.set(name, serializeValue(value));
        }
      };
    })();
  `;
}

/**
 * Type definitions for the tracer runtime.
 * These match the EnhancedTimelineEvent structure in types.ts.
 */
export interface TracerScope {
  type: 'global' | 'function' | 'block';
  name: string;
  variables: Record<string, unknown>;
  line?: number;
  column?: number;
}
