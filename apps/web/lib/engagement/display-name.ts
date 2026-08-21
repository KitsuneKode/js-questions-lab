export function normalizeDisplayName(
  raw: string,
): { ok: true; displayName: string } | { ok: false; error: string } {
  const displayName = raw.trim().replace(/\s+/g, ' ');
  if (displayName.length < 2 || displayName.length > 24) {
    return { ok: false, error: 'Name must be 2–24 characters' };
  }
  if (!/^[\p{L}\p{N} _.-]+$/u.test(displayName)) {
    return { ok: false, error: 'Use letters, numbers, spaces, _ . - only' };
  }
  return { ok: true, displayName };
}
