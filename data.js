// =============================================
//  NOZ P854 — Données planning
//  Semaine 19 — 4 au 10 mai 2026
//  Horaires exacts + pauses extraits du planning Excel
// =============================================

const SEMAINE = {
  numero: 19,
  debut: '2026-05-04',
  fin:   '2026-05-10',
  magasin: 'Louvroil P854',
};

const TASKS = {
  'Pole1':   { label: 'Pôle 1',  color: '#C0392B' },
  'Pole2':   { label: 'Pôle 2',  color: '#27AE60' },
  'Pole3':   { label: 'Pôle 3',  color: '#2980B9' },
  'Caisses': { label: 'Caisses', color: '#F39C12' },
  'TDM':     { label: 'TDM',     color: '#00BCD4' },
  'Divers':  { label: 'Divers',  color: '#7D5A2E' },
};

const ROLES = {
  'Gérant':        { label: 'Gérant',        color: '#B71C1C' },
  'AEM':           { label: 'AEM',            color: '#1565C0' },
  'AM':            { label: 'AM',             color: '#0277BD' },
  'Expert métier': { label: 'Expert métier',  color: '#00838F' },
  'AEMI':          { label: 'AEMI',           color: '#1565C0' },
  'EMP':           { label: 'EMP',            color: '#2E7D32' },
  'Contrat Pro':   { label: 'Contrat Pro',    color: '#6A1B9A' },
};

const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
const JOURS_FULL = {
  'Lun':'Lundi','Mar':'Mardi','Mer':'Mercredi',
  'Jeu':'Jeudi','Ven':'Vendredi','Sam':'Samedi','Dim':'Dimanche',
};
const JOURS_DATES = {
  'Lun':'4 mai','Mar':'5 mai','Mer':'6 mai',
  'Jeu':'7 mai','Ven':'8 mai','Sam':'9 mai','Dim':'10 mai',
};

