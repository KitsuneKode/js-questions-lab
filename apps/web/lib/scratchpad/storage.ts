const STORAGE_KEY = 'jsq_scratchpad_v1';

export function readScratchpadCode(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return '';
    // Stored as a plain string JSON value for forward-compat with object shapes later
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'string') return parsed;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'code' in parsed &&
      typeof (parsed as { code: unknown }).code === 'string'
    ) {
      return (parsed as { code: string }).code;
    }
    return '';
  } catch {
    return '';
  }
}

export function writeScratchpadCode(code: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, updatedAt: Date.now() }));
  } catch (err) {
    console.warn('Failed to persist scratchpad code:', err);
  }
}

export function clearScratchpadCode(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function downloadScratchpadFile(code: string, filename = 'scratchpad.js'): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([code], { type: 'text/javascript;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function copyScratchpadCode(code: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
}

const IMPORT_EXTENSIONS = new Set(['.js', '.ts', '.tsx', '.jsx', '.mjs', '.cjs', '.txt']);

export function isAllowedScratchpadImport(file: File): boolean {
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf('.');
  if (dot === -1) return false;
  return IMPORT_EXTENSIONS.has(name.slice(dot));
}

export async function readImportedScratchpadFile(file: File): Promise<string> {
  if (!isAllowedScratchpadImport(file)) {
    throw new Error('Unsupported file type. Use .js, .ts, .tsx, .jsx, or .txt');
  }

  return file.text();
}
