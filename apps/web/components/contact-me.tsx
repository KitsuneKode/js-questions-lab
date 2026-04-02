'use client';

import {
  IconBrandGithub,
  IconBrandX,
  IconCheck,
  IconLoader2,
  IconMailFilled,
  IconSend,
} from '@tabler/icons-react';
import Link from 'next/link';
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    const formData = new FormData(e.currentTarget);
    formData.append(
      'access_key',
      process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || 'YOUR_ACCESS_KEY_HERE',
    );

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
              Contact
            </span>
          </div>
          <h1 className="font-display text-5xl font-normal leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-[clamp(3rem,2rem+3vw,4.5rem)]">
            Let's build <span className="text-primary">something</span> together.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-secondary">
            Have questions about the platform? Interested in sponsorships or collaborations? Reach
            out and I'll get back to you.
          </p>
        </header>

        <div className="@xl:grid-cols-12 grid gap-10 items-start">
          {/* Contact Info Sidebar */}
          <div className="@xl:col-span-4 space-y-8">
            <div className="space-y-6">
              <h3 className="font-display text-xl font-semibold text-foreground border-b border-border/50 pb-4">
                Connect
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
          <Card className="@xl:col-span-8 p-1 relative overflow-hidden bg-surface/50 border-border-subtle shadow-2xl backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
            <div className="relative bg-background rounded-xl p-6 sm:p-8 border border-border/50">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hidden input for bot prevention in Web3Forms */}
                <input
                  type="checkbox"
                  name="botcheck"
                  className="hidden"
                  style={{ display: 'none' }}
                />

                <div className="@md:grid-cols-2 grid gap-6">
                  <div className="space-y-2.5">
                    <Label htmlFor="name" className="text-sm font-medium text-foreground/90">
                      Name
                    </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Manash Pratim Bhuyan"
                      required
                      className="bg-surface border-border-subtle focus-visible:ring-primary"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground/90">
                      Email
                    </Label>
                    <Input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="bhuyanmanash2002@gmail.com"
                      required
                      className="bg-surface border-border-subtle focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="subject" className="text-sm font-medium text-foreground/90">
                    Subject
                  </Label>
                  <Input
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="Sponsorship inquiry for JSQL"
                    required
                    className="bg-surface border-border-subtle focus-visible:ring-primary"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label htmlFor="message" className="text-sm font-medium text-foreground/90">
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Hello, I'd like to discuss..."
                    required
                    className="min-h-32 bg-surface border-border-subtle focus-visible:ring-primary resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full sm:w-auto min-w-[140px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all"
                >
                  {status === 'idle' && (
                    <>
                      Send Message
                      <IconSend className="ml-2 h-4 w-4" />
                    </>
                  )}
                  {status === 'loading' && (
                    <>
                      Sending...
                      <IconLoader2 className="ml-2 h-4 w-4 animate-spin" />
                    </>
                  )}
                  {status === 'success' && (
                    <>
                      Sent Successfully
                      <IconCheck className="ml-2 h-4 w-4" />
                    </>
                  )}
                  {status === 'error' && 'Error - Try Again'}
                </Button>

                {status === 'error' && (
                  <p className="text-xs text-danger mt-2">
                    Failed to send message. Please ensure you have set
                    NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY in your environment, or email me directly.
                  </p>
                )}
              </form>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
