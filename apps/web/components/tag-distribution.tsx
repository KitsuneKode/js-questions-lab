'use client';

import { motion } from 'framer-motion';

interface TagDistributionProps {
  values: Array<{ tag: string; count: number }>;
}

export function TagDistribution({ values }: TagDistributionProps) {
  if (values.length === 0) {
    return null;
  }

  const max = Math.max(...values.map((item) => item.count));

  return (
    <section className="rounded-xl border border-border bg-card/60 p-4 md:p-6">
      <h2 className="font-display text-2xl text-foreground">Topic Depth Map</h2>
      <p className="mt-1 text-sm text-muted-foreground">Coverage snapshot by dominant concept tags.</p>
      <div className="mt-5 space-y-3">
        {values.map((item, index) => {
          const width = Math.max((item.count / max) * 100, 4);

          return (
            <div key={item.tag} className="space-y-1">
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                <span>{item.tag}</span>
                <span>{item.count}</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-primary via-accent to-warning"
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.55, delay: index * 0.05 }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
