import { AppSiteShell } from '@/app/provider';
import { getAppVersion } from '@/lib/releases/loaders';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const appVersion = getAppVersion();
  return <AppSiteShell appVersion={appVersion}>{children}</AppSiteShell>;
}
