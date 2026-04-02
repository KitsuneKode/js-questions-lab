import { IconArrowRight } from '@tabler/icons-react';
import Link from 'next/link';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/auth-provider';
import { NotificationManager } from '@/components/notification-manager';
import { FloatingScratchpadGate } from '@/components/scratchpad/floating-scratchpad-gate';
import { ScratchpadProvider } from '@/components/scratchpad/scratchpad-context';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { StickyBanner } from '@/components/ui/sticky-banner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ProgressProvider } from '@/lib/progress/progress-context';

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider>
        <ProgressProvider>
          <ScratchpadProvider>
            <StickyBanner
              className="bg-primary text-primary-foreground font-mono tracking-tight z-[60] fixed rounded-none border-b-0"
              hideOnScroll={true}
            >
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-[90%] text-[11px] sm:text-xs font-semibold uppercase">
                <span>
                  Interested in supporting{' '}
                  <strong className="font-extrabold bg-black/10 px-1 py-0.5 rounded">
                    JS Questions Lab
                  </strong>
                  ?
                </span>
                <span className="hidden sm:inline opacity-50">|</span>
                <Link
                  href="/contact"
                  className="group flex items-center gap-1 hover:underline underline-offset-2 transition-all"
                >
                  Contact for Sponsorship
                  <IconArrowRight className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </StickyBanner>
            <SiteHeader />
            {children}
            <SiteFooter />
            <NotificationManager />
            <FloatingScratchpadGate />
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
          </ScratchpadProvider>
        </ProgressProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}
