import { LiteSiteShell } from '@/app/provider';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <LiteSiteShell>{children}</LiteSiteShell>;
}
