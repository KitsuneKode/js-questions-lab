import { AppSiteShell } from '@/app/provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppSiteShell>{children}</AppSiteShell>;
}
