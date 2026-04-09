import { execSync } from 'node:child_process';

const BRANCH_PATTERNS = {
  base: /^(main|dev)$/,
  work: /^(feat|fix|docs|refactor|test|chore)\/(?:[a-z0-9]+(?:-[a-z0-9]+)*|#\d+-[a-z0-9]+(?:-[a-z0-9]+)*)$/,
  release: /^(release|hotfix)\/(?:\d+\.\d+(?:\.\d+)*|#\d+)$/,
};

function getBranchName() {
  const branchArg = process.argv[2]?.trim();

  if (branchArg) {
    return branchArg;
  }

  const currentBranch = execSync('git branch --show-current', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();

  if (!currentBranch) {
    console.error('Invalid branch name: detached HEAD state is not allowed for push validation.');
    process.exit(1);
  }

  return currentBranch;
}

function isValidBranchName(branchName) {
  return Object.values(BRANCH_PATTERNS).some((pattern) => pattern.test(branchName));
}

const branchName = getBranchName();

if (!isValidBranchName(branchName)) {
  console.error(`Invalid branch name: "${branchName}"`);
  console.error('Allowed patterns:');
  console.error('- main');
  console.error('- dev');
  console.error('- feat/<slug>, fix/<slug>, docs/<slug>, refactor/<slug>, test/<slug>, chore/<slug>');
  console.error('  - <slug>: login-page');
  console.error('  - <slug>: #10-color-system');
  console.error('- release/<value>, hotfix/<value>');
  console.error('  - <value>: 1.1, 1.1.4');
  console.error('  - <value>: #10');
  process.exit(1);
}

console.log(`Branch name validated: ${branchName}`);
