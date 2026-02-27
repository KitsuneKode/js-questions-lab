import Link from 'next/link';

import { Container } from '@/components/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getManifest } from '@/lib/content/loaders';

export default function CreditsPage() {
  const manifest = getManifest();

  return (
    <main className="py-8 md:py-10">
      <Container>
        <section className="space-y-5">
          <h1 className="font-display text-4xl text-foreground md:text-5xl">Credits and Attribution</h1>
          <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
            This platform is based on the JavaScript Questions repository by Lydia Hallie. The original questions and explanations belong to the original author and community contributors.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Primary Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                Creator: <strong className="text-foreground">{manifest.attribution.creator}</strong>
              </p>
              <p>
                Repository: <Link href={manifest.attribution.repo}>{manifest.attribution.repo}</Link>
              </p>
              <p>
                Data file: <code>{manifest.source.file}</code>
              </p>
              <p>
                Generated on: <time>{new Date(manifest.generatedAt).toLocaleString()}</time>
              </p>
              <p className="pt-2 text-foreground">Founder links</p>
              <ul className="space-y-1">
                <li>
                  <Link href="https://www.twitter.com/lydiahallie">Twitter</Link>
                </li>
                <li>
                  <Link href="https://www.linkedin.com/in/lydia-hallie">LinkedIn</Link>
                </li>
                <li>
                  <Link href="https://www.instagram.com/theavocoder">Instagram</Link>
                </li>
                <li>
                  <Link href="https://www.lydiahallie.io/">Blog</Link>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Translations Listed in Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
                {manifest.translations.map((translation) => (
                  <li key={translation.href} className="rounded-md border border-border bg-card/70 px-3 py-2">
                    <Link href={`https://github.com/lydiahallie/javascript-questions/blob/master/${translation.href.replace('./', '')}`}>{translation.label}</Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      </Container>
    </main>
  );
}
