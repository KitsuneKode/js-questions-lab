/**
 * Babel Transform Module
 *
 * Transforms user code to inject tracing calls for the Visual Debugger.
 * Uses @babel/standalone for browser-side AST transformation.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BabelPluginObj = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BabelNodePath = any;

export interface TransformResult {
  code: string;
  error: Error | null;
}

const TRACER_RUNTIME = `
  const __tracer = self.__tracer || {
    trace: () => {},
    scopeEnter: () => {},
    scopeExit: () => {},
    beforeCall: () => {},
    afterCall: () => {}
  };
`;

// Babel instance - loaded dynamically
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Babel: any = null;
let pluginRegistered = false;

async function loadBabel(): Promise<typeof Babel> {
  if (Babel) return Babel;
  Babel = await import('@babel/standalone');
  return Babel;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createTracerPlugin(babel: any): BabelPluginObj {
  const t = babel.types;
  const template = babel.template;

  return {
    name: 'tracer-plugin',
    visitor: {
      Program: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        enter(path: BabelNodePath) {
          if ((path.node as any).__tracerProcessed) {
            return;
          }
          (path.node as any).__tracerProcessed = true;
        },
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      FunctionDeclaration(path: BabelNodePath) {
        const loc = path.node.loc;
        if (!loc) return;

        const funcName = path.node.id?.name || 'anonymous';
        const line = loc.start.line;
        const column = loc.start.column;

        const enterCall = template.statement.ast(
          `__tracer.scopeEnter("${funcName}", ${line}, ${column});`,
        );

        const exitCall = template.statement.ast(
          `__tracer.scopeExit("${funcName}", ${line}, ${column});`,
        );

        const body = path.node.body.body;
        if (body.length > 0) {
          const firstStmt = body[0];
          if (
            firstStmt.type === 'ExpressionStatement' &&
            firstStmt.expression.type === 'CallExpression'
          ) {
            const callee = firstStmt.expression.callee;
            if (
              callee.type === 'MemberExpression' &&
              callee.object.type === 'Identifier' &&
              callee.object.name === '__tracer'
            ) {
              return;
            }
          }

          const tryFinally = t.tryStatement(
            t.blockStatement(body),
            null,
            t.blockStatement([exitCall]),
          );

          path.node.body.body = [enterCall, tryFinally];
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'FunctionExpression|ArrowFunctionExpression'(path: any) {
        const loc = path.node.loc;
        if (!loc) return;

        let funcName = 'anonymous';
        if (path.parent.type === 'VariableDeclarator' && path.parent.id.type === 'Identifier') {
          funcName = path.parent.id.name;
        } else if (path.parent.type === 'Property' && path.parent.key.type === 'Identifier') {
          funcName = path.parent.key.name;
        } else if (
          path.parent.type === 'AssignmentExpression' &&
          path.parent.left.type === 'Identifier'
        ) {
          funcName = path.parent.left.name;
        }

        const line = loc.start.line;
        const column = loc.start.column;

        if (
          path.node.type === 'ArrowFunctionExpression' &&
          path.node.body.type !== 'BlockStatement'
        ) {
          const returnStmt = t.returnStatement(path.node.body);
          path.node.body = t.blockStatement([returnStmt]);
        }

        if (path.node.body.type === 'BlockStatement') {
          const body = path.node.body.body;

          if (body.length > 0) {
            const firstStmt = body[0];
            if (
              firstStmt.type === 'ExpressionStatement' &&
              firstStmt.expression.type === 'CallExpression'
            ) {
              const callee = firstStmt.expression.callee;
              if (
                callee.type === 'MemberExpression' &&
                callee.object.type === 'Identifier' &&
                callee.object.name === '__tracer'
              ) {
                return;
              }
            }
          }

          const enterCall = template.statement.ast(
            `__tracer.scopeEnter("${funcName}", ${line}, ${column});`,
          );

          const exitCall = template.statement.ast(
            `__tracer.scopeExit("${funcName}", ${line}, ${column});`,
          );

          const tryFinally = t.tryStatement(
            t.blockStatement(body),
            null,
            t.blockStatement([exitCall]),
          );

          path.node.body.body = [enterCall, tryFinally];
        }
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CallExpression(path: any) {
        const loc = path.node.loc;
        if (!loc) return;

        const callee = path.node.callee;
        if (callee.type === 'MemberExpression') {
          if (callee.object.type === 'Identifier' && callee.object.name === '__tracer') {
            return;
          }
        }
        if (callee.type === 'Identifier' && callee.name.startsWith('__tracer')) {
          return;
        }

        let callName = 'anonymous';
        if (callee.type === 'Identifier') {
          callName = callee.name;
        } else if (callee.type === 'MemberExpression') {
          if (callee.property.type === 'Identifier') {
            if (callee.object.type === 'Identifier') {
              callName = `${callee.object.name}.${callee.property.name}`;
            } else {
              callName = callee.property.name;
            }
          }
        }

        const line = loc.start.line;
        const column = loc.start.column;

        if (path.parent.type === 'SequenceExpression') {
          const exprs = path.parent.expressions;
          if (exprs.length > 0 && exprs[0].type === 'CallExpression') {
            const firstCallee = exprs[0].callee;
            if (
              firstCallee.type === 'MemberExpression' &&
              firstCallee.object.type === 'Identifier' &&
              firstCallee.object.name === '__tracer'
            ) {
              return;
            }
          }
        }

        const beforeCall = template.expression.ast(
          `__tracer.beforeCall("${callName}", ${line}, ${column})`,
        );

        const sequence = t.sequenceExpression([beforeCall, path.node]);
        path.replaceWith(sequence);
        path.skip();
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      VariableDeclarator(path: any) {
        if (!path.node.init || !path.node.loc) return;

        const loc = path.node.loc;
        const line = loc.start.line;
        const column = loc.start.column;

        let varName = 'unknown';
        if (path.node.id.type === 'Identifier') {
          varName = path.node.id.name;
        }

        if (path.node.init.type === 'SequenceExpression') {
          const exprs = path.node.init.expressions;
          if (exprs.length > 0 && exprs[0].type === 'CallExpression') {
            const calleeNode = exprs[0].callee;
            if (
              calleeNode.type === 'MemberExpression' &&
              calleeNode.object.type === 'Identifier' &&
              calleeNode.object.name === '__tracer'
            ) {
              return;
            }
          }
        }

        const traceCall = template.expression.ast(
          `__tracer.trace("${varName}", ${line}, ${column})`,
        );

        const sequence = t.sequenceExpression([traceCall, path.node.init]);
        path.node.init = sequence;
      },

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AwaitExpression(path: any) {
        const loc = path.node.loc;
        if (!loc) return;

        const line = loc.start.line;
        const column = loc.start.column;

        if (path.node.argument.type === 'SequenceExpression') {
          return;
        }

        const traceCall = template.expression.ast(`__tracer.trace("await", ${line}, ${column})`);

        const sequence = t.sequenceExpression([traceCall, path.node.argument]);
        path.node.argument = sequence;
      },
    },
  };
}

export async function transformForTracing(code: string): Promise<TransformResult> {
  try {
    const babel = await loadBabel();

    if (!pluginRegistered) {
      babel.registerPlugin('tracer-plugin', () => createTracerPlugin(babel));
      pluginRegistered = true;
    }

    const result = babel.transform(code, {
      plugins: ['tracer-plugin'],
      sourceType: 'script',
      retainLines: true,
      compact: false,
    }) as any;

    if (!result?.code) {
      return {
        code,
        error: new Error('Babel transform returned empty result'),
      };
    }

    const transformedCode = `${TRACER_RUNTIME}\n${result.code}`;

    return {
      code: transformedCode,
      error: null,
    };
  } catch (error) {
    return {
      code,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Synchronous version for cases where Babel is already loaded
export function transformForTracingSync(code: string): TransformResult {
  if (!Babel) {
    return {
      code,
      error: new Error('Babel not loaded. Call transformForTracing first.'),
    };
  }

  try {
    const result = Babel.transform(code, {
      plugins: ['tracer-plugin'],
      sourceType: 'script',
      retainLines: true,
      compact: false,
    }) as any;

    if (!result?.code) {
      return {
        code,
        error: new Error('Babel transform returned empty result'),
      };
    }

    const transformedCode = `${TRACER_RUNTIME}\n${result.code}`;

    return {
      code: transformedCode,
      error: null,
    };
  } catch (error) {
    return {
      code,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

// Cache for transformed code
const transformCache = new Map<string, TransformResult>();
const MAX_CACHE_SIZE = 100;

export async function transformForTracingCached(code: string): Promise<TransformResult> {
  const cached = transformCache.get(code);
  if (cached) {
    return cached;
  }

  const result = await transformForTracing(code);

  if (transformCache.size >= MAX_CACHE_SIZE) {
    const firstKey = transformCache.keys().next().value;
    if (firstKey) {
      transformCache.delete(firstKey);
    }
  }

  transformCache.set(code, result);
  return result;
}
