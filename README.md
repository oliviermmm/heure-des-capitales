# L'heure des capitales

Site statique (HTML, CSS, JavaScript, sans framework, sans dépendance, sans build) qui montre l'heure
dans les capitales du monde. L'heure se calcule dans le navigateur (`Intl.DateTimeFormat`, fuseaux IANA).

## Ouvrir le site

Depuis la racine du dépôt :

```sh
python -m http.server 8000
```

puis ouvrir <http://localhost:8000/>. Si la page affiche « Les modules JavaScript ne se sont pas
chargés », elle a été ouverte autrement que par ce serveur.

**Pourquoi un serveur et pas un double-clic** : la page charge ses scripts en modules ES
(`<script type="module">`), que Chrome refuse d'importer depuis `file://`. On garde quand même les
modules ES parce que c'est le seul format que la page et node importent tels quels : les fonctions
sont écrites une fois et testées telles que la page les utilise. Un script classique ouvrable au
double-clic aurait imposé un double format ou une copie des fonctions pour les tester. Python est le
seul prérequis, et ce n'est pas une dépendance du site : n'importe quel serveur statique convient.

## Ce que montre la page

- en tête, l'heure, la date et le fuseau du visiteur ;
- une carte par capitale (capitale, pays, heure, date, décalage UTC), mise à jour chaque seconde ;
- un champ de recherche sur le pays ou la capitale, y compris les autres capitales d'un pays
  (« la haye » trouve les Pays-Bas), sans tenir compte de la casse, des accents, des espaces, des
  tirets ni des apostrophes ;
- un choix d'ordre : par continent (par défaut, groupes titrés, pays par ordre alphabétique) ou par
  décalage horaire (du plus en retard sur UTC au plus en avance). Le tri par décalage est calculé au
  moment où l'on filtre ou trie : un changement d'heure pendant la visite ne réordonne la grille
  qu'au filtre ou au tri suivant.

Le filtre et le tri sont la fonction pure `organiser` de `js/grille.js`, testée par `node --test`.

## Lancer les tests

```sh
node --test
```

(ou `npm test`, qui lance la même commande). Node 24 ou plus récent.

## Organisation

- `index.html` : la page ;
- `css/style.css` : la feuille de style ;
- `js/` : les modules. `js/page.js` est le seul à toucher au DOM ; tous les autres sont purs, pour
  s'importer aussi bien dans la page que dans node (un test le vérifie) ;
- `tests/` : les tests, un fichier `*.test.js` par module.
