import { SignUp } from '@clerk/nextjs';
import type { Metadata } from 'next';

import { Container } from '@/components/container';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignUpPage() {
  return (
    <main className="bg-void py-12">
      <Container>
        <div className="flex items-center justify-center min-h-[calc(100vh-350px)]">
          <SignUp />
        </div>
      </Container>
    </main>
  );
}
