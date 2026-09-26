// Heure d'une capitale à partir de son fuseau IANA. Module pur : l'instant est toujours passé en
// paramètre (jamais lu ici), aucun accès au DOM, importable par la page et par node.
//
// Choix d'affichage : 24 h et français imposés (fr-FR), quelle que soit la langue du navigateur.
// Règle jour/nuit : il fait « jour » de 7 h (incluse) à 19 h (exclue), heure locale, sans calcul
// astronomique du lever ou du coucher du soleil.

const DEBUT_DU_JOUR = 7;
const FIN_DU_JOUR = 19;
const MINUTE_MS = 60 * 1000;
const JOUR_MS = 24 * 60 * MINUTE_MS;

// Un formateur par fuseau : en construire un coûte cher, et la page en demande chaque seconde.
const formateurs = new Map();

function formateur(fuseau) {
  let f = formateurs.get(fuseau);
  if (!f) {
    f = new Intl.DateTimeFormat('fr-FR', {
      timeZone: fuseau,
      hourCycle: 'h23',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formateurs.set(fuseau, f);
  }
  return f;
}

// Composantes locales de l'instant dans le fuseau : { annee, mois (1-12), jour, heure, minute,
// seconde, nomDuJour, nomDuMois }.
function composantes(fuseau, instant) {
  const parties = {};
  for (const { type, value } of formateur(fuseau).formatToParts(instant)) parties[type] = value;
  // Le mois en chiffres, que le format « long » ne donne pas : on le relit en numérique.
  const mois = Number(formateurDuMois(fuseau).format(instant));
  return {
    annee: Number(parties.year),
    mois,
    jour: Number(parties.day),
    heure: Number(parties.hour),
    minute: Number(parties.minute),
    seconde: Number(parties.second),
    nomDuJour: parties.weekday,
    nomDuMois: parties.month,
  };
}

const formateursDuMois = new Map();

function formateurDuMois(fuseau) {
  let f = formateursDuMois.get(fuseau);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', { timeZone: fuseau, month: 'numeric' });
    formateursDuMois.set(fuseau, f);
  }
  return f;
}

const deuxChiffres = (n) => String(n).padStart(2, '0');

// « 14:05:09 »
export function heureLocale(fuseau, instant) {
  const c = composantes(fuseau, instant);
  return `${deuxChiffres(c.heure)}:${deuxChiffres(c.minute)}:${deuxChiffres(c.seconde)}`;
}

// « samedi 26 septembre 2026 », « jeudi 1er octobre 2026 »
export function dateLocale(fuseau, instant) {
  const c = composantes(fuseau, instant);
  return `${c.nomDuJour} ${c.jour === 1 ? '1er' : c.jour} ${c.nomDuMois} ${c.annee}`;
}

// Décalage à UTC en minutes (330 pour Kolkata, −180 pour Buenos Aires) : sert aussi à trier.
export function decalageMinutes(fuseau, instant) {
  const c = composantes(fuseau, instant);
  const commeSiUtc = Date.UTC(c.annee, c.mois - 1, c.jour, c.heure, c.minute, c.seconde);
  const auxSecondes = Math.floor(instant.getTime() / 1000) * 1000;
  return Math.round((commeSiUtc - auxSecondes) / MINUTE_MS);
}

// 330 → « UTC+5:30 », −180 → « UTC−3 » (vrai signe moins), 0 → « UTC+0 »
export function formaterDecalage(minutes) {
  const signe = minutes < 0 ? '−' : '+';
  const absolu = Math.abs(minutes);
  const heures = Math.floor(absolu / 60);
  const reste = absolu % 60;
  return `UTC${signe}${heures}${reste ? `:${deuxChiffres(reste)}` : ''}`;
}

function jourCivil(fuseau, instant) {
  const c = composantes(fuseau, instant);
  return Date.UTC(c.annee, c.mois - 1, c.jour);
}

// −1 si la date locale est la veille de celle de l'utilisateur, +1 le lendemain, 0 le même jour.
export function ecartDeJour(fuseau, instant, fuseauUtilisateur) {
  return Math.round((jourCivil(fuseau, instant) - jourCivil(fuseauUtilisateur, instant)) / JOUR_MS);
}

export function estLeJour(fuseau, instant) {
  const { heure } = composantes(fuseau, instant);
  return heure >= DEBUT_DU_JOUR && heure < FIN_DU_JOUR;
}

// Tout ce que la page affiche pour une capitale. fuseauUtilisateur se lit côté page par
// Intl.DateTimeFormat().resolvedOptions().timeZone.
export function heureDeCapitale(fuseau, instant, fuseauUtilisateur) {
  const minutes = decalageMinutes(fuseau, instant);
  return {
    heure: heureLocale(fuseau, instant),
    date: dateLocale(fuseau, instant),
    decalageMinutes: minutes,
    decalage: formaterDecalage(minutes),
    ecartDeJour: ecartDeJour(fuseau, instant, fuseauUtilisateur),
    estLeJour: estLeJour(fuseau, instant),
  };
}
