import { IconExternalLink } from '@tabler/icons-react';
import { StickyBanner } from '@/components/ui/sticky-banner';
import { siteConfig } from '@/lib/site-config';

export default function StickyBannerDemo() {
  return (
    <div className="relative flex h-[60vh] w-full flex-col overflow-y-auto rounded-xl border border-border bg-background">
      <StickyBanner className="bg-primary text-primary-foreground font-display font-medium tracking-tight">
        <p className="mx-0 flex flex-wrap items-center justify-center gap-2 max-w-[90%] text-sm sm:text-base">
          <span>🚀 We are open for advertisement!</span>
          <span className="hidden sm:inline">•</span>
          <a
            href={siteConfig.creator.xUrl}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-1 rounded-full bg-black/10 px-3 py-0.5 text-sm transition-all hover:bg-black/20 font-bold"
          >
            Please contact us
            <IconExternalLink className="h-3 w-3 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </p>
      </StickyBanner>
      <DummyContent />
    </div>
  );
}

const DummyContent = () => {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 p-8">
      <div className="h-64 w-full animate-pulse rounded-xl border border-border/50 bg-card/50" />
      <div className="h-64 w-full animate-pulse rounded-xl border border-border/50 bg-card/50" />
      <div className="h-64 w-full animate-pulse rounded-xl border border-border/50 bg-card/50" />
    </div>
  );
};
