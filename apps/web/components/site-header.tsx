'use client';

import { IconCheck, IconMenu2, IconTerminal2, IconWorld, IconX } from '@tabler/icons-react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { AuthControls } from '@/components/auth-controls';
import { BrandMark } from '@/components/brand-mark';
import { ReviewBadge } from '@/components/dashboard/review-badge';
import { useKeyboardShortcuts } from '@/components/keyboard-shortcuts-modal';
import { useScratchpad } from '@/components/scratchpad/scratchpad-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DEFAULT_LOCALE,
  LOCALE_LABELS,
  type LocaleCode,
  SUPPORTED_LOCALES,
} from '@/lib/i18n/config';
import { getLocaleFromPathname, switchLocalePath, withLocale } from '@/lib/locale-paths';
import { siteLinks } from '@/lib/site-config';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastYRef = useRef(0);
  const { openScratchpad } = useScratchpad();
  const { KeyboardShortcutsTrigger } = useKeyboardShortcuts();

  // Global K key shortcut for scratchpad (works everywhere except when typing)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        // Also check for Monaco editor
        target.closest('.monaco-editor') ||
        target.closest('[data-monaco-editor-root]')
      ) {
        return;
      }

      // Block modifier keys (allow Ctrl+K and Cmd+K for search)
      if (e.altKey) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') return;

      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openScratchpad();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [openScratchpad]);

  const locale = getLocaleFromPathname(pathname ?? `/${DEFAULT_LOCALE}`);

  const navLinks = [
    { href: withLocale(locale, siteLinks.questions), label: t('questions'), badge: false },
    { href: withLocale(locale, siteLinks.progress), label: t('progress'), badge: true },
    { href: withLocale(locale, siteLinks.leaderboard), label: t('leaderboard'), badge: false },
    { href: withLocale(locale, siteLinks.credits), label: t('credits'), badge: false },
    { href: withLocale(locale, siteLinks.contact), label: t('contact'), badge: false },
  ];

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (latest > lastYRef.current && latest > 100) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    lastYRef.current = latest;
  });

  const handleLocaleSwitch = (targetLocale: LocaleCode) => {
    router.push(switchLocalePath(pathname ?? '/', targetLocale));
  };

  return (
    <>
      <motion.div
        variants={{
          visible: { y: 0 },
          hidden: { y: '-150%' },
        }}
        animate={hidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 pt-12 sm:px-6"
      >
        <header
          className="pointer-events-auto mx-auto flex h-14 max-w-6xl items-center justify-between rounded-full border border-border/50 px-4 shadow-sm sm:px-5"
          style={{ backdropFilter: 'blur(16px)', background: 'rgba(9, 9, 11, 0.8)' }}
        >
          <Link
            href={withLocale(locale, '/')}
            className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <BrandMark compact />
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {navLinks.map((link) => {
              const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative text-[14px] transition-colors duration-200 ease-out',
                    active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                  {link.badge && <ReviewBadge className="ml-1.5 -mt-0.5" />}
                  {active ? (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-[6px] left-1/2 h-[2px] w-[2px] -translate-x-1/2 rounded-full bg-primary"
                      initial={false}
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 md:flex">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openScratchpad()}
                data-testid="open-scratchpad"
                className="h-8 gap-1.5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                <IconTerminal2 className="h-3.5 w-3.5" />
                {t('scratchpad')}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                    aria-label="Switch language"
                  >
                    <IconWorld className="h-3.5 w-3.5" />
                    <span className="hidden font-mono text-[10px] uppercase tracking-wider sm:inline">
                      {locale}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {SUPPORTED_LOCALES.map((loc) => (
                    <DropdownMenuItem
                      key={loc}
                      onClick={() => handleLocaleSwitch(loc)}
                      className="flex cursor-pointer items-center justify-between"
                    >
                      <span>{LOCALE_LABELS[loc]}</span>
                      {loc === locale ? <IconCheck className="h-3.5 w-3.5 text-primary" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="mx-1 h-4 w-px bg-border/50" />
              <AuthControls />
            </div>

            {/* Keyboard shortcuts button */}
            <KeyboardShortcutsTrigger />

            <Button
              variant="ghost"
              className="text-muted-foreground transition-colors hover:text-foreground md:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <IconMenu2 className="h-5 w-5" />
            </Button>
          </div>
        </header>
      </motion.div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[60] flex flex-col bg-background/95 px-6 py-8 backdrop-blur-xl"
          >
            <div className="mb-12 flex items-center justify-between">
              <Link
                href={withLocale(locale, '/')}
                className="outline-none"
                onClick={() => setMobileMenuOpen(false)}
              >
                <BrandMark />
              </Link>
              <Button
                variant="ghost"
                className="text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <IconX className="h-6 w-6" />
              </Button>
            </div>

            <nav className="mt-4 flex flex-col gap-8 text-2xl font-medium tracking-tight">
              {navLinks.map((link) => {
                const active = pathname === link.href || pathname?.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'transition-colors duration-200',
                      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openScratchpad();
                }}
                className="flex items-center gap-3 px-0 text-left text-muted-foreground transition-colors hover:text-primary"
              >
                <IconTerminal2 className="h-6 w-6" />
                {t('scratchpad')}
              </Button>
            </nav>

            <div className="mt-8 border-t border-border/30 pt-6">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                {t('language')}
              </p>
              <div className="flex flex-wrap gap-2">
                {SUPPORTED_LOCALES.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLocaleSwitch(loc);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                      loc === locale
                        ? 'border-primary/40 bg-primary/10 text-primary'
                        : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground',
                    )}
                  >
                    {loc === locale ? <IconCheck className="h-3 w-3" /> : null}
                    {LOCALE_LABELS[loc]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pb-8">
              <AuthControls />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
