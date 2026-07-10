'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
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
    <article className="rounded-2xl border border-border-subtle bg-surface/60 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
      <h2 className="font-display text-2xl text-foreground">{t('displayNameTitle')}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t('displayNameBody')}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="display-name" className="text-sm font-medium text-foreground">
            {t('displayNameLabel')}
          </label>
          <input
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
            className="mt-2 w-full rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-tertiary focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-2 text-xs text-tertiary">{t('displayNameHint')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === 'saving'}
            className="inline-flex items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'saving' ? t('displayNameSave') : t('displayNameSave')}
          </button>
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
