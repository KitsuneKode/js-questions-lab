import { SignIn } from '@clerk/nextjs';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignInPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center py-12">
      <SignIn />
    </main>
  );
}
