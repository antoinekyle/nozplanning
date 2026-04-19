// =============================================
//  NOZ P854 — Données planning
//  Modifier ce fichier pour mettre à jour les
//  employés et les horaires.
// =============================================

// =============================================
//  CALCUL DYNAMIQUE DE LA SEMAINE
//  Gère la coupure de fin/début de mois
// =============================================

function calcSemaine(dateDebut) {
  const debut = new Date(dateDebut);

  // Numéro de semaine ISO
  const tmp = new Date(debut);
  tmp.setHours(0,0,0,0);
  tmp.setDate(tmp.getDate() + 3 - (tmp.getDay() + 6) % 7);
  const week1 = new Date(tmp.getFullYear(), 0, 4);
  const numSem = 1 + Math.round(((tmp - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);

  // Calcul des 6 jours (Lun→Sam)
  // RÈGLE COUPURE DE MOIS :
  // - Si on commence le 1er → la semaine commence le 1er
  // - Si la semaine dépasse la fin du mois → on s'arrête au dernier jour du mois
  const moisDebut = debut.getMonth();
  const anDebut   = debut.getFullYear();
  const dernierJourMois = new Date(anDebut, moisDebut + 1, 0).getDate();

  const jours = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(debut);
    d.setDate(debut.getDate() + i);

    // Coupure : si on change de mois → on marque le jour comme "hors mois"
    const horsLimite = d.getMonth() !== moisDebut;

    jours.push({
      key:       ['Lun','Mar','Mer','Jeu','Ven','Sam'][i],
      full:      ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'][i],
      date:      new Date(d),
      iso:       d.toISOString().split('T')[0],
      jour:      d.getDate(),
      horsLimite,   // true = ce jour est dans le mois suivant → pas travaillé
      label:     horsLimite
        ? `${d.getDate()} ${['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'][d.getMonth()]}.`
        : `${d.getDate()} ${['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'][moisDebut]}.`,
    });
  }

  // Date de fin effective = dernier jour travaillé dans le mois
  const finEffective = jours.filter(j => !j.horsLimite).at(-1)?.date || jours[5].date;

  return {
    numero:  numSem,
    debut:   debut.toISOString().split('T')[0],
    fin:     finEffective.toISOString().split('T')[0],
    magasin: 'Louvroil P854',
    jours,
    dernierJourMois,
    moisNom: ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][moisDebut],
  };
}

// ——— DATE DE DÉBUT DE SEMAINE À MODIFIER ———
// Changer uniquement cette ligne chaque semaine
const DATE_DEBUT_SEMAINE = '2026-04-13';
// ————————————————————————————————————————————

const SEMAINE_DATA = calcSemaine(DATE_DEBUT_SEMAINE);

const SEMAINE = {
  numero:  SEMAINE_DATA.numero,
  debut:   SEMAINE_DATA.debut,
  fin:     SEMAINE_DATA.fin,
  magasin: SEMAINE_DATA.magasin,
};

// Tableaux dynamiques basés sur la semaine calculée
const JOURS      = SEMAINE_DATA.jours.map(j => j.key);
const JOURS_FULL = Object.fromEntries(SEMAINE_DATA.jours.map(j => [j.key, j.full]));
const JOURS_DATES = Object.fromEntries(SEMAINE_DATA.jours.map(j => [j.key, j.label]));
const JOURS_ISO   = Object.fromEntries(SEMAINE_DATA.jours.map(j => [j.key, j.iso]));
const JOURS_HORS  = Object.fromEntries(SEMAINE_DATA.jours.map(j => [j.key, j.horsLimite]));

// =============================================
//  TÂCHES — couleurs et libellés
// =============================================
const TASKS = {
  'Manager':    { label: 'Manager',    color: '#1565C0' },
  'Relais AM':  { label: 'Relais AM',  color: '#0277BD' },
  'Polyvalent': { label: 'Polyvalent', color: '#2E7D32' },
  'Caisse':     { label: 'Caisse',     color: '#D4A017' },  // Jaune
  'CPRO PM':    { label: 'CPRO PM',    color: '#6A1B9A' },
  'MEP':        { label: 'MEP',        color: '#00838F' },
  'TDM':        { label: 'TDM',        color: '#E65100' },
};

// =============================================
//  RÔLES
// =============================================
const ROLES = {
  'AM':   { label: 'AM',          color: '#1565C0' },
  'EMP':  { label: 'EMP',         color: '#2E7D32' },
  'CPRO': { label: 'Contrat Pro', color: '#6A1B9A' },
};
//  Chaque shift : { j, deb, fin, task }
//    j    = 'Lun' | 'Mar' | 'Mer' | 'Jeu' | 'Ven' | 'Sam'
//    deb  = heure de début (entier, ex: 8 = 8h00)
//    fin  = heure de fin
//    task = clé de TASKS (ou null = repos)
// =============================================

