// =============================================
//  NOZ P854 — Données planning
//  Semaine 19 — 4 au 10 mai 2026
//  Mis à jour depuis PLANNING_MAGASIN_Vierge__4_.xlsx
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

const STAFF = [
  {
    prenom:'Abdel', nom:'', role:'Gérant', contrat:39, pin:'1001',
    shifts:[
      { j:'Lun', deb:9,  fin:14, task:'Pole1'  },
      { j:'Mar', deb:9,  fin:14, task:'Pole1'  },
      { j:'Mer', deb:7,  fin:14, task:'Pole1'  },
      { j:'Jeu', deb:0,  fin:0,  task:null     },
      { j:'Ven', deb:7,  fin:14, task:'Pole1'  },
      { j:'Sam', deb:0,  fin:0,  task:null     },
    ],
  },
  {
    prenom:'Yohan', nom:'', role:'AEM', contrat:35, pin:'1002',
    shifts:[
      { j:'Lun', deb:10, fin:20, task:'Divers' },
      { j:'Mar', deb:9,  fin:14, task:'Divers' },
      { j:'Mer', deb:7,  fin:15, task:'Divers' },
      { j:'Jeu', deb:9,  fin:20, task:'Divers' },
      { j:'Ven', deb:0,  fin:0,  task:null     },
      { j:'Sam', deb:0,  fin:0,  task:null     },
    ],
  },
  {
    prenom:'Anthony', nom:'', role:'AM', contrat:35, pin:'1003',
    shifts:[
      { j:'Lun', deb:11, fin:20, task:'TDM'    },
      { j:'Mar', deb:0,  fin:0,  task:null     },
      { j:'Mer', deb:7,  fin:15, task:'TDM'    },
      { j:'Jeu', deb:9,  fin:14, task:'TDM'    },
      { j:'Ven', deb:0,  fin:0,  task:null     },
      { j:'Sam', deb:9,  fin:14, task:'TDM'    },
    ],
  },
  {
    prenom:'Virginie', nom:'', role:'EMP', contrat:35, pin:'1004',
    shifts:[
      { j:'Lun', deb:0,  fin:0,  task:null     },
      { j:'Mar', deb:14, fin:20, task:'TDM'    },
      { j:'Mer', deb:9,  fin:20, task:'Pole2'  },
      { j:'Jeu', deb:14, fin:20, task:'TDM'    },
      { j:'Ven', deb:10, fin:18, task:'Pole3'  },
      { j:'Sam', deb:14, fin:20, task:'Caisses'},
    ],
  },
  {
    prenom:'Yanis', nom:'', role:'EMP', contrat:35, pin:'1005',
    shifts:[
      { j:'Lun', deb:14, fin:20, task:'Pole1'  },
      { j:'Mar', deb:9,  fin:14, task:'Caisses'},
      { j:'Mer', deb:14, fin:20, task:'Pole1'  },
      { j:'Jeu', deb:10, fin:20, task:'Pole1'  },
      { j:'Ven', deb:10, fin:18, task:'Pole1'  },
      { j:'Sam', deb:14, fin:20, task:'Pole1'  },
    ],
  },
  {
    prenom:'Mylene', nom:'', role:'EMP', contrat:35, pin:'1006',
    shifts:[
      { j:'Lun', deb:14, fin:20, task:'Caisses'},
      { j:'Mar', deb:0,  fin:0,  task:null     },
      { j:'Mer', deb:14, fin:20, task:'Caisses'},
      { j:'Jeu', deb:9,  fin:14, task:'Caisses'},
      { j:'Ven', deb:13, fin:18, task:'Caisses'},
      { j:'Sam', deb:10, fin:14, task:'Caisses'},
    ],
  },
  {
    prenom:'Zao', nom:'', role:'Contrat Pro', contrat:35, pin:'1007',
    shifts:[
      { j:'Lun', deb:14, fin:20, task:'Caisses'},
      { j:'Mar', deb:11, fin:20, task:'Caisses'},
      { j:'Mer', deb:13, fin:20, task:'TDM'    },
      { j:'Jeu', deb:14, fin:20, task:'Caisses'},
      { j:'Ven', deb:10, fin:18, task:'Divers' },
      { j:'Sam', deb:10, fin:20, task:'TDM'    },
    ],
  },
  {
    prenom:'Oceane', nom:'', role:'Contrat Pro', contrat:35, pin:'1008',
    shifts:[
      { j:'Lun', deb:0, fin:0, task:null },
      { j:'Mar', deb:0, fin:0, task:null },
      { j:'Mer', deb:0, fin:0, task:null },
      { j:'Jeu', deb:0, fin:0, task:null },
      { j:'Ven', deb:0, fin:0, task:null },
      { j:'Sam', deb:0, fin:0, task:null },
    ],
  },
  {
    prenom:'Antoine', nom:'', role:'AEM', contrat:39, pin:'1009',
    shifts:[
      { j:'Lun', deb:10, fin:17, task:'Divers' },
      { j:'Mar', deb:9,  fin:19, task:'Divers' },
      { j:'Mer', deb:7,  fin:18, task:'Divers' },
      { j:'Jeu', deb:9,  fin:17, task:'Divers' },
      { j:'Ven', deb:7,  fin:14, task:'Divers' },
      { j:'Sam', deb:0,  fin:0,  task:null     },
    ],
  },
  {
    prenom:'Mady', nom:'', role:'Expert métier', contrat:39, pin:'1010',
    shifts:[
      { j:'Lun', deb:10, fin:17, task:'Divers' },
      { j:'Mar', deb:9,  fin:19, task:'Divers' },
      { j:'Mer', deb:7,  fin:18, task:'Divers' },
      { j:'Jeu', deb:9,  fin:17, task:'Divers' },
      { j:'Ven', deb:7,  fin:14, task:'Divers' },
      { j:'Sam', deb:0,  fin:0,  task:null     },
    ],
  },
  {
    prenom:'Willy', nom:'', role:'AEMI', contrat:39, pin:'1011',
    shifts:[
      { j:'Lun', deb:10, fin:17, task:'Divers' },
      { j:'Mar', deb:9,  fin:19, task:'Divers' },
      { j:'Mer', deb:7,  fin:18, task:'Divers' },
      { j:'Jeu', deb:9,  fin:17, task:'Divers' },
      { j:'Ven', deb:7,  fin:14, task:'Divers' },
      { j:'Sam', deb:0,  fin:0,  task:null     },
    ],
  },
  {
    prenom:'Vanessa', nom:'', role:'EMP', contrat:39, pin:'1012',
    shifts:[
      { j:'Lun', deb:9,  fin:14, task:'Pole2'  },
      { j:'Mar', deb:14, fin:20, task:'Pole2'  },
      { j:'Mer', deb:0,  fin:0,  task:null     },
      { j:'Jeu', deb:14, fin:20, task:'Pole2'  },
      { j:'Ven', deb:10, fin:18, task:'Pole2'  },
      { j:'Sam', deb:14, fin:20, task:'Pole2'  },
    ],
  },
];

// ——— Helpers ——————————————————————————————
function totalHeures(staff) {
  return staff.shifts.reduce((sum, s) => sum + (s.deb ? s.fin - s.deb : 0), 0);
}
function initiales(p) {
  return (p.prenom[0] + (p.nom ? p.nom[0] || '' : '')).toUpperCase();
}
function roleColor(role) {
  return (ROLES[role] || {}).color || '#888';
}
