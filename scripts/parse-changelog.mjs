import fs from 'node:fs';
import path from 'node:path';

const roots = [process.cwd()];
const changelogPath = roots
  .map((root) => path.join(root, 'CHANGELOG.md'))
  .find((candidate) => fs.existsSync(candidate));

if (!changelogPath) {
  console.error('CHANGELOG.md not found');
  process.exit(1);
}

const markdown = fs.readFileSync(changelogPath, 'utf8');
const versions = [...markdown.matchAll(/^##\s+\[([^\]]+)\]/gm)]
  .map((m) => m[1])
  .filter((v) => v.toLowerCase() !== 'unreleased');

let manifestVersion = 'unknown';
const manifestPath = path.join(process.cwd(), '.release-please-manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifestVersion = manifest['.'] ?? manifestVersion;
}

console.log(`Manifest version: ${manifestVersion}`);
console.log(`Released versions in CHANGELOG: ${versions.length}`);
for (const version of versions) {
  console.log(`  - ${version}`);
}
