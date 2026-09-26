import { test } from 'node:test';
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { projeter, tracer, LARGEUR, HAUTEUR } from '../js/projection.js';
import { CONTOURS } from '../js/monde.js';

const dims = { largeur: 1000, hauteur: 500 };

test('les coins du monde tombent aux coins de la carte', () => {
  assert.deepEqual(projeter(-180, 90, dims), { x: 0, y: 0 });
  assert.deepEqual(projeter(180, 90, dims), { x: 1000, y: 0 });
  assert.deepEqual(projeter(-180, -90, dims), { x: 0, y: 500 });
  assert.deepEqual(projeter(180, -90, dims), { x: 1000, y: 500 });
});

test('le méridien 0 et l’équateur passent au milieu', () => {
  assert.deepEqual(projeter(0, 0, dims), { x: 500, y: 250 });
  assert.equal(projeter(0, 51.5, dims).x, 500);
  assert.equal(projeter(-74, 0, dims).y, 250);
});

test('l’antiméridien : ±180 aux bords, au-delà ramené sur le même méridien', () => {
  assert.equal(projeter(180, 0, dims).x, 1000);
  assert.equal(projeter(-180, 0, dims).x, 0);
  assert.equal(projeter(190, 0, dims).x, projeter(-170, 0, dims).x);
  assert.equal(projeter(-190, 0, dims).x, projeter(170, 0, dims).x);
  assert.equal(projeter(540, 0, dims).x, 0);
});

test('la latitude est bornée aux pôles', () => {
  assert.equal(projeter(0, 95, dims).y, 0);
  assert.equal(projeter(0, -95, dims).y, 500);
});

test('par défaut, la surface est de 360 × 180', () => {
  assert.equal(LARGEUR, 360);
  assert.equal(HAUTEUR, 180);
  assert.deepEqual(projeter(10, 20), { x: 190, y: 70 });
});

test('tracer ferme un sous-chemin par anneau', () => {
  assert.equal(tracer([[-180, 90, 0, 0, 180, -90]]), 'M0 0L180 90L360 180Z');
  assert.equal(tracer([[0, 0, 1, 0, 1, 1], [2, 2, 3, 2, 3, 3]]).match(/M/g).length, 2);
});

test('le fond de carte tient dans son budget (150 000 octets)', () => {
  assert.ok(statSync(new URL('../js/monde.js', import.meta.url)).size < 150_000);
});

test('les contours sont des anneaux de degrés dans les bornes', () => {
  assert.ok(CONTOURS.length > 100);
  for (const anneau of CONTOURS) {
    assert.ok(anneau.length >= 8 && anneau.length % 2 === 0);
    for (let i = 0; i < anneau.length; i += 2) {
      assert.ok(anneau[i] >= -180 && anneau[i] <= 180, `longitude ${anneau[i]}`);
      assert.ok(anneau[i + 1] >= -90 && anneau[i + 1] <= 90, `latitude ${anneau[i + 1]}`);
    }
  }
});
