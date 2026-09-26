import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPITALES, CONTINENTS } from '../js/capitales.js';
import { decalageMinutes } from '../js/heure.js';
import { normaliser, organiser, ORDRE_PAR_DEFAUT } from '../js/grille.js';

const instant = new Date('2026-01-15T12:00:00Z');
const pays = (groupes) => groupes.flatMap((groupe) => groupe.capitales.map((entree) => entree.pays));

test('normaliser ignore casse, accents, tirets et apostrophes', () => {
  assert.equal(normaliser('Côte d’Ivoire'), 'cotedivoire');
  assert.equal(normaliser("  CÔTE  d'IVOIRE "), 'cotedivoire');
  assert.equal(normaliser('cote d ivoire'), 'cotedivoire');
  assert.equal(normaliser('Addis-Abeba'), 'addisabeba');
  assert.equal(normaliser('Nukuʻalofa'), normaliser("nuku'alofa"));
});

test('l’ordre par défaut est par continent', () => {
  assert.equal(ORDRE_PAR_DEFAUT, 'continent');
  assert.deepEqual(organiser(CAPITALES, { instant }), organiser(CAPITALES, { ordre: 'continent', instant }));
});

test('sans recherche, les 195 capitales, groupées par continent dans l’ordre de la liste', () => {
  const groupes = organiser(CAPITALES, { instant });
  assert.deepEqual(groupes.map((groupe) => groupe.titre), [...CONTINENTS]);
  assert.equal(pays(groupes).length, 195);
  for (const groupe of groupes) {
    assert.ok(groupe.capitales.every((entree) => entree.continent === groupe.titre));
    const noms = groupe.capitales.map((entree) => entree.pays);
    assert.deepEqual(noms, [...noms].sort((a, b) => a.localeCompare(b, 'fr')));
  }
});

test('recherche par pays ou par capitale, sans casse ni accents', () => {
  assert.deepEqual(pays(organiser(CAPITALES, { recherche: 'ETHIOPIE', instant })), ['Éthiopie']);
  assert.deepEqual(pays(organiser(CAPITALES, { recherche: 'yaounde', instant })), ['Cameroun']);
  assert.deepEqual(pays(organiser(CAPITALES, { recherche: "cote d'ivoire", instant })), ["Côte d'Ivoire"]);
  assert.deepEqual(pays(organiser(CAPITALES, { recherche: 'addis abeba', instant })), ['Éthiopie']);
  assert.deepEqual(pays(organiser(CAPITALES, { recherche: 'nukualofa', instant })), ['Tonga']);
});

test('la recherche trouve aussi les autres capitales', () => {
  assert.deepEqual(pays(organiser(CAPITALES, { recherche: 'la haye', instant })), ['Pays-Bas']);
});

test('les groupes vides sont omis, une recherche sans résultat rend une liste vide', () => {
  const groupes = organiser(CAPITALES, { recherche: 'paris', instant });
  assert.deepEqual(groupes.map((groupe) => groupe.titre), ['Europe']);
  assert.deepEqual(organiser(CAPITALES, { recherche: 'atlantide', instant }), []);
  assert.deepEqual(organiser(CAPITALES, { recherche: 'atlantide', ordre: 'decalage', instant }), []);
});

test('par décalage : un seul groupe sans titre, du plus en retard au plus en avance, puis par pays', () => {
  const groupes = organiser(CAPITALES, { ordre: 'decalage', instant });
  assert.equal(groupes.length, 1);
  assert.equal(groupes[0].titre, null);
  const liste = groupes[0].capitales;
  assert.equal(liste.length, 195);
  for (let i = 1; i < liste.length; i++) {
    const avant = decalageMinutes(liste[i - 1].fuseau, instant);
    const apres = decalageMinutes(liste[i].fuseau, instant);
    assert.ok(avant < apres || (avant === apres && liste[i - 1].pays.localeCompare(liste[i].pays, 'fr') < 0),
      `${liste[i - 1].pays} puis ${liste[i].pays}`);
  }
  assert.equal(liste[0].pays, 'Belize'); // UTC−6, premier par ordre alphabétique
  assert.equal(liste.at(-1).pays, 'Tonga'); // UTC+13, avec la Nouvelle-Zélande (été austral) et les Samoa
});

test('le tri par décalage suit l’instant (heure d’été)', () => {
  const ordre = (quand) => pays(organiser(CAPITALES, { ordre: 'decalage', instant: new Date(quand) }));
  // Royaume-Uni : UTC+0 l'hiver, avant le Nigeria (UTC+1) ; UTC+1 l'été, après lui par ordre alphabétique.
  const hiver = ordre('2026-01-15T12:00:00Z');
  const ete = ordre('2026-07-15T12:00:00Z');
  assert.ok(hiver.indexOf('Royaume-Uni') < hiver.indexOf('Nigeria'));
  assert.ok(ete.indexOf('Nigeria') < ete.indexOf('Royaume-Uni'));
});

test('un ordre inconnu lève une erreur', () => {
  assert.throws(() => organiser(CAPITALES, { ordre: 'alphabet', instant }), RangeError);
});

test('la liste d’entrée n’est pas modifiée', () => {
  const copie = [...CAPITALES];
  organiser(CAPITALES, { ordre: 'decalage', instant });
  assert.deepEqual([...CAPITALES], copie);
});
