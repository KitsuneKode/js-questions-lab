import { revalidateTag } from 'next/cache';

export const LEADERBOARD_CACHE_TAG = 'leaderboard';
export const WEEKLY_LEADERBOARD_CACHE_TAG = 'leaderboard:weekly';
export const ALL_TIME_LEADERBOARD_CACHE_TAG = 'leaderboard:all-time';

export function revalidateLeaderboardCaches() {
  revalidateTag(LEADERBOARD_CACHE_TAG, 'max');
  revalidateTag(WEEKLY_LEADERBOARD_CACHE_TAG, 'max');
  revalidateTag(ALL_TIME_LEADERBOARD_CACHE_TAG, 'max');
}
