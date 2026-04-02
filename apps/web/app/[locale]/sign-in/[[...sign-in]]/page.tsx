import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';

import { Container } from '@/components/container';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInPage() {
  return (
    <main className="bg-void py-12">
      <Container>
        <div className="flex items-center justify-center min-h-[calc(100vh-350px)]">
          <SignIn />
        </div>
      </Container>
    </main>
  );
}
