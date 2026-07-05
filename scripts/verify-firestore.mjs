import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { initializeApp } from 'firebase/app';
import { collection, getDocs, getFirestore } from 'firebase/firestore';

const REQUIRED_ENV_KEYS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
];

function loadEnvFile() {
  const envPath = resolve(process.cwd(), '.env');

  try {
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

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      env[key] = value;
    }

    return { env, envPath };
  } catch {
    return { env: null, envPath };
  }
}

function printMissingKeys(env) {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key]);
  console.error('\nSaknade värden i .env:');
  missing.forEach((key) => console.error(`  - ${key}`));
}

async function main() {
  console.log('SeniorHub – verifierar Firebase-anslutning...\n');

  const { env, envPath } = loadEnvFile();

  if (!env) {
    console.error(`Kunde inte läsa ${envPath}`);
    console.error('Skapa filen genom att kopiera .env.example till .env och fyll i Firebase-värdena.');
    process.exit(1);
  }

  const missing = REQUIRED_ENV_KEYS.filter((key) => !env[key]);
  if (missing.length > 0) {
    printMissingKeys(env);
    process.exit(1);
  }

  const firebaseConfig = {
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  console.log(`Projekt: ${firebaseConfig.projectId}`);

  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const snapshot = await getDocs(collection(db, 'activities'));

    console.log('\n✓ Anslutning till Firestore lyckades');
    console.log(`✓ Hittade ${snapshot.size} dokument i samlingen "activities"`);

    if (snapshot.size === 0) {
      console.log('\nObs: Samlingen är tom. Appen visar exempelaktiviteter tills du lagt till data.');
    } else {
      console.log('\nDokument i Firestore:');
      snapshot.docs.forEach((doc) => {
        const title = doc.data().title ?? '(saknar title)';
        console.log(`  - ${doc.id}: ${title}`);
      });
    }

    console.log('\nNästa steg: starta appen med  npx expo start -c');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Anslutningen misslyckades\n');
    console.error(error);
    console.error('\nVanliga orsaker:');
    console.error('  - Fel värden i .env');
    console.error('  - Firestore Database är inte skapad');
    console.error('  - Säkerhetsregler blockerar läsning (kör rules från src/firebase/firestore.rules.example)');
    process.exit(1);
  }
}

void main();
