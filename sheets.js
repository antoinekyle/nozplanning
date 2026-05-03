// =============================================
//  NOZ P854 — Google Sheets Sync
//  sheets.js — lecture automatique du planning Excel
// =============================================

// URL de la S19 (par défaut si rien n'est enregistré)
const SHEET_CSV_URL_DEFAULT = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ5h-6talvesE97xlHfwsPeEcsC7HMB-SaY8ub5sMQTa64K1DqH9tBqX1MCIC3oHqpCdqT2wadPJHmt/pub?output=csv';

const SHEET_URL_KEY    = 'noz_sheet_csv_url';   // URL courante (compatibilité)
const WEEKS_KEY        = 'noz_weeks';            // { "19": url, "20": url, … }
const ACTIVE_WEEK_KEY  = 'noz_active_week';      // semaine actuellement affichée

// ——— GESTION MULTI-SEMAINES ——————————————————

function getAllWeeks() {
  try { return JSON.parse(localStorage.getItem(WEEKS_KEY) || '{}'); }
  catch { return {}; }
}

// Sauvegarde une semaine avec ses métadonnées { url, debut, fin }
function saveWeekURL(num, url, debut, fin) {
  const weeks = getAllWeeks();
  weeks[String(num)] = { url, debut: debut || '', fin: fin || '' };
  localStorage.setItem(WEEKS_KEY, JSON.stringify(weeks));
  localStorage.setItem(SHEET_URL_KEY, url);
  if (typeof _fbAvailable !== 'undefined' && _fbAvailable && typeof fbSet === 'function') {
    fbSet(`config/weeks/${num}`, { url, debut: debut || '', fin: fin || '' });
    fbSet('config/sheet_url', url);
  }
}

// Retourne le numéro de la semaine active selon la date d'aujourd'hui
function detectCurrentWeek() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const weeks = getAllWeeks();
  // Cherche la semaine dont la plage contient aujourd'hui
  for (const [num, data] of Object.entries(weeks)) {
    const entry = typeof data === 'string' ? { url: data } : data;
    if (!entry.debut || !entry.fin) continue;
    const debut = new Date(entry.debut + 'T00:00:00');
    const fin   = new Date(entry.fin   + 'T23:59:59');
    if (today >= debut && today <= fin) return num;
  }
  // Sinon prend la semaine la plus récente non archivée
  const upcoming = Object.entries(weeks)
    .filter(([, data]) => {
      const entry = typeof data === 'string' ? {} : data;
      if (!entry.fin) return true;
      return new Date(entry.fin + 'T23:59:59') >= today;
    })
    .sort(([a], [b]) => Number(a) - Number(b));
  return upcoming[0]?.[0] || null;
}

function getActiveWeekNum() {
  return localStorage.getItem(ACTIVE_WEEK_KEY) || null;
}

function setActiveWeekNum(num) {
  localStorage.setItem(ACTIVE_WEEK_KEY, String(num));
}

function getSheetURL() {
  const weeks  = getAllWeeks();
  const active = getActiveWeekNum();

  // Chercher d'abord la semaine active
  if (active && weeks[active]) {
    const entry = weeks[active];
    const url = typeof entry === 'string' ? entry : entry.url;
    if (url) return url;
  }

  // Semaine active invalide ou absente → prendre la semaine la plus récente disponible
  const nums = Object.keys(weeks).sort((a, b) => Number(a) - Number(b));
  for (let i = nums.length - 1; i >= 0; i--) {
    const entry = weeks[nums[i]];
    const url = typeof entry === 'string' ? entry : (entry && entry.url);
    if (url) {
      // Mettre à jour la semaine active pour éviter ce problème au prochain chargement
      setActiveWeekNum(nums[i]);
      return url;
    }
  }

  // Dernier recours : URL enregistrée manuellement ou valeur par défaut
  return localStorage.getItem(SHEET_URL_KEY) || SHEET_CSV_URL_DEFAULT;
}

// Compatibilité avec l'ancien système (1 seule URL)
function saveSheetURL(url) {
  localStorage.setItem(SHEET_URL_KEY, url);
  if (typeof _fbAvailable !== 'undefined' && _fbAvailable && typeof fbSet === 'function') {
    fbSet('config/sheet_url', url);
  }
}

async function loadSheetURLFromFirebase() {
  if (typeof _fbAvailable !== 'undefined' && _fbAvailable && typeof fbGet === 'function') {
    // Charger toutes les semaines
    const weeks = await fbGet('config/weeks');
    if (weeks && typeof weeks === 'object') {
      const local = getAllWeeks();
      Object.assign(local, weeks);
      localStorage.setItem(WEEKS_KEY, JSON.stringify(local));
    }
    // Charger l'URL courante (compatibilité)
    const url = await fbGet('config/sheet_url');
    if (url && typeof url === 'string') {
      localStorage.setItem(SHEET_URL_KEY, url);
    }
  }
}

