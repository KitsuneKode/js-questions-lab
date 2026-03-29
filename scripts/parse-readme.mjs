#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { DEFAULT_LOCALE, PILOT_LOCALES } from './locale-config.mjs';

const ROOT = process.cwd();
const LOCALES_SOURCE_BASE = path.join(ROOT, 'content/source/locales');
const LOCALES_OUT_BASE = path.join(ROOT, 'content/generated/locales');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeWhitespace(input) {
  return input.replace(/\r\n/g, '\n');
}

function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
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
    {
      tag: 'async',
      keywords: [
        'promise',
        'async',
        'await',
        'settimeout',
        'setinterval',
        'microtask',
        'macrotask',
        'event loop',
      ],
    },
    {
      tag: 'scope',
      keywords: [
        'hoist',
        'scope',
        'closure',
        'temporal dead zone',
        'referenceerror',
        'var ',
        'let ',
        'const ',
      ],
    },
    {
      tag: 'objects',
      keywords: ['object', 'reference', 'spread', 'destructur', 'freeze', 'seal', 'assign'],
    },
    {
      tag: 'prototypes',
      keywords: ['prototype', 'class', 'constructor', 'extends', 'super', 'instanceof'],
    },
    {
      tag: 'arrays',
      keywords: ['array', 'map(', 'filter(', 'reduce(', 'splice', 'slice', 'sort(', 'concat'],
    },
    {
      tag: 'types',
      keywords: ['coercion', 'truthy', 'falsy', 'undefined', 'null', 'nan', 'typeof'],
    },
    { tag: 'modules', keywords: ['import', 'export', 'module'] },
    {
      tag: 'dom-events',
      keywords: ['bubbling', 'capturing', 'event.target', 'dom', 'window', 'document'],
    },
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
  let match = re.exec(markdown);
  while (match !== null) {
    images.push(match[1]);
    match = re.exec(markdown);
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
  let match = re.exec(input);
  let index = 0;
  while (match !== null) {
    blocks.push({
      id: `code-${index + 1}`,
      order: index,
      language: (match[1] || 'plain').toLowerCase(),
      code: match[2].trimEnd(),
    });
    index += 1;
    match = re.exec(input);
  }
  return blocks;
}

function parseOptions(input) {
  const options = [];
  // Match both '- A:' and '-   A:' (German uses 3 spaces after hyphen)
  const re = /^-\s+([A-D]):\s*(.+)$/gm;
  let match = re.exec(input);
  while (match !== null) {
    options.push({ key: match[1], text: match[2].trim() });
    match = re.exec(input);
  }
  return options;
}

function parseTranslations(input) {
  const translations = [];
  const re = /^- \[(.+?)\]\((.+?)\)$/gm;
  let match = re.exec(input);
  while (match !== null) {
    const label = match[1].trim();
    const href = match[2].trim();
    if (href.toLowerCase().includes('readme')) {
      translations.push({ label, href });
    }
    match = re.exec(input);
  }
  return translations;
}

function classifyRuntime(id, codeBlocks) {
  const hasRunnableSnippet = codeBlocks.some(
    (block) => block.language === 'javascript' || block.language === 'js',
  );

  if (hasRunnableSnippet) {
    return {
      runnable: true,
      runtime: {
        kind: 'javascript',
      },
    };
  }

  const hasInlineDomClickSnippet = codeBlocks.some(
    (block) => block.language === 'html' && /onclick\s*=/.test(block.code),
  );

  if (hasInlineDomClickSnippet && (id === 31 || id === 32)) {
    return {
      runnable: false,
      runtime: {
        kind: 'dom-click-propagation',
      },
    };
  }

  return {
    runnable: false,
    runtime: {
      kind: 'static',
    },
  };
}

