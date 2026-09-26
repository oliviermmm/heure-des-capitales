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

## Choix de style

- **Thème selon le système** (`prefers-color-scheme`) : clair ou sombre comme l'appareil du visiteur,
  sans bouton de bascule. Toutes les couleurs sont des variables de `:root` dans `css/style.css`.
- **Typographie système** (`system-ui`) : aucune police à télécharger, rien sur un CDN.
- **Jour ou nuit dans la capitale** : fond de soleil pâle le jour, bleu de nuit la nuit, d'après
  `estLeJour` de `js/heure.js` (7 h – 19 h, heure locale). Un libellé « ☀ jour » / « ☾ nuit » dit la
  même chose en toutes lettres, pour ne pas s'en remettre à la seule couleur.
- **Responsive** : une colonne sur mobile, autant de colonnes de 15rem que la largeur en porte dès 36rem.
- **Contrastes WCAG AA** (4,5:1) sur tout le texte, dans les deux thèmes : `tests/style.test.js` les
  recalcule depuis la feuille de style. Changer une couleur, c'est la changer dans les deux thèmes.
- **Mouvement** : seule animation, un fondu de couleur quand une carte passe du jour à la nuit, coupé
  sous `prefers-reduced-motion`.

## Lancer les tests

```sh
node --test
```

(ou `npm test`, qui lance la même commande). Node 24 ou plus récent.

## En ligne

Adresse publique : **à inscrire ici** quand le domaine Railway du service existera (ticket #1684,
geste manuel), et dans la variable `URL_PUBLIQUE` du dépôt GitHub.

Le site est servi par Railway : un conteneur Caddy qui ne sert que `index.html`, `css/`, `js/` et
`version.txt` (`Dockerfile`, `railway.json`). Rien n'est ajouté au site lui-même.

- **Chaque push et chaque PR** lance `node --test` (`.github/workflows/tests.yml`). Il ne livre rien.
- **Une version part d'un tag**, et de lui seul (`.github/workflows/livraison.yml`) : un tag annoté
  `vX.Y.Z` posé sur un commit de `main`. La première sera `v0.1.0`.

  ```sh
  git tag -a v0.1.0 -m "Ce que cette version apporte"
  git push origin v0.1.0        # on nomme le tag ; jamais --tags
  ```

  Le workflow refuse un tag léger, hors de `main` ou d'une autre forme, relance `node --test`, écrit
  le tag dans `version.txt`, met en service par `railway up`, puis attend que l'adresse publique le
  serve. Une version refusée ou fautive ne se repose pas : on livre la suivante (un tag ne se
  déplace jamais).
- **Constater la version en service** : `curl <adresse publique>/version.txt` rend le tag servi.
  En local, ce fichier dit `hors-livraison`.

Ce que le dépôt GitHub doit porter pour livrer : le secret `RAILWAY_TOKEN` (jeton de projet
Railway), les variables `RAILWAY_SERVICE` (nom du service) et `URL_PUBLIQUE` (sans `/` final), et
`main` comme branche par défaut — c'est elle que le workflow lit comme branche de production.

## Organisation

- `index.html` : la page ;
- `css/style.css` : la feuille de style (voir « Choix de style ») ;
- `js/` : les modules. `js/page.js` est le seul à toucher au DOM ; tous les autres sont purs, pour
  s'importer aussi bien dans la page que dans node (un test le vérifie) ;
- `tests/` : les tests, un fichier `*.test.js` par module.
