'use client';

import Editor, { type Monaco, type OnMount } from '@monaco-editor/react';
import { IconCode as Code } from '@tabler/icons-react';
import type * as MonacoEditor from 'monaco-editor';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface DebuggerCodePanelProps {
  code: string;
  currentLine?: number | null;
  className?: string;
}

export function DebuggerCodePanel({ code, currentLine, className }: DebuggerCodePanelProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const decorationsRef = useRef<MonacoEditor.editor.IEditorDecorationsCollection | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsReady(true);

    // Configure editor options for read-only display
    editor.updateOptions({
      readOnly: true,
      domReadOnly: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      lineNumbers: 'on',
      glyphMargin: true,
      folding: false,
      lineDecorationsWidth: 10,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'none',
      selectionHighlight: false,
      occurrencesHighlight: 'off',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'hidden',
        verticalScrollbarSize: 8,
      },
      padding: { top: 12, bottom: 12 },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 20,
      fontLigatures: true,
    });

    // Define custom theme for debugger
    monaco.editor.defineTheme('debugger-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.lineHighlightBackground': '#00000000',
        'editorLineNumber.foreground': '#4b5563',
        'editorLineNumber.activeForeground': '#ec4899',
        'editorGutter.background': '#0a0a0a',
      },
    });

    monaco.editor.setTheme('debugger-dark');
  }, []);

  // Update line highlighting when currentLine changes
  useEffect(() => {
    if (!isReady || !editorRef.current || !monacoRef.current) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Clear existing decorations
    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }

    if (currentLine && currentLine > 0) {
      // Add new decoration for current line
      decorationsRef.current = editor.createDecorationsCollection([
        {
          range: new monaco.Range(currentLine, 1, currentLine, 1),
          options: {
            isWholeLine: true,
            className: 'debugger-active-line',
            glyphMarginClassName: 'debugger-active-glyph',
            overviewRuler: {
              color: '#ec4899',
              position: monaco.editor.OverviewRulerLane.Full,
            },
          },
        },
      ]);

      // Scroll to the line
      editor.revealLineInCenter(currentLine);
    }
  }, [currentLine, isReady]);

  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-slate-700/50 bg-[#0a0a0a] overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-[#111]">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Source Code
          </span>
        </div>
        {currentLine && <span className="text-xs font-mono text-pink-400">Line {currentLine}</span>}
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={code}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          loading={
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading editor...
            </div>
          }
          options={{
            readOnly: true,
            domReadOnly: true,
            automaticLayout: true,
          }}
        />
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-slate-700/50 bg-[#111]">
        <p className="text-[10px] text-slate-500">
          {currentLine
            ? 'Pink highlight shows the current line being executed'
            : 'Run the code to see step-by-step execution'}
        </p>
      </div>
    </section>
  );
}