function parseQuestions(readme, localeCode) {
  const headingRe = /^######\s+(\d+)\.\s+(.+)$/gm;
  const headings = [...readme.matchAll(headingRe)];
  const total = headings.length;

  const questions = headings.map((match, idx) => {
    const id = Number.parseInt(match[1], 10);
    const title = match[2].trim();
    const start = match.index ?? 0;
    const end =
      idx < headings.length - 1 ? (headings[idx + 1].index ?? readme.length) : readme.length;
    const chunk = readme.slice(start, end).trim();

    // Generic: match any <details><summary><b>ANY WORD</b></summary> — works for all locales
    const detailsRe = /<details><summary><b>[^<]+<\/b><\/summary>/i;
    const detailsMatch = detailsRe.exec(chunk);
    const detailsIndex = detailsMatch ? detailsMatch.index : -1;
    const promptChunk = detailsIndex === -1 ? chunk : chunk.slice(0, detailsIndex);
    const answerChunk = detailsIndex === -1 ? '' : chunk.slice(detailsIndex);

    const options = parseOptions(promptChunk);
    const promptCodeBlocks = parseCodeBlocks(promptChunk);
    const explanationCodeBlocks = parseCodeBlocks(answerChunk);

    // Match any locale's answer heading: '#### Answer: A', '#### Respuesta correcta: A',
    // '#### Réponse : A' (space before colon), '#### Antwort: A', '#### 答え: A', etc.
    const answerMatch =
      answerChunk.match(/####\s+[^\n]+?:\s*([A-D])\b/) ||
      chunk.match(/####\s+[^\n]+?:\s*([A-D])\b/);
    const correctOption = answerMatch?.[1] ?? null;

    const detailsBodyMatch = answerChunk.match(
      /<details><summary><b>[^<]+<\/b><\/summary>\s*<p>\s*([\s\S]*?)\s*<\/p>\s*<\/details>/i,
    );
    const rawExplanation = detailsBodyMatch ? detailsBodyMatch[1] : answerChunk;
    // Strip the answer heading line (any locale variant) from the explanation
    const explanationMarkdown = stripPTags(
      rawExplanation.replace(/####\s+[^\n]+?:\s*[A-D]\b\s*/i, '').trim(),
    );

    const promptBody = promptChunk
      .replace(/^######\s+\d+\.\s+.+\n?/m, '')
      .replace(/^- [A-D]:\s*.+$/gm, '')
      .trim();

    const { runnable, runtime } = classifyRuntime(id, promptCodeBlocks);

    return {
      id,
      slug: `question-${id}`,
      locale: localeCode,
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
      runnable,
      runtime,
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

// ---------------------------------------------------------------------------
// Per-locale parse
// ---------------------------------------------------------------------------

function parseLocale(locale) {
  const sourcePath = path.join(LOCALES_SOURCE_BASE, locale.code, 'README.upstream.md');

  if (!fs.existsSync(sourcePath)) {
    console.warn(`  [!] No source found for ${locale.code} at ${sourcePath} — skipping.`);
    return null;
  }

  const raw = normalizeWhitespace(fs.readFileSync(sourcePath, 'utf8'));
  const sourceStats = fs.statSync(sourcePath);
  const sourceHash = sha256(raw);
  const questions = parseQuestions(raw, locale.code);

  const outDir = path.join(LOCALES_OUT_BASE, locale.code);
  const outQuestions = path.join(outDir, 'questions.v1.json');
  const outManifest = path.join(outDir, 'manifest.v1.json');

  const manifest = {
    schemaVersion: 2,
    generatedAt: new Date(sourceStats.mtimeMs).toISOString(),
    locale: {
      code: locale.code,
      label: locale.label,
      dir: locale.dir,
    },
    source: {
      repo: 'https://github.com/lydiahallie/javascript-questions',
      upstreamPath: locale.upstreamPath,
      localPath: `content/source/locales/${locale.code}/README.upstream.md`,
      sha256: sourceHash,
    },
    totals: {
      questions: questions.length,
      runnable: questions.filter((q) => q.runnable).length,
      withImages: questions.filter((q) => q.images.length > 0).length,
    },
    tags: [...new Set(questions.flatMap((q) => q.tags))].sort(),
    translations: locale.code === DEFAULT_LOCALE ? parseTranslations(raw) : [],
    attribution: {
      creator: 'Lydia Hallie',
      repo: 'https://github.com/lydiahallie/javascript-questions',
      requestReference: true,
    },
  };

  ensureDir(outQuestions);
  fs.writeFileSync(outQuestions, `${JSON.stringify(questions, null, 2)}\n`, 'utf8');
  fs.writeFileSync(outManifest, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(
    `  [+] ${locale.code}: ${questions.length} questions → content/generated/locales/${locale.code}/`,
  );

  return {
    code: locale.code,
    label: locale.label,
    questionCount: questions.length,
    sourceHash,
    generatedAt: manifest.generatedAt,
  };
}

// ---------------------------------------------------------------------------
// Root index manifest (for the app to load supported locale metadata)
// ---------------------------------------------------------------------------

function writeRootManifest(availableLocales) {
  const outPath = path.join(ROOT, 'content/generated/locales/index.json');
  const index = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    supported: PILOT_LOCALES.map((l) => l.code),
    default: DEFAULT_LOCALE,
    available: availableLocales,
  };
  ensureDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  console.log(`\n[+] Wrote locale index → content/generated/locales/index.json`);
}

// ---------------------------------------------------------------------------
// Legacy compat: keep content/generated/questions.v1.json + manifest.v1.json
// pointing at English for any code that still imports from the flat path.
// ---------------------------------------------------------------------------

function writeLegacyEnglishAlias() {
  const enQuestionsPath = path.join(LOCALES_OUT_BASE, 'en', 'questions.v1.json');
  const enManifestPath = path.join(LOCALES_OUT_BASE, 'en', 'manifest.v1.json');
  const legacyDir = path.join(ROOT, 'content/generated');

  if (!fs.existsSync(enQuestionsPath)) return;

  fs.copyFileSync(enQuestionsPath, path.join(legacyDir, 'questions.v1.json'));
  fs.copyFileSync(enManifestPath, path.join(legacyDir, 'manifest.v1.json'));
  console.log('[+] Wrote legacy English alias → content/generated/questions.v1.json');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('Parsing locale sources…\n');

  const available = [];

  for (const locale of PILOT_LOCALES) {
    const result = parseLocale(locale);
    if (result) available.push(result);
  }

  writeRootManifest(available);
  writeLegacyEnglishAlias();

  const total = available.reduce((sum, l) => sum + l.questionCount, 0);
  console.log(
    `\nDone. Parsed ${available.length}/${PILOT_LOCALES.length} locales, ${total} total question records.`,
  );
}

main();
