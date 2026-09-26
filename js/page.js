// Point d'entrée de la page : le SEUL module qui touche au DOM.
// Toute la logique vit dans les autres modules de js/, purs et testés par « node --test ».
import { NOM_DU_SITE } from './site.js';

document.title = NOM_DU_SITE;
document.getElementById('titre').textContent = NOM_DU_SITE;
document.getElementById('etat').textContent = 'Modules chargés.';
