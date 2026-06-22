'use client';

import { useSandpack } from '@codesandbox/sandpack-react';
import * as prettierBabel from 'prettier/plugins/babel';
import * as prettierEstree from 'prettier/plugins/estree';
import * as prettier from 'prettier/standalone';
import { useMemo } from 'react';
import { MonacoCodeEditor } from '@/components/editor/monaco-code-editor';

interface SandpackCodeEditorLayoutProps {
  headerLeft?: React.ReactNode;
  viewMode: 'problem' | 'solution';
}

function getLanguageForPath(filePath: string): string {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) return 'typescript';
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) return 'javascript';
  if (filePath.endsWith('.css') || filePath.endsWith('.scss')) return 'css';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.html')) return 'html';
  return 'plaintext';
}

export function SandpackCodeEditorLayout({ headerLeft, viewMode }: SandpackCodeEditorLayoutProps) {
  const { sandpack } = useSandpack();
  const { files, activeFile, updateFile } = sandpack;
  const code = files[activeFile]?.code ?? '';
  const isReadOnly = viewMode === 'solution';

  const language = getLanguageForPath(activeFile);

  // Sandpack returns a fresh `files` object every render. Use a content-aware
  // signature so this object is only rebuilt when actual file content changes —
  // otherwise Monaco's sync effect would fire on every keystroke.
  const projectFilesSignature = useMemo(
    () =>
      Object.entries(files)
        .filter(([p]) => !p.includes('node_modules'))
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([p, f]) => `${p}:${f.code}`)
        .join('|'),
    [files],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: projectFilesSignature intentionally tracks content changes without depending on Sandpack's object identity.
  const projectFiles = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        Object.entries(files)
          .filter(([p]) => !p.includes('node_modules'))
          .map(([p, f]) => [p, f.code]),
      ),
    [projectFilesSignature],
  );

  function handleChange(val: string) {
    updateFile(activeFile, val);
  }

  async function handleFormat() {
    if (isReadOnly) return;
    try {
      const formatted = await prettier.format(code, {
        parser: 'babel',
        plugins: [prettierBabel, prettierEstree],
        singleQuote: true,
        printWidth: 100,
        trailingComma: 'all',
      });
      updateFile(activeFile, formatted);
    } catch {
      // Format errors are non-fatal — user code may be incomplete
    }
  }

  function handleReset() {
    if (isReadOnly) return;
    sandpack.resetAllFiles();
  }

  return (
    <div className="relative flex-1 min-h-0 h-full w-full flex flex-col overflow-hidden bg-code">
      {isReadOnly && (
        <div className="shrink-0 flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-3 py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Solution — Reference Only
          </span>
          <span className="text-[10px] text-muted-foreground/60">Your code is saved.</span>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-border/40 bg-surface/50 px-2 py-1.5 shrink-0">
        <div className="flex items-center min-w-0">{headerLeft}</div>
        {!isReadOnly && (
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              type="button"
              onClick={handleFormat}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/40 hover:bg-surface/50 transition-colors text-[10px] font-medium text-muted-foreground active:scale-[0.97]"
              title="Format Code"
            >
              Format
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-border/40 hover:bg-surface/50 transition-colors text-[10px] font-medium text-muted-foreground active:scale-[0.97]"
              title="Reset to Starter Code"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      <div className="relative flex-1 min-h-0 w-full">
        <MonacoCodeEditor
          path={activeFile}
          value={code}
          onChange={handleChange}
          language={language}
          readOnly={isReadOnly}
          projectFiles={projectFiles}
        />
      </div>
    </div>
  );
}
