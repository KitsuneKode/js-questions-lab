export default {
  '**/*.{js,jsx,ts,tsx,mjs,cjs,css,json,jsonc}': [
    'bunx biome check --write --no-errors-on-unmatched',
  ],
  '**/*.md': (files) => {
    const lintable = files.filter((f) => !f.includes('/.context/'));
    if (lintable.length === 0) return [];
    return [`bunx markdownlint-cli2 ${lintable.map((f) => `"${f}"`).join(' ')}`];
  },
};
