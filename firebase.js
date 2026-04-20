// =============================================
//  NOZ P854 — Firebase Sync
//  Synchronisation temps réel multi-appareils
//
//  CONFIGURATION :
//  1. Va sur https://console.firebase.google.com
//  2. Crée un projet "noz-planning"
//  3. Realtime Database → Créer une base
//  4. Règles → mets en mode test (30 jours)
//  5. Copie l'URL de ta base et colle-la dans
//     FIREBASE_URL ci-dessous
// =============================================

const FIREBASE_URL = 'https://noz-planning-default-rtdb.europe-west1.firebasedatabase.app';
// Exemple : 'https://noz-planning-xxxxx-default-rtdb.europe-west1.firebasedatabase.app'

// ——— ÉTAT LOCAL (fallback si Firebase indispo) ———
let _localOverrides = [];
let _localHistory   = [];
let _localConsignes = [];
let _fbAvailable    = false;
let _listeners      = {};

// ——— VÉRIFICATION FIREBASE —————————————————————
async function checkFirebase() {
  if (!FIREBASE_URL || FIREBASE_URL.includes('REMPLACE')) {
    console.warn('[NOZ] Firebase non configuré — mode local uniquement');
    _fbAvailable = false;
    return false;
  }
  try {
    const r = await fetch(`${FIREBASE_URL}/.json`, { method: 'GET' });
    _fbAvailable = r.ok;
    if (_fbAvailable) console.log('[NOZ] Firebase connecté ✅');
    else console.warn('[NOZ] Firebase inaccessible — mode local');
    return _fbAvailable;
  } catch {
    _fbAvailable = false;
    console.warn('[NOZ] Firebase inaccessible — mode local');
    return false;
  }
}

