/**
 * Babel Transform Module
 *
 * Transforms user code to inject tracing calls for the Visual Debugger.
 * Uses @babel/standalone for browser-side AST transformation.
 */

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

interface BabelTypes {
  tryStatement(block: unknown, handler: unknown, finalizer: unknown): unknown;
  blockStatement(body: unknown[]): unknown;
  returnStatement(argument: unknown): unknown;
  sequenceExpression(expressions: unknown[]): unknown;
}

interface BabelTemplateBuilder {
  ast(template: string): unknown;
}

interface BabelTemplate {
  statement: BabelTemplateBuilder;
  expression: BabelTemplateBuilder;
}

interface BabelTransformResult {
  code?: string;
}

interface BabelRuntime {
  types: BabelTypes;
  template: BabelTemplate;
  transform(code: string, options: Record<string, unknown>): BabelTransformResult;
  registerPlugin(name: string, factory: () => unknown): void;
}

interface VisitorPath {
  node: {
    type: string;
    loc?: { start: { line: number; column: number } };
    id?: Record<string, unknown>;
    body: { type: string; body: unknown[] };
    callee: Record<string, unknown>;
    argument: Record<string, unknown>;
    init: Record<string, unknown> | null;
    __tracerProcessed?: boolean;
  };
  parent: Record<string, unknown>;
  replaceWith(node: unknown): void;
  skip(): void;
}

interface VisitorHandlers {
  Program: { enter(path: VisitorPath): void };
  FunctionDeclaration(path: VisitorPath): void;
  'FunctionExpression|ArrowFunctionExpression'(path: VisitorPath): void;
  CallExpression(path: VisitorPath): void;
  VariableDeclarator(path: VisitorPath): void;
  AwaitExpression(path: VisitorPath): void;
}

interface TracerPlugin {
  name: string;
  visitor: VisitorHandlers;
}

type BabelModule = BabelRuntime & {
  registerPlugin(name: string, factory: () => unknown): void;
};

let Babel: BabelModule | null = null;
let pluginRegistered = false;

async function loadBabel(): Promise<BabelModule> {
  if (Babel) return Babel;
  const mod = await import('@babel/standalone');
  Babel = mod as unknown as BabelModule;
  return Babel;
}

function isTracerCall(node: unknown): boolean {
  if (typeof node !== 'object' || node === null) return false;
  const record = node as Record<string, unknown>;
  if (record.type !== 'CallExpression') return false;
  const callee = record.callee as Record<string, unknown>;
  if (callee?.type !== 'MemberExpression') return false;
  const obj = callee.object as Record<string, unknown>;
  return obj?.type === 'Identifier' && obj?.name === '__tracer';
}

