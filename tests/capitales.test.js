import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPITALES, CONTINENTS } from '../js/capitales.js';

const CHAMPS_OBLIGATOIRES = ['pays', 'capitale', 'continent', 'fuseau'];
const CHAMPS_PERMIS = [...CHAMPS_OBLIGATOIRES, 'autresCapitales'];

test('195 entrées : les 193 États membres de l\'ONU, le Vatican et la Palestine', () => {
  assert.equal(CAPITALES.length, 195);
  const pays = CAPITALES.map((entree) => entree.pays);
  assert.ok(pays.includes('Vatican'));
  assert.ok(pays.includes('Palestine'));
});

test('Taïwan et le Kosovo sont exclus (liste ONU stricte)', () => {
  const pays = CAPITALES.map((entree) => entree.pays);
  assert.ok(!pays.includes('Taïwan'));
  assert.ok(!pays.includes('Kosovo'));
});

test('aucun pays en double', () => {
  const vus = new Set();
  for (const { pays } of CAPITALES) {
    const cle = pays.toLocaleLowerCase('fr');
    assert.ok(!vus.has(cle), `${pays} apparaît deux fois`);
    vus.add(cle);
  }
});

test('aucun champ vide ni inconnu', () => {
  for (const entree of CAPITALES) {
    for (const champ of CHAMPS_OBLIGATOIRES) {
      assert.equal(typeof entree[champ], 'string', `${entree.pays} : ${champ} manquant`);
      assert.ok(entree[champ].trim().length > 0, `${entree.pays} : ${champ} vide`);
    }
    for (const champ of Object.keys(entree)) {
      assert.ok(CHAMPS_PERMIS.includes(champ), `${entree.pays} : champ inconnu ${champ}`);
    }
    if ('autresCapitales' in entree) {
      assert.ok(Array.isArray(entree.autresCapitales), `${entree.pays} : autresCapitales n'est pas une liste`);
      assert.ok(entree.autresCapitales.length > 0, `${entree.pays} : autresCapitales vide`);
      for (const autre of entree.autresCapitales) {
        assert.equal(typeof autre, 'string');
        assert.ok(autre.trim().length > 0, `${entree.pays} : une autre capitale est vide`);
        assert.notEqual(autre, entree.capitale, `${entree.pays} : capitale répétée dans autresCapitales`);
      }
    }
  }
});

test('chaque continent est dans la liste fermée', () => {
  assert.deepEqual([...CONTINENTS].sort(), ['Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Asie', 'Europe', 'Océanie']);
  for (const { pays, continent } of CAPITALES) {
    assert.ok(CONTINENTS.includes(continent), `${pays} : continent inconnu « ${continent} »`);
  }
});

test('chaque fuseau est accepté par Intl.DateTimeFormat', () => {
  for (const { pays, fuseau } of CAPITALES) {
    // Un fuseau inconnu lève une RangeError.
    assert.doesNotThrow(() => new Intl.DateTimeFormat('fr-FR', { timeZone: fuseau }), `${pays} : fuseau refusé « ${fuseau} »`);
  }
});

test('règles de rangement tranchées : Russie en Europe, Turquie en Asie, pays à plusieurs capitales', () => {
  const trouver = (pays) => CAPITALES.find((entree) => entree.pays === pays);
  assert.equal(trouver('Russie').continent, 'Europe');
  assert.equal(trouver('Turquie').continent, 'Asie');
  assert.equal(trouver('France').fuseau, 'Europe/Paris');
  assert.equal(trouver('Afrique du Sud').capitale, 'Pretoria');
  assert.deepEqual([...trouver('Pays-Bas').autresCapitales], ['La Haye']);
  assert.deepEqual([...trouver('Bolivie').autresCapitales], ['La Paz']);
});

test('les données sont figées', () => {
  assert.ok(Object.isFrozen(CAPITALES));
  assert.ok(CAPITALES.every((entree) => Object.isFrozen(entree)));
});
