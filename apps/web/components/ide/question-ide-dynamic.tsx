'use client';

import dynamic from 'next/dynamic';
import QuestionDetailLoading from '@/app/[locale]/questions/[id]/loading';

export const QuestionIDEDynamic = dynamic(
  () =>
    import('@/components/ide/question-ide-client').then((m) => ({
      default: m.QuestionIDEClient,
    })),
  {
    ssr: false,
    loading: () => <QuestionDetailLoading />,
  },
);
