// =============================================
//  NOZ P854 — Données planning
//  Modifier ce fichier pour mettre à jour les
//  employés et les horaires.
// =============================================

const SEMAINE = {
  numero: 19,
  debut: '2026-04-28',
  fin:   '2026-05-04',
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
  'Gerant': { label: 'Gérant',        color: '#B71C1C' },
  'AEM':    { label: 'AEM',           color: '#1565C0' },
  'AM':     { label: 'AM',            color: '#0277BD' },
  'Expert': { label: 'Expert métier', color: '#E65100' },
  'AEMI':   { label: 'AEMI',          color: '#00838F' },
  'EMP':    { label: 'EMP',           color: '#2E7D32' },
  'CPRO':   { label: 'Contrat Pro',   color: '#6A1B9A' },
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
  'Lun': '28 avr.',
  'Mar': '29 avr.',
  'Mer': '30 avr.',
  'Jeu': '1er mai',
  'Ven': '2 mai',
  'Sam': '3 mai',
  'Dim': '4 mai',
};

// =============================================
//  LISTE DES EMPLOYÉS (source: PLANNING_MAGASIN_Vierge S19)
// =============================================

const STAFF = [
  {
    prenom: 'Abdel',
    nom: '',
    role: 'Gerant',
    contrat: 35,
    pin: '1001',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 15, task: 'Manager' },
      { j: 'Mar', deb: 9,  fin: 15, task: 'Manager' },
      { j: 'Mer', deb: 8,  fin: 15, task: 'Manager' },
      { j: 'Jeu', deb: 0,  fin: 0,  task: null },
      { j: 'Ven', deb: 8,  fin: 15, task: 'Manager' },
      { j: 'Sam', deb: 0,  fin: 0,  task: null },
    ],
  },
  {
    prenom: 'Yohan',
    nom: '',
    role: 'AEM',
    contrat: 35,
    pin: '1002',
    shifts: [
      { j: 'Lun', deb: 7,  fin: 16, task: 'Relais AM' },
      { j: 'Mar', deb: 8,  fin: 14, task: 'Polyvalent' },
      { j: 'Mer', deb: 8,  fin: 15, task: 'Polyvalent' },
      { j: 'Jeu', deb: 7,  fin: 17, task: 'Relais AM' },
      { j: 'Ven', deb: 0,  fin: 0,  task: null },
      { j: 'Sam', deb: 0,  fin: 0,  task: null },
    ],
  },
  {
    prenom: 'Anthony',
    nom: '',
    role: 'AM',
    contrat: 35,
    pin: '1003',
    shifts: [
      { j: 'Lun', deb: 7,  fin: 16, task: 'Manager' },
      { j: 'Mar', deb: 0,  fin: 0,  task: null },
      { j: 'Mer', deb: 8,  fin: 15, task: 'Manager' },
      { j: 'Jeu', deb: 9,  fin: 15, task: 'Manager' },
      { j: 'Ven', deb: 0,  fin: 0,  task: null },
      { j: 'Sam', deb: 9,  fin: 14, task: 'Manager' },
    ],
  },
  {
    prenom: 'Virginie',
    nom: '',
    role: 'EMP',
    contrat: 35,
    pin: '1004',
    shifts: [
      { j: 'Lun', deb: 0,  fin: 0,  task: null },
      { j: 'Mar', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Mer', deb: 7,  fin: 17, task: 'Caisse' },
      { j: 'Jeu', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Ven', deb: 9,  fin: 16, task: 'Caisse' },
      { j: 'Sam', deb: 9,  fin: 15, task: 'Caisse' },
    ],
  },
  {
    prenom: 'Yanis',
    nom: '',
    role: 'EMP',
    contrat: 35,
    pin: '1005',
    shifts: [
      { j: 'Lun', deb: 8,  fin: 14, task: 'Polyvalent' },
      { j: 'Mar', deb: 8,  fin: 14, task: 'Polyvalent' },
      { j: 'Mer', deb: 8,  fin: 14, task: 'Polyvalent' },
      { j: 'Jeu', deb: 7,  fin: 16, task: 'Polyvalent' },
      { j: 'Ven', deb: 8,  fin: 16, task: 'Polyvalent' },
      { j: 'Sam', deb: 8,  fin: 14, task: 'Polyvalent' },
    ],
  },
  {
    prenom: 'Mylene',
    nom: '',
    role: 'EMP',
    contrat: 35,
    pin: '1006',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Mar', deb: 0,  fin: 0,  task: null },
      { j: 'Mer', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Jeu', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Ven', deb: 9,  fin: 14, task: 'Caisse' },
      { j: 'Sam', deb: 9,  fin: 14, task: 'Caisse' },
    ],
  },
  {
    prenom: 'Zao',
    nom: '',
    role: 'CPRO',
    contrat: 35,
    pin: '1007',
    shifts: [
      { j: 'Lun', deb: 13, fin: 19, task: 'CPRO PM' },
      { j: 'Mar', deb: 12, fin: 20, task: 'CPRO PM' },
      { j: 'Mer', deb: 14, fin: 20, task: 'CPRO PM' },
      { j: 'Jeu', deb: 13, fin: 19, task: 'CPRO PM' },
      { j: 'Ven', deb: 13, fin: 21, task: 'CPRO PM' },
      { j: 'Sam', deb: 12, fin: 21, task: 'CPRO PM' },
    ],
  },
  {
    prenom: 'Oceane',
    nom: '',
    role: 'CPRO',
    contrat: 35,
    pin: '1008',
    shifts: [
      { j: 'Lun', deb: 0,  fin: 0,  task: null },
      { j: 'Mar', deb: 0,  fin: 0,  task: null },
      { j: 'Mer', deb: 0,  fin: 0,  task: null },
      { j: 'Jeu', deb: 0,  fin: 0,  task: null },
      { j: 'Ven', deb: 0,  fin: 0,  task: null },
      { j: 'Sam', deb: 0,  fin: 0,  task: null },
    ],
  },
  {
    prenom: 'Antoine',
    nom: '',
    role: 'AEM',
    contrat: 39,
    pin: '1009',
    shifts: [
      { j: 'Lun', deb: 8,  fin: 14, task: 'Polyvalent' },
      { j: 'Mar', deb: 7,  fin: 17, task: 'Relais AM' },
      { j: 'Mer', deb: 7,  fin: 17, task: 'Relais AM' },
      { j: 'Jeu', deb: 8,  fin: 15, task: 'Polyvalent' },
      { j: 'Ven', deb: 8,  fin: 14, task: 'Polyvalent' },
      { j: 'Sam', deb: 0,  fin: 0,  task: null },
    ],
  },
  {
    prenom: 'Mady',
    nom: '',
    role: 'Expert',
    contrat: 39,
    pin: '1010',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 15, task: 'MEP' },
      { j: 'Mar', deb: 7,  fin: 17, task: 'TDM' },
      { j: 'Mer', deb: 7,  fin: 17, task: 'TDM' },
      { j: 'Jeu', deb: 9,  fin: 17, task: 'TDM' },
      { j: 'Ven', deb: 9,  fin: 15, task: 'MEP' },
      { j: 'Sam', deb: 0,  fin: 0,  task: null },
    ],
  },
  {
    prenom: 'Willy',
    nom: '',
    role: 'AEMI',
    contrat: 39,
    pin: '1011',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 15, task: 'MEP' },
      { j: 'Mar', deb: 7,  fin: 17, task: 'TDM' },
      { j: 'Mer', deb: 7,  fin: 17, task: 'TDM' },
      { j: 'Jeu', deb: 9,  fin: 17, task: 'TDM' },
      { j: 'Ven', deb: 9,  fin: 15, task: 'MEP' },
      { j: 'Sam', deb: 0,  fin: 0,  task: null },
    ],
  },
  {
    prenom: 'Vanessa',
    nom: '',
    role: 'EMP',
    contrat: 39,
    pin: '1012',
    shifts: [
      { j: 'Lun', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Mar', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Mer', deb: 0,  fin: 0,  task: null },
      { j: 'Jeu', deb: 9,  fin: 15, task: 'Caisse' },
      { j: 'Ven', deb: 9,  fin: 17, task: 'Caisse' },
      { j: 'Sam', deb: 9,  fin: 15, task: 'Caisse' },
    ],
  },
];

// ——— Helpers —————————————————————————————
function totalHeures(staff) {
  return staff.shifts.reduce((sum, s) => sum + (s.deb ? s.fin - s.deb : 0), 0);
}
function initiales(p) {
  return (p.prenom[0] + (p.prenom[1] || '')).toUpperCase();
}
function roleColor(role) {
  return (ROLES[role] || {}).color || '#888';
}
