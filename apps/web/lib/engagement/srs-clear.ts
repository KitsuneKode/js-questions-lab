export function srsClearSubmissionId(questionId: number, todayIsoDate: string): string {
  return `srs-clear:${todayIsoDate}:${questionId}`;
}
