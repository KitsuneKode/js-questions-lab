'use client';

import type { OnMount } from '@monaco-editor/react';
import { Editor } from '@monaco-editor/react';
import { IconLoader2 as Loader2 } from '@tabler/icons-react';
import { useCallback, useEffect, useRef } from 'react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onReset?: () => void;
  onEditorMount?: (editor: Parameters<OnMount>[0]) => void;
  autoFocus?: boolean;
  language?: 'html' | 'javascript' | 'typescript';
  readOnly?: boolean;
  path?: string;
}

const EDITOR_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
  fontLigatures: true,
  lineNumbers: 'on' as const,
  roundedSelection: true,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on' as const,
  padding: { top: 16, bottom: 16 },
  renderLineHighlight: 'line' as const,
  cursorBlinking: 'smooth' as const,
  cursorSmoothCaretAnimation: 'on' as const,
  smoothScrolling: true,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
    alwaysConsumeMouseWheel: false,
  },
  bracketPairColorization: { enabled: true },
  guides: {
    bracketPairs: true,
    indentation: true,
  },
};

export function MonacoCodeEditor({
  value,
  onChange,
  onRun,
  onReset,
  onEditorMount,
  autoFocus = false,
  language = 'javascript',
  readOnly = false,
  path,
}: MonacoEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  // Refs keep commands up-to-date without re-registering on every render
  const onRunRef = useRef(onRun);
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;

      // Use refs so commands always call the latest callback, not the stale closure
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRunRef.current?.();
      });

      // Ctrl+Shift+Backspace → reset scratchpad
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Backspace,
        () => {
          onResetRef.current?.();
        },
      );

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});

      editor.updateOptions({
        ...EDITOR_OPTIONS,
        readOnly,
        domReadOnly: readOnly,
      });

      if (autoFocus) {
        // Defer one tick so the Sheet/Dialog animation doesn't steal focus back
        setTimeout(() => editor.focus(), 50);
      }

      onEditorMount?.(editor);
    },
    // readOnly and autoFocus are layout-time values; refs handle the rest
    [readOnly, autoFocus, onEditorMount],
  );

  return (
    <Editor
      path={path}
      height="100%"
      language={language}
      theme="vs-dark"
      value={value}
      onChange={(val) => onChange(val || '')}
      onMount={handleMount}
      loading={
        <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    />
  );
}
