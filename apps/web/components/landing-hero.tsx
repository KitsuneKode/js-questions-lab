'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Terminal, Zap, BookOpen, LockKeyhole } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface LandingHeroProps {
  total: number;
  runnable: number;
  tagCount: number;
}

const sampleCode = `function createCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    getCount: () => count
  };
}

const counter = createCounter();
console.log(counter.increment()); // ?
console.log(counter.getCount());  // ?`;

export function LandingHero({ total, runnable, tagCount }: LandingHeroProps) {
  const stats = [
    { label: 'Questions', value: total },
    { label: 'Runnable', value: runnable },
    { label: 'Topics', value: tagCount },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.2, duration: 0.8 } }
  };

  return (
    <section className="relative px-4 sm:px-6 lg:px-8 py-20 md:py-32 overflow-hidden">
      {/* Dynamic Background Mesh */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

      <div className="mx-auto max-w-7xl grid gap-16 lg:grid-cols-2 lg:items-center">
        {/* Left: Copy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-primary shadow-[0_0_20px_rgba(204,255,0,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Engineered for JavaScript Mastery
            </div>
          </motion.div>

          <motion.h1 variants={itemVariants} className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Crack the JS <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-primary to-green-400">
              interview code
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="max-w-xl text-lg font-medium leading-relaxed text-muted-foreground">
            Execute code in-browser, visualize execution flow, and master the event loop. The definitive interactive platform for advanced JavaScript concepts.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4 pt-4">
            <Link href="/questions">
              <Button size="lg" className="h-12 gap-2 text-primary-foreground font-semibold px-8 hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(204,255,0,0.3)] hover:shadow-[0_0_40px_rgba(204,255,0,0.5)]">
                Start Practicing
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/credits">
              <Button variant="secondary" size="lg" className="h-12 px-8 font-semibold border-border/60 hover:bg-surface-elevated/50 backdrop-blur-md">
                View Source
              </Button>
            </Link>
          </motion.div>

          {/* Stats inline */}
          <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-8 pt-8 border-t border-border/40">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <span className="font-display text-3xl font-bold text-foreground tracking-tight">{stat.value}</span>
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right: Code preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, type: 'spring', bounce: 0.15 }}
          className="relative lg:ml-auto w-full max-w-lg"
        >
          {/* Animated Glow Border */}
          <div className="animated-border rounded-2xl shadow-card-hover p-px">
            {/* Terminal window */}
            <div className="relative overflow-hidden rounded-2xl bg-surface/90 backdrop-blur-2xl">
              {/* Title bar */}
              <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                  <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2">
                  <LockKeyhole className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[11px] font-mono tracking-wide text-muted-foreground">closures.js</span>
                </div>
                <div className="w-12" /> {/* spacer for balance */}
              </div>

              {/* Code content */}
              <div className="p-6 bg-[#040405]">
                <pre className="font-mono text-sm leading-7 text-foreground/90">
                  <code dangerouslySetInnerHTML={{
                    __html: sampleCode
                      .replace(/function/g, '<span class="text-accent">function</span>')
                      .replace(/const|let/g, '<span class="text-accent">$&</span>')
                      .replace(/return/g, '<span class="text-primary">return</span>')
                      .replace(/console/g, '<span class="text-[#ffbd2e]">console</span>')
                      .replace(/\/\/.*/g, '<span class="text-muted-foreground">$&</span>')
                      .replace(/[0-9]+/g, '<span class="text-success">$&</span>')
                  }} />
                </pre>
              </div>

              {/* Footer with output hint */}
              <div className="border-t border-white/5 bg-white/2 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                  <Terminal className="h-4 w-4 text-primary" />
                  <span>Interactive Console</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 text-[11px] font-mono text-foreground font-semibold">
                  <span>Shift</span> + <span>Enter</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotate: -10 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.9, type: "spring" }}
            className="absolute -right-6 top-12 flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/80 backdrop-blur-md px-4 py-3 shadow-card-hover"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-wide">AST Execution</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, rotate: 10 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 0.6, delay: 1.1, type: "spring" }}
            className="absolute -left-8 bottom-20 flex items-center gap-2.5 rounded-xl border border-border/80 bg-surface/80 backdrop-blur-md px-4 py-3 shadow-card-hover"
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent/20">
              <BookOpen className="h-4 w-4 text-accent" />
            </div>
            <span className="text-sm font-semibold tracking-wide">Deep Dives</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
