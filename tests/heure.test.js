import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  heureLocale,
  dateLocale,
  decalageMinutes,
  formaterDecalage,
  ecartDeJour,
  estLeJour,
  mentionDeJour,
  heureDeCapitale,
} from '../js/heure.js';

const instant = (iso) => new Date(iso);

test("heure locale en 24 h, minuit en « 00 »", () => {
  assert.equal(heureLocale('Europe/Paris', instant('2026-01-15T13:05:09Z')), '14:05:09');
  assert.equal(heureLocale('Europe/Paris', instant('2026-01-15T23:00:00Z')), '00:00:00');
  assert.equal(heureLocale('UTC', instant('2026-01-15T21:30:00Z')), '21:30:00');
});

test('passage à l’heure d’été à Paris, le 29 mars 2026', () => {
  const avant = instant('2026-03-29T00:59:59Z');
  const apres = instant('2026-03-29T01:00:00Z');
  assert.equal(heureLocale('Europe/Paris', avant), '01:59:59');
  assert.equal(heureLocale('Europe/Paris', apres), '03:00:00');
  assert.equal(formaterDecalage(decalageMinutes('Europe/Paris', avant)), 'UTC+1');
  assert.equal(formaterDecalage(decalageMinutes('Europe/Paris', apres)), 'UTC+2');
});

test('décalages non entiers', () => {
  const t = instant('2026-01-15T12:00:00Z');
  assert.equal(decalageMinutes('Asia/Kolkata', t), 330);
  assert.equal(heureLocale('Asia/Kolkata', t), '17:30:00');
  assert.equal(formaterDecalage(decalageMinutes('Asia/Kolkata', t)), 'UTC+5:30');
  assert.equal(decalageMinutes('Asia/Kathmandu', t), 345);
  assert.equal(heureLocale('Asia/Kathmandu', t), '17:45:00');
  assert.equal(formaterDecalage(decalageMinutes('Asia/Kathmandu', t)), 'UTC+5:45');
  assert.equal(formaterDecalage(decalageMinutes('America/St_Johns', t)), 'UTC−3:30');
});

test('format du décalage', () => {
  assert.equal(formaterDecalage(-180), 'UTC−3');
  assert.equal(formaterDecalage(0), 'UTC+0');
  assert.equal(formaterDecalage(840), 'UTC+14');
  assert.equal(formaterDecalage(-570), 'UTC−9:30');
});

test('date locale en français', () => {
  assert.equal(dateLocale('Europe/Paris', instant('2026-09-26T10:00:00Z')), 'samedi 26 septembre 2026');
  assert.equal(dateLocale('Europe/Paris', instant('2026-10-01T10:00:00Z')), 'jeudi 1er octobre 2026');
  // Même instant, jour différent de l'autre côté du globe.
  assert.equal(dateLocale('Pacific/Kiritimati', instant('2026-09-26T12:00:00Z')), 'dimanche 27 septembre 2026');
});

test('veille et lendemain par rapport à l’utilisateur', () => {
  const tardParis = instant('2026-01-15T23:30:00Z'); // 00:30 le 16 à Paris
  assert.equal(ecartDeJour('America/New_York', tardParis, 'Europe/Paris'), -1);
  assert.equal(ecartDeJour('Europe/London', tardParis, 'Europe/Paris'), -1);
  assert.equal(ecartDeJour('Europe/Berlin', tardParis, 'Europe/Paris'), 0);
  const midi = instant('2026-01-15T12:00:00Z');
  assert.equal(ecartDeJour('Pacific/Kiritimati', midi, 'Europe/Paris'), 1);
  assert.equal(ecartDeJour('Pacific/Pago_Pago', midi, 'Pacific/Kiritimati'), -1);
  // Fin d'année : la veille reste −1 d'une année à l'autre.
  assert.equal(ecartDeJour('America/New_York', instant('2027-01-01T01:00:00Z'), 'Europe/Paris'), -1);
});

test('jour de 7 h à 19 h, heure locale', () => {
  // Paris en hiver = UTC+1
  assert.equal(estLeJour('Europe/Paris', instant('2026-01-15T05:59:59Z')), false); // 06:59:59
  assert.equal(estLeJour('Europe/Paris', instant('2026-01-15T06:00:00Z')), true); // 07:00:00
  assert.equal(estLeJour('Europe/Paris', instant('2026-01-15T17:59:59Z')), true); // 18:59:59
  assert.equal(estLeJour('Europe/Paris', instant('2026-01-15T18:00:00Z')), false); // 19:00:00
});

test('heureDeCapitale rassemble tout', () => {
  assert.deepEqual(heureDeCapitale('Asia/Kathmandu', instant('2026-01-15T12:00:00Z'), 'Europe/Paris'), {
    heure: '17:45:00',
    date: 'jeudi 15 janvier 2026',
    decalageMinutes: 345,
    decalage: 'UTC+5:45',
    ecartDeJour: 0,
    estLeJour: true,
  });
});

test('un fuseau inconnu lève une erreur', () => {
  assert.throws(() => heureLocale('Mars/Olympus', instant('2026-01-15T12:00:00Z')), RangeError);
});

test('mention veille / lendemain sur la carte, rien le même jour', () => {
  assert.equal(mentionDeJour(-1), 'la veille');
  assert.equal(mentionDeJour(1), 'le lendemain');
  assert.equal(mentionDeJour(0), '');
});
