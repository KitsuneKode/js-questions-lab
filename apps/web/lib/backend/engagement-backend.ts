export type EngagementBackend = 'supabase' | 'convex';

export function getEngagementBackend(): EngagementBackend {
  const value = process.env.ENGAGEMENT_BACKEND;
  if (value === 'convex') return 'convex';
  return 'supabase';
}
