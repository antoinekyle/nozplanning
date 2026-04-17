// =============================================
//  NOZ P854 — Données planning
//  Modifier ce fichier pour mettre à jour les
//  employés et les horaires.
// =============================================

const SEMAINE = {
  numero: 16,
  debut: '2026-04-13',
  fin:   '2026-04-19',
  magasin: 'Louvroil P854',
};

// Tâches disponibles : clé → { label, couleur }
const TASKS = {
  'Manager':    { label: 'Manager',     color: '#1565C0' },
  'Relais AM':  { label: 'Relais AM',   color: '#0277BD' },
  'Polyvalent': { label: 'Polyvalent',  color: '#2E7D32' },
  'Caisse':     { label: 'Caisse',      color: '#BF360C' },
  'Caisse-AM':  { label: 'Caisse AM',   color: '#BF360C' },
  'CPRO PM':    { label: 'CPRO PM',     color: '#6A1B9A' },
  'MEP':        { label: 'MEP',         color: '#00838F' },
  'TDM':        { label: 'TDM',         color: '#E65100' },
};

// Rôles disponibles
const ROLES = {
  'AM':   { label: 'AM',         color: '#1565C0' },
  'EMP':  { label: 'EMP',        color: '#2E7D32' },
  'CPRO': { label: 'Contrat Pro', color: '#6A1B9A' },
};

// Jours de la semaine (ordre affichage)
const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const JOURS_FULL = {
  'Lun': 'Lundi',
  'Mar': 'Mardi',
  'Mer': 'Mercredi',
  'Jeu': 'Jeudi',
  'Ven': 'Vendredi',
  'Sam': 'Samedi',
  'Dim': 'Dimanche',
};
const JOURS_DATES = {
  'Lun': '13 avr.',
  'Mar': '14 avr.',
  'Mer': '15 avr.',
  'Jeu': '16 avr.',
  'Ven': '17 avr.',
  'Sam': '18 avr.',
  'Dim': '19 avr.',
};

// =============================================
//  LISTE DES EMPLOYÉS (source: feuille EMPLOYES)
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
    shifts: [
      { j: 'Lun', deb: 8,  fin: 16, task: 'Manager' },
      { j: 'Mar', deb: 9,  fin: 17, task: 'Manager' },
      { j: 'Mer', deb: 8,  fin: 16, task: 'Manager' },
      { j: 'Jeu', deb: 0,  fin: 0,  task: null },      // REPOS
      { j: 'Ven', deb: 8,  fin: 16, task: 'Manager' },
      { j: 'Sam', deb: 8,  fin: 16, task: 'Manager' },
    ],
  },
  {
    prenom: 'Kylian',
    nom: 'Mbappe',
    role: 'EMP',
    contrat: 39,
    shifts: [
      { j: 'Lun', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Mar', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Mer', deb: 6,  fin: 13, task: 'Polyvalent' },
      { j: 'Jeu', deb: 8,  fin: 16, task: 'Relais AM' },
      { j: 'Ven', deb: 6,  fin: 13, task: 'Caisse-AM' },
      { j: 'Sam', deb: 9,  fin: 13, task: 'Polyvalent' },
    ],
  },
  {
    prenom: 'Cristiano',
    nom: 'ROnaldo',
    role: 'EMP',
    contrat: 35,
    shifts: [
      { j: 'Lun', deb: 9,  fin: 16, task: 'Caisse' },
      { j: 'Mar', deb: 10, fin: 17, task: 'Polyvalent' },
      { j: 'Mer', deb: 6,  fin: 13, task: 'Caisse-AM' },
      { j: 'Jeu', deb: 9,  fin: 16, task: 'Caisse' },
      { j: 'Ven', deb: 0,  fin: 0,  task: null },      // REPOS
      { j: 'Sam', deb: 9,  fin: 16, task: 'Polyvalent' },
    ],
  },
  {
    prenom: 'Lionel',
    nom: 'Pessi',
    role: 'EMP',
    contrat: 35,
    shifts: [
      { j: 'Lun', deb: 0,  fin: 0,  task: null },      // REPOS
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
    shifts: [
      { j: 'Lun', deb: 9,  fin: 16, task: 'MEP' },
      { j: 'Mar', deb: 0,  fin: 0,  task: null },      // REPOS
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
    shifts: [
      { j: 'Lun', deb: 10, fin: 17, task: 'Polyvalent' },
      { j: 'Mar', deb: 11, fin: 18, task: 'MEP' },
      { j: 'Mer', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Jeu', deb: 0,  fin: 0,  task: null },      // REPOS
      { j: 'Ven', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Sam', deb: 10, fin: 17, task: 'TDM' },
    ],
  },
  {
    prenom: 'Luc',
    nom: 'Sky',
    role: 'CPRO',
    contrat: 35,
    shifts: [
      { j: 'Lun', deb: 9,  fin: 16, task: 'TDM' },
      { j: 'Mar', deb: 9,  fin: 16, task: 'TDM' },
      { j: 'Mer', deb: 13, fin: 20, task: 'CPRO PM' },
      { j: 'Jeu', deb: 10, fin: 17, task: 'MEP' },
      { j: 'Ven', deb: 0,  fin: 0,  task: null },      // REPOS
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