// ——— MAPPING CODES TÂCHES ————————————————————
const TASK_CODE_MAP = {
  '1': 'Pole1',
  '2': 'TDM',
  '3': 'Pole3',
  '4': 'Ecole',
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
function parseHeureSheet(str) {
  if (!str || typeof str !== 'string') return 0;
  str = str.trim().replace(',', '.');
  if (!str || str === '0' || str === '-' || str === 'R') return 0;
  const hMatch = str.match(/^(\d{1,2})[hH](\d{0,2})$/);
  if (hMatch) return parseInt(hMatch[1]) + (parseInt(hMatch[2] || '0') / 60);
  const cMatch = str.match(/^(\d{1,2}):(\d{2})$/);
  if (cMatch) return parseInt(cMatch[1]) + parseInt(cMatch[2]) / 60;
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

// ——— CALCUL LABELS JOURS ——————————————————————
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
    console.info('[NOZ Sheets] Pas d\'URL — données data.js utilisées.');
    return false;
  }

  try {
    const res = await fetch(SHEET_CSV_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();
    const lines = text.split('\n').map(l => parseCSVLine(l));

    // ——— 1. Infos semaine ———————————————————
    for (const cols of lines) {
      if (cols[0] === 'S :' && /^\d+$/.test((cols[1] || '').trim())) {
        const num   = parseInt(cols[1]);
        const debut = datefrToISO(cols[2]);
        const fin   = datefrToISO(cols[4]);
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

        // Enregistrer automatiquement cette semaine avec ses dates
        saveWeekURL(num, SHEET_CSV_URL, debut, fin);
        setActiveWeekNum(num);
        break;
      }
    }

    // ——— 2. Blocs journaliers ——————————————
    const JOUR_NOMS = { 'LUNDI':0,'MARDI':1,'MERCREDI':2,'JEUDI':3,'VENDREDI':4,'SAMEDI':5,'DIMANCHE':6 };
    const JOURS_KEYS = ['Lun','Mar','Mer','Jeu','Ven','Sam'];

    const blocks = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i][0] !== 'S :') continue;
      for (let k = 5; k < Math.min(lines[i].length, 12); k++) {
        const v = (lines[i][k] || '').trim().toUpperCase();
        if (v in JOUR_NOMS) { blocks.push({ jourIdx: JOUR_NOMS[v], startLine: i }); break; }
      }
    }
    if (blocks.length === 0) return false;

    // ——— 3. Employés (depuis premier bloc) ——
    const HEADER_WORDS = new Set(['Prénom','Prenom','Fonction','Poste','Nom','Role']);
    const employeeOrder = [];
    const nextBlockStart = blocks[1] ? blocks[1].startLine : lines.length;
    for (let i = blocks[0].startLine + 1; i < nextBlockStart; i++) {
      const cols = lines[i];
      const name = (cols[5] || '').trim();
      if (name && /^[A-ZÀ-Ü][a-zà-ü]+$/.test(name) && !HEADER_WORDS.has(name)) {
        const contratRaw  = parseFloat((cols[1] || '').replace(',', '.'));
        const totalRaw    = parseFloat((cols[3] || '').replace(',', '.'));
        employeeOrder.push({
          prenom:  name,
          role:    (cols[0] || '').trim(),
          contrat: isNaN(contratRaw) ? 0 : contratRaw,
          totalSemaine: isNaN(totalRaw) || totalRaw === 0 ? null : totalRaw,
        });
      }
    }
    if (employeeOrder.length === 0) return false;

    // ——— 4. Shifts ——————————————————————————
    const shiftsMap = {};
    for (const emp of employeeOrder) shiftsMap[emp.prenom] = {};

    for (let b = 0; b < blocks.length; b++) {
      const { jourIdx, startLine } = blocks[b];
      if (jourIdx >= 6) continue;
      const endLine = blocks[b+1] ? blocks[b+1].startLine : lines.length;
      for (let i = startLine + 1; i < endLine; i++) {
        const cols = lines[i];
        const name = (cols[5] || '').trim();
        if (!shiftsMap[name]) continue;
        const deb      = parseHeureSheet(cols[263] || '');
        let   fin      = parseHeureSheet(cols[264] || '');
        // Correction arrondi : 12.75 → 13 (1/4h de différence visuelle)
        if (fin === 12.75) fin = 13;
        const pauseDeb = parseHeureSheet(cols[265] || '');
        const pauseFin = parseHeureSheet(cols[266] || '');
        const visCodes = [];
        for (let c = 8; c < Math.min(cols.length, 263); c++) {
          const v = (cols[c] || '').trim();
          if (/^\d+$/.test(v) && v !== '0') visCodes.push(v);
        }
        const taskCode = modeValue(visCodes) || '0';
        shiftsMap[name][jourIdx] = {
          j: JOURS_KEYS[jourIdx], deb, fin,
          task: deb > 0 ? (TASK_CODE_MAP[taskCode] || null) : null,
          pause_deb: pauseDeb || null,
          pause_fin: pauseFin || null,
        };
      }
    }

    // ——— 5. Construire STAFF ————————————————
    const newStaff = employeeOrder.map(emp => {
      const existing = STAFF.find(s => s.prenom === emp.prenom);
      const pin = existing ? existing.pin : String(1000 + employeeOrder.indexOf(emp) + 1);
      const shifts = JOURS_KEYS.map((j, idx) =>
        shiftsMap[emp.prenom][idx] || { j, deb: 0, fin: 0, task: null, pause_deb: null, pause_fin: null }
      );
      return {
        prenom: emp.prenom,
        nom: existing ? existing.nom : '',
        role: emp.role || (existing ? existing.role : 'EMP'),
        contrat: emp.contrat > 0 ? emp.contrat : (existing ? existing.contrat : 35),
        pin, totalSemaine: emp.totalSemaine !== undefined ? emp.totalSemaine : null, shifts,
      };
    });

    STAFF.length = 0;
    STAFF.push(...newStaff);
    console.log(`[NOZ Sheets] ✅ S${SEMAINE.numero} — ${newStaff.length} employés`);
    return true;

  } catch (e) {
    console.warn('[NOZ Sheets] Erreur :', e.message);
    return false;
  }
}
