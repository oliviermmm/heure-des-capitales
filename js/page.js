// Point d'entrée de la page : le SEUL module qui touche au DOM.
// Toute la logique vit dans les autres modules de js/, purs et testés par « node --test ».
//
// Chaque carte est créée une seule fois : filtrer ou trier ne fait que les replacer dans leurs groupes,
// et la mise à jour de chaque seconde ne réécrit que les textes de l'heure, de la date et du décalage.
import { NOM_DU_SITE } from './site.js';
import { CAPITALES } from './capitales.js';
import { heureDeCapitale } from './heure.js';
import { organiser, ORDRE_PAR_DEFAUT } from './grille.js';

const fuseauUtilisateur = Intl.DateTimeFormat().resolvedOptions().timeZone;

const contenu = document.getElementById('contenu');
const utilisateur = document.getElementById('utilisateur');
const recherche = document.getElementById('recherche');
const ordre = document.getElementById('ordre');

function element(balise, classe, texte = '') {
  const el = document.createElement(balise);
  if (classe) el.className = classe;
  el.textContent = texte;
  return el;
}

// Une carte par capitale, et les nœuds que la seconde qui passe doit réécrire.
const cartes = new Map(CAPITALES.map((entree) => {
  const carte = element('article', 'carte');
  const heure = element('p', 'heure');
  const date = element('p', 'date');
  const decalage = element('p', 'decalage');
  carte.append(element('h3', 'capitale', entree.capitale), element('p', 'pays', entree.pays), heure, date, decalage);
  return [entree, { carte, heure, date, decalage }];
}));

function afficher() {
  const groupes = organiser(CAPITALES, { recherche: recherche.value, ordre: ordre.value, instant: new Date() });
  const sections = groupes.map(({ titre, capitales }) => {
    const section = element('section', 'groupe');
    if (titre) section.append(element('h2', '', `${titre} (${capitales.length})`));
    const grille = element('div', 'grille');
    grille.append(...capitales.map((entree) => cartes.get(entree).carte));
    section.append(grille);
    return section;
  });
  if (!sections.length) sections.push(element('p', 'vide', 'Aucune capitale ne correspond à cette recherche.'));
  contenu.replaceChildren(...sections);
}

// Réécrit les textes qui changent, sur les seules cartes affichées.
function rafraichir() {
  const instant = new Date();
  const moi = heureDeCapitale(fuseauUtilisateur, instant, fuseauUtilisateur);
  utilisateur.textContent = `Chez vous : ${moi.heure}, ${moi.date} — fuseau ${fuseauUtilisateur} (${moi.decalage})`;
  // Un calcul par fuseau et par seconde, pas par carte : plusieurs pays partagent le même.
  const parFuseau = new Map();
  for (const [entree, noeuds] of cartes) {
    if (!noeuds.carte.isConnected) continue;
    let h = parFuseau.get(entree.fuseau);
    if (!h) parFuseau.set(entree.fuseau, (h = heureDeCapitale(entree.fuseau, instant, fuseauUtilisateur)));
    noeuds.heure.textContent = h.heure;
    noeuds.date.textContent = h.date;
    noeuds.decalage.textContent = h.decalage;
  }
}

function battre() {
  rafraichir();
  // Recalé sur le début de la seconde suivante, pour que l'affichage ne dérive pas.
  setTimeout(battre, 1000 - (Date.now() % 1000));
}

document.title = NOM_DU_SITE;
document.getElementById('titre').textContent = NOM_DU_SITE;
ordre.value = ORDRE_PAR_DEFAUT;
// Une carte masquée n'est plus rafraîchie : on la remet à l'heure dès qu'elle réapparaît.
recherche.addEventListener('input', () => { afficher(); rafraichir(); });
ordre.addEventListener('change', () => { afficher(); rafraichir(); });
document.getElementById('reglages').hidden = false;
document.getElementById('reglages').addEventListener('submit', (evenement) => evenement.preventDefault());
afficher();
battre();
