'use client';

interface SimpleCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SimpleCodeEditor({ value, onChange }: SimpleCodeEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      className="min-h-[280px] w-full rounded-lg border border-border bg-black/30 p-4 font-mono text-sm leading-6 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      spellCheck={false}
      aria-label="Code editor"
    />
  );
}
