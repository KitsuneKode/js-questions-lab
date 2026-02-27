'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Flame, Telescope, Workflow } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface LandingHeroProps {
  total: number;
  runnable: number;
  tagCount: number;
}

export function LandingHero({ total, runnable, tagCount }: LandingHeroProps) {
  const stats = [
    { label: 'Questions', value: total, icon: Telescope },
    { label: 'Runnable snippets', value: runnable, icon: Workflow },
    { label: 'Concept cloaks', value: tagCount, icon: Flame },
  ];

  return (
    <section className="py-12 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
          <p className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-primary">
            Interactive JavaScript Interview Atlas
          </p>
          <h1 className="font-display text-4xl leading-tight text-foreground md:text-6xl">
            Learn by answering, running, and visualizing each JavaScript challenge.
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Built from the famous Lydia Hallie repository with premium UX, code sandboxing, and event-loop timeline views.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/questions">
              <Button size="lg">
                Start practicing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/credits">
              <Button variant="secondary" size="lg">
                Credits and source
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"
        >
          {stats.map((item, idx) => (
            <Card key={item.label} className="overflow-hidden border-primary/15 bg-gradient-to-br from-card to-card/40">
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                  <p className="font-display text-3xl text-foreground">{item.value}</p>
                </div>
                <motion.span
                  initial={{ rotate: -12, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5, delay: idx * 0.08 + 0.2 }}
                  className="rounded-full border border-primary/30 bg-primary/10 p-2 text-primary"
                >
                  <item.icon className="h-5 w-5" />
                </motion.span>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
