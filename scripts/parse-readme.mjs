#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, 'content/source/README.upstream.md');
const OUT_QUESTIONS = path.join(ROOT, 'content/generated/questions.v1.json');
const OUT_MANIFEST = path.join(ROOT, 'content/generated/manifest.v1.json');

function normalizeWhitespace(input) {
  return input.replace(/\r\n/g, '\n');
}

function stripPTags(input) {
  return input
    .replace(/^<p>\s*/i, '')
    .replace(/\s*<\/p>$/i, '')
    .trim();
}

function detectTags(question, explanation) {
  const text = `${question} ${explanation}`.toLowerCase();
  const tags = new Set();

  const rules = [
    { tag: 'async', keywords: ['promise', 'async', 'await', 'settimeout', 'setinterval', 'microtask', 'macrotask', 'event loop'] },
    { tag: 'scope', keywords: ['hoist', 'scope', 'closure', 'temporal dead zone', 'referenceerror', 'var ', 'let ', 'const '] },
    { tag: 'objects', keywords: ['object', 'reference', 'spread', 'destructur', 'freeze', 'seal', 'assign'] },
    { tag: 'prototypes', keywords: ['prototype', 'class', 'constructor', 'extends', 'super', 'instanceof'] },
    { tag: 'arrays', keywords: ['array', 'map(', 'filter(', 'reduce(', 'splice', 'slice', 'sort(', 'concat'] },
    { tag: 'types', keywords: ['coercion', 'truthy', 'falsy', 'undefined', 'null', 'nan', 'typeof'] },
    { tag: 'modules', keywords: ['import', 'export', 'module'] },
    { tag: 'dom-events', keywords: ['bubbling', 'capturing', 'event.target', 'dom', 'window', 'document'] },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      tags.add(rule.tag);
    }
  }

  if (tags.size === 0) {
    tags.add('fundamentals');
  }

  return [...tags];
}

function collectImages(markdown) {
  const images = [];
  const re = /<img\s+[^>]*src="([^"]+)"[^>]*>/gi;
  let match;
  while ((match = re.exec(markdown)) !== null) {
    images.push(match[1]);
  }
  return images;
}

function inferDifficulty(id, total) {
  const ratio = id / total;
  if (ratio <= 0.33) return 'beginner';
  if (ratio <= 0.66) return 'intermediate';
  return 'advanced';
}

function parseCodeBlocks(input) {
  const blocks = [];
  const re = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  while ((match = re.exec(input)) !== null) {
    blocks.push({
      id: `code-${index + 1}`,
      order: index,
      language: (match[1] || 'plain').toLowerCase(),
      code: match[2].trimEnd(),
    });
    index += 1;
  }
  return blocks;
}

function parseOptions(input) {
  const options = [];
  const re = /^- ([A-D]):\s*(.+)$/gm;
  let match;
  while ((match = re.exec(input)) !== null) {
    options.push({ key: match[1], text: match[2].trim() });
  }
  return options;
}

function parseTranslations(input) {
  const translations = [];
  const re = /^- \[(.+?)\]\((.+?)\)$/gm;
  let match;
  while ((match = re.exec(input)) !== null) {
    const label = match[1].trim();
    const href = match[2].trim();
    if (href.toLowerCase().includes('readme')) {
      translations.push({ label, href });
    }
  }
  return translations;
}

function parseQuestions(readme) {
  const headingRe = /^######\s+(\d+)\.\s+(.+)$/gm;
  const headings = [...readme.matchAll(headingRe)];
  const total = headings.length;

  const questions = headings.map((match, idx) => {
    const id = Number.parseInt(match[1], 10);
    const title = match[2].trim();
    const start = match.index ?? 0;
    const end = idx < headings.length - 1 ? (headings[idx + 1].index ?? readme.length) : readme.length;
    const chunk = readme.slice(start, end).trim();

    const detailsIndex = chunk.indexOf('<details><summary><b>Answer</b></summary>');
    const promptChunk = detailsIndex === -1 ? chunk : chunk.slice(0, detailsIndex);
    const answerChunk = detailsIndex === -1 ? '' : chunk.slice(detailsIndex);

    const options = parseOptions(promptChunk);
    const promptCodeBlocks = parseCodeBlocks(promptChunk);
    const explanationCodeBlocks = parseCodeBlocks(answerChunk);

    const answerMatch = answerChunk.match(/####\s+Answer:\s*([A-D])/i) || chunk.match(/####\s+Answer:\s*([A-D])/i);
    const correctOption = answerMatch?.[1] ?? null;

    const detailsBodyMatch = answerChunk.match(/<details><summary><b>Answer<\/b><\/summary>\s*<p>\s*([\s\S]*?)\s*<\/p>\s*<\/details>/i);
    const rawExplanation = detailsBodyMatch ? detailsBodyMatch[1] : answerChunk;
    const explanationMarkdown = stripPTags(rawExplanation.replace(/####\s+Answer:\s*[A-D]\s*/i, '').trim());

    const promptBody = promptChunk
      .replace(/^######\s+\d+\.\s+.+\n?/m, '')
      .replace(/^- [A-D]:\s*.+$/gm, '')
      .trim();

    const hasRunnableSnippet = promptCodeBlocks.some((block) => block.language === 'javascript' || block.language === 'js');

    return {
      id,
      slug: `question-${id}`,
      title,
      promptMarkdown: promptBody,
      codeBlocks: promptCodeBlocks,
      explanationCodeBlocks,
      options,
      correctOption,
      explanationMarkdown,
      images: collectImages(explanationMarkdown),
      tags: detectTags(title, explanationMarkdown),
      difficulty: inferDifficulty(id, total),
      runnable: hasRunnableSnippet,
      source: {
        startLineHint: null,
      },
    };
  });

  return questions;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function main() {
  if (!fs.existsSync(SOURCE_PATH)) {
    console.error(`Missing source README at ${SOURCE_PATH}`);
    process.exit(1);
  }

  const raw = normalizeWhitespace(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const questions = parseQuestions(raw);

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: {
      repo: 'https://github.com/lydiahallie/javascript-questions',
      file: 'README.md',
      localPath: 'content/source/README.upstream.md',
    },
    totals: {
      questions: questions.length,
      runnable: questions.filter((q) => q.runnable).length,
      withImages: questions.filter((q) => q.images.length > 0).length,
    },
    tags: [...new Set(questions.flatMap((q) => q.tags))].sort(),
    translations: parseTranslations(raw),
    attribution: {
      creator: 'Lydia Hallie',
      repo: 'https://github.com/lydiahallie/javascript-questions',
      requestReference: true,
    },
  };

  ensureDir(OUT_QUESTIONS);
  ensureDir(OUT_MANIFEST);

  fs.writeFileSync(OUT_QUESTIONS, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
  fs.writeFileSync(OUT_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Parsed ${questions.length} questions -> content/generated`);
}

main();
