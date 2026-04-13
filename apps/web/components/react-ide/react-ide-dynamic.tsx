'use client';

import dynamic from 'next/dynamic';
import ReactQuestionLoading from '@/app/[locale]/react/[id]/loading';

export const ReactIDEDynamic = dynamic(
  () =>
    import('@/components/react-ide/react-ide-client').then((module) => ({
      default: module.ReactIDEClient,
    })),
  {
    ssr: false,
    loading: () => <ReactQuestionLoading />,
  },
);
