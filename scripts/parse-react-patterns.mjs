#!/usr/bin/env node

/**
 * Parses MDX files from content/source/react-patterns/pages/ into
 * content/generated/react/en/<id>.json + manifest.json.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_DIR = path.join(ROOT, 'content', 'source', 'react-patterns', 'pages');
const OUT_DIR = path.join(ROOT, 'content', 'generated', 'react', 'en');
const MANIFEST_PATH = path.join(ROOT, 'content', 'generated', 'react', 'manifest.json');

const DIFFICULTY_MAP = {
  'design-patterns': 'intermediate',
  performance: 'advanced',
  hooks: 'beginner',
};

function deriveDifficulty(categoryPath) {
  for (const [key, level] of Object.entries(DIFFICULTY_MAP)) {
    if (categoryPath.includes(key)) {
      return level;
    }
  }
  return 'intermediate';
}

function toCategory(category) {
  if (category === 'design-patterns') return 'pattern';
  if (category === 'hooks') return 'hook';
  if (category === 'performance') return 'component';
  return 'component';
}

function extractCodeBlocks(mdxContent) {
  const blocks = [];
  const regex = /```(?:tsx?|jsx?)\n([\s\S]*?)```/g;
  let match = regex.exec(mdxContent);
  while (match !== null) {
    blocks.push(match[1].trim());
    match = regex.exec(mdxContent);
  }
  return blocks;
}

function hasVisibleJSX(code) {
  return /return\s*\(/.test(code) && /<[A-Za-z]/.test(code);
}

function walkMdxFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMdxFiles(fullPath, results);
    } else if (entry.name === 'index.mdx') {
      results.push(fullPath);
    }
  }
  return results;
}

function parseId(mdxPath) {
  const relative = path.relative(SOURCE_DIR, path.dirname(mdxPath));
  return `react-${relative
    .replace(/[\\/]/g, '-')
    .replace(/[^a-z0-9-]/gi, '')
    .toLowerCase()}`;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result = {};
  for (const line of match[1].split('\n')) {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      result[key.trim()] = valueParts
        .join(':')
        .trim()
        .replace(/^['"]|['"]$/g, '');
    }
  }
  return result;
}

function parseMdxFile(mdxPath) {
  const content = fs.readFileSync(mdxPath, 'utf8');
  const frontmatter = parseFrontmatter(content);
  const categoryRelative = path.relative(SOURCE_DIR, path.dirname(path.dirname(mdxPath)));
  const category = categoryRelative.split(path.sep)[0] ?? 'design-patterns';

  const codeBlocks = extractCodeBlocks(content);
  const starterBlock = codeBlocks[0] ?? '// TODO: implement';
  const solutionBlock = codeBlocks[codeBlocks.length - 1] ?? starterBlock;

  const id = parseId(mdxPath);
  const slug = path.basename(path.dirname(mdxPath));
  const title =
    frontmatter.title ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

  return {
    id,
    title,
    difficulty: deriveDifficulty(mdxPath),
    tags: [category, ...slug.split('-').filter((tag) => tag.length > 2)],
    category: toCategory(category),
    prompt: `Implement the **${title}** pattern. Study the concept explanation above, then complete the starter code.`,
    starterCode: { 'App.tsx': starterBlock },
    entryFile: 'App.tsx',
    solutionCode: { 'App.tsx': solutionBlock },
    previewVisible: hasVisibleJSX(solutionBlock),
    sandpackTemplate: 'react-ts',
    resources: [],
    source: {
      repo: 'lydiahallie/javascript-react-patterns',
      path: path.relative(path.join(ROOT, 'content', 'source', 'react-patterns'), mdxPath),
      author: 'Lydia Hallie',
      license: 'MIT',
    },
  };
}

function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`Source directory not found: ${SOURCE_DIR}`);
    console.error(
      'Run: git submodule add https://github.com/lydiahallie/javascript-react-patterns content/source/react-patterns',
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const mdxFiles = walkMdxFiles(SOURCE_DIR);
  const manifestEntries = [];

  for (const mdxPath of mdxFiles) {
    try {
      const question = parseMdxFile(mdxPath);
      const outputPath = path.join(OUT_DIR, `${question.id}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(question, null, 2));
      manifestEntries.push({
        id: question.id,
        title: question.title,
        difficulty: question.difficulty,
        category: question.category,
        tags: question.tags,
      });
      console.log(`✓ ${question.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`✗ ${mdxPath}: ${message}`);
    }
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    totalQuestions: manifestEntries.length,
    questions: manifestEntries,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nWrote ${manifestEntries.length} questions + manifest.json`);
}

main();
