// Projection équirectangulaire du monde : (longitude, latitude) en degrés → (x, y) sur une surface
// de largeur × hauteur, origine en haut à gauche. Module pur, sans DOM : la carte (js/page.js) et les
// tests l'importent tels quels. La longitude −180 est le bord gauche, +180 le bord droit.
export const LARGEUR = 360;
export const HAUTEUR = 180;

export function projeter(lon, lat, { largeur = LARGEUR, hauteur = HAUTEUR } = {}) {
  // Hors de [−180, 180], la longitude est ramenée sur le même méridien ; ±180 restent aux bords.
  const l = lon >= -180 && lon <= 180 ? lon : ((((lon + 180) % 360) + 360) % 360) - 180;
  const b = Math.min(90, Math.max(-90, lat));
  return { x: ((l + 180) / 360) * largeur, y: ((90 - b) / 180) * hauteur };
}

const court = (v) => String(Math.round(v * 100) / 100);

// Attribut « d » d'un chemin SVG : un sous-chemin fermé par anneau [lon, lat, lon, lat, …].
export function tracer(anneaux, dimensions) {
  return anneaux.map((anneau) => {
    const points = [];
    for (let i = 0; i < anneau.length; i += 2) {
      const { x, y } = projeter(anneau[i], anneau[i + 1], dimensions);
      points.push(`${court(x)} ${court(y)}`);
    }
    return `M${points.join('L')}Z`;
  }).join('');
}
