import { LiteSiteShell } from '@/app/provider';
import { getAppVersion } from '@/lib/releases/loaders';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const appVersion = getAppVersion();
  return <LiteSiteShell appVersion={appVersion}>{children}</LiteSiteShell>;
}
