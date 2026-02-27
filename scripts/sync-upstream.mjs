#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const SOURCE_PATH = path.join(ROOT, 'content/source/README.upstream.md');
const RAW_URL = 'https://raw.githubusercontent.com/lydiahallie/javascript-questions/master/README.md';

function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

async function main() {
  const response = await fetch(RAW_URL, {
    headers: {
      'user-agent': 'lydia-js-questions-sync-script',
      accept: 'text/plain',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch upstream README (${response.status})`);
  }

  const incoming = (await response.text()).replace(/\r\n/g, '\n');
  const existing = fs.existsSync(SOURCE_PATH) ? fs.readFileSync(SOURCE_PATH, 'utf8').replace(/\r\n/g, '\n') : '';

  const before = sha256(existing);
  const after = sha256(incoming);

  if (before === after) {
    console.log('No upstream changes detected.');
    return;
  }

  fs.mkdirSync(path.dirname(SOURCE_PATH), { recursive: true });
  fs.writeFileSync(SOURCE_PATH, incoming, 'utf8');

  console.log(`Updated source README at ${SOURCE_PATH}`);
  console.log(`old=${before}`);
  console.log(`new=${after}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
