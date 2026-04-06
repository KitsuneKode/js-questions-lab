import type { SandpackTheme } from '@codesandbox/sandpack-react';

export const darkForgeTheme: SandpackTheme = {
  colors: {
    surface1: '#111113',
    surface2: '#1a1a1f',
    surface3: '#0d0d12',
    clickable: '#71717a',
    base: '#fafafa',
    disabled: '#3f3f46',
    hover: '#a1a1aa',
    accent: '#f59e0b',
    error: '#ef4444',
    errorSurface: '#1a0a0a',
  },
  syntax: {
    plain: '#fafafa',
    comment: { color: '#3f3f46', fontStyle: 'italic' },
    keyword: '#38bdf8',
    tag: '#f59e0b',
    punctuation: '#71717a',
    definition: '#fafafa',
    property: '#38bdf8',
    static: '#22c55e',
    string: '#f59e0b',
  },
  font: {
    body: 'Geist Sans, ui-sans-serif, system-ui',
    mono: 'JetBrains Mono, Fira Code, ui-monospace',
    size: '14px',
    lineHeight: '1.6',
  },
};
