'use client';

import dynamic from 'next/dynamic';
import ReactQuestionLoading from '@/app/[locale]/(app)/react/[id]/loading';
import type { ReactQuestion } from '@/lib/content/types';

interface ReactIDEDynamicProps {
  question: ReactQuestion;
  locale: string;
  nextQuestionId?: string | null;
}

export const ReactIDEDynamic = dynamic<ReactIDEDynamicProps>(
  () =>
    import('@/components/react-ide/react-ide-client').then((module) => ({
      default: module.ReactIDEClient,
    })),
  {
    ssr: false,
    loading: () => <ReactQuestionLoading />,
  },
);
