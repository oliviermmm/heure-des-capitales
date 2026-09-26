// Garde-fou : les modules de logique doivent rester importables par node, donc sans DOM.
// Seul js/page.js a le droit de toucher à la page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dossier = new URL('../js/', import.meta.url);
const modulesDeLogique = readdirSync(dossier).filter((nom) => nom.endsWith('.js') && nom !== 'page.js');

for (const nom of modulesDeLogique) {
  test(`${nom} ne touche pas au DOM et s'importe dans node`, async () => {
    const source = readFileSync(new URL(nom, dossier), 'utf8');
    assert.doesNotMatch(source, /\b(document|window|localStorage)\b/);
    await import(new URL(nom, dossier));
  });
}
