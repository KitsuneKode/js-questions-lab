'use client';

import type { OnMount } from '@monaco-editor/react';
import { IconLoader2 as Loader2 } from '@tabler/icons-react';
import { Editor } from '@monaco-editor/react';
import { useCallback, useRef } from 'react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
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
  language = 'javascript',
  readOnly = false,
  path,
}: MonacoEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun?.();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});

      editor.updateOptions({
        ...EDITOR_OPTIONS,
        readOnly,
        domReadOnly: readOnly,
      });
    },
    [onRun, readOnly],
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
