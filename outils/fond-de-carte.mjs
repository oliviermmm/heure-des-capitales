// Génère js/monde.js depuis les contours des pays de Natural Earth 1:110m (domaine public).
// Outil de développement, non servi par le site : lancé une fois, son résultat est versionné.
//
//   node outils/fond-de-carte.mjs ne_110m_admin_0_countries.geojson
//
// Source : https://github.com/nvkelso/natural-earth-vector (v5.1.2, geojson/ne_110m_admin_0_countries.geojson).
// Simplification : coordonnées arrondies à 0,1° (un tiers de pixel sur une carte de 1 200 px de large),
// points répétés retirés, anneaux réduits à moins de 4 points abandonnés.
import { readFileSync, writeFileSync } from 'node:fs';

const [source] = process.argv.slice(2);
if (!source) {
  console.error('usage : node outils/fond-de-carte.mjs <ne_110m_admin_0_countries.geojson>');
  process.exit(1);
}

const arrondi = (v) => Math.round(v * 10) / 10;
const anneaux = [];
for (const { geometry } of JSON.parse(readFileSync(source, 'utf8')).features) {
  const polygones = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  for (const polygone of polygones) {
    for (const anneau of polygone) {
      const plat = [];
      for (const [lon, lat] of anneau) {
        const x = arrondi(lon);
        const y = arrondi(lat);
        if (plat.length && plat.at(-2) === x && plat.at(-1) === y) continue;
        plat.push(x, y);
      }
      if (plat.length >= 8) anneaux.push(plat);
    }
  }
}

const lignes = anneaux.map((a) => `[${a.join(',')}]`).join(',\n');
writeFileSync(new URL('../js/monde.js', import.meta.url), `// Contours des pays : Natural Earth 1:110m, domaine public (https://www.naturalearthdata.com).
// Généré par outils/fond-de-carte.mjs — ne pas modifier à la main. Module pur, sans DOM.
// Chaque anneau est une liste plate de degrés : [lon, lat, lon, lat, …], fermée implicitement.
export const CONTOURS = [
${lignes}
];
`);
console.log(`${anneaux.length} anneaux, ${anneaux.reduce((n, a) => n + a.length / 2, 0)} points`);
