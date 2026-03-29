'use client';

import { IconCircleCheck, IconCode, IconEye, IconSearch } from '@tabler/icons-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { CardTilt } from '@/components/ui/card-tilt';
import { cn } from '@/lib/utils';

interface LandingSectionsProps {
  tagCounts: { tag: string; count: number }[];
  locale?: string;
}

const heatBarIds = ['heat-a', 'heat-b', 'heat-c', 'heat-d', 'heat-e'] as const;

type WorkflowStep = {
  id: number;
  icon: React.ComponentType<{ className?: string }>;
  titleKey: string;
  descKey: string;
};

const workflowSteps: WorkflowStep[] = [
  { id: 1, icon: IconSearch, titleKey: 'workflow.step1Title', descKey: 'workflow.step1Desc' },
  { id: 2, icon: IconCircleCheck, titleKey: 'workflow.step2Title', descKey: 'workflow.step2Desc' },
  { id: 3, icon: IconCode, titleKey: 'workflow.step3Title', descKey: 'workflow.step3Desc' },
  { id: 4, icon: IconEye, titleKey: 'workflow.step4Title', descKey: 'workflow.step4Desc' },
];

function StickyCard({
  step,
  index,
  title,
  description,
}: {
  step: WorkflowStep;
  index: number;
  title: string;
  description: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);
  const filter = useTransform(scrollYProgress, [0, 1], ['blur(0px)', 'blur(10px)']);

  return (
    <motion.div
      ref={ref}
      style={{
        scale,
        opacity,
        filter,
        zIndex: index,
        top: `calc(15vh + ${index * 24}px)`,
        perspective: '1000px',
      }}
      className="sticky mx-auto mb-24 min-h-[50vh] w-full max-w-4xl"
    >
      <CardTilt
        maxTilt={8}
        scale={1.01}
        className="flex h-full flex-col overflow-hidden rounded-[24px] border border-border-subtle bg-surface shadow-2xl transition-shadow duration-500 hover:shadow-[0_20px_60px_rgba(245,158,11,0.08)] md:flex-row"
      >
        <div
          className="flex flex-1 flex-col justify-center bg-linear-to-br from-surface to-elevated p-8 md:p-12"
          style={{ transform: 'translateZ(30px)' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', bounce: 0.5, delay: 0.1 }}
            className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_20px_rgba(245,158,11,0.15)]"
          >
            <step.icon className="h-7 w-7" />
          </motion.div>
          <h3 className="mb-4 font-display text-4xl text-foreground">{title}</h3>
          <p className="text-lg leading-relaxed text-secondary">{description}</p>
          <div className="mt-auto pt-8">
            <span className="font-mono text-5xl font-bold text-border opacity-40">0{step.id}</span>
          </div>
        </div>

        <div
          className="relative flex flex-1 items-center justify-center overflow-hidden border-l border-border-subtle bg-[#09090B] p-8"
          style={{ transform: 'translateZ(50px)' }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50" />
          <motion.div
            initial={{ rotate: -10, scale: 0.9 }}
            whileInView={{ rotate: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', bounce: 0.4, delay: 0.2 }}
            className="relative z-10 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-3xl border border-primary/20 bg-[#111113] shadow-[0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-sm"
          >
            <step.icon className="h-24 w-24 text-primary opacity-20" />
          </motion.div>
        </div>
      </CardTilt>
    </motion.div>
  );
}

export function LandingSections({ tagCounts }: LandingSectionsProps) {
  const t = useTranslations('landing');

  return (
    <div className="w-full">
      <section className="relative py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,rgba(245,158,11,0.05)_0%,transparent_50%)]" />

        <div className="mx-auto mb-24 max-w-4xl px-4 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {t('workflow.sectionLabel')}
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mb-6 font-display text-4xl tracking-tight text-foreground md:text-6xl"
          >
            {t('workflow.sectionTitle')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="mx-auto max-w-2xl text-lg text-secondary"
          >
            {t('workflow.sectionSubline')}
          </motion.p>
        </div>

        <div className="px-4 pb-32">
          {workflowSteps.map((step, i) => (
            <StickyCard
              key={step.id}
              step={step}
              index={i}
              title={t(step.titleKey as Parameters<typeof t>[0])}
              description={t(step.descKey as Parameters<typeof t>[0])}
            />
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl overflow-hidden border-t border-border-subtle px-4 py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.03)_0%,transparent_50%)]" />

        <div className="mb-20 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {t('topics.sectionLabel')}
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="mb-4 font-display text-4xl tracking-tight text-foreground md:text-5xl"
          >
            {t('topics.sectionTitle')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
            className="text-lg text-secondary"
          >
            {t('topics.sectionSubline', { count: tagCounts.length })}
          </motion.p>
        </div>

        <div className="grid auto-rows-[200px] grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tagCounts.map((tagObj, i) => {
            const isFeatured = i === 0 || i === 3;
            const maxCount = Math.max(...tagCounts.map((tag) => tag.count));

            return (
              <motion.div
                key={tagObj.tag}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                className={cn(
                  'group relative overflow-hidden rounded-[24px] border border-border-subtle bg-surface p-8 transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-[0_20px_40px_-10px_rgba(245,158,11,0.15)]',
                  isFeatured ? 'md:col-span-2 lg:col-span-2' : '',
                )}
              >
                <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <h3 className="font-display text-3xl capitalize text-foreground transition-colors group-hover:text-primary">
                      {tagObj.tag}
                    </h3>
                    <p className="mt-2 font-mono text-sm text-secondary transition-colors group-hover:text-foreground">
                      {t('topics.challenges', { count: tagObj.count })}
                    </p>
                  </div>

                  <div className="mt-8 flex gap-2">
                    {heatBarIds.map((barId, idx) => {
                      const fillThreshold = Math.ceil((tagObj.count / maxCount) * 5);
                      const isFilled = idx < fillThreshold;

                      return (
                        <div
                          key={`${tagObj.tag}-${barId}`}
                          className={cn(
                            'h-2 flex-1 rounded-full transition-colors duration-500',
                            isFilled
                              ? 'bg-primary/70 shadow-[0_0_15px_rgba(245,158,11,0.3)] group-hover:bg-primary'
                              : 'bg-border-subtle group-hover:bg-border-focus',
                          )}
                        />
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
