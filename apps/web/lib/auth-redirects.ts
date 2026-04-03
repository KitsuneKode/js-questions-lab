import { withLocale } from '@/lib/locale-paths';

function isSafeRelativeRedirect(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//');
}

export function sanitizeAuthRedirect(
  redirectUrl: string | null | undefined,
  fallbackUrl: string,
): string {
  return isSafeRelativeRedirect(redirectUrl) ? redirectUrl : fallbackUrl;
}

export function buildAuthEntryHref(
  locale: string,
  pathname: string | null,
  search: string,
  authPath: '/sign-in' | '/sign-up',
): string {
  const authHref = withLocale(locale, authPath);

  if (!pathname) {
    return authHref;
  }

  if (
    pathname.startsWith(withLocale(locale, '/sign-in')) ||
    pathname.startsWith(withLocale(locale, '/sign-up'))
  ) {
    return authHref;
  }

  const redirectTarget = `${pathname}${search ? `?${search}` : ''}`;
  const params = new URLSearchParams({ redirect_url: redirectTarget });
  return `${authHref}?${params.toString()}`;
}
