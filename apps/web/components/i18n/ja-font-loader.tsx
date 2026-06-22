'use client';

import { useEffect } from 'react';

const NOTO_SANS_JP_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap';

/**
 * Loads Noto Sans JP only for Japanese locale pages — avoids shipping
 * ~277KB of @font-face rules on every other locale.
 */
export function JaFontLoader({ locale }: { locale: string }) {
  useEffect(() => {
    if (locale !== 'ja') return;

    const existing = document.getElementById('ja-font-noto-sans-jp');
    if (existing) return;

    const link = document.createElement('link');
    link.id = 'ja-font-noto-sans-jp';
    link.rel = 'stylesheet';
    link.href = NOTO_SANS_JP_URL;
    document.head.appendChild(link);
  }, [locale]);

  return null;
}
