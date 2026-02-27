import { notFound } from 'next/navigation';

import { Container } from '@/components/container';
import { QuestionClientShell } from '@/components/question-client-shell';
import { getQuestionById, getQuestions } from '@/lib/content/loaders';

interface QuestionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function QuestionDetailPage({ params }: QuestionDetailPageProps) {
  const resolvedParams = await params;
  const id = Number.parseInt(resolvedParams.id, 10);

  if (!Number.isFinite(id)) {
    notFound();
  }

  const question = getQuestionById(id);
  if (!question) {
    notFound();
  }

  const all = getQuestions();
  const prev = all.find((item) => item.id === id - 1) ?? null;
  const next = all.find((item) => item.id === id + 1) ?? null;

  return (
    <main className="py-8 md:py-10">
      <Container>
        <QuestionClientShell question={question} prevId={prev?.id ?? null} nextId={next?.id ?? null} />
      </Container>
    </main>
  );
}
