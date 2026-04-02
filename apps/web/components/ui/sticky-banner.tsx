'use client';

import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import type React from 'react';
import { type SVGProps, useState } from 'react';
import { cn } from '@/lib/utils';

export const StickyBanner = ({
  className,
  children,
  hideOnScroll = false,
}: {
  className?: string;
  children: React.ReactNode;
  hideOnScroll?: boolean;
}) => {
  const [open, setOpen] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (hideOnScroll && latest > 40) {
      setOpen(false);
    } else {
      setOpen(true);
    }
  });

  return (
    <motion.div
      className={cn(
        'sticky inset-x-0 top-0 z-50 flex min-h-[3.5rem] w-full items-center justify-center px-4 py-2.5',
        'border-b border-primary/20 shadow-[0_0_40px_rgba(245,158,11,0.15)]',
        className,
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: open ? 0 : -100, opacity: open ? 1 : 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
    >
      {children}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 transition-colors hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
        onClick={() => setOpen(!open)}
        aria-label="Close banner"
      >
        <CloseIcon className="h-4 w-4 opacity-70 hover:opacity-100" />
      </motion.button>
    </motion.div>
  );
};

const CloseIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Close"
      {...props}
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
};
