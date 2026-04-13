/**
 * Sandbox Tests
 *
 * Note: Full integration tests for the sandbox require a real browser environment
 * because Web Workers are not fully supported in jsdom. These tests focus on:
 * - Unit tests for helper functions (error parsing, stack trace parsing)
 * - Transformation tests (import/export stripping)
 *
 * For full integration testing, run the dev server and test manually in browser,
 * or use Playwright/Cypress for E2E tests.
 */

import { describe, expect, it, vi } from 'vitest';

// Test helper functions that don't require Worker
describe('sandbox helpers', () => {
  // Since the helper functions are internal to sandbox.ts, we test them
  // indirectly through the babel-transform module which is also used by sandbox

  describe('error handling', () => {
    it('should export the expected functions', async () => {
      const sandbox = await import('./sandbox');

      expect(sandbox.runJavaScript).toBeDefined();
      expect(sandbox.runJavaScriptInSandbox).toBeDefined();
      expect(sandbox.runJavaScriptInEnhancedSandbox).toBeDefined();
    });
  });
});

describe('babel-transform', () => {
  describe('stripImportsExports', () => {
    it('strips single-line imports', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        import { foo } from 'bar';
        console.log("works");
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('import');
      expect(result.code).toContain('console.log');
    });

    it('strips multiline imports', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        import {
          foo,
          bar,
          baz
        } from 'module';
        console.log("multiline");
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('import');
      expect(result.code).toContain('console.log');
    });

    it('strips default imports', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        import React from 'react';
        console.log("default");
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('import');
    });

    it('strips namespace imports', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        import * as utils from 'utils';
        console.log("namespace");
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('import');
    });

    it('converts named exports to declarations', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        export const myVar = 42;
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('export');
      expect(result.code).toContain('const myVar = 42');
    });

    it('converts exported functions to declarations', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        export function greet() {
          return "hello";
        }
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('export');
      expect(result.code).toContain('function greet()');
    });

    it('converts exported classes to declarations', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        export class MyClass {
          constructor() {}
        }
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('export');
      expect(result.code).toContain('class MyClass');
    });

    it('removes re-exports', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        export { foo } from 'bar';
        console.log("done");
      `);

      expect(result.error).toBeNull();
      // Check that the export statement line is removed
      expect(result.code).not.toMatch(/^export\s*\{/m);
      expect(result.code).toContain('console.log');
    });

    it('removes export all', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        export * from 'module';
        console.log("done");
      `);

      expect(result.error).toBeNull();
      // Check that the export * statement is removed
      expect(result.code).not.toMatch(/^export\s*\*/m);
      expect(result.code).toContain('console.log');
    });

    it('handles default export with named function', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        export default function myFunc() {
          return 1;
        }
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('export');
      expect(result.code).toContain('function myFunc()');
    });

    it('handles default export with named class', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        export default class MyClass {}
      `);

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('export');
      expect(result.code).toContain('class MyClass');
    });

    it('returns error for syntax errors', async () => {
      const { stripImportsExports } = await import('./babel-transform');

      const result = await stripImportsExports(`
        const x = {
      `);

      expect(result.error).not.toBeNull();
    });
  });

  describe('prepareCodeForSandbox', () => {
    it('strips imports without tracing', async () => {
      const { prepareCodeForSandbox } = await import('./babel-transform');

      const result = await prepareCodeForSandbox(
        `
        import { x } from 'y';
        console.log(x);
      `,
        { enableTracing: false },
      );

      expect(result.error).toBeNull();
      expect(result.code).not.toContain('import');
      expect(result.code).not.toContain('__tracer');
    });

    // Note: Tracing transform uses babel.template which may not work in test env
    // This is tested manually in browser or via E2E tests
    it.skip('adds tracing when enabled', async () => {
      const { prepareCodeForSandbox } = await import('./babel-transform');

      const result = await prepareCodeForSandbox(
        `
        function foo() {
          return 1;
        }
        foo();
      `,
        { enableTracing: true },
      );

      expect(result.error).toBeNull();
      expect(result.code).toContain('__tracer');
    });
  });
});

describe('worker-source', () => {
  it('generates valid JavaScript source', async () => {
    const { generateWorkerSource } = await import('./worker-source');

    const source = generateWorkerSource();

    expect(typeof source).toBe('string');
    expect(source.length).toBeGreaterThan(1000);
    expect(source).toContain('addEventListener');
    expect(source).toContain('RUN_CODE');
  });

  it('includes console proxy methods', async () => {
    const { generateWorkerSource } = await import('./worker-source');

    const source = generateWorkerSource();

    expect(source).toContain('console.log');
    expect(source).toContain('console.warn');
    expect(source).toContain('console.error');
    expect(source).toContain('console.info');
    expect(source).toContain('console.table');
    expect(source).toContain('console.time');
    expect(source).toContain('console.timeEnd');
    expect(source).toContain('console.assert');
    expect(source).toContain('console.count');
    expect(source).toContain('console.group');
    expect(source).toContain('console.trace');
  });

  it('includes async operation tracking', async () => {
    const { generateWorkerSource } = await import('./worker-source');

    const source = generateWorkerSource();

    expect(source).toContain('setTimeout');
    expect(source).toContain('setInterval');
    expect(source).toContain('requestAnimationFrame');
    expect(source).toContain('Promise.prototype.then');
    expect(source).toContain('queueMicrotask');
  });

  it('includes security hardening', async () => {
    const { generateWorkerSource } = await import('./worker-source');

    const source = generateWorkerSource();

    expect(source).toContain('postMessage');
    expect(source).toContain('importScripts');
    expect(source).toContain('BLOCKED_APIS');
  });

  it('includes cleanup function that runs after async completes', async () => {
    const { generateWorkerSource } = await import('./worker-source');

    const source = generateWorkerSource();

    // The key fix: cleanup happens in maybePostDone, not in finally
    expect(source).toContain('cleanup()');
    expect(source).toContain('maybePostDone');
    // Cleanup should be called inside maybePostDone, before posting 'done'
    expect(source).toMatch(/cleanup\(\)[\s\S]*completionPosted = true/);
  });
});

/**
 * Browser Integration Tests
 *
 * These tests require a real browser environment and should be run manually
 * or via E2E test frameworks like Playwright.
 *
 * Test cases to verify:
 *
 * 1. Basic async output:
 *    function delay() {
 *      return new Promise((res) => {
 *        setTimeout(() => {
 *          console.log("hi");
 *          res();
 *        }, 1000);
 *      });
 *    }
 *    async function run() {
 *      await delay();
 *      console.log("done");
 *    }
 *    run();
 *    // Expected: Both "hi" and "done" appear in output
 *
 * 2. setInterval with clear:
 *    let count = 0;
 *    const id = setInterval(() => {
 *      count++;
 *      console.log("tick", count);
 *      if (count >= 3) clearInterval(id);
 *    }, 100);
 *    // Expected: "tick 1", "tick 2", "tick 3" appear
 *
 * 3. Promise.all:
 *    Promise.all([
 *      fetch('https://api.example.com'),
 *      new Promise(r => setTimeout(r, 100))
 *    ]).then(() => console.log("all done"));
 *    // Expected: "all done" appears
 *
 * 4. Never-resolving promise (timeout):
 *    await new Promise(() => {});
 *    // Expected: Times out after 5 seconds
 */
