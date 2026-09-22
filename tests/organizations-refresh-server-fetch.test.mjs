import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { REFRESH_ORGANIZATIONS_FETCH_OPTIONS } from '../src/constants/organizations-refresh-fetch.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fetchOrganizationsSource = readFileSync(
  resolve(__dirname, '../src/services/organizations/fetch-organizations.ts'),
  'utf8',
);

describe('refreshOrganizations server fetch', () => {
  it('refresh uses server-forced organizations query options', () => {
    assert.deepEqual(REFRESH_ORGANIZATIONS_FETCH_OPTIONS, { source: 'server' });
  });

  it('fetchOrganizationsFromFirestore uses getDocsFromServer when source is server', () => {
    assert.match(fetchOrganizationsSource, /getDocsFromServer/);
    assert.match(fetchOrganizationsSource, /options\?\.source === 'server'/);
  });
});
