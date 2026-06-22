export const siteConfig = {
  name: 'JS Questions Lab',
  shortName: 'JSQL',
  description:
    "Interactive JavaScript interview practice built on Lydia Hallie's questions, with runnable snippets, event-loop visualization, and a tighter answer-to-feedback loop.",
  url: 'https://jsquestionslab.kitsunelabs.xyz',
  repoUrl: 'https://github.com/KitsuneKode/lydia-js-questions',
  license: 'MIT',
  creator: {
    name: 'KitsuneKode',
    handle: 'kitsunekode',
    displayHandle: '@kitsunekode',
    githubUrl: 'https://github.com/kitsunekode',
    xUrl: 'https://x.com/kitsunekode',
    bio: 'An independent builder making JavaScript interview prep feel focused, interactive, and worth revisiting.',
  },
  source: {
    name: 'javascript-questions',
    repoUrl: 'https://github.com/lydiahallie/javascript-questions',
    creatorName: 'Lydia Hallie',
    creatorUrl: 'https://github.com/lydiahallie',
    websiteUrl: 'https://www.lydiahallie.io/',
    xUrl: 'https://x.com/lydiahallie',
  },
} as const;

export const siteLinks = {
  credits: '/credits',
  questions: '/questions',
  progress: '/progress',
  dashboard: '/dashboard',
  leaderboard: '/leaderboard',
  contact: '/contact',
  react: '/react',
} as const;
