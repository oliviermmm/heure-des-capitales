// Contrastes de css/style.css : chaque couple texte/fond doit atteindre le niveau WCAG AA (4,5:1),
// dans le thème clair comme dans le thème sombre. Le style lui-même se regarde dans le navigateur ;
// ce test garde la lisibilité quand on retouche une couleur.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CSS = readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const AA = 4.5;

// Couples [texte, fond] effectivement affichés l'un sur l'autre.
const COUPLES = [
  ['texte', 'fond'],
  ['texte-doux', 'fond'],
  ['accent', 'fond'],
  ['texte', 'surface'],
  ['texte-doux', 'surface'],
  ['jour-texte', 'jour-fond'],
  ['jour-doux', 'jour-fond'],
  ['nuit-texte', 'nuit-fond'],
  ['nuit-doux', 'nuit-fond'],
];

// Les variables de chaque bloc « :root { … } », dans l'ordre du fichier : le clair, puis le sombre.
function variablesDesThemes(css) {
  return [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map(([, corps]) =>
    Object.fromEntries([...corps.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, nom, valeur]) => [nom, valeur.trim()])));
}

function luminance(hex) {
  const [r, g, b] = hex.slice(1).match(/../g).map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(hexA, hexB) {
  const [claire, sombre] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (claire + 0.05) / (sombre + 0.05);
}

// Éléments graphiques (WCAG 1.4.11) : 3:1 suffit pour distinguer les terres de la mer.
const NON_TEXTE = 3;
const COUPLES_GRAPHIQUES = [
  ['carte-terre', 'carte-mer'],
];

test('le calcul de contraste donne les valeurs de référence', () => {
  assert.equal(contraste('#000000', '#ffffff'), 21);
  assert.equal(contraste('#777777', '#777777'), 1);
  assert.ok(Math.abs(contraste('#767676', '#ffffff') - 4.54) < 0.01);
});

const themes = variablesDesThemes(CSS);

test('la feuille déclare un thème clair et un thème sombre', () => {
  assert.equal(themes.length, 2);
  assert.match(CSS, /@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*:root/);
});

for (const [i, nom] of ['clair', 'sombre'].entries()) {
  test(`thème ${nom} : chaque couple texte/fond atteint ${AA}:1`, () => {
    for (const [texte, fond] of COUPLES) {
      const a = themes[i][texte];
      const b = themes[i][fond];
      assert.match(a ?? '', /^#[0-9a-f]{6}$/i, `--${texte} absente ou pas en #rrggbb dans le thème ${nom}`);
      assert.match(b ?? '', /^#[0-9a-f]{6}$/i, `--${fond} absente ou pas en #rrggbb dans le thème ${nom}`);
      const ratio = contraste(a, b);
      assert.ok(ratio >= AA, `--${texte} sur --${fond} : ${ratio.toFixed(2)}:1 < ${AA}:1 (thème ${nom})`);
    }
  });
}

for (const [i, nom] of ['clair', 'sombre'].entries()) {
  test(`thème ${nom} : la carte distingue les terres de la mer (${NON_TEXTE}:1)`, () => {
    for (const [a, b] of COUPLES_GRAPHIQUES) {
      const ratio = contraste(themes[i][a], themes[i][b]);
      assert.ok(ratio >= NON_TEXTE, `--${a} sur --${b} : ${ratio.toFixed(2)}:1 < ${NON_TEXTE}:1 (thème ${nom})`);
    }
  });
}

test('les animations se coupent sous prefers-reduced-motion', () => {
  if (!/transition|animation/.test(CSS)) return;
  assert.match(CSS, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
});
