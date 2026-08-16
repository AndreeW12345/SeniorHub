import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DEFAULT_SERVICE_ACCOUNT_PATHS = [
  'secrets/firebase-service-account.json',
  'firebase-service-account.json',
];

function printServiceAccountInstructions() {
  console.error(`
No Firebase Admin credentials found.

OPTION A — No local service account (recommended)
  Uses the Cloud Functions service account already attached to your Firebase project.

  1. Make sure you are logged in:
       npx firebase login

  2. Run the remote setup (deploys a one-time function and invokes it):
       npm run configure:mobile-auth-links:remote

OPTION B — Local service account JSON
  1. Open Firebase Console → Project settings (gear) → Service accounts
  2. Click "Generate new private key" → confirm → save the JSON file
  3. Move the file to:
       secrets/firebase-service-account.json
     (Create the secrets/ folder if needed. This path is gitignored.)
  4. Run:
       npm run configure:mobile-auth-links

  Do NOT commit the JSON file to git.
`);
}

function resolveServiceAccountPath() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return process.env.GOOGLE_APPLICATION_CREDENTIALS;
  }

  for (const relativePath of DEFAULT_SERVICE_ACCOUNT_PATHS) {
    const absolutePath = resolve(process.cwd(), relativePath);
    if (existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  return null;
}

async function main() {
  const serviceAccountPath = resolveServiceAccountPath();

  if (!serviceAccountPath) {
    printServiceAccountInstructions();
    process.exit(1);
  }

  const { getAuth } = await import('firebase-admin/auth');
  const { initializeApp, cert } = await import('firebase-admin/app');

  initializeApp({
    credential: cert(JSON.parse(readFileSync(serviceAccountPath, 'utf8'))),
  });

  const projectConfigManager = getAuth().projectConfigManager();
  const before = await projectConfigManager.getProjectConfig();
  const after = await projectConfigManager.updateProjectConfig({
    mobileLinksConfig: {
      domain: 'HOSTING_DOMAIN',
    },
  });

  console.log('Updated Firebase Auth mobileLinksConfig.domain to HOSTING_DOMAIN.');
  console.log('Before:', before.mobileLinksConfig ?? null);
  console.log('After:', after.mobileLinksConfig ?? null);
  console.log(
    '\nEnsure ActionCodeSettings.linkDomain matches your deployed Hosting site (EXPO_PUBLIC_FIREBASE_HOSTING_DOMAIN).',
  );
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
