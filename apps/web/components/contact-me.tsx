'use client';

import {
  IconBrandGithub,
  IconBrandX,
  IconCheck,
  IconLoader2,
  IconMailFilled,
} from '@tabler/icons-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { siteConfig } from '@/lib/site-config';

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const t = useTranslations('contact');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      console.error(
        'Web3Forms access key is missing. Set NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY in your environment.',
      );
      setStatus('error');
      return;
    }

    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    formData.append('access_key', accessKey);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        console.error('Form error:', data);
        setStatus('error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setStatus('error');
    }
  }

  return (
    <section className="@container relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mb-12 space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <span className="uppercase tracking-widest font-bold flex items-center gap-2">
              <IconMailFilled className="h-3 w-3" />
              {t('badge')}
            </span>
          </div>
          <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[clamp(3rem,2rem+3vw,4.5rem)]">
            {t.rich('headline', {
              something: (children) => <span className="text-primary">{children}</span>,
            })}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-secondary">{t('subheadline')}</p>
        </header>

        <div className="@xl:grid-cols-12 grid gap-10 items-start">
          {/* Contact Info Sidebar */}
          <div className="@xl:col-span-4 space-y-8">
            <div className="space-y-6">
              <h3 className="font-display text-xl font-semibold text-foreground border-b border-border/50 pb-4">
                {t('connect')}
              </h3>

              <div className="space-y-4">
                <div className="group flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border-subtle group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                    <IconMailFilled className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Email</p>
                    <Link
                      href="mailto:bhuyanmanash2002@gmail.com"
                      className="text-secondary hover:text-primary text-sm transition-colors"
                    >
                      bhuyanmanash2002@gmail.com
                    </Link>
                  </div>
                </div>

                <div className="group flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border-subtle group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                    <IconBrandX className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">X (Twitter)</p>
                    <Link
                      href={siteConfig.creator.xUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-primary text-sm transition-colors"
                    >
                      {siteConfig.creator.displayHandle}
                    </Link>
                  </div>
                </div>

                <div className="group flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface border border-border-subtle group-hover:border-primary/50 group-hover:bg-primary/10 transition-colors">
                    <IconBrandGithub className="h-5 w-5 text-secondary group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">GitHub</p>
                    <Link
                      href={siteConfig.creator.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-primary text-sm transition-colors"
                    >
                      {siteConfig.creator.handle}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <Card className="@xl:col-span-8 relative overflow-hidden border-border-subtle bg-surface/80 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl rounded-2xl">
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/80 to-transparent" />

            {/* Inner ambient glow */}
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

            <div className="relative p-8 sm:p-10">
              <div className="mb-8">
                <h3 className="font-display text-2xl font-medium text-foreground tracking-tight">
                  {t('formTitle')}
                </h3>
                <p className="text-sm text-secondary mt-1">{t('formSubtitle')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Hidden input for bot prevention in Web3Forms */}
                <input
                  type="checkbox"
                  name="botcheck"
                  className="hidden"
                  style={{ display: 'none' }}
                />

                <div className="@md:grid-cols-2 grid gap-4 sm:gap-5">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="name"
                      className="text-[11px] font-semibold uppercase tracking-wider text-tertiary"
                    >
                      {t('labelName')}
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Manash Pratim Bhuyan"
                      required
                      className="h-11 bg-background/50 border-border-subtle hover:border-primary/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-all shadow-inner rounded-xl px-4"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="email"
                      className="text-[11px] font-semibold uppercase tracking-wider text-tertiary"
                    >
                      {t('labelEmail')}
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="bhuyanmanash2002@gmail.com"
                      required
                      className="h-11 bg-background/50 border-border-subtle hover:border-primary/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-all shadow-inner rounded-xl px-4"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="subject"
                    className="text-[11px] font-semibold uppercase tracking-wider text-tertiary"
                  >
                    {t('labelSubject')}
                  </Label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder={t('placeholderSubject')}
                    required
                    className="h-11 bg-background/50 border-border-subtle hover:border-primary/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-all shadow-inner rounded-xl px-4"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label
                    htmlFor="message"
                    className="text-[11px] font-semibold uppercase tracking-wider text-tertiary"
                  >
                    {t('labelMessage')}
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={4}
                    placeholder={t('placeholderMessage')}
                    required
                    className="min-h-[100px] bg-background/50 border-border-subtle hover:border-primary/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 transition-all shadow-inner rounded-xl p-4 resize-y"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <Button
                    type="submit"
                    disabled={status === 'loading' || status === 'success'}
                    className="w-full sm:w-auto h-11 px-8 font-bold tracking-wide bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all rounded-xl active:scale-[0.98]"
                  >
                    {status === 'idle' && t('submitIdle')}
                    {status === 'loading' && (
                      <>
                        {t('submitLoading')}
                        <IconLoader2 className="ml-2 h-4 w-4 animate-spin" />
                      </>
                    )}
                    {status === 'success' && (
                      <>
                        {t('submitSuccess')}
                        <IconCheck className="ml-2 h-4 w-4" />
                      </>
                    )}
                    {status === 'error' && t('submitError')}
                  </Button>

                  <p className="text-xs text-tertiary flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                    </span>
                    {t('responseNotice')}
                  </p>
                </div>

                {status === 'error' && (
                  <div className="p-3 mt-4 rounded-lg bg-danger/10 border border-danger/20 text-danger text-xs flex items-start gap-2">
                    <IconBrandX className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Failed to send message. Please ensure you have set the{' '}
                      <code className="bg-danger/20 px-1 py-0.5 rounded font-mono">
                        NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY
                      </code>{' '}
                      in your environment variables, or email me directly instead.
                    </p>
                  </div>
                )}
              </form>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
