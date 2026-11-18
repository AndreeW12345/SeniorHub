import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

describe('hosting CSP after T4', () => {
  it('does not allow direct Nominatim in connect-src', () => {
    const firebaseConfig = JSON.parse(readFileSync(resolve(rootDir, 'firebase.json'), 'utf8'));
    const headers = firebaseConfig.hosting?.headers?.[0]?.headers ?? [];
    const csp = headers.find((entry) => entry.key === 'Content-Security-Policy')?.value ?? '';
    assert.doesNotMatch(csp, /nominatim\.openstreetmap\.org/);
    assert.match(csp, /europe-west1-seniorhub-se\.cloudfunctions\.net/);
  });
});

describe('OSM attribution on activities map', () => {
  it('includes OpenStreetMap attribution in native map component', () => {
    const source = readFileSync(resolve(rootDir, 'src/components/activities-map.tsx'), 'utf8');
    assert.match(source, /OpenStreetMap/);
    assert.match(source, /openstreetmap\.org\/copyright/);
  });
});