import type { Metadata } from 'next';
import { Bricolage_Grotesque, Geist, Roboto_Mono } from 'next/font/google';
import '@/app/globals.css';
import { Analytics } from '@vercel/analytics/next';
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
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
  ],
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
      suppressHydrationWarning
      className={cn(
        bricolageGrotesque.variable,
        geist.variable,
        robotoMono.variable,
        'font-sans dark',
      )}
    >
      <body className="grain-overlay antialiased">{children}</body>
      <Analytics />
    </html>
  );
}
