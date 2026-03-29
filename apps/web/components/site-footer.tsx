'use client';

import { IconArrowUpRight, IconBrandGithub, IconBrandX } from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { BrandMark } from '@/components/brand-mark';
import { getLocaleFromPathname, withLocale } from '@/lib/locale-paths';
import { siteConfig, siteLinks } from '@/lib/site-config';

export function SiteFooter() {
  const tNav = useTranslations('nav');
  const tFooter = useTranslations('footer');
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname ?? '/en');

  const footerLinks = {
    product: [
      { href: withLocale(locale, siteLinks.questions), label: tNav('questions') },
      { href: withLocale(locale, siteLinks.dashboard), label: tNav('dashboard') },
      { href: withLocale(locale, siteLinks.credits), label: tNav('credits') },
    ],
    resources: [
      {
        href: siteConfig.repoUrl,
        label: tFooter('projectRepo'),
        external: true,
      },
      {
        href: siteConfig.source.repoUrl,
        label: tFooter('lydiaRepo'),
        external: true,
      },
    ],
  };

  return (
    <footer className="relative mt-auto bg-void">
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.7fr_0.7fr]">
          {/* Brand + tagline */}
          <div className="flex flex-col justify-between">
            <Link
              href={withLocale(locale, '/')}
              className="inline-flex w-fit rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <BrandMark />
            </Link>

            <div className="mt-6 md:mt-auto">
              <p className="max-w-md text-sm leading-6 text-muted-foreground">
                {tFooter('builtBy')}{' '}
                <Link
                  href={siteConfig.creator.xUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  {siteConfig.creator.displayHandle}
                </Link>
                {'. '}
                {tFooter('originalBy')}{' '}
                <Link
                  href={siteConfig.source.creatorUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-foreground transition-colors hover:text-primary"
                >
                  {siteConfig.source.creatorName}
                </Link>
                .
              </p>
              <div className="mt-4 flex items-center gap-4 text-tertiary">
                <a
                  href={siteConfig.creator.xUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary transition-colors hover:text-primary/80"
                >
                  <IconBrandX className="h-4 w-4" />
                  <span className="sr-only">X</span>
                </a>
                <a
                  href={siteConfig.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-primary"
                >
                  <IconBrandGithub className="h-4 w-4" />
                  <span className="sr-only">{tFooter('projectRepo')}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground">
              {tFooter('product')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-tertiary transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-foreground">
              {tFooter('resources')}
            </h3>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1.5 text-[13px] text-tertiary transition-colors hover:text-primary"
                  >
                    {link.label}
                    {link.external ? <IconArrowUpRight className="h-3.5 w-3.5" /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
