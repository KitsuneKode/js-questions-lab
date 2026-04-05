import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist, Roboto_Mono } from 'next/font/google';
import '@/app/globals.css';
import { Analytics } from '@vercel/analytics/next';
import { getBaseUrl } from '@/lib/seo/config';
import { siteConfig } from '@/lib/site-config';
import { cn } from '@/lib/utils';

const robotoMono = Roboto_Mono({
  subsets: ['cyrillic', 'cyrillic-ext', 'greek', 'latin', 'latin-ext', 'vietnamese'],
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  variable: '--font-roboto-mono',
});

const geist = Geist({
  subsets: ['cyrillic', 'latin', 'latin-ext'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-geist',
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-bricolage-grotesque',
});

/**
 * Root layout — pure HTML shell.
 * `lang` and `dir` are set in the [locale]/layout.tsx.
 * Providers live in [locale]/layout.tsx as well.
 */
export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  applicationName: siteConfig.name,
  title: siteConfig.name,
  description: siteConfig.description,
  authors: [{ name: siteConfig.creator.name, url: siteConfig.creator.xUrl }],
  creator: siteConfig.creator.name,
  category: 'education',
  keywords: [
    'javascript interview questions',
    'javascript practice',
    'event loop visualization',
    'runnable snippets',
    'js interview prep',
    'javascript closures',
    'hoisting interview questions',
    'promise async await',
    'frontend interview prep',
    'javascript quiz',
    'lydia hallie questions',
    'javascript concepts',
    'scope and closure',
    'this keyword javascript',
    'prototype inheritance',
    'javascript tricky questions',
  ],
  other: {
    'ai-content-declaration': 'educational',
    'ai-generated': 'false',
    'content-license': 'MIT',
    'original-source': 'https://github.com/lydiahallie/javascript-questions',
    'original-author': 'Lydia Hallie',
    'og:logo': `${getBaseUrl()}/icon`,
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    creator: siteConfig.creator.displayHandle,
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn(
        bricolageGrotesque.variable,
        geist.variable,
        robotoMono.variable,
        'relative font-sans dark',
      )}
    >
      <body className="grain-overlay antialiased">{children}</body>
      <Analytics />
    </html>
  );
}
