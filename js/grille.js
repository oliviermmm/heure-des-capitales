// Filtre et tri de la grille des capitales. Module pur : l'instant est passé en paramètre, aucun accès
// au DOM, importable par la page et par node.
//
// Recherche : sur le pays, la capitale et les autres capitales (« La Haye » trouve les Pays-Bas),
// insensible à la casse, aux accents, aux espaces, aux tirets et aux apostrophes.
// Ordres : « continent » (groupes titrés dans l'ordre de CONTINENTS, pays par ordre alphabétique) ou
// « decalage » (un seul groupe sans titre, du plus en retard sur UTC au plus en avance).
import { CONTINENTS } from './capitales.js';
import { decalageMinutes } from './heure.js';

export const ORDRE_PAR_DEFAUT = 'continent';

// « Côte d’Ivoire » → « cotedivoire », « Addis-Abeba » → « addisabeba » : les séparateurs tombent
// tous, pour que « cote d ivoire », « côte d'ivoire » et « cotedivoire » se retrouvent.
export function normaliser(texte) {
  return texte
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('fr')
    .replace(/[\s\p{P}ʻ]/gu, '');
}

function correspond(entree, recherche) {
  const noms = [entree.pays, entree.capitale, ...(entree.autresCapitales ?? [])];
  return noms.some((nom) => normaliser(nom).includes(recherche));
}

const parPays = (a, b) => a.pays.localeCompare(b.pays, 'fr');

// → [{ titre, capitales }] : groupes non vides, titre null pour l'ordre par décalage.
export function organiser(capitales, { recherche = '', ordre = ORDRE_PAR_DEFAUT, instant }) {
  const cherche = normaliser(recherche);
  const retenues = cherche ? capitales.filter((entree) => correspond(entree, cherche)) : [...capitales];

  if (ordre === 'decalage') {
    // Un décalage par fuseau, pas par capitale : plusieurs pays partagent le même.
    const decalages = new Map();
    const decalage = ({ fuseau }) => {
      if (!decalages.has(fuseau)) decalages.set(fuseau, decalageMinutes(fuseau, instant));
      return decalages.get(fuseau);
    };
    retenues.sort((a, b) => decalage(a) - decalage(b) || parPays(a, b));
    return retenues.length ? [{ titre: null, capitales: retenues }] : [];
  }
  if (ordre !== 'continent') throw new RangeError(`Ordre inconnu : ${ordre}`);

  return CONTINENTS
    .map((continent) => ({
      titre: continent,
      capitales: retenues.filter((entree) => entree.continent === continent).sort(parPays),
    }))
    .filter((groupe) => groupe.capitales.length);
}
