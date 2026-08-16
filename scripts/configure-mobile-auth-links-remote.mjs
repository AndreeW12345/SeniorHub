import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const SETUP_SECRET = 'seniorhub-mobile-links-setup';

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');
  const content = readFileSync(envPath, 'utf8');
  const env = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    env[trimmed.slice(0, separatorIndex).trim()] = trimmed.slice(separatorIndex + 1).trim();
  }

  return env;
}

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function invokeFunction(projectId) {
  const url =
    `https://us-central1-${projectId}.cloudfunctions.net/configureMobileAuthLinks` +
    `?secret=${encodeURIComponent(SETUP_SECRET)}`;

  console.log(`Invoking ${url}\n`);

  const response = await fetch(url);
  const body = await response.text();

  console.log(`HTTP ${response.status}`);
  console.log(body);

  if (!response.ok) {
    process.exit(1);
  }
}

async function main() {
  const env = loadEnvFile();
  const projectId = env.EXPO_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  if (!projectId) {
    throw new Error('EXPO_PUBLIC_FIREBASE_PROJECT_ID is missing from .env');
  }

  console.log('Deploying one-time Cloud Function (configureMobileAuthLinks)...\n');
  run('npx', ['firebase', 'deploy', '--only', 'functions:configureMobileAuthLinks']);

  console.log('\nConfiguring Firebase Auth mobileLinksConfig.domain = HOSTING_DOMAIN...\n');
  await invokeFunction(projectId);

  console.log('\nDone. Request a new magic link and rebuild the native app if associatedDomains changed.');
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
