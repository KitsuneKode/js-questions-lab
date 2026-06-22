#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const REQUIRED_CHECKS = ['Typecheck', 'Test', 'Lint', 'Build'];
const PROTECTED_BRANCHES = ['main', 'dev'];
const BASELINE_TAG = 'v0.1.0';
const requireAutomationPat =
  process.argv.includes('--require-automation-pat') || process.env.CI === 'true';

const failures = [];

function run(command, args) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function ghJson(args) {
  const output = run('gh', args);
  return output ? JSON.parse(output) : null;
}

function getRepository() {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  return run('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']);
}

function fail(message) {
  failures.push(message);
}

function checkAutomationPat() {
  if (!requireAutomationPat) return;
  if (!process.env.AUTOMATION_PAT) {
    fail('AUTOMATION_PAT is not available to the workflow; release PRs may not trigger CI.');
  }
}

function getProtection(repository, branch) {
  try {
    return ghJson(['api', `repos/${repository}/branches/${branch}/protection`]);
  } catch (_error) {
    fail(`${branch} is not protected.`);
    return null;
  }
}

function checkRequiredChecks(branch, protection) {
  const statusChecks = protection.required_status_checks;
  if (!statusChecks) {
    fail(`${branch} does not require status checks.`);
    return;
  }

  if (statusChecks.strict !== true) {
    fail(`${branch} does not require branches to be up to date before merge.`);
  }

  const configuredChecks = new Set([
    ...(statusChecks.contexts ?? []),
    ...(statusChecks.checks ?? []).map((check) => check.context),
  ]);

  for (const check of REQUIRED_CHECKS) {
    if (!configuredChecks.has(check)) {
      fail(`${branch} is missing required check: ${check}.`);
    }
  }
}

function checkPullRequestGate(branch, protection) {
  if (!protection.required_pull_request_reviews) {
    fail(`${branch} does not require pull requests before merge.`);
  }

  if (protection.enforce_admins?.enabled !== true) {
    fail(`${branch} protection does not include admins.`);
  }

  if (protection.allow_force_pushes?.enabled !== false) {
    fail(`${branch} allows force pushes.`);
  }

  if (protection.allow_deletions?.enabled !== false) {
    fail(`${branch} allows deletion.`);
  }
}

function checkBranchProtection(repository) {
  for (const branch of PROTECTED_BRANCHES) {
    const protection = getProtection(repository, branch);
    if (!protection) continue;

    checkPullRequestGate(branch, protection);
    checkRequiredChecks(branch, protection);
  }
}

function checkBaselineTag(repository) {
  try {
    ghJson(['api', `repos/${repository}/git/ref/tags/${BASELINE_TAG}`]);
  } catch (_error) {
    fail(`${BASELINE_TAG} baseline tag is missing on GitHub.`);
  }
}

function checkReleasePullRequests() {
  const prs = ghJson([
    'pr',
    'list',
    '--base',
    'main',
    '--state',
    'open',
    '--json',
    'number,title,headRefName,statusCheckRollup',
  ]);

  for (const pr of prs.filter((item) => item.headRefName.startsWith('release-please--'))) {
    const checks = new Set(
      pr.statusCheckRollup.map((check) => check.name ?? check.context).filter(Boolean),
    );

    for (const requiredCheck of REQUIRED_CHECKS) {
      if (!checks.has(requiredCheck)) {
        fail(`Release PR #${pr.number} is missing required CI check: ${requiredCheck}.`);
      }
    }
  }
}

const repository = getRepository();

checkAutomationPat();
checkBranchProtection(repository);
checkBaselineTag(repository);
checkReleasePullRequests();

if (failures.length > 0) {
  console.error('Release train health check failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('Release train health check passed.');
