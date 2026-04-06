import { useTranslations } from 'next-intl';

export function ReactBentoSection() {
  const t = useTranslations('landing.reactSection');

  // Pattern names are intentionally kept in English — these are technical/proper-noun
  // terms used as-is in all developer communities regardless of locale.
  const patterns = [
    'Container',
    'HOC',
    'Compound',
    'Render Props',
    'Custom Hooks',
    'Observer',
    'Provider',
    'Proxy',
    'Prototype',
    'Module',
    'Singleton',
  ];
  const heroTags = [t('heroTagIde'), t('heroTagVersion'), t('heroTagPreview')];

  return (
    <section id="react" className="py-24 px-4 border-t border-border-subtle">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground tracking-tight">
            {t('sectionTitle')}
          </h2>
          <p className="mt-4 text-lg text-secondary max-w-2xl mx-auto">{t('sectionSubline')}</p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-auto">
          {/* Hero card — spans 2 cols, 2 rows */}
          <div
            className="
              relative md:col-span-2 md:row-span-2 overflow-hidden rounded-[20px]
              border border-border-subtle bg-surface
              hover:border-primary/40 hover:shadow-[0_20px_50px_-10px_rgba(245,158,11,0.15)]
              transition-all duration-500 group
              min-h-[280px] flex flex-col justify-between p-8
            "
          >
            {/* Amber glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(245,158,11,0.08)_0%,transparent_60%)] pointer-events-none" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />

            <div className="relative z-10">
              {/* Coming soon badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold tracking-wide mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t('comingSoon')}
              </span>

              <h3 className="font-display text-4xl md:text-5xl text-foreground leading-tight mb-4">
                {t('heroTitle')}
              </h3>
              <p className="text-secondary text-base leading-relaxed max-w-md">
                {t('heroSubtitle')}
              </p>
            </div>

            {/* Bottom gradient line */}
            <div className="relative z-10 mt-8">
              <div className="flex gap-2">
                {heroTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md border border-border-subtle bg-elevated text-tertiary text-xs font-mono"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6 h-px bg-gradient-to-r from-primary/60 via-primary/20 to-transparent" />
            </div>
          </div>

          {/* IDE Preview card */}
          <div
            className="
              relative overflow-hidden rounded-[20px]
              border border-border-subtle bg-[#0d0d12]
              hover:border-primary/30 transition-all duration-500
              p-5 min-h-[180px]
            "
          >
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
              <span className="ml-2 text-xs text-tertiary font-mono">App.tsx</span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed overflow-hidden">
              <span className="text-[#c678dd]">function</span>
              <span className="text-[#61afef]"> Counter</span>
              <span className="text-foreground/60">{'() {'}</span>
              {'\n'}
              <span className="text-foreground/40">{'  '}</span>
              <span className="text-[#c678dd]">const</span>
              <span className="text-foreground"> [count, setCount]</span>
              {'\n'}
              <span className="text-foreground/40">{'    '}</span>
              <span className="text-foreground/60">= </span>
              <span className="text-[#61afef]">useState</span>
              <span className="text-foreground/60">{'(0);'}</span>
              {'\n'}
              {'\n'}
              <span className="text-foreground/40">{'  '}</span>
              <span className="text-[#c678dd]">return</span>
              <span className="text-foreground/60">{' ('}</span>
              {'\n'}
              <span className="text-foreground/40">{'    '}</span>
              <span className="text-[#98c379]">{'<button'}</span>
              {'\n'}
              <span className="text-foreground/40">{'      '}</span>
              <span className="text-[#e06c75]">onClick</span>
              <span className="text-foreground/60">{'={() => '}</span>
              {'\n'}
              <span className="text-foreground/40">{'        '}</span>
              <span className="text-[#61afef]">setCount</span>
              <span className="text-foreground/60">{'(c => c+1)}'}</span>
              {'\n'}
              <span className="text-foreground/40">{'    '}</span>
              <span className="text-[#98c379]">{'>'}</span>
              {'\n'}
              <span className="text-foreground/40">{'      '}</span>
              <span className="text-foreground/70">Clicked </span>
              <span className="text-[#c678dd]">{'{count}'}</span>
              <span className="text-foreground/70"> times</span>
              {'\n'}
              <span className="text-foreground/40">{'    '}</span>
              <span className="text-[#98c379]">{'</button>'}</span>
              {'\n'}
              <span className="text-foreground/40">{'  '}</span>
              <span className="text-foreground/60">{')'}</span>
              {'\n'}
              <span className="text-foreground/60">{'}'}</span>
            </pre>
          </div>

          {/* 3-phase flow card */}
          <div
            className="
              relative overflow-hidden rounded-[20px]
              border border-border-subtle bg-surface
              hover:border-primary/30 transition-all duration-500
              p-6 min-h-[180px] flex flex-col justify-between
            "
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-5">
              {t('flowLabel')}
            </p>
            <div className="flex flex-col gap-3">
              {[
                { step: '01', label: t('flowStep1'), color: 'text-[#61afef]' },
                { step: '02', label: t('flowStep2'), color: 'text-primary' },
                { step: '03', label: t('flowStep3'), color: 'text-[#98c379]' },
              ].map(({ step, label, color }) => (
                <div key={step} className="flex items-center gap-3">
                  <span className={`font-mono text-xs font-bold ${color} opacity-60`}>{step}</span>
                  <div className="flex-1 h-px bg-border-subtle" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns card — spans full width on mobile, 3 cols on desktop */}
          <div
            className="
              relative overflow-hidden rounded-[20px]
              border border-border-subtle bg-surface
              hover:border-primary/30 hover:shadow-[0_10px_30px_-10px_rgba(245,158,11,0.1)]
              transition-all duration-500
              md:col-span-3 p-6
            "
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-shrink-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">
                  {t('patternsLabel')}
                </p>
                <h4 className="font-display text-xl text-foreground">{t('patternsTitle')}</h4>
                <p className="mt-1.5 text-sm text-secondary max-w-xs">{t('patternsSubtitle')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {patterns.map((p) => (
                  <span
                    key={p}
                    className="px-2.5 py-1 rounded-md border border-border-subtle bg-elevated text-secondary text-xs font-mono hover:border-primary/40 hover:text-foreground transition-colors duration-200"
                  >
                    {p}
                  </span>
                ))}
                <span className="px-2.5 py-1 rounded-md border border-primary/20 bg-primary/5 text-primary text-xs font-mono">
                  {t('patternsMore')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
