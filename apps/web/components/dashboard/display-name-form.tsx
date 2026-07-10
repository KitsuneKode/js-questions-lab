'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setDisplayName } from '@/lib/engagement/actions';

type FormStatus = 'idle' | 'saving' | 'saved' | 'error';

interface DisplayNameFormProps {
  initialName: string | null;
}

export function DisplayNameForm({ initialName }: DisplayNameFormProps) {
  const t = useTranslations('accountDashboard');
  const [name, setName] = useState(initialName ?? '');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('saving');
    setErrorMessage(null);

    const result = await setDisplayName(name);
    if (!result.ok) {
      setStatus('error');
      setErrorMessage(result.error);
      return;
    }

    setName(result.displayName);
    setStatus('saved');
  }

  return (
    <article className="rounded-xl border border-border-subtle bg-surface p-6">
      <h2 className="font-display text-2xl text-foreground">{t('displayNameTitle')}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('displayNameBody')}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="display-name">
            {t('displayNameLabel')}
          </Label>
          <Input
            id="display-name"
            type="text"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (status === 'saved' || status === 'error') {
                setStatus('idle');
                setErrorMessage(null);
              }
            }}
            placeholder={t('displayNamePlaceholder')}
            maxLength={24}
            autoComplete="nickname"
            className="mt-2 h-10 bg-background/70 px-3 placeholder:text-tertiary"
          />
          <p className="mt-2 text-xs text-tertiary">{t('displayNameHint')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="submit"
            disabled={status === 'saving'}
            variant="outline"
            className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
          >
            {t('displayNameSave')}
          </Button>
          {status === 'saved' ? (
            <span className="text-sm text-primary">{t('displayNameSaved')}</span>
          ) : null}
          {status === 'error' && errorMessage ? (
            <span className="text-sm text-destructive">{errorMessage}</span>
          ) : null}
        </div>
      </form>
    </article>
  );
}
