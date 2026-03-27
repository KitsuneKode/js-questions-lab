'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Code2, Library, LayoutDashboard, Heart, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AuthControls } from '@/components/auth-controls';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';

const navLinks = [
  { href: '/questions', label: 'Questions', icon: Library },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/credits', label: 'Credits', icon: Heart },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Library;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-colors',
        active
          ? 'text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {active ? (
        <motion.div
          layoutId="navbar-active"
          className="absolute inset-0 rounded-full bg-primary shadow-[0_0_15px_rgba(204,255,0,0.4)]"
          initial={false}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
        />
      ) : (
        <div className="absolute inset-0 rounded-full bg-transparent transition-colors group-hover:bg-white/5" />
      )}
      <span className="relative z-10 flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 pt-4 pb-2 px-4 sm:px-6">
      <header className="mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full border border-border/80 bg-surface-elevated/70 px-2 pr-4 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
        
        {/* Logo */}
        <Link href="/" className="group relative ml-2 flex items-center gap-3 outline-none rounded-full focus-visible:ring-2 focus-visible:ring-primary">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_10px_rgba(204,255,0,0.3)] transition-transform duration-300 group-hover:scale-110">
            <Code2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="font-display text-[15px] font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary sm:inline-block hidden">
            Atlas
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              active={pathname === link.href || pathname.startsWith(link.href + '/')}
            />
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <AuthControls />

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full h-9 w-9 bg-surface-elevated hover:bg-surface-elevated/80 border border-border/50">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="border-border/50 bg-background/95 backdrop-blur-xl">
              <SheetHeader className="text-left py-4">
                <SheetTitle className="font-display">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 p-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href || pathname.startsWith(link.href + '/');
                  return (
                    <SheetClose key={link.href} asChild>
                      <Link
                         href={link.href}
                         className={cn(
                           'flex items-center gap-3 rounded-lg px-4 py-3 text-[15px] font-medium transition-all active:scale-95',
                           active
                             ? 'bg-primary/10 text-primary border border-primary/20'
                             : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent',
                         )}
                       >
                         <Icon className="h-5 w-5" />
                         {link.label}
                       </Link>
                    </SheetClose>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </div>
  );
}