const STAFF = [
  {
    prenom: 'Antoine',
    nom: 'Benoit',
    role: 'AM',
    contrat: 39,
    pin: '1001',
    shifts: [
      { j: 'Lun', deb: 8,  fin: 16, task: 'Manager' },
      { j: 'Mar', deb: 9,  fin: 17, task: 'Manager' },
      { j: 'Mer', deb: 8,  fin: 16, task: 'Manager' },
      { j: 'Jeu', deb: 0,  fin: 0,  task: null },
      { j: 'Ven', deb: 8,  fin: 16, task: 'Manager' },
      { j: 'Sam', deb: 8,  fin: 16, task: 'Manager' },
    ],
  },
  {
    prenom: 'Kylian',
    nom: 'Mbappe',
    role: 'EMP',
    contrat: 39,
    pin: '1002',
    shifts: [
      { j: 'Lun', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Mar', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Mer', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Jeu', deb: 8,  fin: 16, task: 'Relais AM' },
      { j: 'Ven', deb: 6,  fin: 13, task: 'Caisse' },
      { j: 'Sam', deb: 9,  fin: 13, task: 'Polyvalent' },
    ],
  },
  {
    prenom: 'Cristiano',
    nom: 'ROnaldo',
    role: 'EMP',
    contrat: 35,
    pin: '1003',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 16, task: 'Caisse' },
      { j: 'Mar', deb: 10, fin: 17, task: 'Polyvalent' },
      { j: 'Mer', deb: 6,  fin: 13, task: 'Caisse' },
      { j: 'Jeu', deb: 9,  fin: 16, task: 'Caisse' },
      { j: 'Ven', deb: 0,  fin: 0,  task: null },
      { j: 'Sam', deb: 9,  fin: 16, task: 'Polyvalent' },
    ],
  },
  {
    prenom: 'Lionel',
    nom: 'Pessi',
    role: 'EMP',
    contrat: 35,
    pin: '1004',
    shifts: [
      { j: 'Lun', deb: 0,  fin: 0,  task: null },
      { j: 'Mar', deb: 9,  fin: 16, task: 'Caisse' },
      { j: 'Mer', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Jeu', deb: 10, fin: 17, task: 'Polyvalent' },
      { j: 'Ven', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Sam', deb: 9,  fin: 16, task: 'Caisse' },
    ],
  },
  {
    prenom: 'Harry',
    nom: 'est entrain de cane',
    role: 'CPRO',
    contrat: 35,
    pin: '1005',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 16, task: 'MEP' },
      { j: 'Mar', deb: 0,  fin: 0,  task: null },
      { j: 'Mer', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Jeu', deb: 9,  fin: 16, task: 'TDM' },
      { j: 'Ven', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Sam', deb: 9,  fin: 16, task: 'MEP' },
    ],
  },
  {
    prenom: 'Huge',
    nom: 'au frais',
    role: 'CPRO',
    contrat: 35,
    pin: '1006',
    shifts: [
      { j: 'Lun', deb: 10, fin: 17, task: 'Polyvalent' },
      { j: 'Mar', deb: 11, fin: 18, task: 'MEP' },
      { j: 'Mer', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Jeu', deb: 0,  fin: 0,  task: null },
      { j: 'Ven', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Sam', deb: 10, fin: 17, task: 'TDM' },
    ],
  },
  {
    prenom: 'Luc',
    nom: 'Sky',
    role: 'CPRO',
    contrat: 35,
    pin: '1007',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 16, task: 'TDM' },
      { j: 'Mar', deb: 9,  fin: 16, task: 'TDM' },
      { j: 'Mer', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Jeu', deb: 10, fin: 17, task: 'MEP' },
      { j: 'Ven', deb: 0,  fin: 0,  task: null },
      { j: 'Sam', deb: 9,  fin: 16, task: 'Polyvalent' },
    ],
  },
];

// ——— Helpers —————————————————————————————
function totalHeures(staff) {
  return staff.shifts.reduce((sum, s) => sum + (s.deb ? s.fin - s.deb : 0), 0);
}
function initiales(p) {
  return (p.prenom[0] + (p.nom[0] || '')).toUpperCase();
}
function roleColor(role) {
  return (ROLES[role] || {}).color || '#888';
}
