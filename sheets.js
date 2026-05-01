// =============================================
//  NOZ P854 — Google Sheets Sync
//  sheets.js — lecture automatique du planning Excel
// =============================================
//
//  Pour connecter ton Google Sheet :
//  1. Ouvre le sheet → Fichier → Partager → Publier sur le web
//  2. Choisir "Feuille 1" + "Valeurs séparées par virgules (.csv)"
//  3. Clique "Publier" et colle l'URL ici :
// =============================================

// URL par défaut (peut être écrasée depuis l'admin via localStorage)
const SHEET_CSV_URL_DEFAULT = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5h-6talvesE97xlHfwsPeEcsC7HMB-SaY8ub5sMQTa64K1DqH9tBqX1MCIC3oHqpCdqT2wadPJHmt/pub?output=csv';
const SHEET_URL_KEY = 'noz_sheet_csv_url';

function getSheetURL() {
  return localStorage.getItem(SHEET_URL_KEY) || SHEET_CSV_URL_DEFAULT;
}
function saveSheetURL(url) {
  localStorage.setItem(SHEET_URL_KEY, url);
  // Sync Firebase si dispo
  if (typeof _fbAvailable !== 'undefined' && _fbAvailable && typeof fbSet === 'function') {
    fbSet('config/sheet_url', url);
  }
}
async function loadSheetURLFromFirebase() {
  if (typeof _fbAvailable !== 'undefined' && _fbAvailable && typeof fbGet === 'function') {
    const url = await fbGet('config/sheet_url');
    if (url && typeof url === 'string') {
      localStorage.setItem(SHEET_URL_KEY, url);
    }
  }
}

// ——— MAPPING CODES TÂCHES ————————————————————
// Codes trouvés dans le planning Excel → clés TASKS de l'appli
const TASK_CODE_MAP = {
  '1': 'Pole1',
  '2': 'TDM',
  '3': 'Pole3',
  '6': 'Divers',
  '7': 'Pole2',
  '8': 'Caisses',
};

// ——— PARSE CSV ————————————————————————————————
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

