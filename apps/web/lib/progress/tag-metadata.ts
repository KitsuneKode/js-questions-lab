import enQuestions from '../../../../content/generated/locales/en/questions.v1.json';

/**
 * @param _locale - Currently unused. Always returns English question data.
 * Locale-aware tag counts are not yet supported due to fs module constraints.
 */
export function getTagQuestionCounts(_locale = 'en'): Record<string, number> {
  // For now, only using English fallback for client-side to avoid fs module issues
  const questions = enQuestions;
  const counts: Record<string, number> = {};
  for (const q of questions) {
    for (const tag of q.tags || []) {
      counts[tag] = (counts[tag] || 0) + 1;
    }
  }
  return counts;
}

/**
 * @param _locale - Currently unused. Always returns English question data.
 * Locale-aware tag counts are not yet supported due to fs module constraints.
 */
export function getQuestionTags(id: number, _locale = 'en'): string[] {
  const q = enQuestions.find((q) => q.id === id);
  return q?.tags || [];
}
