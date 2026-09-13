import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalizeSwedishPhone } from '../src/utils/normalize-swedish-phone.ts';

describe('normalizeSwedishPhone', () => {
  it('treats formatted and unformatted numbers as equal', () => {
    assert.equal(normalizeSwedishPhone('070-123 45 67'), '0701234567');
    assert.equal(normalizeSwedishPhone('0701234567'), '0701234567');
  });

  it('normalizes international +46 format', () => {
    assert.equal(normalizeSwedishPhone('+46 70 123 45 67'), '0701234567');
    assert.equal(normalizeSwedishPhone('0046701234567'), '0701234567');
  });

  it('rejects empty and invalid values', () => {
    assert.equal(normalizeSwedishPhone(''), null);
    assert.equal(normalizeSwedishPhone('123'), null);
    assert.equal(normalizeSwedishPhone('abc'), null);
  });
});