function createTracerPlugin(babel: BabelRuntime): TracerPlugin {
  const t = babel.types;
  const template = babel.template;

  return {
    name: 'tracer-plugin',
    visitor: {
      Program: {
        enter(path: VisitorPath) {
          if (path.node.__tracerProcessed) {
            return;
          }
          path.node.__tracerProcessed = true;
        },
      },

      FunctionDeclaration(path: VisitorPath) {
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
          const firstStmt = body[0] as Record<string, unknown>;
          if (
            firstStmt.type === 'ExpressionStatement' &&
            firstStmt.expression &&
            (firstStmt.expression as Record<string, unknown>).type === 'CallExpression' &&
            isTracerCall(firstStmt.expression)
          ) {
            return;
          }

          const tryFinally = t.tryStatement(
            t.blockStatement(body),
            null,
            t.blockStatement([exitCall]),
          );

          path.node.body.body = [enterCall, tryFinally];
        }
      },

      'FunctionExpression|ArrowFunctionExpression'(path: VisitorPath) {
        const loc = path.node.loc;
        if (!loc) return;

        let funcName = 'anonymous';
        const parent = path.parent;
        if (
          parent.type === 'VariableDeclarator' &&
          (parent.id as Record<string, unknown>)?.type === 'Identifier'
        ) {
          funcName = (parent.id as Record<string, unknown>).name as string;
        } else if (
          parent.type === 'Property' &&
          (parent.key as Record<string, unknown>)?.type === 'Identifier'
        ) {
          funcName = (parent.key as Record<string, unknown>).name as string;
        } else if (
          parent.type === 'AssignmentExpression' &&
          (parent.left as Record<string, unknown>)?.type === 'Identifier'
        ) {
          funcName = (parent.left as Record<string, unknown>).name as string;
        }

        const line = loc.start.line;
        const column = loc.start.column;

        const bodyNode = path.node.body;
        if (path.node.type === 'ArrowFunctionExpression' && bodyNode.type !== 'BlockStatement') {
          const returnStmt = t.returnStatement(bodyNode);
          path.node.body = t.blockStatement([returnStmt]) as VisitorPath['node']['body'];
        }

        const currentBody = path.node.body;
        if (currentBody.type === 'BlockStatement') {
          const body = currentBody.body;

          if (body.length > 0) {
            const firstStmt = body[0] as Record<string, unknown>;
            if (
              firstStmt.type === 'ExpressionStatement' &&
              firstStmt.expression &&
              (firstStmt.expression as Record<string, unknown>).type === 'CallExpression' &&
              isTracerCall(firstStmt.expression)
            ) {
              return;
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

      CallExpression(path: VisitorPath) {
        const loc = path.node.loc;
        if (!loc) return;

        const callee = path.node.callee;
        if (callee.type === 'MemberExpression') {
          const obj = callee.object as Record<string, unknown>;
          if (obj.type === 'Identifier' && obj.name === '__tracer') {
            return;
          }
        }
        if (
          callee.type === 'Identifier' &&
          typeof callee.name === 'string' &&
          callee.name.startsWith('__tracer')
        ) {
          return;
        }

        let callName = 'anonymous';
        if (callee.type === 'Identifier') {
          callName = callee.name as string;
        } else if (callee.type === 'MemberExpression') {
          const prop = callee.property as Record<string, unknown>;
          if (prop.type === 'Identifier') {
            const obj = callee.object as Record<string, unknown>;
            if (obj.type === 'Identifier') {
              callName = `${obj.name as string}.${prop.name as string}`;
            } else {
              callName = prop.name as string;
            }
          }
        }

        const line = loc.start.line;
        const column = loc.start.column;

        if (path.parent.type === 'SequenceExpression') {
          const exprs = (path.parent.expressions ?? []) as Record<string, unknown>[];
          if (exprs.length > 0 && exprs[0]?.type === 'CallExpression') {
            const firstCallee = (exprs[0].callee ?? {}) as Record<string, unknown>;
            const firstObj = (firstCallee.object ?? {}) as Record<string, unknown>;
            if (
              firstCallee.type === 'MemberExpression' &&
              firstObj.type === 'Identifier' &&
              firstObj.name === '__tracer'
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

      VariableDeclarator(path: VisitorPath) {
        if (!path.node.init || !path.node.loc) return;

        const loc = path.node.loc;
        const line = loc.start.line;
        const column = loc.start.column;

        let varName = 'unknown';
        if (path.node.id?.type === 'Identifier') {
          varName = path.node.id.name as string;
        }

        const init = path.node.init;
        if (init.type === 'SequenceExpression') {
          const exprs = (init.expressions ?? []) as Record<string, unknown>[];
          if (exprs.length > 0 && exprs[0]?.type === 'CallExpression') {
            const calleeNode = (exprs[0].callee ?? {}) as Record<string, unknown>;
            const obj = (calleeNode.object ?? {}) as Record<string, unknown>;
            if (
              calleeNode.type === 'MemberExpression' &&
              obj.type === 'Identifier' &&
              obj.name === '__tracer'
            ) {
              return;
            }
          }
        }

        const traceCall = template.expression.ast(
          `__tracer.trace("${varName}", ${line}, ${column})`,
        );

        const sequence = t.sequenceExpression([traceCall, path.node.init]);
        path.node.init = sequence as VisitorPath['node']['init'];
      },

      AwaitExpression(path: VisitorPath) {
        const loc = path.node.loc;
        if (!loc) return;

        const line = loc.start.line;
        const column = loc.start.column;

        const arg = path.node.argument;
        if (arg.type === 'SequenceExpression') {
          return;
        }

        const traceCall = template.expression.ast(`__tracer.trace("await", ${line}, ${column})`);

        const sequence = t.sequenceExpression([traceCall, path.node.argument]);
        path.node.argument = sequence as VisitorPath['node']['argument'];
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
    });

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
    });

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
