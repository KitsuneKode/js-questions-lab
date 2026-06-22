import type { SandpackTheme } from '@codesandbox/sandpack-react';

export const darkForgeTheme: SandpackTheme = {
  colors: {
    surface1: 'transparent', // Let the app's native bg-code/bg-void shine through
    surface2: '#1a1a1f', // borders and secondary backgrounds
    surface3: '#27272a', // hovers
    clickable: '#a1a1aa',
    base: '#f4f4f5',
    disabled: '#52525b',
    hover: '#fafafa',
    accent: '#f59e0b',
    error: '#ef4444',
    errorSurface: 'rgba(239, 68, 68, 0.1)',
  },
  syntax: {
    plain: '#f4f4f5',
    comment: { color: '#71717a', fontStyle: 'italic' },
    keyword: '#38bdf8', // sky-400
    tag: '#fbbf24', // amber-400
    punctuation: '#a1a1aa', // zinc-400
    definition: '#818cf8', // indigo-400
    property: '#38bdf8', // sky-400
    static: '#34d399', // emerald-400
    string: '#a7f3d0', // emerald-200
  },
  font: {
    body: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
    size: '14px',
    lineHeight: '1.6',
  },
};
