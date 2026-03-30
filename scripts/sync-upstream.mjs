#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { PILOT_LOCALES } from './locale-config.mjs';

const ROOT = process.cwd();
const LOCALES_BASE = path.join(ROOT, 'content/source/locales');
const UPSTREAM_RAW_BASE =
  'https://raw.githubusercontent.com/lydiahallie/javascript-questions/master';

function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

async function syncLocale(locale) {
  const url = `${UPSTREAM_RAW_BASE}/${locale.upstreamPath}`;
  const localPath = path.join(LOCALES_BASE, locale.code, 'README.upstream.md');

  console.log(`Syncing ${locale.code} from ${url}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'user-agent': 'js-questions-lab-sync-script',
        accept: 'text/plain',
      },
    });

    if (!response.ok) {
      console.error(`  [!] Failed to fetch ${locale.code} README (${response.status})`);
      return;
    }

    const incoming = (await response.text()).replace(/\r\n/g, '\n');
    const existing = fs.existsSync(localPath)
      ? fs.readFileSync(localPath, 'utf8').replace(/\r\n/g, '\n')
      : '';

    const before = sha256(existing);
    const after = sha256(incoming);

    if (before === after) {
      console.log(`  [=] No changes detected for ${locale.code}.`);
      return;
    }

    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, incoming, 'utf8');

    console.log(`  [+] Updated ${locale.code} README at ${localPath}`);
    console.log(`      old=${before.slice(0, 8)}...`);
    console.log(`      new=${after.slice(0, 8)}...`);
  } catch (err) {
    console.error(`  [!] Error syncing ${locale.code}:`, err.message);
  }
}

async function fetchUpstreamCommit() {
  const url = 'https://api.github.com/repos/lydiahallie/javascript-questions/git/refs/heads/master';
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'js-questions-lab-sync-script',
        accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) {
      console.warn(`  [!] Could not fetch upstream commit SHA (${res.status}) — skipping.`);
      return null;
    }
    const data = await res.json();
    const sha = data?.object?.sha ?? null;
    if (sha) {
      console.log(`  [git] Upstream master commit: ${sha.slice(0, 7)}`);
    }
    return sha;
  } catch (err) {
    console.warn(`  [!] Error fetching upstream commit SHA:`, err.message);
    return null;
  }
}

async function main() {
  for (const locale of PILOT_LOCALES) {
    await syncLocale(locale);
  }

  const commit = await fetchUpstreamCommit();
  const metaPath = path.join(ROOT, 'content/source/upstream-meta.json');
  const meta = {
    commit,
    fetchedAt: new Date().toISOString(),
  };
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
  console.log(`  [+] Wrote upstream meta → content/source/upstream-meta.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
