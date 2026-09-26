import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NOM_DU_SITE } from '../js/site.js';

test('le nom du site est défini', () => {
  assert.equal(typeof NOM_DU_SITE, 'string');
  assert.ok(NOM_DU_SITE.length > 0);
});
