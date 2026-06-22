'use client';

import type { BeforeMount, OnMount } from '@monaco-editor/react';
import { Editor } from '@monaco-editor/react';
import { IconLoader2 as Loader2 } from '@tabler/icons-react';
import { useCallback, useEffect, useMemo, useRef } from 'react';

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onReset?: () => void;
  onEditorMount?: (editor: Parameters<OnMount>[0]) => void;
  autoFocus?: boolean;
  language?: 'html' | 'javascript' | 'typescript' | 'css' | 'json' | string;
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
  cursorBlinking: 'expand' as const,
  formatOnPaste: true,
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

// ---------------------------------------------------------------------------
// React typings — bundled directly so IntelliSense works offline and without
// network. Hand-curated to cover the React API surface used by exercises.
// Registered at a path the TypeScript language service treats as installed
// node_modules, so `import React from 'react'` resolves cleanly.
// ---------------------------------------------------------------------------

const REACT_TYPES = `
declare module 'react' {
  export type Key = string | number;
  export type ReactNode =
    | ReactElement
    | string
    | number
    | boolean
    | null
    | undefined
    | Iterable<ReactNode>;
  export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: Key | null;
  }
  export type JSXElementConstructor<P> = (props: P) => ReactElement | null;

  export type FC<P = {}> = FunctionComponent<P>;
  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null;
    displayName?: string;
  }

  export type Dispatch<A> = (action: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export type EffectCallback = () => void | (() => void | undefined);
  export type DependencyList = ReadonlyArray<unknown>;

  export interface MutableRefObject<T> { current: T; }
  export interface RefObject<T> { readonly current: T | null; }
  export type Ref<T> = ((instance: T | null) => void) | RefObject<T> | null;

  export function useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, Dispatch<SetStateAction<S | undefined>>];
  export function useEffect(effect: EffectCallback, deps?: DependencyList): void;
  export function useLayoutEffect(effect: EffectCallback, deps?: DependencyList): void;
  export function useMemo<T>(factory: () => T, deps: DependencyList): T;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: DependencyList): T;
  export function useRef<T>(initialValue: T): MutableRefObject<T>;
  export function useRef<T>(initialValue: T | null): RefObject<T>;
  export function useRef<T = undefined>(): MutableRefObject<T | undefined>;
  export function useReducer<S, A>(reducer: (state: S, action: A) => S, initial: S): [S, Dispatch<A>];
  export function useContext<T>(context: Context<T>): T;
  export function useId(): string;
  export function useTransition(): [boolean, (cb: () => void) => void];
  export function useDeferredValue<T>(value: T): T;

  export interface Context<T> {
    Provider: FC<{ value: T; children?: ReactNode }>;
    Consumer: FC<{ children: (value: T) => ReactNode }>;
    displayName?: string;
  }
  export function createContext<T>(defaultValue: T): Context<T>;
  export function memo<P>(component: FC<P>, areEqual?: (prev: P, next: P) => boolean): FC<P>;
  export function forwardRef<T, P = {}>(
    render: (props: P, ref: Ref<T>) => ReactElement | null,
  ): FC<P & { ref?: Ref<T> }>;
  export function lazy<T>(loader: () => Promise<{ default: T }>): T;
  export const Fragment: any;
  export const StrictMode: FC<{ children?: ReactNode }>;
  export const Suspense: FC<{ children?: ReactNode; fallback?: ReactNode }>;

  export class Component<P = {}, S = {}> {
    constructor(props: P);
    props: P;
    state: S;
    setState(state: Partial<S> | ((prev: S, props: P) => Partial<S>), cb?: () => void): void;
    forceUpdate(cb?: () => void): void;
    render(): ReactNode;
  }
  export class PureComponent<P = {}, S = {}> extends Component<P, S> {}

  export type ChangeEvent<T = Element> = { target: T & { value: string; checked?: boolean } } & SyntheticEvent<T>;
  export type FormEvent<T = Element> = SyntheticEvent<T>;
  export type MouseEvent<T = Element> = SyntheticEvent<T>;
  export type KeyboardEvent<T = Element> = SyntheticEvent<T> & { key: string; code: string };
  export interface SyntheticEvent<T = Element> {
    currentTarget: T;
    target: EventTarget;
    preventDefault(): void;
    stopPropagation(): void;
  }

  const React: {
    useState: typeof useState;
    useEffect: typeof useEffect;
    useMemo: typeof useMemo;
    useCallback: typeof useCallback;
    useRef: typeof useRef;
    useReducer: typeof useReducer;
    useContext: typeof useContext;
    createContext: typeof createContext;
    memo: typeof memo;
    forwardRef: typeof forwardRef;
    Fragment: any;
    StrictMode: typeof StrictMode;
    Component: typeof Component;
  };
  export default React;
}

declare module 'react-dom/client' {
  export interface Root {
    render(children: import('react').ReactNode): void;
    unmount(): void;
  }
  export function createRoot(container: Element | DocumentFragment | null): Root;
  export function hydrateRoot(container: Element, children: import('react').ReactNode): Root;
}

declare module 'react-dom' {
  export function createPortal(children: import('react').ReactNode, container: Element): import('react').ReactElement;
  export function flushSync<R>(fn: () => R): R;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module 'react/jsx-dev-runtime' {
  export const jsxDEV: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface Element extends import('react').ReactElement {}
  interface ElementClass extends import('react').Component<any, any> {}
  interface IntrinsicAttributes { key?: import('react').Key }
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLanguageForFile(filePath: string): string {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) return 'typescript';
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.mjs'))
    return 'javascript';
  if (filePath.endsWith('.css')) return 'css';
  if (filePath.endsWith('.scss') || filePath.endsWith('.less')) return 'css';
  if (filePath.endsWith('.json')) return 'json';
  if (filePath.endsWith('.html') || filePath.endsWith('.htm')) return 'html';
  if (filePath.endsWith('.md')) return 'markdown';
  return 'plaintext';
}

// Module-level guard so we configure TS defaults exactly once per page load,
// even if multiple <MonacoCodeEditor> instances mount/unmount.
let typescriptDefaultsConfigured = false;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

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
  const monacoRef = useRef<Parameters<OnMount>[1] | null>(null);

  // Refs keep commands up-to-date without re-registering on every render
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const onResetRef = useRef(onReset);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onRunRef.current = onRun;
  }, [onRun]);
  useEffect(() => {
    onResetRef.current = onReset;
  }, [onReset]);

  // Build a content-aware signature so we only re-sync when files actually change.
  // Sandpack returns a fresh `files` object on every keystroke; without this,
  // the sync effect fires on every render.
  const projectFilesSignature = useMemo(() => {
    if (!projectFiles) return '';
    return Object.entries(projectFiles)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join('|');
  }, [projectFiles]);

  // Sync project files → Monaco models. Pre-creating models lets the TypeScript
  // language service resolve cross-file imports (so `import App from './App'`
  // gets IntelliSense from the model created here).
  // biome-ignore lint/correctness/useExhaustiveDependencies: projectFilesSignature intentionally tracks content changes without depending on Sandpack's object identity.
  useEffect(() => {
    const monaco = monacoRef.current;
    if (!monaco || !projectFiles) return;

    const seen = new Set<string>();

    for (const [filePath, content] of Object.entries(projectFiles)) {
      seen.add(filePath);
      if (filePath === path) continue; // The active file is owned by <Editor value={...} />

      const uri = monaco.Uri.file(filePath);
      const existing = monaco.editor.getModel(uri);
      const lang = getLanguageForFile(filePath);

      if (existing) {
        if (existing.getValue() !== content) existing.setValue(content);
      } else {
        monaco.editor.createModel(content, lang, uri);
      }
    }

    // Dispose models for files that no longer exist in the project (e.g. on
    // question switch). Avoids stale ghost imports lingering in IntelliSense.
    for (const model of monaco.editor.getModels()) {
      const uriPath = model.uri.path;
      if (!seen.has(uriPath) && uriPath.startsWith('/') && !uriPath.startsWith('/types/')) {
        // Only dispose models that look like project files (not our extra-libs).
        if (uriPath !== path) model.dispose();
      }
    }
  }, [projectFilesSignature, path]);

  // Configure TypeScript defaults BEFORE any model is created so the very
  // first .tsx model gets the correct JSX tokenization & compiler options.
  const handleBeforeMount = useCallback<BeforeMount>((monaco) => {
    monacoRef.current = monaco;

    if (typescriptDefaultsConfigured) return;
    typescriptDefaultsConfigured = true;

    const ts = monaco.languages.typescript;

    const compilerOptions = {
      allowNonTsExtensions: true,
      allowJs: true,
      checkJs: false,
      noEmit: true,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      isolatedModules: true,
      skipLibCheck: true,
      strict: false,
    };

    ts.typescriptDefaults.setCompilerOptions(compilerOptions);
    ts.javascriptDefaults.setCompilerOptions(compilerOptions);

    // Diagnostics off — this is a learning scratchpad, not a strict project.
    // Highlighting and IntelliSense don't depend on diagnostics.
    ts.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });
    ts.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
      noSuggestionDiagnostics: true,
    });

    // Eager mode: ensure cross-file lookups resolve immediately.
    ts.typescriptDefaults.setEagerModelSync(true);
    ts.javascriptDefaults.setEagerModelSync(true);

    // Register React types so `import React from 'react'` resolves with full
    // hover info / autocomplete. Path is treated as installed node_modules.
    ts.typescriptDefaults.addExtraLib(REACT_TYPES, 'file:///node_modules/@types/react/index.d.ts');
    ts.javascriptDefaults.addExtraLib(REACT_TYPES, 'file:///node_modules/@types/react/index.d.ts');
  }, []);

  const handleMount = useCallback<OnMount>(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Cmd/Ctrl+Enter → run
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRunRef.current?.();
      });
      // Cmd/Ctrl+Shift+Backspace → reset
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Backspace,
        () => {
          onResetRef.current?.();
        },
      );
      // Swallow Cmd/Ctrl+S so the browser save dialog doesn't appear
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});

      editor.updateOptions({
        ...EDITOR_OPTIONS,
        readOnly,
        domReadOnly: readOnly,
      });

      const changeDisposable = editor.onDidChangeModelContent(() => {
        onChangeRef.current(editor.getValue());
      });

      // Monaco can mount at 0px height in resizable/animated layouts. Force a
      // layout pass on the next frame so it paints even when its container
      // size stabilizes slightly later.
      requestAnimationFrame(() => {
        try {
          editor.layout();
        } catch {
          // ignore
        }
      });

      if (autoFocus) {
        // Defer one tick so a parent Sheet/Dialog animation doesn't steal focus
        setTimeout(() => editor.focus(), 50);
      }

      onEditorMount?.(editor);

      return () => {
        changeDisposable.dispose();
      };
    },
    [readOnly, autoFocus, onEditorMount],
  );

  useEffect(() => {
    editorRef.current?.updateOptions({
      readOnly,
      domReadOnly: readOnly,
    });
  }, [readOnly]);

  return (
    <div className="h-full w-full" data-monaco-editor-root>
      <Editor
        path={path}
        height="100%"
        language={language}
        theme="vs-dark"
        value={value}
        beforeMount={handleBeforeMount}
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
