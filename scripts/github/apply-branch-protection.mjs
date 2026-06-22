#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const REQUIRED_CHECKS = ['Typecheck', 'Test', 'Lint', 'Build'];
const PROTECTED_BRANCHES = ['main', 'dev'];

function runGh(args, input) {
  return execFileSync('gh', args, {
    encoding: 'utf8',
    input,
    stdio: input ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function getRepository() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  return runGh(['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
}

function protectionPayload() {
  return {
    required_status_checks: {
      strict: true,
      checks: REQUIRED_CHECKS.map((context) => ({ context })),
    },
    enforce_admins: true,
    required_pull_request_reviews: {
      required_approving_review_count: 0,
      dismiss_stale_reviews: false,
      require_code_owner_reviews: false,
      require_last_push_approval: false,
    },
    restrictions: null,
    required_linear_history: false,
    allow_force_pushes: false,
    allow_deletions: false,
    block_creations: false,
    required_conversation_resolution: false,
    lock_branch: false,
    allow_fork_syncing: false,
  };
}

function applyProtection(repository, branch) {
  const payload = JSON.stringify(protectionPayload());
  runGh(
    ['api', '-X', 'PUT', `repos/${repository}/branches/${branch}/protection`, '--input', '-'],
    payload,
  );
  console.log(`Applied PR-only protection to ${branch}`);
}

const repository = getRepository();

for (const branch of PROTECTED_BRANCHES) {
  applyProtection(repository, branch);
}
