import { describe, expect, it } from 'vitest';
import { isQuestionDetailPath, nextScrollHideState } from '@/lib/chrome/scroll-hide';

describe('isQuestionDetailPath', () => {
  it('matches locale question detail paths', () => {
    expect(isQuestionDetailPath('/en/questions/12')).toBe(true);
    expect(isQuestionDetailPath('/pt-BR/questions/1')).toBe(true);
  });

  it('rejects library and other routes', () => {
    expect(isQuestionDetailPath('/en/questions')).toBe(false);
    expect(isQuestionDetailPath('/en/progress')).toBe(false);
    expect(isQuestionDetailPath(null)).toBe(false);
  });
});

describe('nextScrollHideState', () => {
  it('hides chrome on question detail until below-fold scroll', () => {
    const nearTop = nextScrollHideState(0, { hidden: true, lastY: 0 }, { isQuestionDetail: true });
    expect(nearTop.hidden).toBe(true);

    const belowFold = nextScrollHideState(
      120,
      { hidden: true, lastY: 0 },
      { isQuestionDetail: true },
    );
    expect(belowFold.hidden).toBe(false);
  });

  it('uses hysteresis on normal pages', () => {
    const down = nextScrollHideState(
      150,
      { hidden: false, lastY: 120 },
      { isQuestionDetail: false },
    );
    expect(down.hidden).toBe(true);

    const jitter = nextScrollHideState(
      152,
      { hidden: true, lastY: 150 },
      { isQuestionDetail: false },
    );
    expect(jitter.hidden).toBe(true);

    const up = nextScrollHideState(130, { hidden: true, lastY: 152 }, { isQuestionDetail: false });
    expect(up.hidden).toBe(false);

    const top = nextScrollHideState(10, { hidden: true, lastY: 130 }, { isQuestionDetail: false });
    expect(top.hidden).toBe(false);
  });
});
