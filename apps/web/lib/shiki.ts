import { createHighlighter, type Highlighter } from 'shiki';

let highlighterInstance: Highlighter | null = null;
let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Get or create the singleton shiki highlighter instance.
 * Uses a custom dark theme that matches the Obsidian Terminal aesthetic.
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (highlighterInstance) {
    return highlighterInstance;
  }

  if (highlighterPromise) {
    return highlighterPromise;
  }

  highlighterPromise = createHighlighter({
    themes: ['github-dark-default'],
    langs: ['javascript', 'typescript', 'json', 'html', 'css'],
  }).catch((error) => {
    highlighterPromise = null;
    console.error('Failed to create shiki highlighter:', error);
    throw error;
  });

  highlighterInstance = await highlighterPromise;
  return highlighterInstance;
}

/**
 * Highlight code using shiki.
 * Returns HTML string with syntax highlighting.
 */
export async function highlightCode(
  code: string,
  lang: string = 'javascript'
): Promise<string> {
  const highlighter = await getHighlighter();
  
  // Normalize language
  const normalizedLang = lang.toLowerCase();
  const supportedLang = ['javascript', 'typescript', 'json', 'html', 'css', 'js', 'ts'].includes(normalizedLang)
    ? normalizedLang === 'js' ? 'javascript' : normalizedLang === 'ts' ? 'typescript' : normalizedLang
    : 'javascript';

  const html = highlighter.codeToHtml(code, {
    lang: supportedLang,
    theme: 'github-dark-default',
  });

  return html;
}
