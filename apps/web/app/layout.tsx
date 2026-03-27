import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { Toaster } from 'sonner';

import { AuthProvider } from '@/components/auth-provider';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { ProgressProvider } from '@/lib/progress/progress-context';
import { NotificationManager } from '@/components/notification-manager';

const geistSans = Geist({
  variable: '--font-body',
  subsets: ['latin'],
});

const geistDisplay = Geist({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'JS Interview Atlas',
  description: 'Interactive JavaScript interview questions with runnable code and timeline visualizations.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <AuthProvider>
      <html lang="en" className={`${geistDisplay.variable} ${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <body className="grain-overlay antialiased">
          <ProgressProvider>
            <SiteHeader />
            {children}
            <SiteFooter />
            <NotificationManager />
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: 'hsl(0, 0%, 5%)',
                  border: '1px solid hsl(0, 0%, 15%)',
                  color: 'hsl(210, 20%, 98%)',
                  fontFamily: 'var(--font-body), system-ui, sans-serif',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                },
              }}
            />
          </ProgressProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
