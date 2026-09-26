import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CAPITALES, CONTINENTS } from '../js/capitales.js';
import { decalageMinutes } from '../js/heure.js';

const CHAMPS_OBLIGATOIRES = ['pays', 'capitale', 'continent', 'fuseau'];
const CHAMPS_NUMERIQUES = ['lat', 'lon'];
const CHAMPS_PERMIS = [...CHAMPS_OBLIGATOIRES, ...CHAMPS_NUMERIQUES, 'autresCapitales'];

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

test('chaque capitale a lat ∈ [-90, 90] et lon ∈ [-180, 180], à 2 décimales au plus', () => {
  for (const { pays, lat, lon } of CAPITALES) {
    assert.ok(Number.isFinite(lat) && lat >= -90 && lat <= 90, `${pays} : lat hors bornes (${lat})`);
    assert.ok(Number.isFinite(lon) && lon >= -180 && lon <= 180, `${pays} : lon hors bornes (${lon})`);
    for (const v of [lat, lon]) assert.equal(Math.round(v * 100) / 100, v, `${pays} : plus de 2 décimales (${v})`);
  }
});

test('aucune paire de coordonnées partagée par deux pays', () => {
  const vus = new Map();
  for (const { pays, lat, lon } of CAPITALES) {
    const cle = `${lat},${lon}`;
    assert.ok(!vus.has(cle), `${pays} et ${vus.get(cle)} ont les mêmes coordonnées`);
    vus.set(cle, pays);
  }
});

// Cohérence longitude / fuseau : le décalage nominal lon/15 reste à moins d'une heure du décalage standard
// (le plus petit de janvier et de juillet, heure d'été exclue), l'écart pris modulo 24 h pour la ligne de
// changement de date (Samoa, Tonga, Kiribati). Une longitude au mauvais signe ou décalée de quelques degrés
// dépasse vite ce seuil. Exceptions connues, jusqu'à 2 h : capitales à l'ouest de leur fuseau, qui ont
// choisi l'heure d'un voisin plus à l'est (Espagne et Maroc sur l'Europe centrale, Malaisie et Singapour sur
// UTC+8, Biélorussie sur Moscou…) ou l'heure de Greenwich très à l'ouest (Islande, Afrique de l'Ouest).
// Pékin et Tarawa, cités d'avance comme suspects, restent sous le seuil : la Chine n'a qu'un fuseau mais sa
// capitale est à l'est du pays, et Kiribati repasse sous le seuil une fois l'écart pris modulo 24 h.
const SEUIL_H = 1;
const SEUIL_EXCEPTIONS_H = 2;
const EXCEPTIONS_FUSEAU = [
  'Arménie', 'Biélorussie', 'Espagne', 'Gambie', 'Géorgie', 'Guinée-Bissau', 'Islande', 'Kirghizistan',
  'Libye', 'Malaisie', 'Maroc', 'Mauritanie', 'Sénégal', 'Singapour', 'Turkménistan',
];

function ecartAuFuseauH({ fuseau, lon }) {
  const janvier = decalageMinutes(fuseau, new Date(Date.UTC(2026, 0, 15)));
  const juillet = decalageMinutes(fuseau, new Date(Date.UTC(2026, 6, 15)));
  const ecart = Math.min(janvier, juillet) / 60 - lon / 15;
  return Math.abs((((ecart % 24) + 36) % 24) - 12);
}

test('la longitude est cohérente avec le fuseau, aux exceptions écrites près', () => {
  const horsSeuil = [];
  for (const entree of CAPITALES) {
    const ecart = ecartAuFuseauH(entree);
    const seuil = EXCEPTIONS_FUSEAU.includes(entree.pays) ? SEUIL_EXCEPTIONS_H : SEUIL_H;
    assert.ok(ecart <= seuil, `${entree.pays} : lon/15 à ${ecart.toFixed(2)} h du décalage réel`);
    if (ecart > SEUIL_H) horsSeuil.push(entree.pays);
  }
  // La liste reste exacte : une exception qui ne dépasse plus le seuil se retire.
  assert.deepEqual(horsSeuil.sort((a, b) => a.localeCompare(b, 'fr')), [...EXCEPTIONS_FUSEAU].sort((a, b) => a.localeCompare(b, 'fr')));
});
