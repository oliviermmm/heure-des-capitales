// js/page.js touche au DOM et ne s'importe pas sous node : on vérifie qu'il pose la mention veille/lendemain,
// et que la feuille la met en forme sans la montrer vide.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const PAGE = readFileSync(new URL('../js/page.js', import.meta.url), 'utf8');
const CSS = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');

test('chaque carte affiche la veille ou le lendemain, mis à jour avec l’heure', () => {
  assert.match(PAGE, /element\('p', 'jour-relatif'\)/);
  assert.match(PAGE, /mentionDeJour\(h\.ecartDeJour\)/);
  assert.match(PAGE, /jourRelatif\.hidden = !mention/);
});

test('la mention a son style, et reste masquée le même jour', () => {
  assert.match(CSS, /\.carte \.jour-relatif\s*\{[^}]*font-weight/);
  assert.match(CSS, /\.jour-relatif\[hidden\]\s*\{\s*display:\s*none/);
});
