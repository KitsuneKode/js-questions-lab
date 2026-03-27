'use client';

import { useEffect, useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';

import { highlightCode } from '@/lib/shiki';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = 'javascript',
  showLineNumbers = true,
  className,
}: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    highlightCode(code, language).then((html) => {
      if (!cancelled) {
        setHighlightedHtml(html);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = code.split('\n').length;

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border/50 bg-[#0d1117]',
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/30 bg-white/[0.02] px-4 py-2">
        <span className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
          <Code2 className="h-3 w-3" />
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground/60 transition-colors hover:bg-white/5 hover:text-muted-foreground"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="hidden sm:inline">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code content */}
      <div className="relative overflow-x-auto">
        {showLineNumbers && (
          <div
            className="pointer-events-none absolute left-0 top-0 select-none border-r border-border/20 bg-white/[0.01] px-3 py-4 text-right font-mono text-[11px] leading-6 text-muted-foreground/30"
            aria-hidden="true"
          >
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={`line-${i + 1}`}>{i + 1}</div>
            ))}
          </div>
        )}

        <div
          className={cn(
            'shiki-code overflow-x-auto p-4 font-mono text-sm leading-6',
            showLineNumbers && 'pl-14'
          )}
        >
          {highlightedHtml ? (
            /* biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is trusted */
            <div
              // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is trusted
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              className="[&>pre]:!bg-transparent [&>pre]:!p-0 [&_code]:!bg-transparent [&_pre]:!whitespace-pre [&_code]:!whitespace-pre"
            />
          ) : (
            <pre className="text-[#e6edf3]">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
