/**
 * Shared chrome hide/show helpers for the fixed site header and sponsor banner.
 * Question detail pages use nested panel scroll, so window scrollY barely moves
 * while the IDE is in view — those routes use a different policy.
 */

const QUESTION_DETAIL_RE = /\/questions\/\d+(?:\/)?(?:\?.*)?$/;

export function isQuestionDetailPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return QUESTION_DETAIL_RE.test(pathname);
}

export interface ScrollHideState {
  hidden: boolean;
  lastY: number;
}

/**
 * Normal pages: hide on meaningful downward scroll past a threshold;
 * show on meaningful upward scroll or near the top (hysteresis avoids jitter).
 *
 * Question detail: keep chrome hidden while the IDE fills the viewport
 * (near-zero window scroll); reveal only after the user scrolls into
 * below-fold content (related questions).
 */
export function nextScrollHideState(
  latest: number,
  prev: ScrollHideState,
  options: { isQuestionDetail: boolean },
): ScrollHideState {
  if (options.isQuestionDetail) {
    return {
      // Show chrome once the user has scrolled past the IDE shell into page content
      hidden: latest < 80,
      lastY: latest,
    };
  }

  const delta = latest - prev.lastY;

  if (latest < 40) {
    return { hidden: false, lastY: latest };
  }

  if (delta > 8 && latest > 100) {
    return { hidden: true, lastY: latest };
  }

  if (delta < -8) {
    return { hidden: false, lastY: latest };
  }

  return { hidden: prev.hidden, lastY: latest };
}
