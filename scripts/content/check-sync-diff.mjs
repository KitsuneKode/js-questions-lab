#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = process.cwd();
const REQUIRED_LOCALE_INDEX = 'content/generated/locales/index.json';
const BODY_PATH = path.join(os.tmpdir(), 'weekly-sync-pr-body.md');

function runGit(args, options = {}) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options,
    }).trim();
  } catch (error) {
    if (options.allowFailure) return '';
    throw error;
  }
}

function changedFiles() {
  const tracked = runGit(['diff', '--name-only', 'HEAD'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const untracked = runGit(['ls-files', '--others', '--exclude-standard'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return [...new Set([...tracked, ...untracked])];
}

function filePatch(file) {
  return runGit(['diff', '--', file], { allowFailure: true });
}

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readHeadJson(file) {
  const raw = runGit(['show', `HEAD:${file}`], { allowFailure: true });
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isManifestLike(file) {
  return (
    file === REQUIRED_LOCALE_INDEX ||
    file === 'content/generated/manifest.v1.json' ||
    /^content\/generated\/locales\/[^/]+\/manifest\.v1\.json$/.test(file)
  );
}

function isMetadataOnlyPatch(file) {
  if (file === 'content/source/upstream-meta.json') return true;
  if (!isManifestLike(file)) return false;

  const meaningfulLines = filePatch(file)
    .split('\n')
    .filter((line) => line.startsWith('+') || line.startsWith('-'))
    .filter((line) => !line.startsWith('+++') && !line.startsWith('---'))
    .filter((line) => !/"generatedAt"\s*:/.test(line))
    .filter((line) => !/"fetchedAt"\s*:/.test(line));

  return meaningfulLines.length === 0;
}

function classify(files) {
  const metadataOnly = [];
  const semantic = [];

  for (const file of files) {
    if (isMetadataOnlyPatch(file)) {
      metadataOnly.push(file);
    } else {
      semantic.push(file);
    }
  }

  return { metadataOnly, semantic };
}

function localeQuestionDeltas() {
  const current = readJson(REQUIRED_LOCALE_INDEX);
  const previous = readHeadJson(REQUIRED_LOCALE_INDEX);
  if (!current?.available || !previous?.available) return [];

  const previousByLocale = new Map(
    previous.available.map((locale) => [locale.code, locale.questionCount ?? 0]),
  );

  return current.available
    .map((locale) => {
      const before = previousByLocale.get(locale.code) ?? 0;
      const after = locale.questionCount ?? 0;
      return {
        code: locale.code,
        before,
        after,
        delta: after - before,
      };
    })
    .filter((locale) => locale.delta !== 0);
}

function upstreamCommit() {
  const meta = readJson('content/source/upstream-meta.json');
  return meta?.commit ?? 'unknown';
}

function listMarkdown(files) {
  if (files.length === 0) return '- None';
  return files.map((file) => `- \`${file}\``).join('\n');
}

function deltaMarkdown(deltas) {
  if (deltas.length === 0) return '- No locale question-count changes detected.';
  return deltas
    .map((delta) => {
      const sign = delta.delta > 0 ? '+' : '';
      return `- \`${delta.code}\`: ${delta.before} -> ${delta.after} (${sign}${delta.delta})`;
    })
    .join('\n');
}

function writeBody({ semantic, metadataOnly, deltas }) {
  const body = `Automated weekly refresh from https://github.com/lydiahallie/javascript-questions.

## Upstream

- Commit: \`${upstreamCommit()}\`

## Locale Question Count Changes

${deltaMarkdown(deltas)}

## Semantic Files Changed

${listMarkdown(semantic)}

## Metadata-Only Files Changed

${listMarkdown(metadataOnly)}

> Translated READMEs may lag behind English. Check the locale index for per-locale coverage.
`;

  fs.writeFileSync(BODY_PATH, body, 'utf8');
  return BODY_PATH;
}

function setOutput(name, value) {
  const output = process.env.GITHUB_OUTPUT;
  const stringValue = String(value);

  if (output) {
    fs.appendFileSync(output, `${name}=${stringValue}\n`, 'utf8');
  }

  console.log(`${name}=${stringValue}`);
}

const files = changedFiles();
const { metadataOnly, semantic } = classify(files);
const deltas = localeQuestionDeltas();
const bodyPath = writeBody({ semantic, metadataOnly, deltas });

setOutput('changed', files.length > 0);
setOutput('semanticChanged', semantic.length > 0);
setOutput('changedFiles', files.join(','));
setOutput('semanticFiles', semantic.join(','));
setOutput('metadataOnlyFiles', metadataOnly.join(','));
setOutput('bodyPath', bodyPath);

if (semantic.length === 0 && files.length > 0) {
  console.log('Only metadata/timestamp changes detected; no content PR should be opened.');
}