// deb/fin en décimal : 8.75 = 8h45, 13.75 = 13h45, 19.5 = 19h30
// pause_deb / pause_fin : idem (null = pas de pause)
const STAFF = [
  {
    prenom:'Abdel',  totalSemaine:null, nom:'', role:'Gérant', contrat:39, pin:'1001',
    shifts:[
      { j:'Lun', deb:8.75, fin:13.75, task:'Pole1',  pause_deb:null,  pause_fin:null  },
      { j:'Mar', deb:8.75, fin:13.75, task:'Pole1',  pause_deb:null,  pause_fin:null  },
      { j:'Mer', deb:7,    fin:13.75, task:'Pole1',  pause_deb:null,  pause_fin:null  },
      { j:'Jeu', deb:0,    fin:0,     task:null,     pause_deb:null,  pause_fin:null  },
      { j:'Ven', deb:0,    fin:0,     task:null,      pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:0,    fin:0,     task:null,     pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Yohan',  totalSemaine:31.75, nom:'', role:'AEM', contrat:35, pin:'1002',
    shifts:[
      { j:'Lun', deb:10,   fin:19.5,  task:'Divers', pause_deb:14,    pause_fin:15    },
      { j:'Mar', deb:8.75, fin:14.5,  task:'Divers', pause_deb:null,  pause_fin:null  },
      { j:'Mer', deb:7,    fin:14.75, task:'Divers', pause_deb:12,    pause_fin:13    },
      { j:'Jeu', deb:8.75, fin:19.5,  task:'Divers', pause_deb:14,    pause_fin:15    },
      { j:'Ven', deb:0,    fin:0,     task:null,      pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:0,    fin:0,     task:null,     pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Anthony',totalSemaine:26.25, nom:'', role:'AM', contrat:35, pin:'1003',
    shifts:[
      { j:'Lun', deb:11,   fin:19.5,  task:'TDM',    pause_deb:14,    pause_fin:15    },
      { j:'Mar', deb:0,    fin:0,     task:null,     pause_deb:null,  pause_fin:null  },
      { j:'Mer', deb:7,    fin:14.75, task:'TDM',    pause_deb:12,    pause_fin:13    },
      { j:'Jeu', deb:8.75, fin:14.5,  task:'TDM',    pause_deb:null,  pause_fin:null  },
      { j:'Ven', deb:0,    fin:0,     task:null,      pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:8.75, fin:14,    task:'TDM',    pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Virginie',totalSemaine:35.00, nom:'', role:'EMP', contrat:35, pin:'1004',
    shifts:[
      { j:'Lun', deb:0,    fin:0,     task:null,      pause_deb:null,  pause_fin:null  },
      { j:'Mar', deb:13.75,fin:19.5,  task:'TDM',     pause_deb:null,  pause_fin:null  },
      { j:'Mer', deb:8.75, fin:19.5,  task:'Pole2',   pause_deb:13,    pause_fin:14    },
      { j:'Jeu', deb:13.75,fin:19.5,  task:'TDM',     pause_deb:null,  pause_fin:null  },
      { j:'Ven', deb:10,   fin:17.75, task:'Pole3',   pause_deb:13,   pause_fin:14    },
      { j:'Sam', deb:13.75,fin:19.5,  task:'Caisses', pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Yanis',  totalSemaine:40.00, nom:'', role:'EMP', contrat:35, pin:'1005',
    shifts:[
      { j:'Lun', deb:13.75,fin:19.5,  task:'Pole1',   pause_deb:null,  pause_fin:null  },
      { j:'Mar', deb:8.75, fin:14.5,  task:'Caisses', pause_deb:null,  pause_fin:null  },
      { j:'Mer', deb:13.75,fin:19.5,  task:'Pole1',   pause_deb:null,  pause_fin:null  },
      { j:'Jeu', deb:10,   fin:19.5,  task:'Pole1',   pause_deb:14,    pause_fin:15    },
      { j:'Ven', deb:9.75, fin:17.75, task:'Pole1',   pause_deb:14,   pause_fin:15    },
      { j:'Sam', deb:13.75,fin:19.5,  task:'Pole1',   pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Mylene', totalSemaine:27.50, nom:'', role:'EMP', contrat:35, pin:'1006',
    shifts:[
      { j:'Lun', deb:13.75,fin:19.5,  task:'Caisses', pause_deb:null,  pause_fin:null  },
      { j:'Mar', deb:0,    fin:0,     task:null,      pause_deb:null,  pause_fin:null  },
      { j:'Mer', deb:13.75,fin:19.5,  task:'Caisses', pause_deb:null,  pause_fin:null  },
      { j:'Jeu', deb:8.75, fin:14.5,  task:'Caisses', pause_deb:null,  pause_fin:null  },
      { j:'Ven', deb:13,   fin:17.75, task:'Caisses', pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:9.75, fin:14,    task:'Caisses', pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Zao',    totalSemaine:41.00, nom:'', role:'Contrat Pro', contrat:35, pin:'1007',
    shifts:[
      { j:'Lun', deb:13.75,fin:19.5,  task:'Caisses', pause_deb:null,  pause_fin:null  },
      { j:'Mar', deb:10.75,fin:19.5,  task:'Caisses', pause_deb:12.75, pause_fin:13.75 },
      { j:'Mer', deb:13.25,fin:19.5,  task:'TDM',     pause_deb:14,    pause_fin:15    },
      { j:'Jeu', deb:13.75,fin:19.5,  task:'Caisses', pause_deb:null,  pause_fin:null  },
      { j:'Ven', deb:9.75, fin:17.75, task:'Divers',  pause_deb:14,   pause_fin:15    },
      { j:'Sam', deb:10.5, fin:19.5,  task:'TDM',     pause_deb:12.75, pause_fin:13.75 },
    ],
  },
  {
    prenom:'Oceane', totalSemaine:0, nom:'', role:'Contrat Pro', contrat:35, pin:'1008',
    shifts:[
      { j:'Lun', deb:0, fin:0, task:null, pause_deb:null, pause_fin:null },
      { j:'Mar', deb:0, fin:0, task:null, pause_deb:null, pause_fin:null },
      { j:'Mer', deb:0, fin:0, task:null, pause_deb:null, pause_fin:null },
      { j:'Jeu', deb:0, fin:0, task:null, pause_deb:null, pause_fin:null },
      { j:'Ven', deb:0,    fin:0,     task:null,      pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:0, fin:0, task:null, pause_deb:null, pause_fin:null },
    ],
  },
  {
    prenom:'Antoine',totalSemaine:39.00, nom:'', role:'AEM', contrat:39, pin:'1009',
    shifts:[
      { j:'Lun', deb:10,   fin:17.25, task:'Divers',  pause_deb:14,    pause_fin:15    },
      { j:'Mar', deb:9,    fin:19,    task:'Divers',  pause_deb:14,    pause_fin:15    },
      { j:'Mer', deb:7,    fin:17.75, task:'Divers',  pause_deb:13,    pause_fin:14    },
      { j:'Jeu', deb:8.75, fin:18.75, task:'Divers',  pause_deb:13,    pause_fin:14    },
      { j:'Ven', deb:9,    fin:13,    task:'Divers',  pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:0,    fin:0,     task:null,      pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Mady',   totalSemaine:39.00, nom:'', role:'Expert métier', contrat:39, pin:'1010',
    shifts:[
      { j:'Lun', deb:10,   fin:17.25, task:'Divers',  pause_deb:14,    pause_fin:15    },
      { j:'Mar', deb:9,    fin:19,    task:'Divers',  pause_deb:14,    pause_fin:15    },
      { j:'Mer', deb:7,    fin:17.75, task:'Divers',  pause_deb:13,    pause_fin:14    },
      { j:'Jeu', deb:8.75, fin:18.75, task:'Divers',  pause_deb:13,    pause_fin:14    },
      { j:'Ven', deb:9,    fin:13,    task:'Divers',  pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:0,    fin:0,     task:null,      pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Willy',  totalSemaine:39.00, nom:'', role:'AEMI', contrat:39, pin:'1011',
    shifts:[
      { j:'Lun', deb:10,   fin:17.25, task:'Divers',  pause_deb:14,    pause_fin:15    },
      { j:'Mar', deb:9,    fin:19,    task:'Divers',  pause_deb:14,    pause_fin:15    },
      { j:'Mer', deb:7,    fin:17.75, task:'Divers',  pause_deb:13,    pause_fin:14    },
      { j:'Jeu', deb:8.75, fin:18.75, task:'Divers',  pause_deb:13,    pause_fin:14    },
      { j:'Ven', deb:9,    fin:13,    task:'Divers',  pause_deb:null, pause_fin:null  },
      { j:'Sam', deb:0,    fin:0,     task:null,      pause_deb:null,  pause_fin:null  },
    ],
  },
  {
    prenom:'Vanessa',totalSemaine:31.25, nom:'', role:'EMP', contrat:39, pin:'1012',
    shifts:[
      { j:'Lun', deb:8.75, fin:14.5,  task:'Pole2',   pause_deb:null,  pause_fin:null  },
      { j:'Mar', deb:13.75,fin:19.5,  task:'Pole2',   pause_deb:null,  pause_fin:null  },
      { j:'Mer', deb:0,    fin:0,     task:null,      pause_deb:null,  pause_fin:null  },
      { j:'Jeu', deb:13.75,fin:19.5,  task:'Pole2',   pause_deb:null,  pause_fin:null  },
      { j:'Ven', deb:9.75, fin:17.75, task:'Pole2',   pause_deb:14,   pause_fin:15    },
      { j:'Sam', deb:13.75,fin:19.5,  task:'Pole2',   pause_deb:null,  pause_fin:null  },
    ],
  },
];

// ——— Helpers ——————————————————————————————
function totalHeures(staff) {
  // Utilise le total officiel du planning Excel si disponible
  if (staff.totalSemaine !== null && staff.totalSemaine !== undefined) {
    return staff.totalSemaine;
  }
  return staff.shifts.reduce((sum, s) => {
    if (!s.deb) return sum;
    const brut = s.fin - s.deb;
    const pause = (s.pause_deb && s.pause_fin) ? (s.pause_fin - s.pause_deb) : 0;
    return sum + (brut - pause);
  }, 0);
}
function initiales(p) {
  return (p.prenom[0] + (p.nom ? p.nom[0] || '' : '')).toUpperCase();
}
function roleColor(role) {
  return (ROLES[role] || {}).color || '#888';
}
// Convertit décimal → "8h45"
function fmtH(v) {
  if (!v && v !== 0) return '';
  const h = Math.floor(v);
  const m = Math.round((v - h) * 60);
  return m > 0 ? `${h}h${String(m).padStart(2,'0')}` : `${h}h00`;
}