// ——— CONVERSION HEURES ————————————————————————
// Accepte : 8.75, "8,75", "14h", "14h30"
function parseHeureSheet(str) {
  if (!str || typeof str !== 'string') return 0;
  str = str.trim().replace(',', '.');
  if (!str || str === '0' || str === '-' || str === 'R') return 0;
  // "14h30" ou "14h"
  const hMatch = str.match(/^(\d{1,2})[hH](\d{0,2})$/);
  if (hMatch) return parseInt(hMatch[1]) + (parseInt(hMatch[2] || '0') / 60);
  // "14:30"
  const cMatch = str.match(/^(\d{1,2}):(\d{2})$/);
  if (cMatch) return parseInt(cMatch[1]) + parseInt(cMatch[2]) / 60;
  // décimal "8.75"
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// ——— DATE fr "4/5/2026" → ISO "2026-05-04" ————
function datefrToISO(str) {
  if (!str) return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

// ——— CALCUL LABELS JOURS DATES ————————————————
function calcJoursDates(debutISO) {
  const d = new Date(debutISO + 'T00:00:00');
  const jours = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  const moisFr = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
  const result = {};
  jours.forEach((j, i) => {
    const day = new Date(d);
    day.setDate(d.getDate() + i);
    result[j] = `${day.getDate()} ${moisFr[day.getMonth()]}`;
  });
  return result;
}

// ——— MODE (valeur la plus fréquente) ——————————
function modeValue(arr) {
  const count = {};
  let max = 0, best = null;
  for (const v of arr) {
    count[v] = (count[v] || 0) + 1;
    if (count[v] > max) { max = count[v]; best = v; }
  }
  return best;
}

// =============================================
//  PARSER PRINCIPAL
// =============================================
async function fetchAndApplySheet() {
  const SHEET_CSV_URL = getSheetURL();
  if (!SHEET_CSV_URL) {
    console.info('[NOZ Sheets] Pas d\'URL configurée — données data.js utilisées.');
    return false;
  }

  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const rawLines = text.split('\n');

    // Parse toutes les lignes en tableaux
    const lines = rawLines.map(l => parseCSVLine(l));

    // ——— 1. Infos semaine ———————————————————
    // Cherche la ligne "S :" avec numéro de semaine (col1 numérique) et dates (col2 "d/m/yyyy")
    for (const cols of lines) {
      if (cols[0] === 'S :' && /^\d+$/.test((cols[1] || '').trim())) {
        const num   = parseInt(cols[1]);
        const debut = datefrToISO(cols[2]);
        const fin   = datefrToISO(cols[4]);
        // Magasin : chercher après "Magasin de :"
        let mag = SEMAINE.magasin;
        for (let k = 8; k < Math.min(cols.length, 30); k++) {
          if (cols[k] && cols[k].trim() && !cols[k].includes(':') && cols[k].trim().length > 3) {
            mag = cols[k].trim();
            break;
          }
        }
        if (num)   SEMAINE.numero  = num;
        if (debut) SEMAINE.debut   = debut;
        if (fin)   SEMAINE.fin     = fin;
        if (mag)   SEMAINE.magasin = mag;
        if (debut) Object.assign(JOURS_DATES, calcJoursDates(debut));
        break;
      }
    }

    // ——— 2. Identifier les blocs journaliers ——
    // Chaque bloc commence par une ligne "S :" qui contient un nom de jour
    const JOUR_NOMS = { 'LUNDI':0,'MARDI':1,'MERCREDI':2,'JEUDI':3,'VENDREDI':4,'SAMEDI':5,'DIMANCHE':6 };
    const JOURS_KEYS = ['Lun','Mar','Mer','Jeu','Ven','Sam'];

    const blocks = []; // { jourIdx, startLine }
    for (let i = 0; i < lines.length; i++) {
      if (lines[i][0] !== 'S :') continue;
      for (let k = 5; k < Math.min(lines[i].length, 12); k++) {
        const v = (lines[i][k] || '').trim().toUpperCase();
        if (v in JOUR_NOMS) {
          blocks.push({ jourIdx: JOUR_NOMS[v], startLine: i });
          break;
        }
      }
    }

    if (blocks.length === 0) {
      console.warn('[NOZ Sheets] Aucun bloc journalier trouvé.');
      return false;
    }

    // ——— 3. Récupérer les employés depuis le premier bloc ———
    // Le nom est en col 5, rôle en col 0, contrat en col 1
    // Mots-clés à exclure (en-têtes du sheet)
    const HEADER_WORDS = new Set(['Prénom','Prenom','Fonction','Poste','Nom','Role']);
    const employeeOrder = []; // liste ordonnée des prénoms

    const firstBlock = blocks[0];
    const nextBlockStart = blocks[1] ? blocks[1].startLine : lines.length;
    for (let i = firstBlock.startLine + 1; i < nextBlockStart; i++) {
      const cols = lines[i];
      const name = (cols[5] || '').trim();
      if (name && /^[A-ZÀ-Ü][a-zà-ü]+$/.test(name) && !HEADER_WORDS.has(name)) {
        const contratRaw = parseFloat((cols[1] || '').replace(',', '.'));
        employeeOrder.push({ prenom: name, role: (cols[0] || '').trim(), contrat: isNaN(contratRaw) ? 0 : contratRaw });
      }
    }

    if (employeeOrder.length === 0) {
      console.warn('[NOZ Sheets] Aucun employé trouvé.');
      return false;
    }

    // ——— 4. Construire les shifts ————————————
    // Structure : shifts[prénom][jourIdx] = { deb, fin, task, pause_deb, pause_fin }
    const shiftsMap = {};
    for (const emp of employeeOrder) {
      shiftsMap[emp.prenom] = {};
    }

    for (let b = 0; b < blocks.length; b++) {
      const { jourIdx, startLine } = blocks[b];
      if (jourIdx >= 6) continue; // ignorer Dimanche
      const endLine = blocks[b+1] ? blocks[b+1].startLine : lines.length;

      for (let i = startLine + 1; i < endLine; i++) {
        const cols = lines[i];
        const name = (cols[5] || '').trim();
        if (!shiftsMap[name]) continue;

        // Colonnes données : 263=deb, 264=fin, 265=pause_deb, 266=pause_fin
        const deb      = parseHeureSheet(cols[263] || '');
        const fin      = parseHeureSheet(cols[264] || '');
        const pauseDeb = parseHeureSheet(cols[265] || '');
        const pauseFin = parseHeureSheet(cols[266] || '');

        // Tâche : mode des codes numériques dans les cellules visuelles (cols 8-262)
        const visCodes = [];
        for (let c = 8; c < Math.min(cols.length, 263); c++) {
          const v = (cols[c] || '').trim();
          if (/^\d+$/.test(v) && v !== '0') visCodes.push(v);
        }
        const taskCode = modeValue(visCodes) || '0';
        const task = deb > 0 ? (TASK_CODE_MAP[taskCode] || null) : null;

        shiftsMap[name][jourIdx] = {
          j:         JOURS_KEYS[jourIdx],
          deb:       deb,
          fin:       fin,
          task:      task,
          pause_deb: pauseDeb || null,
          pause_fin: pauseFin || null,
        };
      }
    }

    // ——— 5. Construire STAFF ————————————————
    const newStaff = employeeOrder.map(emp => {
      // Récupérer le PIN depuis les données actuelles (par nom)
      const existing = STAFF.find(s => s.prenom === emp.prenom);
      const pin = existing ? existing.pin : String(1000 + employeeOrder.indexOf(emp) + 1);

      const shifts = JOURS_KEYS.map((j, idx) => {
        return shiftsMap[emp.prenom][idx] || { j, deb: 0, fin: 0, task: null, pause_deb: null, pause_fin: null };
      });

      return {
        prenom:       emp.prenom,
        nom:          existing ? existing.nom : '',
        role:         emp.role || (existing ? existing.role : 'EMP'),
        // Priorité : sheet si valide, sinon garder le contrat de data.js
        contrat:      emp.contrat > 0 ? emp.contrat : (existing ? existing.contrat : 35),
        pin,
        totalSemaine: null,
        shifts,
      };
    });

    // ——— 6. Appliquer ———————————————————————
    STAFF.length = 0;
    STAFF.push(...newStaff);
    console.log(`[NOZ Sheets] ✅ ${newStaff.length} employés chargés — Semaine ${SEMAINE.numero} (${SEMAINE.debut} → ${SEMAINE.fin})`);
    return true;

  } catch (e) {
    console.warn('[NOZ Sheets] Erreur :', e.message, '— données data.js utilisées en fallback.');
    return false;
  }
}
