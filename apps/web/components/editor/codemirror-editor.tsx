'use client';

import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { keymap } from '@codemirror/view';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import CodeMirror from '@uiw/react-codemirror';

interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  onReset?: () => void;
  autoFocus?: boolean;
  language?: 'html' | 'javascript' | 'typescript';
  readOnly?: boolean;
  path?: string;
  projectFiles?: Record<string, string>;
}

export function CodeMirrorEditor({
  value,
  onChange,
  onRun,
  onReset,
  autoFocus = false,
  language = 'javascript',
  readOnly = false,
}: CodeMirrorEditorProps) {
  const getLanguageExtension = () => {
    switch (language) {
      case 'html':
        return html();
      case 'typescript':
        return javascript({ typescript: true, jsx: true });
      case 'javascript':
        return javascript({ jsx: true });
      default:
        return javascript({ jsx: true });
    }
  };

  const customKeymap = keymap.of([
    ...defaultKeymap,
    ...historyKeymap,
    {
      key: 'Mod-Enter',
      run: () => {
        onRun?.();
        return true;
      },
    },
    {
      key: 'Mod-Shift-Backspace',
      run: () => {
        onReset?.();
        return true;
      },
    },
  ]);

  return (
    <div className="h-full w-full [&>.cm-theme-vscode]:h-full [&_.cm-scroller]:font-mono [&_.cm-scroller]:text-[14px]">
      <CodeMirror
        value={value}
        height="100%"
        theme={vscodeDark}
        extensions={[
          getLanguageExtension(),
          customKeymap,
          history(),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        ]}
        onChange={onChange}
        readOnly={readOnly}
        autoFocus={autoFocus}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
}
