import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const racine = new URL('../', import.meta.url);
const lire = (chemin) => readFileSync(new URL(chemin, racine), 'utf8');

// Ce que le Dockerfile copie dans /srv : les fichiers et dossiers nommés par ses COPY.
function copies() {
  return lire('Dockerfile')
    .split('\n')
    .filter((ligne) => ligne.startsWith('COPY '))
    .flatMap((ligne) => ligne.split(/\s+/).slice(1, -1))
    .map((source) => source.replace(/\/$/, ''));
}

test('l’image copie tout ce que la page charge', () => {
  const charges = [...lire('index.html').matchAll(/(?:href|src)="([^"#?:]+)"/g)].map((m) => m[1]);
  assert.ok(charges.length > 0);
  const copie = copies();
  for (const chemin of charges) {
    const tete = chemin.split('/')[0];
    assert.ok(copie.includes(tete), `${chemin} est chargé par index.html mais absent du Dockerfile`);
  }
});

test('l’image sert la version, et pas les tests', () => {
  const copie = copies();
  assert.ok(copie.includes('version.txt'));
  assert.ok(!copie.includes('tests'));
});
