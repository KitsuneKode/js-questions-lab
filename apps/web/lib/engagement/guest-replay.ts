import type { AttemptRecord, ProgressItem, ProgressState } from '@/lib/progress/storage';

export interface GuestAttemptReplay {
  questionId: number;
  selected: AttemptRecord['selected'];
  attemptedAt: string;
  submissionId: string;
}

export function buildGuestSubmissionId(questionId: number, attemptedAt: string): string {
  return `guest:${questionId}:${attemptedAt}`;
}

/**
 * Decide which guest attempts should be replayed through recordAttempt.
 * Strategy: if guest item is missing on server OR guest.updatedAt is newer,
 * replay every guest attempt whose attemptedAt is not already present on the
 * server item (match on attemptedAt string).
 */
export function listGuestAttemptsToReplay(
  guest: ProgressState,
  serverItems: ProgressItem[],
): GuestAttemptReplay[] {
  const serverById = new Map(serverItems.map((item) => [item.questionId, item]));
  const out: GuestAttemptReplay[] = [];

  for (const localItem of Object.values(guest.questions)) {
    const serverItem = serverById.get(localItem.questionId);
    const guestIsNewer =
      !serverItem || new Date(localItem.updatedAt) > new Date(serverItem.updatedAt);
    if (!guestIsNewer) continue;

    const serverAttemptTimes = new Set((serverItem?.attempts ?? []).map((a) => a.attemptedAt));

    for (const attempt of localItem.attempts) {
      if (serverAttemptTimes.has(attempt.attemptedAt)) continue;
      out.push({
        questionId: localItem.questionId,
        selected: attempt.selected,
        attemptedAt: attempt.attemptedAt,
        submissionId: buildGuestSubmissionId(localItem.questionId, attempt.attemptedAt),
      });
    }
  }

  return out.sort((a, b) => a.attemptedAt.localeCompare(b.attemptedAt));
}
