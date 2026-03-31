import { Suspense } from 'react';
import QuestionDetailLoading from './loading';

export default function QuestionDetailTemplate({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<QuestionDetailLoading />}>{children}</Suspense>;
}
