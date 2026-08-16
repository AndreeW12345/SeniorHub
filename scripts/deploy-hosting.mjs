import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log('Building Firebase Hosting assets...\n');
run('node', ['scripts/build-hosting.mjs']);

console.log('\nDeploying Firebase Hosting...\n');
run('npx', ['firebase', 'deploy', '--only', 'hosting']);

console.log('\nFirebase Hosting deploy finished.');
