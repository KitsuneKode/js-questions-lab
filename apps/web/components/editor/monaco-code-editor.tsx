'use client';

import type { OnMount } from '@monaco-editor/react';
import { Editor, useMonaco } from '@monaco-editor/react';
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
  projectFiles?: Record<string, string>;
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

const REACT_GLOBAL_TYPES = `
declare namespace JSX {
  // Minimal JSX typing so TSX/JSX is usable inside the in-browser editor
  // without bundling full @types/react into Monaco.
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
`;

const REACT_MODULE_STUBS = `
declare module 'react' {
  const React: any;
  export default React;
  export const useState: any;
  export const useEffect: any;
  export const useMemo: any;
  export const useCallback: any;
  export const useRef: any;
  export const useLayoutEffect: any;
  export const useReducer: any;
  export const useContext: any;
  export const createContext: any;
  export const memo: any;
  export const Fragment: any;
  export type FC<P = any> = (props: P) => any;
}

declare module 'react-dom/client' {
  export const createRoot: any;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}
`;

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
  projectFiles,
}: MonacoEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const didSetupReactTypesRef = useRef(false);
  // Refs keep commands up-to-date without re-registering on every render
  const onRunRef = useRef(onRun);
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  const monaco = useMonaco();

  useEffect(() => {
    if (!monaco || !projectFiles) return;

    Object.entries(projectFiles).forEach(([filePath, fileContent]) => {
      // Sandpack activeFile has leading slash, Monaco Uri expects it
      const uri = monaco.Uri.file(filePath);
      const model = monaco.editor.getModel(uri);

      if (filePath === path) return; // Managed by <Editor /> prop

      if (model) {
        if (model.getValue() !== fileContent) {
          model.setValue(fileContent);
        }
      } else {
        const lang =
          filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript';
        monaco.editor.createModel(fileContent, lang, uri);
      }
    });
  }, [monaco, projectFiles, path]);

  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;

      if (!didSetupReactTypesRef.current) {
        didSetupReactTypesRef.current = true;

        const ts = monaco.languages.typescript;
        const compilerOptions = {
          // Keep editor usable across arbitrary Sandpack templates.
          allowNonTsExtensions: true,
          allowJs: true,
          checkJs: false,
          noEmit: true,
          target: monaco.languages.typescript.ScriptTarget.ES2022,
          module: monaco.languages.typescript.ModuleKind.ESNext,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
        };

        ts.typescriptDefaults.setCompilerOptions(compilerOptions);
        ts.javascriptDefaults.setCompilerOptions(compilerOptions);

        ts.typescriptDefaults.setDiagnosticsOptions({
          noSemanticValidation: false,
          noSyntaxValidation: false,
        });

        // Minimal React/JSX typing to avoid the "Cannot find name JSX" / module errors
        ts.typescriptDefaults.addExtraLib(REACT_GLOBAL_TYPES, 'file:///types/react-jsx.d.ts');
        ts.typescriptDefaults.addExtraLib(REACT_MODULE_STUBS, 'file:///types/react-stubs.d.ts');
      }

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

      // Monaco can mount at 0px height in complex flex layouts (resizable panels,
      // animated mounts, etc.). Force a layout pass on the next frame so the editor
      // paints even if its container size stabilizes slightly later.
      requestAnimationFrame(() => {
        try {
          editor.layout();
        } catch {
          // ignore
        }
      });
      setTimeout(() => {
        try {
          editor.layout();
        } catch {
          // ignore
        }
      }, 0);

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
    <div className="h-full w-full" data-monaco-editor-root>
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
    </div>
  );
}
