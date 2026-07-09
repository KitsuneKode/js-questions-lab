'use client';

import { motion, useMotionValueEvent, useScroll } from 'motion/react';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { isQuestionDetailPath, nextScrollHideState } from '@/lib/chrome/scroll-hide';
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
  const pathname = usePathname();
  const isQuestionDetail = isQuestionDetailPath(pathname);
  const [visible, setVisible] = useState(!isQuestionDetail);
  const { scrollY } = useScroll();
  const lastYRef = useRef(0);
  const hiddenRef = useRef(isQuestionDetail);

  useEffect(() => {
    const nextHidden = isQuestionDetail;
    hiddenRef.current = nextHidden;
    setVisible(!nextHidden);
    lastYRef.current = scrollY.get();
  }, [isQuestionDetail, scrollY]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    if (!hideOnScroll) return;

    const next = nextScrollHideState(
      latest,
      { hidden: hiddenRef.current, lastY: lastYRef.current },
      { isQuestionDetail },
    );
    lastYRef.current = next.lastY;
    if (next.hidden !== hiddenRef.current) {
      hiddenRef.current = next.hidden;
      setVisible(!next.hidden);
    }
  });

  return (
    <motion.div
      className={cn(
        'fixed inset-x-0 top-0 z-[60] flex min-h-[1.75rem] w-full items-center justify-center px-4 py-1',
        'border-b border-primary/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
        className,
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      aria-hidden={!visible}
    >
      {children}
    </motion.div>
  );
};