// ——— LECTURE ———————————————————————————————————
async function fbGet(path) {
  if (!_fbAvailable) return null;
  try {
    const r = await fetch(`${FIREBASE_URL}/${path}.json`);
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

// ——— ÉCRITURE ——————————————————————————————————
async function fbSet(path, data) {
  if (!_fbAvailable) return false;
  try {
    const r = await fetch(`${FIREBASE_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return r.ok;
  } catch { return false; }
}

// ——— ÉCOUTE TEMPS RÉEL (Server-Sent Events) ———
function fbListen(path, callback) {
  if (!_fbAvailable) return;
  // Fermer l'ancien listener si existe
  if (_listeners[path]) _listeners[path].close();

  const es = new EventSource(`${FIREBASE_URL}/${path}.json`);
  es.addEventListener('put', e => {
    try {
      const data = JSON.parse(e.data);
      if (data && data.data !== undefined) callback(data.data);
    } catch {}
  });
  es.onerror = () => { es.close(); delete _listeners[path]; };
  _listeners[path] = es;
}

// =============================================
//  API PUBLIQUE — OVERRIDES (modifications planning)
// =============================================

async function syncGetOverrides() {
  if (_fbAvailable) {
    const data = await fbGet('overrides');
    const list = data ? Object.values(data) : [];
    _localOverrides = list;
    localStorage.setItem('noz_planning_overrides', JSON.stringify(list));
    return list;
  }
  try { return JSON.parse(localStorage.getItem('noz_planning_overrides') || '[]'); }
  catch { return []; }
}

async function syncSaveOverride(ov) {
  // Clé unique : prenom_jourIdx
  const key = `${ov.prenom}_${ov.jourIdx}`;
  if (_fbAvailable) {
    await fbSet(`overrides/${key}`, ov);
  }
  // Toujours sauvegarder en local aussi
  const local = JSON.parse(localStorage.getItem('noz_planning_overrides') || '[]');
  const updated = local.filter(o => !(o.prenom === ov.prenom && o.jourIdx === ov.jourIdx));
  updated.push(ov);
  localStorage.setItem('noz_planning_overrides', JSON.stringify(updated));
}

async function syncDeleteOverride(prenom, jourIdx) {
  const key = `${prenom}_${jourIdx}`;
  if (_fbAvailable) {
    await fetch(`${FIREBASE_URL}/overrides/${key}.json`, { method: 'DELETE' });
  }
  const local = JSON.parse(localStorage.getItem('noz_planning_overrides') || '[]');
  const updated = local.filter(o => !(o.prenom === prenom && o.jourIdx === jourIdx));
  localStorage.setItem('noz_planning_overrides', JSON.stringify(updated));
}

async function syncClearOverrides() {
  if (_fbAvailable) {
    await fetch(`${FIREBASE_URL}/overrides.json`, { method: 'DELETE' });
  }
  localStorage.removeItem('noz_planning_overrides');
}

// =============================================
//  API PUBLIQUE — HISTORIQUE MESSAGES
// =============================================

async function syncGetHistory() {
  if (_fbAvailable) {
    const data = await fbGet('history');
    const list = data ? Object.values(data).sort((a, b) => b.ts - a.ts) : [];
    _localHistory = list;
    localStorage.setItem('noz_history', JSON.stringify(list));
    return list;
  }
  try { return JSON.parse(localStorage.getItem('noz_history') || '[]'); }
  catch { return []; }
}

async function syncSaveHistory(msg) {
  const entry = {
    id:   Date.now(),
    ts:   Date.now(),
    msg,
    time: new Date().toLocaleString('fr-FR'),
  };
  if (_fbAvailable) {
    await fbSet(`history/${entry.id}`, entry);
  }
  // Local
  const local = JSON.parse(localStorage.getItem('noz_history') || '[]');
  local.unshift(entry);
  if (local.length > 30) local.pop();
  localStorage.setItem('noz_history', JSON.stringify(local));
  return entry;
}

async function syncClearHistory() {
  if (_fbAvailable) {
    await fetch(`${FIREBASE_URL}/history.json`, { method: 'DELETE' });
  }
  localStorage.removeItem('noz_history');
}

// =============================================
//  API PUBLIQUE — CONSIGNES
// =============================================

async function syncGetConsignes() {
  if (_fbAvailable) {
    const data = await fbGet('consignes');
    const list = data ? Object.values(data).sort((a, b) => b.id - a.id) : [];
    _localConsignes = list;
    localStorage.setItem('noz_consignes', JSON.stringify(list));
    return list;
  }
  try { return JSON.parse(localStorage.getItem('noz_consignes') || '[]'); }
  catch { return []; }
}

async function syncSaveConsigne(c) {
  if (_fbAvailable) {
    await fbSet(`consignes/${c.id}`, c);
  }
  const local = JSON.parse(localStorage.getItem('noz_consignes') || '[]');
  local.unshift(c);
  localStorage.setItem('noz_consignes', JSON.stringify(local));
}

async function syncDeleteConsigne(id) {
  if (_fbAvailable) {
    await fetch(`${FIREBASE_URL}/consignes/${id}.json`, { method: 'DELETE' });
  }
  const local = JSON.parse(localStorage.getItem('noz_consignes') || '[]');
  localStorage.setItem('noz_consignes', JSON.stringify(local.filter(c => c.id !== id)));
}

async function syncClearConsignes() {
  if (_fbAvailable) {
    await fetch(`${FIREBASE_URL}/consignes.json`, { method: 'DELETE' });
  }
  localStorage.removeItem('noz_consignes');
}

// =============================================
//  ÉCOUTE TEMPS RÉEL (pour app.js)
//  Recharge automatiquement quand l'admin modifie
// =============================================

function startRealTimeSync(onOverridesChange, onConsignesChange) {
  if (!_fbAvailable) return;

  fbListen('overrides', data => {
    const list = data ? Object.values(data) : [];
    localStorage.setItem('noz_planning_overrides', JSON.stringify(list));
    if (onOverridesChange) onOverridesChange(list);
  });

  fbListen('consignes', data => {
    const list = data ? Object.values(data).sort((a, b) => b.id - a.id) : [];
    localStorage.setItem('noz_consignes', JSON.stringify(list));
    if (onConsignesChange) onConsignesChange(list);
  });
}

// =============================================
//  INDICATEUR DE CONNEXION
// =============================================

function showSyncStatus(connected) {
  let el = document.getElementById('sync-status');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sync-status';
    el.style.cssText = `
      position: fixed; bottom: 12px; left: 12px;
      font-size: 11px; font-weight: 600;
      padding: 4px 10px; border-radius: 20px;
      display: flex; align-items: center; gap: 5px;
      z-index: 999; transition: opacity 0.3s;
    `;
    document.body.appendChild(el);
  }
  if (connected) {
    el.style.background = '#d1fae5';
    el.style.color = '#065f46';
    el.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#10b981;display:inline-block"></span> Sync cloud`;
  } else {
    el.style.background = '#fef3c7';
    el.style.color = '#92400e';
    el.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#f59e0b;display:inline-block"></span> Local uniquement`;
  }
  // Masquer après 4s
  setTimeout(() => { el.style.opacity = '0.4'; }, 4000);
  el.addEventListener('mouseenter', () => el.style.opacity = '1');
  el.addEventListener('mouseleave', () => el.style.opacity = '0.4');
}

// ——— INIT ——————————————————————————————————————
async function initFirebase() {
  const ok = await checkFirebase();
  showSyncStatus(ok);
  return ok;
}

// =============================================
//  API PUBLIQUE — ABSENCES / CONGÉS
// =============================================

async function syncGetAbsences() {
  if (_fbAvailable) {
    const data = await fbGet('absences');
    const list = data ? Object.values(data) : [];
    localStorage.setItem('noz_absences', JSON.stringify(list));
    return list;
  }
  try { return JSON.parse(localStorage.getItem('noz_absences') || '[]'); }
  catch { return []; }
}

async function syncSaveAbsence(absence) {
  const key = absence.id;
  if (_fbAvailable) {
    await fbSet(`absences/${key}`, absence);
  }
  const local = JSON.parse(localStorage.getItem('noz_absences') || '[]');
  const updated = local.filter(a => a.id !== absence.id);
  updated.push(absence);
  localStorage.setItem('noz_absences', JSON.stringify(updated));
}

async function syncUpdateAbsenceStatus(id, status, comment) {
  const local = JSON.parse(localStorage.getItem('noz_absences') || '[]');
  const absence = local.find(a => a.id === id);
  if (!absence) return;
  absence.status = status;
  absence.adminComment = comment || '';
  absence.validatedAt = new Date().toLocaleString('fr-FR');
  if (_fbAvailable) {
    await fbSet(`absences/${id}`, absence);
  }
  const updated = local.filter(a => a.id !== id);
  updated.push(absence);
  localStorage.setItem('noz_absences', JSON.stringify(updated));
  return absence;
}

async function syncDeleteAbsence(id) {
  if (_fbAvailable) {
    await fetch(`${FIREBASE_URL}/absences/${id}.json`, { method: 'DELETE' });
  }
  const local = JSON.parse(localStorage.getItem('noz_absences') || '[]');
  localStorage.setItem('noz_absences', JSON.stringify(local.filter(a => a.id !== id)));
}

// =============================================
//  API PUBLIQUE — POINTAGES MENSUEL
// =============================================

async function syncGetPointages() {
  if (_fbAvailable) {
    const data = await fbGet('pointages');
    if (data) {
      localStorage.setItem('noz_pointages', JSON.stringify(data));
      return data;
    }
  }
  try { return JSON.parse(localStorage.getItem('noz_pointages') || '{}'); }
  catch { return {}; }
}
