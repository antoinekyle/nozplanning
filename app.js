// ——— FORMATAGE HEURES ———————————————————
// fmtH : horaires lisibles   8.75 → "8h45"  |  13.5 → "13h30"
function fmtH(v) {
  if (!v && v !== 0) return '';
  const h = Math.floor(v);
  const m = Math.round((v - h) * 60);
  return m > 0 ? h + 'h' + String(m).padStart(2, '0') : h + 'h00';
}
// fmtD : totaux/durées décimaux  31.75 → "31h75"  |  23.5 → "23h50"
function fmtD(v) {
  if (!v && v !== 0) return '';
  const h = Math.floor(v);
  const d = Math.round((v - h) * 100);
  return d > 0 ? h + 'h' + String(d) : h + 'h';
}

// =============================================
//  NOZ P854 — Application Planning
//  app.js — logique principale
// =============================================

/* ——— PLANNING OVERRIDES (Firebase sync) ——— */
function getOverrides() {
  try { return JSON.parse(localStorage.getItem('noz_planning_overrides') || '[]'); }
  catch { return []; }
}

function getEffectiveShift(prenom, jourIdx, originalShift) {
  const overrides = getOverrides();
  const ov = overrides.find(o => o.prenom === prenom && o.jourIdx === jourIdx);
  return ov ? { j: originalShift.j, deb: ov.deb, fin: ov.fin, task: ov.task } : originalShift;
}

// Recharge tout le planning quand Firebase notifie un changement
function onRemoteChange() {
  // Reconstruire toutes les pages employés
  STAFF.forEach((s, i) => {
    const page = document.getElementById('page-p' + i);
    if (!page) return;
    const wasActive = page.classList.contains('active');
    page.remove();
    buildPersonPage(s, i);
    if (wasActive) document.getElementById('page-p' + i)?.classList.add('active');
    // Re-render consignes
    const container = document.getElementById('consignes-' + i);
    const countEl   = document.getElementById('consigne-count-' + i);
    if (container) renderConsignesFor(s.prenom, container, countEl);
  });
  // Reconstruire le tableau global
  const global = document.getElementById('page-global');
  if (global) {
    const wasActive = global.classList.contains('active');
    global.remove();
    buildGlobalPage();
    if (wasActive) document.getElementById('page-global')?.classList.add('active');
  }
  showSyncToast('Planning mis à jour ↗');
}

function showSyncToast(msg) {
  let t = document.getElementById('sync-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'sync-toast';
    t.style.cssText = 'position:fixed;top:60px;right:12px;background:#0D2240;color:#fff;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:500;z-index:9999;opacity:0;transition:opacity 0.3s;pointer-events:none';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2500);
}

/* ——— NAV ——————————————————————————————————— */
function buildNav() {
  const nav = document.getElementById('nav');

  const tabs = [
    { id: 'global',    label: 'Planning global', icon: '📅' },
    { id: 'calendar',  label: 'Calendrier',      icon: '🗓' },
    ...STAFF.map((s, i) => ({ id: 'p' + i, label: s.prenom, staff: s })),
    { id: 'admin',     label: 'Admin',           icon: '🔒' },

  ];

  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.dataset.page = tab.id;

    if (tab.staff) {
      const s = tab.staff;
      btn.innerHTML = `
        <span class="avatar-xs" style="background:${roleColor(s.role)}">${initiales(s)}</span>
        ${s.prenom}
      `;
    } else {
      btn.innerHTML = `<span style="font-size:15px;line-height:1">${tab.icon}</span> ${tab.label}`;
    }

    btn.addEventListener('click', () => {
      if (tab.id === 'admin') { showAdminPage(); }
      else showPage(tab.id);
    });

    // Badge notification consignes sur onglet employé
    if (tab.staff) {
      const count = getConsignesFor(tab.staff.prenom).length;
      if (count > 0) {
        const badge = document.createElement('span');
        badge.className = 'notif-dot';
        badge.id = 'notif-' + tab.id;
        badge.textContent = count;
        btn.appendChild(badge);
      }
    }

    nav.appendChild(btn);
  });
}

function showPage(id) {
  document.querySelectorAll('.nav-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.page === id)
  );
  document.querySelectorAll('.page').forEach(p =>
    p.classList.toggle('active', p.id === 'page-' + id)
  );
}

/* ——— GLOBAL PAGE ——————————————————————————— */
function buildGlobalPage() {
  const pages = document.getElementById('pages');
  const div = document.createElement('div');
  div.className = 'page active';
  div.id = 'page-global';

  // Stats summary
  const totalContrat = STAFF.reduce((s, e) => s + e.contrat, 0);
  const totalPlannif = STAFF.reduce((s, e) => s + totalHeures(e), 0);
  const nbRepos = STAFF.reduce((s, e) => s + e.shifts.filter(sh => !sh.deb).length, 0);

  // Legend
  const legendHTML = Object.entries(TASKS).map(([k, v]) =>
    `<span class="legend-item">
      <span class="legend-dot" style="background:${v.color}"></span>${v.label}
    </span>`
  ).join('') +
  `<span class="legend-item">
    <span class="legend-dot" style="background:var(--bg-muted);border:1px solid var(--border)"></span>Repos
  </span>`;

  // Table rows
  const rows = STAFF.map(s => {
    const total = totalHeures(s);
    const ok = Math.abs(total - s.contrat) <= 1;
    const role = ROLES[s.role] || { label: s.role, color: '#888' };

    const cells = JOURS.slice(0, 6).map((j, idx) => {
      const sh = s.shifts[idx];
      const eff = getEffectiveShift(s.prenom, idx, sh || { j, deb: 0, fin: 0, task: null });
      const isOv = getOverrides().some(o => o.prenom === s.prenom && o.jourIdx === idx);
      if (!eff || !eff.deb) return `<td style="padding:5px 4px"><span class="shift-pill shift-repos">${isOv?'⚡ ':''}</span></td>`;
      const t = TASKS[eff.task] || { color: '#888', label: eff.task };
      return `<td style="padding:5px 4px">
        <span class="shift-pill" style="background:${t.color};${isOv?'outline:2px solid #fbbf24;outline-offset:1px':''}" title="${eff.task} — ${fmtH(eff.deb)} à ${fmtH(eff.fin)}${isOv?' (modifié)':''}">
          ${fmtH(eff.deb)}–${fmtH(eff.fin)}
        </span>
      </td>`;
    }).join('');

    return `<tr>
      <td style="padding:7px 12px;min-width:140px">
        <div class="emp-cell">
          <span class="avatar-xs" style="background:${role.color}">${initiales(s)}</span>
          <div>
            <div class="emp-name">${s.prenom} ${s.nom}</div>
          </div>
        </div>
      </td>
      <td style="padding:5px 8px">
        <span class="emp-role" style="background:${role.color}">${role.label}</span>
      </td>
      <td style="text-align:center;font-size:11px;color:var(--text-muted)">${s.contrat}h</td>
      ${cells}
      <td style="text-align:center;padding:5px 10px">
        <span class="${ok ? 'h-ok' : 'h-warn'}">${fmtD(total)}</span>
      </td>
    </tr>`;
  }).join('');

  div.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-card-label">Équipe</div>
        <div class="stat-card-num">${STAFF.length}</div>
        <div class="stat-card-sub">collaborateurs</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Heures planifiées</div>
        <div class="stat-card-num">${fmtD(totalPlannif)}</div>
        <div class="stat-card-sub">/ ${totalContrat}h contrat</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Jours de repos</div>
        <div class="stat-card-num">${nbRepos}</div>
        <div class="stat-card-sub">sur la semaine</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-label">Semaine</div>
        <div class="stat-card-num">${SEMAINE.numero}</div>
        <div class="stat-card-sub">13 – 19 avr. 2026</div>
      </div>
    </div>

    <div class="section-header">
      <span class="section-title">Planning semaine ${SEMAINE.numero} — ${SEMAINE.magasin}</span>
    </div>

    <div class="legend">${legendHTML}</div>

    <div class="card">
      <div class="table-wrap">
        <table class="ptable">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Rôle</th>
              <th class="center">Contrat</th>
              ${JOURS.slice(0,6).map(j => `<th class="center">${j}<br><span style="font-weight:400;font-size:10px">${JOURS_DATES[j]}</span></th>`).join('')}
              <th class="center">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  pages.appendChild(div);
}

/* ——— PERSON PAGE ——————————————————————————— */
function buildPersonPage(s, i) {
  const pages = document.getElementById('pages');
  const div = document.createElement('div');
  div.className = 'page';
  div.id = 'page-p' + i;

  const total = totalHeures(s);
  const ok = Math.abs(total - s.contrat) <= 1;
  const role = ROLES[s.role] || { label: s.role, color: '#888' };
  const avatarColor = role.color;

  const TL_START = 6;
  const TL_END   = 21;
  const TL_SPAN  = TL_END - TL_START;

  const dayCards = s.shifts.map((sh, idx) => {
    const jour = JOURS[idx];
    const jourFull = JOURS_FULL[jour];
    const date = JOURS_DATES[jour];
    // Appliquer les overrides admin
    const eff = getEffectiveShift(s.prenom, idx, sh);
    const isOverride = getOverrides().some(o => o.prenom === s.prenom && o.jourIdx === idx);

    if (!eff.deb) {
      return `
        <div class="day-card repos">
          <div class="day-card-inner">
            <span class="day-label">${jour}</span>
            <span class="day-date">${jourFull} ${date}</span>
            <span style="font-size:12px;color:var(--text-light);font-style:italic">Jour de repos${isOverride ? ' <span style="font-size:10px;background:#fef9c3;color:#92400e;padding:1px 5px;border-radius:8px">modifié</span>' : ''}</span>
          </div>
        </div>`;
    }

    const t = TASKS[eff.task] || { color: '#888', label: eff.task || '' };
    const dur = eff.fin - eff.deb;
    const pauseDur = (eff.pause_deb && eff.pause_fin) ? (eff.pause_fin - eff.pause_deb) : 0;

    const ticks = [];
    for (let h = TL_START; h <= TL_END; h += 3) {
      ticks.push(`<span>${h}h</span>`);
    }
    const modifBadge = isOverride ? `<span style="font-size:9px;background:#fef9c3;color:#92400e;padding:1px 5px;border-radius:8px;margin-left:6px">modifié</span>` : '';

    // Timeline avec coupure pause
    let tlContent = '';
    if (eff.pause_deb && eff.pause_fin) {
      const l1 = ((eff.deb       - TL_START) / TL_SPAN * 100).toFixed(1);
      const w1 = ((eff.pause_deb - eff.deb)  / TL_SPAN * 100).toFixed(1);
      const lP = ((eff.pause_deb - TL_START) / TL_SPAN * 100).toFixed(1);
      const wP = ((eff.pause_fin - eff.pause_deb) / TL_SPAN * 100).toFixed(1);
      const l2 = ((eff.pause_fin - TL_START) / TL_SPAN * 100).toFixed(1);
      const w2 = ((eff.fin - eff.pause_fin)  / TL_SPAN * 100).toFixed(1);
      tlContent = `<div class="tl-fill" style="left:${l1}%;width:${w1}%;background:${t.color}">${fmtH(eff.deb)}</div><div class="tl-fill" style="left:${lP}%;width:${wP}%;background:repeating-linear-gradient(45deg,#cbd5e1,#cbd5e1 3px,#e2e8f0 3px,#e2e8f0 8px);color:#64748b;font-size:9px">☕</div><div class="tl-fill" style="left:${l2}%;width:${w2}%;background:${t.color}">${fmtH(eff.fin)}</div>`;
    } else {
      const leftPct  = ((eff.deb - TL_START) / TL_SPAN * 100).toFixed(1);
      const widthPct = (dur / TL_SPAN * 100).toFixed(1);
      tlContent = `<div class="tl-fill" style="left:${leftPct}%;width:${widthPct}%;background:${t.color}">${fmtH(eff.deb)}–${fmtH(eff.fin)}</div>`;
    }

    const pauseLine = eff.pause_deb
      ? `<div style="padding:2px 14px 6px;font-size:11px;color:var(--text-muted)">☕ Pause ${fmtH(eff.pause_deb)} → ${fmtH(eff.pause_fin)}</div>`
      : '';

    return `
      <div class="day-card">
        <div class="day-card-inner">
          <span class="day-label">${jour}</span>
          <span class="day-date">${jourFull} ${date}</span>
          <span class="day-task-badge" style="background:${t.color};font-size:13px;font-weight:700;padding:4px 12px;border-radius:8px">${t.label}</span>
          <span class="day-hours-range" style="margin-left:8px;font-size:13px;font-weight:600;color:var(--text)">${fmtH(eff.deb)} → ${fmtH(eff.fin)}${modifBadge}</span>
          <span class="day-dur">${fmtD(dur)}</span>
        </div>
        ${pauseLine}
        <div class="tl-wrap">
          <div class="tl-track">${tlContent}</div>
          <div class="tl-ticks">${ticks.join('')}</div>
        </div>
      </div>`;
  }).join('');

  div.innerHTML = `
    <div class="person-header">
      <div class="avatar-lg" style="background:${avatarColor}">${initiales(s)}</div>
      <div class="ph-info">
        <div class="ph-name">${s.prenom} ${s.nom}</div>
        <div class="ph-meta">${role.label} · Contrat ${s.contrat}h / semaine · S${SEMAINE.numero}</div>
        <!-- ONGLET CONSIGNES cliquable sous le nom -->
        <button
          id="consigne-toggle-${i}"
          onclick="toggleConsignesTab(${i})"
          style="
            margin-top:8px;
            display:inline-flex;align-items:center;gap:5px;
            background:transparent;
            border:1px solid rgba(255,255,255,0.25);
            border-radius:20px;
            padding:3px 10px;
            font-size:11px;font-weight:600;color:rgba(255,255,255,0.75);
            cursor:pointer;transition:all 0.15s;
          "
          onmouseover="this.style.background='rgba(255,255,255,0.1)'"
          onmouseout="this.style.background='transparent'"
        >
          📌 Consignes
          <span id="consigne-count-${i}" style="background:var(--noz-red);color:#fff;font-size:9px;padding:1px 5px;border-radius:8px;display:none">0</span>
        </button>
      </div>
      <div class="ph-stats">
        <div class="ph-stat-num ${ok ? 'ph-stat-ok' : 'ph-stat-warn'}">${fmtD(total)}</div>
        <div class="ph-stat-label">planifiées / ${s.contrat}h</div>
      </div>
    </div>

    <!-- PANNEAU CONSIGNES — caché par défaut, s'ouvre au clic -->
    <div id="consignes-tab-${i}" style="display:none;margin-bottom:14px"></div>

    <div class="week-list">${dayCards}</div>

    <div style="margin-top:12px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;font-size:12px;">
      <span style="color:var(--text-muted)">Heures planifiées cette semaine</span>
      <span style="font-weight:700;color:${ok?'#16a34a':'#ea580c'}">
        ${fmtD(total)} / ${s.contrat}h · Écart : ${total >= s.contrat ? '+' : ''}${fmtD(Math.abs(total - s.contrat))}
      </span>
    </div>
  `;

  pages.appendChild(div);
}

/* ——— CALENDAR PAGE ——————————————————————— */
function buildCalendarPage() {
  const pages = document.getElementById('pages');
  const div = document.createElement('div');
  div.className = 'page';
  div.id = 'page-calendar';

  div.innerHTML = `
    <div class="cal-header">
      <div class="cal-nav">
        <button class="cal-nav-btn" id="cal-prev">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <span class="cal-month-title" id="cal-title"></span>
        <button class="cal-nav-btn" id="cal-next">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
      </div>
      <div style="font-size:12px;color:var(--text-muted)">Planning semaine ${SEMAINE.numero}</div>
    </div>

    <div class="cal-wrapper">
      <div class="cal-grid">
        <div class="cal-weekdays">
          ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(j =>
            `<div class="cal-weekday">${j}</div>`
          ).join('')}
        </div>
        <div class="cal-days" id="cal-days"></div>
      </div>
    </div>

    <div style="margin-top:14px">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Légende équipe</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${STAFF.map(s => {
          const rc = roleColor(s.role);
          return `<span style="display:flex;align-items:center;gap:5px;background:var(--bg-card);border:1px solid var(--border);padding:3px 10px;border-radius:20px;font-size:11px;color:var(--text-muted)">
            <span style="width:8px;height:8px;border-radius:50%;background:${rc};flex-shrink:0"></span>
            ${s.prenom}
          </span>`;
        }).join('')}
      </div>
    </div>
  `;

  pages.appendChild(div);
  initCalendar();
}

function initCalendar() {
  // Initialiser sur le mois de la semaine active
  const _debutCal = SEMAINE.debut ? new Date(SEMAINE.debut + 'T00:00:00') : new Date(2026, 3, 1);
  let current = new Date(_debutCal.getFullYear(), _debutCal.getMonth(), 1);

  function render() {
    const title = document.getElementById('cal-title');
    const container = document.getElementById('cal-days');
    if (!title || !container) return;

    const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    title.textContent = months[current.getMonth()] + ' ' + current.getFullYear();

    // Compute days to show
    const year  = current.getFullYear();
    const month = current.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay  = new Date(year, month + 1, 0);
    // Start from Monday
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1;

    const cells = [];
    // Previous month padding
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      cells.push({ date: d, other: true });
    }
    // Current month
    for (let d = 1; d <= lastDay.getDate(); d++) {
      cells.push({ date: new Date(year, month, d), other: false });
    }
    // Next month padding
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ date: new Date(year, month + 1, d), other: true });
    }

    // Build events map: iso date → [{prenom, color, task, deb, fin}]
    const eventsMap = {};
    // Calculer les dates de la semaine dynamiquement depuis SEMAINE.debut
    const weekDates = {};
    const _wd = new Date((SEMAINE.debut || '2026-05-04') + 'T00:00:00');
    ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].forEach((j, i) => {
      const d = new Date(_wd);
      d.setDate(_wd.getDate() + i);
      weekDates[j] = d.toISOString().split('T')[0];
    });
    STAFF.forEach(s => {
      const rc = roleColor(s.role);
      s.shifts.forEach((sh, idx) => {
        if (!sh.deb) return;
        const jour = JOURS[idx];
        const iso  = weekDates[jour];
        if (!iso) return;
        if (!eventsMap[iso]) eventsMap[iso] = [];
        const t = TASKS[sh.task] || { color: rc, label: sh.task };
        eventsMap[iso].push({ prenom: s.prenom, color: t.color, task: t.label, deb: sh.deb, fin: sh.fin });
      });
    });

    const today = new Date();
    today.setHours(0,0,0,0);

    container.innerHTML = cells.map(cell => {
      const iso = cell.date.toISOString().split('T')[0];
      const isToday = cell.date.getTime() === today.getTime();
      const events = eventsMap[iso] || [];

      const evHTML = events.slice(0, 3).map(ev =>
        `<div class="cal-event" style="background:${ev.color}" title="${ev.prenom} — ${ev.task} ${fmtH(ev.deb)}–${fmtH(ev.fin)}">
          ${ev.prenom}
        </div>`
      ).join('');

      const more = events.length > 3
        ? `<div style="font-size:8px;color:var(--text-muted);padding:1px 3px">+${events.length - 3}</div>`
        : '';

      return `<div class="cal-day ${cell.other ? 'other-month' : ''} ${isToday ? 'today' : ''}">
        <div class="cal-day-num">${cell.date.getDate()}</div>
        ${evHTML}${more}
      </div>`;
    }).join('');
  }

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    current = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    render();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    render();
  });

  render();
}

/* ——— PDF EXPORT ———————————————————————————— */
function setupPDF() {
  document.getElementById('btn-pdf')?.addEventListener('click', () => {
    showToast('Impression en cours…');
    setTimeout(() => window.print(), 200);
  });
}

/* ——— TOAST ———————————————————————————————— */
function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ——— CONSIGNES ENGINE ————————————————————— */

const CONSIGNES_KEY = 'noz_consignes';

function getAllConsignes() {
  try { return JSON.parse(localStorage.getItem(CONSIGNES_KEY) || '[]'); }
  catch { return []; }
}

function saveAllConsignes(list) {
  localStorage.setItem(CONSIGNES_KEY, JSON.stringify(list));
}

function getConsignesFor(prenom) {
  const all = getAllConsignes();
  return all.filter(c => c.dest === prenom || c.dest === 'Tous');
}

function addConsigne(dest, text, priority) {
  const all = getAllConsignes();
  const c = {
    id:       Date.now(),
    dest,
    text,
    priority,
    from:     'Antoine (Gérant)',
    date:     new Date().toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }),
  };
  all.unshift(c);
  saveAllConsignes(all);
  refreshAllConsignes();
  updateNavBadges();
}

function deleteConsigne(id) {
  const all = getAllConsignes().filter(c => c.id !== id);
  saveAllConsignes(all);
  refreshAllConsignes();
  updateNavBadges();
}

function toggleConsignesTab(i) {
  const tab = document.getElementById('consignes-tab-' + i);
  if (!tab) return;
  const isOpen = tab.style.display !== 'none';
  tab.style.display = isOpen ? 'none' : 'block';
  const btn = document.getElementById('consigne-toggle-' + i);
  if (btn) btn.style.borderColor = isOpen ? 'rgba(255,255,255,0.25)' : 'rgba(255,165,0,0.7)';
}

function renderConsignesFor(prenom, _unused, countEl) {
  const list = getConsignesFor(prenom);
  const idx  = STAFF.findIndex(s => s.prenom === prenom);
  const tabEl = idx >= 0 ? document.getElementById('consignes-tab-' + idx) : null;
  const badge = idx >= 0 ? document.getElementById('consigne-count-' + idx) : null;

  // Badge sur le bouton
  if (badge) {
    badge.textContent = list.length;
    badge.style.display = list.length > 0 ? 'inline-block' : 'none';
  }
  if (countEl) countEl.textContent = list.length > 0 ? list.length : '';

  if (!tabEl) return;

  if (!list.length) {
    tabEl.innerHTML = '<div style="padding:12px 14px;font-size:13px;color:var(--text-muted);font-style:italic">Aucune consigne en cours.</div>';
    return;
  }

  const icons = { haute: '🔴', normale: '🟡', info: '🔵' };
  const jourLabels = { Lun:'Lundi', Mar:'Mardi', Mer:'Mercredi', Jeu:'Jeudi', Ven:'Vendredi', Sam:'Samedi', Semaine:'Semaine' };
  const JOURS_ORDER = ['Lun','Mar','Mer','Jeu','Ven','Sam','Semaine'];

  // Grouper par jour
  const byJour = {};
  for (const c of list) {
    const j = c.jour || 'Semaine';
    if (!byJour[j]) byJour[j] = [];
    byJour[j].push(c);
  }
  const joursPresents = JOURS_ORDER.filter(j => byJour[j]);

  tabEl.innerHTML = `
    <div style="background:#fff8f0;border:1.5px solid #f97316;border-radius:var(--radius-md);overflow:hidden;">
      <div style="background:#f97316;padding:8px 14px;display:flex;align-items:center;justify-content:space-between">
        <span style="color:#fff;font-size:12px;font-weight:700;letter-spacing:.3px">
          📌 CONSIGNES DU GÉRANT
          <span style="background:rgba(255,255,255,0.3);color:#fff;font-size:10px;font-weight:700;padding:1px 7px;border-radius:10px;margin-left:6px">${list.length}</span>
        </span>
        <button onclick="toggleConsignesTab(${idx})" style="background:none;border:none;color:rgba(255,255,255,0.8);cursor:pointer;font-size:16px;padding:0;line-height:1">×</button>
      </div>
      <div style="padding:10px 14px;display:flex;flex-direction:column;gap:10px">
        ${joursPresents.map(j => `
          <div>
            ${j !== 'Semaine' ? `<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#c2410c;margin-bottom:5px;padding-bottom:3px;border-bottom:1px solid #fed7aa">${jourLabels[j] || j}</div>` : ''}
            <div style="display:flex;flex-direction:column;gap:6px">
              ${byJour[j].map(c => `
                <div style="display:flex;align-items:flex-start;gap:8px">
                  <span style="font-size:13px;flex-shrink:0;margin-top:1px">${icons[c.priority] || '🟡'}</span>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:13px;color:#7c2d12;font-weight:500;line-height:1.4">${escHtml(c.text)}</div>
                    <div style="font-size:10px;color:#c2410c;margin-top:2px">
                      ${c.from} · ${c.date}
                      ${c.dest === 'Tous' ? '<span style="background:#fed7aa;color:#c2410c;padding:0 5px;border-radius:8px;margin-left:4px;font-size:9px">Équipe</span>' : ''}
                    </div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function refreshAllConsignes() {
  STAFF.forEach((s, i) => {
    const countEl = document.getElementById('consigne-count-' + i);
    renderConsignesFor(s.prenom, null, countEl);
  });
  renderConsignesPage();
  updateNavBadges();
}

function updateNavBadges() {
  STAFF.forEach((s, i) => {
    const existing = document.getElementById('notif-p' + i);
    const count = getConsignesFor(s.prenom).length;
    if (existing) {
      existing.textContent = count;
      existing.style.display = count > 0 ? '' : 'none';
    }
  });
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ——— CONSIGNES PAGE ——————————————————————— */

function buildConsignesPage() {
  const pages = document.getElementById('pages');
  const div = document.createElement('div');
  div.className = 'page';
  div.id = 'page-consignes';
  div.innerHTML = `
    <div style="margin-bottom:16px;display:flex;align-items:center;justify-content:space-between">
      <h2 style="font-size:16px;font-weight:600;color:var(--text)">Consignes équipe</h2>
      <span style="font-size:11px;color:var(--text-muted)">Visible sur la fiche de chaque employé</span>
    </div>

    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:20px;box-shadow:var(--shadow-sm)">
      <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:12px">
        Nouvelle consigne
      </div>

      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
        <label style="font-size:12px;color:var(--text-muted);font-weight:500">Pour :</label>
        <select id="consigne-dest" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:13px;background:var(--bg-card);color:var(--text);cursor:pointer">
          <option value="Tous">👥 Toute l'équipe</option>
          ${STAFF.map(s => `<option value="${s.prenom}">${s.prenom} ${s.nom}</option>`).join('')}
        </select>

        <label style="font-size:12px;color:var(--text-muted);font-weight:500;margin-left:8px">Priorité :</label>
        <select id="consigne-priority" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:13px;background:var(--bg-card);color:var(--text);cursor:pointer">
          <option value="normale">🟡 Normale</option>
          <option value="haute">🔴 Haute</option>
          <option value="info">🔵 Info</option>
        </select>
      </div>

      <textarea id="consigne-text"
        placeholder="Ex: Penser à faire le TDM avant 9h, vérifier le facing après la livraison..."
        style="width:100%;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;background:var(--bg-muted);color:var(--text);resize:vertical;min-height:80px;font-family:inherit;outline:none;transition:border-color 0.15s"
        onfocus="this.style.borderColor='var(--noz-navy)'"
        onblur="this.style.borderColor='var(--border)'"
      ></textarea>

      <div style="display:flex;justify-content:flex-end;margin-top:10px;gap:8px">
        <button onclick="document.getElementById('consigne-text').value=''" style="padding:8px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:none;color:var(--text-muted);cursor:pointer;font-size:13px">
          Effacer
        </button>
        <button onclick="submitConsigne()" style="padding:8px 20px;border:none;border-radius:var(--radius-sm);background:var(--noz-navy);color:#fff;cursor:pointer;font-size:13px;font-weight:600;transition:background 0.15s" onmouseover="this.style.background='#1a3a6e'" onmouseout="this.style.background='var(--noz-navy)'">
          Envoyer la consigne
        </button>
      </div>
    </div>

    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:10px;display:flex;align-items:center;justify-content:space-between">
      <span>Consignes actives</span>
      <button onclick="clearAllConsignes()" style="font-size:10px;color:var(--text-light);background:none;border:none;cursor:pointer;font-weight:400">Tout effacer</button>
    </div>
    <div id="consignes-page-list"></div>
  `;
  pages.appendChild(div);
  renderConsignesPage();
}

function renderConsignesPage() {
  const container = document.getElementById('consignes-page-list');
  if (!container) return;
  const all = getAllConsignes();
  if (!all.length) {
    container.innerHTML = '<div class="consigne-empty" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md)">Aucune consigne active</div>';
    return;
  }
  const icons = { haute: '🔴', normale: '🟡', info: '🔵' };
  container.innerHTML = all.map(c => `
    <div class="consigne-banner priority-${c.priority}" data-id="${c.id}">
      <span class="consigne-icon">${icons[c.priority] || '🟡'}</span>
      <div class="consigne-body">
        <div class="consigne-from" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span>Pour : <strong>${c.dest}</strong></span>
          <span class="priority-badge priority-${c.priority}">${c.priority}</span>
        </div>
        <div class="consigne-text">${escHtml(c.text)}</div>
        <div class="consigne-date">${c.from} · ${c.date}</div>
      </div>
      <button class="consigne-del" onclick="deleteConsigne(${c.id})" title="Supprimer">×</button>
    </div>`).join('');
}

function submitConsigne() {
  const text     = (document.getElementById('consigne-text')?.value || '').trim();
  const dest     = document.getElementById('consigne-dest')?.value || 'Tous';
  const priority = document.getElementById('consigne-priority')?.value || 'normale';
  if (!text) {
    const ta = document.getElementById('consigne-text');
    if (ta) { ta.style.borderColor = '#dc2626'; setTimeout(() => ta.style.borderColor = 'var(--border)', 1500); }
    return;
  }
  addConsigne(dest, text, priority);
  const ta = document.getElementById('consigne-text');
  if (ta) ta.value = '';
  showToast('Consigne envoyée ✓');
  refreshAdminConsignes();
}

function refreshAdminConsignes() {
  // Met à jour la liste dans la page admin sans la reconstruire entièrement
  const list = document.getElementById('admin-consignes-list');
  if (!list) return;
  const all = getAllConsignes().sort((a, b) => {
    const p = { haute:0, normale:1, info:2 };
    return (p[a.priority]||1) - (p[b.priority]||1);
  });
  if (!all.length) {
    list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Aucune consigne active</div>';
    return;
  }
  list.innerHTML = all.map(c => {
    const pColor = c.priority === 'haute' ? '#dc2626' : c.priority === 'normale' ? '#f59e0b' : '#6b7280';
    const s = STAFF.find(x => x.prenom === c.dest);
    const rc = s ? roleColor(s.role) : '#888';
    const iniIsEmoji = c.dest === 'Tous';
    const ini = iniIsEmoji ? '👥' : (s ? initiales(s) : (c.dest||'?')[0].toUpperCase());
    return `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">
      ${iniIsEmoji
        ? `<span style="width:28px;height:28px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${ini}</span>`
        : `<span style="width:28px;height:28px;border-radius:50%;background:${rc};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${ini}</span>`
      }
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:2px">${c.dest || 'Tous'} · <span style="color:${pColor};font-weight:600">${c.priority}</span></div>
        <div style="font-size:13px;color:var(--text)">${escHtml(c.text)}</div>
        <div style="font-size:10px;color:var(--text-light);margin-top:3px">${c.from} · ${c.date}</div>
      </div>
      <button onclick="deleteConsigne(${c.id});refreshAdminConsignes()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;padding:0;flex-shrink:0;line-height:1">×</button>
    </div>`;
  }).join('');
}

function clearAllConsignes() {
  if (!confirm('Effacer toutes les consignes ?')) return;
  localStorage.removeItem(CONSIGNES_KEY);
  refreshAllConsignes();
  refreshAdminConsignes();
  updateNavBadges();
  showToast('Consignes effacées');
}

/* ——— RÉCAP MENSUEL ——————————————————————— */

const RECAP_KEY = 'noz_recap_mensuel';

function getRecapMensuel() {
  try { return JSON.parse(localStorage.getItem(RECAP_KEY) || '{}'); }
  catch { return {}; }
}

// Appelée à chaque chargement de semaine — sauvegarde les heures
function sauvegarderSemaineRecap() {
  if (!SEMAINE.debut) return;
  const moisKey = SEMAINE.debut.slice(0, 7); // "2026-05"
  const semKey  = `S${SEMAINE.numero}`;
  const recap   = getRecapMensuel();
  if (!recap[moisKey]) recap[moisKey] = {};
  recap[moisKey][semKey] = {
    debut: SEMAINE.debut,
    fin:   SEMAINE.fin,
    heures: {}
  };
  STAFF.forEach(s => {
    recap[moisKey][semKey].heures[s.prenom] = totalHeures(s);
  });
  localStorage.setItem(RECAP_KEY, JSON.stringify(recap));
}

/* ——— PIN ADMIN —————————————————————————————— */
const ADMIN_PIN = '0409';
let _pinInput = '';

function showAdminPage() {
  if (sessionStorage.getItem('noz_admin_auth') === '1') {
    showPage('admin');
  } else {
    _pinInput = '';
    adminPinUpdateDots();
    showPage('admin-lock');
  }
}

function buildAdminLockPage() {
  const pages = document.getElementById('pages');
  const div = document.createElement('div');
  div.className = 'page';
  div.id = 'page-admin-lock';
  div.innerHTML = `
    <div style="max-width:340px;margin:60px auto 0;text-align:center">
      <div style="font-size:48px;margin-bottom:12px">🔒</div>
      <div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:6px">Accès Administration</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:24px">Saisir le code PIN</div>
      <div id="admin-pin-dots" style="display:flex;justify-content:center;gap:14px;margin-bottom:28px">
        ${[0,1,2,3].map(i => `<span class="pin-dot" data-i="${i}" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--noz-navy);background:transparent"></span>`).join('')}
      </div>
      <div id="admin-pin-msg" style="font-size:13px;color:#dc2626;min-height:18px;margin-bottom:14px"></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
        ${[1,2,3,4,5,6,7,8,9].map(n => `
          <button onclick="adminPinPress('${n}')" style="padding:18px 0;border:1px solid var(--border);border-radius:14px;background:var(--bg-card);color:var(--text);font-size:22px;font-weight:600;cursor:pointer">${n}</button>
        `).join('')}
        <button onclick="adminPinDel()" style="padding:18px 0;border:1px solid var(--border);border-radius:14px;background:var(--bg-card);color:var(--text-muted);font-size:18px;cursor:pointer">←</button>
        <button onclick="adminPinPress('0')" style="padding:18px 0;border:1px solid var(--border);border-radius:14px;background:var(--bg-card);color:var(--text);font-size:22px;font-weight:600;cursor:pointer">0</button>
        <button onclick="_pinInput='';adminPinUpdateDots();document.getElementById('admin-pin-msg').textContent=''" style="padding:18px 0;border:1px solid var(--border);border-radius:14px;background:var(--bg-card);color:var(--text-muted);font-size:14px;cursor:pointer">C</button>
      </div>
    </div>
  `;
  pages.appendChild(div);
}

function adminPinUpdateDots() {
  document.querySelectorAll('#admin-pin-dots .pin-dot').forEach((d, i) => {
    d.style.background = i < _pinInput.length ? 'var(--noz-navy)' : 'transparent';
  });
}

function adminPinPress(v) {
  if (_pinInput.length >= 4) return;
  _pinInput += v;
  adminPinUpdateDots();
  if (_pinInput.length === 4) setTimeout(adminPinCheck, 150);
}

function adminPinDel() {
  _pinInput = _pinInput.slice(0, -1);
  adminPinUpdateDots();
  document.getElementById('admin-pin-msg').textContent = '';
}

function adminPinCheck() {
  if (_pinInput === ADMIN_PIN) {
    sessionStorage.setItem('noz_admin_auth', '1');
    _pinInput = '';
    showPage('admin');
  } else {
    document.getElementById('admin-pin-msg').textContent = 'Code incorrect';
    _pinInput = '';
    adminPinUpdateDots();
  }
}

function adminLogout() {
  sessionStorage.removeItem('noz_admin_auth');
  showPage('global');
}

function buildAdminPage() {
  const pages = document.getElementById('pages');
  const div   = document.createElement('div');
  div.className = 'page';
  div.id = 'page-admin';

  // Styles boutons raccourcis
  if (!document.getElementById('admin-styles')) {
    const s = document.createElement('style');
    s.id = 'admin-styles';
    s.textContent = `
      .admin-btn {
        display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;
        padding:22px 12px;border:1px solid var(--border);border-radius:16px;
        background:var(--bg-card);color:var(--text);cursor:pointer;
        font-size:13px;font-weight:600;text-align:center;
        transition:all 0.15s;box-shadow:0 2px 8px rgba(0,0,0,0.06);
      }
      .admin-btn:hover { transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,0.12);border-color:var(--noz-navy); }
      .admin-btn:active { transform:translateY(0); }
      .admin-btn .admin-btn-icon { font-size:30px;line-height:1; }
      .admin-section-title {
        font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
        color:var(--text-muted);margin-bottom:10px;
      }
    `;
    document.head.appendChild(s);
  }

  const recap     = getRecapMensuel();
  const moisDispo = Object.keys(recap).sort().reverse();
  const moisFr    = ['jan','fév','mar','avr','mai','juin','juil','aoû','sep','oct','nov','déc'];
  function moisLabel(k) {
    const [y, m] = k.split('-');
    return moisFr[parseInt(m) - 1] + '. ' + y;
  }

  // Toutes les consignes actives
  const toutesConsignes = getAllConsignes().sort((a, b) => {
    const p = { haute:0, normale:1, basse:2 };
    return (p[a.priority]||1) - (p[b.priority]||1);
  });

  div.innerHTML = `
    <div style="max-width:720px;margin:0 auto;padding-bottom:40px">

      <!-- TITRE -->
      <div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:20px">🔒 Administration</div>

      <!-- 6 BOUTONS RACCOURCIS -->
      <div class="admin-section-title">Accès rapide</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px">
        <button class="admin-btn" onclick="showPage('global')">
          <span class="admin-btn-icon">📅</span>Planning global
        </button>
        <button class="admin-btn" onclick="showPage('calendar')">
          <span class="admin-btn-icon">🗓</span>Calendrier
        </button>
        <button class="admin-btn" onclick="document.getElementById('admin-recap').scrollIntoView({behavior:'smooth'})">
          <span class="admin-btn-icon">📊</span>Récap mois
        </button>
        <button class="admin-btn" onclick="document.getElementById('admin-consignes').scrollIntoView({behavior:'smooth'})">
          <span class="admin-btn-icon">📌</span>Consignes
        </button>
        <button class="admin-btn" onclick="document.getElementById('admin-envoyer').scrollIntoView({behavior:'smooth'})">
          <span class="admin-btn-icon">📤</span>Planning à envoyer
        </button>
        <button class="admin-btn" onclick="showPage('global')">
          <span class="admin-btn-icon">👥</span>Équipe S${SEMAINE.numero}
        </button>
      </div>

      <!-- PLANNING PAR SEMAINE -->
      <div id="admin-semaines" style="margin-bottom:32px">
        <div class="admin-section-title">🗓 Planning par semaine</div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
          <div id="week-mgr-tabs" style="display:flex;gap:0;border-bottom:1px solid var(--border);overflow-x:auto;background:var(--bg-muted)"></div>
          <div id="week-mgr-content" style="padding:18px"></div>
        </div>
      </div>

      <!-- RÉCAP MENSUEL -->
      <div id="admin-recap" style="margin-bottom:32px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div class="admin-section-title" style="margin-bottom:0">📊 Récap mensuel</div>
          <div style="display:flex;gap:8px;align-items:center">
            <select id="recap-mois-select" onchange="renderRecapTable()" style="padding:7px 10px;border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;background:var(--bg-card);color:var(--text);cursor:pointer">
              ${moisDispo.length
                ? moisDispo.map(m => `<option value="${m}">${moisLabel(m)}</option>`).join('')
                : '<option value="">Aucune donnée</option>'}
            </select>
            <button onclick="imprimerRecap()" style="padding:7px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);background:none;color:var(--text-muted);cursor:pointer;font-size:12px">🖨️</button>
          </div>
        </div>
        <div id="recap-table-zone"></div>
      </div>

      <!-- CONSIGNES -->
      <div id="admin-consignes" style="margin-bottom:32px">
        <div class="admin-section-title">📌 Consignes</div>

        <!-- Formulaire ajout -->
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 18px;margin-bottom:14px;box-shadow:var(--shadow-sm)">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:12px">Nouvelle consigne</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;align-items:center">
            <label style="font-size:12px;color:var(--text-muted);font-weight:500">Pour :</label>
            <select id="consigne-dest" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:13px;background:var(--bg-muted);color:var(--text);cursor:pointer">
              <option value="Tous">👥 Toute l'équipe</option>
              ${STAFF.map(s => `<option value="${s.prenom}">${s.prenom}</option>`).join('')}
            </select>
            <label style="font-size:12px;color:var(--text-muted);font-weight:500;margin-left:8px">Priorité :</label>
            <select id="consigne-priority" style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:6px 10px;font-size:13px;background:var(--bg-muted);color:var(--text);cursor:pointer">
              <option value="normale">🟡 Normale</option>
              <option value="haute">🔴 Haute</option>
              <option value="info">🔵 Info</option>
            </select>
          </div>
          <textarea id="consigne-text"
            placeholder="Ex: Penser à faire le TDM avant 9h, vérifier le facing après la livraison..."
            style="width:100%;border:1px solid var(--border);border-radius:var(--radius-md);padding:10px 14px;font-size:13px;background:var(--bg-muted);color:var(--text);resize:vertical;min-height:70px;font-family:inherit;outline:none;transition:border-color 0.15s;box-sizing:border-box"
            onfocus="this.style.borderColor='var(--noz-navy)'"
            onblur="this.style.borderColor='var(--border)'"
          ></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:10px;gap:8px">
            <button onclick="document.getElementById('consigne-text').value=''" style="padding:8px 16px;border:1px solid var(--border);border-radius:var(--radius-sm);background:none;color:var(--text-muted);cursor:pointer;font-size:13px">Effacer</button>
            <button onclick="submitConsigne()" style="padding:8px 20px;border:none;border-radius:var(--radius-sm);background:var(--noz-navy);color:#fff;cursor:pointer;font-size:13px;font-weight:600" onmouseover="this.style.background='#1a3a6e'" onmouseout="this.style.background='var(--noz-navy)'">Envoyer</button>
          </div>
        </div>

        <!-- Liste consignes actives -->
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">
          <span>Consignes actives</span>
          <button onclick="clearAllConsignes()" style="font-size:10px;color:var(--text-light);background:none;border:none;cursor:pointer;font-weight:400">Tout effacer</button>
        </div>
        <div id="admin-consignes-list" style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden">
          ${toutesConsignes.length === 0
            ? `<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Aucune consigne active</div>`
            : toutesConsignes.map(c => {
                const pColor = c.priority === 'haute' ? '#dc2626' : c.priority === 'normale' ? '#f59e0b' : '#6b7280';
                const s = STAFF.find(x => x.prenom === c.dest);
                const rc = s ? roleColor(s.role) : '#888';
                const ini = c.dest === 'Tous' ? '👥' : (s ? initiales(s) : (c.dest||'?')[0].toUpperCase());
                const iniIsEmoji = c.dest === 'Tous';
                return `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)">
                  ${iniIsEmoji
                    ? `<span style="width:28px;height:28px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${ini}</span>`
                    : `<span style="width:28px;height:28px;border-radius:50%;background:${rc};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${ini}</span>`
                  }
                  <div style="flex:1;min-width:0">
                    <div style="font-size:12px;color:var(--text-muted);margin-bottom:2px">${c.dest || 'Tous'} · <span style="color:${pColor};font-weight:600">${c.priority}</span></div>
                    <div style="font-size:13px;color:var(--text)">${escHtml(c.text)}</div>
                    <div style="font-size:10px;color:var(--text-light);margin-top:3px">${c.from} · ${c.date}</div>
                  </div>
                  <button onclick="deleteConsigne(${c.id});refreshAdminConsignes()" style="background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:18px;padding:0;flex-shrink:0;line-height:1">×</button>
                </div>`;
              }).join('')
          }
        </div>
      </div>

      <!-- PLANNING À ENVOYER -->
      <div id="admin-envoyer">
        <div class="admin-section-title">📤 Planning à envoyer</div>
        <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;display:flex;flex-direction:column;gap:12px">
          <div style="font-size:13px;color:var(--text-muted)">Semaine ${SEMAINE.numero} — ${SEMAINE.debut ? SEMAINE.debut.slice(8)+'/'+SEMAINE.debut.slice(5,7) : ''} au ${SEMAINE.fin ? SEMAINE.fin.slice(8)+'/'+SEMAINE.fin.slice(5,7) : ''} · ${SEMAINE.magasin}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button onclick="imprimerPlanning('global')" style="padding:14px;border:1px solid var(--border);border-radius:12px;background:var(--noz-navy);color:#fff;font-size:13px;font-weight:600;cursor:pointer">
              🖨️ Imprimer planning complet
            </button>
            <button onclick="imprimerPlanning('individuel')" style="padding:14px;border:1px solid var(--border);border-radius:12px;background:none;color:var(--text);font-size:13px;font-weight:600;cursor:pointer">
              👤 Imprimer par employé
            </button>
          </div>
        </div>
      </div>

    </div>
  `;

  pages.appendChild(div);
  if (moisDispo.length) renderRecapTable();
  buildWeekManager();
}

/* ——— GESTIONNAIRE SEMAINES (Admin) ————————— */
let _weekMgrSelected = null;

function buildWeekManager() {
  const weeks = typeof getAllWeeks === 'function' ? getAllWeeks() : {};
  const nums  = Object.keys(weeks).sort((a, b) => Number(a) - Number(b));
  _weekMgrSelected = String(SEMAINE.numero);
  if (!weeks[_weekMgrSelected] && nums.length > 0) _weekMgrSelected = nums[nums.length - 1];
  renderWeekMgrTabs();
}

function renderWeekMgrTabs() {
  const tabsEl   = document.getElementById('week-mgr-tabs');
  const contentEl = document.getElementById('week-mgr-content');
  if (!tabsEl || !contentEl) return;

  const weeks = typeof getAllWeeks === 'function' ? getAllWeeks() : {};
  const nums  = Object.keys(weeks).sort((a, b) => Number(a) - Number(b));
  const active = _weekMgrSelected || String(SEMAINE.numero);

  tabsEl.innerHTML = nums.map(num => {
    const isActive = num === active;
    const entry    = weeks[num];
    const isCurrent = entry && entry.debut && entry.fin && (() => {
      const today = new Date(); today.setHours(12,0,0,0);
      return today >= new Date(entry.debut + 'T00:00:00') && today <= new Date(entry.fin + 'T23:59:59');
    })();
    return `<button onclick="weekMgrSelect('${num}')" style="
      flex-shrink:0;padding:10px 16px;border:none;border-bottom:2px solid ${isActive ? 'var(--noz-navy)' : 'transparent'};
      background:transparent;color:${isActive ? 'var(--noz-navy)' : 'var(--text-muted)'};
      font-size:13px;font-weight:${isActive ? '700' : '500'};cursor:pointer;white-space:nowrap;
      display:flex;align-items:center;gap:5px
    ">S${num}${isCurrent ? '<span style="width:7px;height:7px;border-radius:50%;background:#16a34a;flex-shrink:0"></span>' : ''}</button>`;
  }).join('') +
  `<button onclick="weekMgrAdd()" style="
    flex-shrink:0;padding:10px 14px;border:none;border-bottom:2px solid transparent;
    background:transparent;color:var(--text-muted);font-size:18px;cursor:pointer
  ">+</button>`;

  if (nums.length === 0) {
    contentEl.innerHTML = `<div style="text-align:center;color:var(--text-muted);font-size:13px;padding:12px">Aucune semaine enregistrée.<br>Cliquez sur <b>+</b> pour en ajouter une.</div>`;
    return;
  }
  const sel    = weeks[active] || weeks[nums[nums.length - 1]];
  const selNum = weeks[active] ? active : nums[nums.length - 1];
  const entry  = sel ? (typeof sel === 'string' ? { url: sel } : sel) : {};
  const debut  = entry.debut || '';
  const fin    = entry.fin   || '';
  const url    = entry.url   || '';

  const today = new Date(); today.setHours(12,0,0,0);
  const isCurrent = debut && fin &&
    today >= new Date(debut + 'T00:00:00') && today <= new Date(fin + 'T23:59:59');
  const isUpcoming = debut && new Date(debut + 'T00:00:00') > today;

  const statusBadge = isCurrent
    ? `<span style="background:#dcfce7;color:#16a34a;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">En cours</span>`
    : isUpcoming
    ? `<span style="background:#fef9c3;color:#92400e;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">À venir</span>`
    : `<span style="background:var(--bg-muted);color:var(--text-muted);font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px">Passée</span>`;

  const debutFr = debut ? debut.slice(8) + '/' + debut.slice(5,7) : '—';
  const finFr   = fin   ? fin.slice(8)   + '/' + fin.slice(5,7)   : '—';

  const hasExcel = !!localStorage.getItem('noz_staff_S' + selNum);

  contentEl.innerHTML = `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">
      <div>
        <div style="font-size:17px;font-weight:700;color:var(--text);display:flex;align-items:center;gap:8px">
          Semaine ${selNum}
          <span style="background:var(--noz-navy);color:#fff;font-size:10px;padding:2px 8px;border-radius:10px">ACTIVE</span>
        </div>
        <div style="font-size:13px;color:var(--text-muted);margin-top:3px">${debutFr} au ${finFr}</div>
      </div>
      ${statusBadge}
    </div>

    <div style="margin-bottom:10px">
      <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-bottom:5px">Dates de la semaine</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input id="wm-debut" type="date" value="${debut}" style="flex:1;min-width:130px;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--bg-muted);color:var(--text)">
        <span style="align-self:center;color:var(--text-muted);font-size:13px">au</span>
        <input id="wm-fin" type="date" value="${fin}" style="flex:1;min-width:130px;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--bg-muted);color:var(--text)">
      </div>
    </div>

    <div style="margin-bottom:10px">
      <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-bottom:5px">Lien Google Sheets (CSV) :</div>
      <div style="display:flex;gap:8px">
        <input id="wm-url" type="url" value="${escHtml(url)}" placeholder="https://docs.google.com/spreadsheets/…"
          style="flex:1;border:1px solid var(--border);border-radius:8px;padding:8px 10px;font-size:13px;background:var(--bg-muted);color:var(--text);outline:none">
        <button onclick="weekMgrSave('${selNum}')" style="padding:8px 18px;border:none;border-radius:8px;background:var(--noz-navy);color:#fff;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap">Enregistrer</button>
      </div>
    </div>

    <div style="margin-bottom:14px">
      <div style="font-size:11px;color:var(--text-muted);font-weight:500;margin-bottom:6px">Ou fichier Excel (.xlsx) :</div>
      ${hasExcel
        ? `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
             <span style="font-size:12px;color:#16a34a;font-weight:600">✅ Données Excel importées</span>
             <button onclick="weekMgrExcelClear('${selNum}')" style="padding:5px 12px;border:1.5px solid #dc2626;border-radius:7px;background:none;color:#dc2626;font-size:12px;cursor:pointer">Supprimer</button>
           </div>`
        : `<label style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border:1.5px dashed var(--border);border-radius:8px;cursor:pointer;font-size:13px;color:var(--text-muted)">
             📂 Choisir un fichier Excel
             <input type="file" accept=".xlsx,.xls" style="display:none" onchange="weekMgrImportExcel('${selNum}', this.files[0])">
           </label>`}
    </div>

    <button onclick="weekMgrDelete('${selNum}')" style="padding:7px 16px;border:1.5px solid #dc2626;border-radius:8px;background:none;color:#dc2626;font-size:13px;cursor:pointer">Supprimer</button>
  `;
}

function weekMgrSelect(num) { _weekMgrSelected = String(num); renderWeekMgrTabs(); }

function weekMgrAdd() {
  const weeks = typeof getAllWeeks === 'function' ? getAllWeeks() : {};
  const nums  = Object.keys(weeks).map(Number).sort((a,b) => a-b);
  const next  = nums.length > 0 ? String(nums[nums.length - 1] + 1) : String(SEMAINE.numero + 1);
  if (typeof saveWeekURL === 'function') saveWeekURL(next, '', '', '');
  _weekMgrSelected = next;
  renderWeekMgrTabs();
}

function weekMgrSave(num) {
  const url   = document.getElementById('wm-url')?.value.trim()   || '';
  const debut = document.getElementById('wm-debut')?.value.trim() || '';
  const fin   = document.getElementById('wm-fin')?.value.trim()   || '';
  if (typeof saveWeekURL === 'function') saveWeekURL(num, url, debut, fin);
  showToast('Semaine ' + num + ' enregistrée ✓');
  renderWeekMgrTabs();
  if (url) switchWeek(num);
}

function weekMgrDelete(num) {
  if (!confirm('Supprimer la semaine ' + num + ' ?')) return;
  const weeks = typeof getAllWeeks === 'function' ? getAllWeeks() : {};
  delete weeks[num];
  localStorage.setItem('noz_weeks', JSON.stringify(weeks));
  localStorage.removeItem('noz_staff_S' + num);
  const nums = Object.keys(weeks).sort((a,b) => Number(a)-Number(b));
  if (typeof setActiveWeekNum === 'function') setActiveWeekNum(nums[nums.length - 1] || '');
  renderWeekMgrTabs();
  showToast('Semaine ' + num + ' supprimée');
}

async function weekMgrImportExcel(num, file) {
  if (!file) return;
  if (typeof XLSX === 'undefined') { showToast('❌ SheetJS non chargé'); return; }
  try {
    const data = await file.arrayBuffer();
    const wb   = XLSX.read(data, { type: 'array' });
    const matNom = wb.SheetNames.find(n => n.toUpperCase().includes('MATRICE'));
    const indNom = wb.SheetNames.find(n => n.toUpperCase().includes('INDIVIDUEL'));
    if (!matNom && !indNom) { showToast('❌ Feuilles MATRICE/INDIVIDUEL introuvables'); return; }
    let newStaff = (matNom && indNom) ? parseExcelPlanning(wb, matNom, indNom)
                                      : (indNom ? parseIndividuelOnly(wb, indNom) : null);
    if (!newStaff || newStaff.length === 0) { showToast('❌ Aucun employé trouvé'); return; }
    localStorage.setItem('noz_staff_S' + num, JSON.stringify(newStaff));
    if (String(num) === String(typeof getActiveWeekNum === 'function' ? getActiveWeekNum() : SEMAINE.numero)) {
      STAFF.length = 0; STAFF.push(...newStaff);
      sauvegarderSemaineRecap();
      document.getElementById('nav').innerHTML = ''; document.getElementById('pages').innerHTML = '';
      buildNav(); buildWeekBadge(); buildGlobalPage(); buildCalendarPage();
      buildAdminLockPage(); buildAdminPage();
      STAFF.forEach((s, i) => buildPersonPage(s, i));
      STAFF.forEach((s, i) => renderConsignesFor(s.prenom, null, document.getElementById('consigne-count-' + i)));
      showPage('admin');
    } else { renderWeekMgrTabs(); }
    showToast('✅ ' + newStaff.length + ' employés importés pour S' + num);
  } catch (err) {
    console.error('[weekMgrImportExcel]', err);
    showToast('❌ ' + err.message);
  }
}

function weekMgrExcelClear(num) {
  if (!confirm('Supprimer les données Excel de la semaine ' + num + ' ?')) return;
  localStorage.removeItem('noz_staff_S' + num);
  renderWeekMgrTabs();
  showToast('Données Excel S' + num + ' supprimées');
}

/* ——— PARSER EXCEL ——————————————————————————— */
function parseExcelPlanning(wb, matNom, indNom) {
  const matSheet = wb.Sheets[matNom];
  const indSheet = wb.Sheets[indNom];
  const matData  = XLSX.utils.sheet_to_json(matSheet, { header: 1, defval: '' });
  const indData  = XLSX.utils.sheet_to_json(indSheet, { header: 1, defval: '' });

  for (const row of matData) {
    if (String(row[0]).trim() === 'S :' && /^\d+$/.test(String(row[1] || '').trim())) {
      SEMAINE.numero = parseInt(row[1]);
      const debut = parseDateFr(String(row[2] || ''));
      const fin   = parseDateFr(String(row[4] || ''));
      if (debut) { SEMAINE.debut = debut; if (typeof calcJoursDates === 'function') Object.assign(JOURS_DATES, calcJoursDates(debut)); }
      if (fin)   SEMAINE.fin = fin;
      break;
    }
  }

  const staffHours = parseIndividuelSheet(indData);
  const staffTasks = parseMatriceTasks(matData);
  const prenoms    = Object.keys(staffHours).length > 0 ? Object.keys(staffHours) : Object.keys(staffTasks);
  const JOURS_KEYS = ['Lun','Mar','Mer','Jeu','Ven','Sam'];

  return prenoms.map((prenom, idx) => {
    const existing = STAFF.find(s => s.prenom === prenom);
    const hours = staffHours[prenom] || {};
    const tasks = staffTasks[prenom] || {};
    const shifts = JOURS_KEYS.map((j, i) => {
      const h = hours[i] || { deb: 0, fin: 0, pause_deb: null, pause_fin: null };
      const t = tasks[i] || null;
      return { j, deb: h.deb, fin: h.fin, task: h.deb ? (t || existing?.shifts[i]?.task || null) : null, pause_deb: h.pause_deb, pause_fin: h.pause_fin };
    });
    const totalSemaine = shifts.reduce((s, sh) => {
      if (!sh.deb) return s;
      const brut = sh.fin - sh.deb;
      const pause = sh.pause_deb && sh.pause_fin ? sh.pause_fin - sh.pause_deb : 0;
      return s + brut - pause;
    }, 0);
    return {
      prenom,
      nom:    existing?.nom    || '',
      role:   existing?.role   || 'EMP',
      contrat:existing?.contrat|| 35,
      pin:    existing?.pin    || String(1000 + idx + 1),
      totalSemaine: Math.round(totalSemaine * 4) / 4,
      shifts,
    };
  });
}

function parseIndividuelSheet(rows) {
  const result = {};
  const JOURS_FR = ['LUNDI','MARDI','MERCREDI','JEUDI','VENDREDI','SAMEDI'];
  let colMap = {};
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowUpper = row.map(c => String(c).trim().toUpperCase());
    const hasJour  = JOURS_FR.some(j => rowUpper.includes(j));
    if (hasJour) {
      colMap = {};
      JOURS_FR.forEach((j, i) => { const col = rowUpper.indexOf(j); if (col >= 0) colMap[i] = col; });
      continue;
    }
    const prenom = String(row[0] || row[1] || '').trim();
    if (!prenom || /^(prénom|nom|total|contrat)/i.test(prenom)) continue;
    if (!/^[A-ZÀ-Ü][a-zà-ü]/.test(prenom)) continue;
    if (!result[prenom]) result[prenom] = {};
    Object.entries(colMap).forEach(([jourIdx, col]) => {
      const deb = parseHeureExcel(String(row[col] || '').trim());
      const fin = parseHeureExcel(String(row[col + 1] || '').trim());
      if (deb > 0) {
        result[prenom][parseInt(jourIdx)] = {
          deb, fin,
          pause_deb: parseHeureExcel(String(row[col + 2] || '').trim()) || null,
          pause_fin: parseHeureExcel(String(row[col + 3] || '').trim()) || null,
        };
      }
    });
  }
  return result;
}

function parseMatriceTasks(rows) {
  const result = {};
  const TASK_MAP = { '1':'Pole1','2':'TDM','3':'Pole3','4':'Ecole','5':'Divers','6':'Divers','7':'Pole2','8':'Caisses','9':'Divers','10':'Divers' };
  const JOUR_NOMS = { 'LUNDI':0,'MARDI':1,'MERCREDI':2,'JEUDI':3,'VENDREDI':4,'SAMEDI':5 };
  const blocks = [];
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim() !== 'S :') continue;
    for (let k = 5; k < Math.min(rows[i].length, 15); k++) {
      const v = String(rows[i][k] || '').trim().toUpperCase();
      if (v in JOUR_NOMS) { blocks.push({ jourIdx: JOUR_NOMS[v], startLine: i }); break; }
    }
  }
  for (let b = 0; b < blocks.length; b++) {
    const { jourIdx, startLine } = blocks[b];
    if (jourIdx >= 6) continue;
    const endLine = blocks[b+1] ? blocks[b+1].startLine : rows.length;
    for (let i = startLine + 1; i < endLine; i++) {
      const row = rows[i];
      const prenom = String(row[5] || '').trim();
      if (!prenom || !/^[A-ZÀ-Ü][a-zà-ü]/.test(prenom)) continue;
      if (!result[prenom]) result[prenom] = {};
      const codes = [];
      for (let c = 8; c < Math.min(row.length, 263); c++) {
        const v = String(row[c] || '').trim();
        if (/^\d+$/.test(v) && v !== '0') codes.push(v);
      }
      const count = {}; let best = null, max = 0;
      for (const v of codes) { count[v] = (count[v]||0)+1; if (count[v]>max) { max=count[v]; best=v; } }
      if (best) result[prenom][jourIdx] = TASK_MAP[best] || null;
    }
  }
  return result;
}

function parseIndividuelOnly(wb, indNom) {
  const indData = XLSX.utils.sheet_to_json(wb.Sheets[indNom], { header: 1, defval: '' });
  const hours   = parseIndividuelSheet(indData);
  const JOURS_KEYS = ['Lun','Mar','Mer','Jeu','Ven','Sam'];
  return Object.keys(hours).map((prenom, idx) => {
    const existing = STAFF.find(s => s.prenom === prenom);
    const shifts = JOURS_KEYS.map((j, i) => {
      const h = hours[prenom][i] || { deb: 0, fin: 0, pause_deb: null, pause_fin: null };
      return { j, deb: h.deb, fin: h.fin, task: existing?.shifts[i]?.task || null, pause_deb: h.pause_deb, pause_fin: h.pause_fin };
    });
    const total = shifts.reduce((s, sh) => {
      if (!sh.deb) return s;
      return s + (sh.fin - sh.deb) - (sh.pause_deb && sh.pause_fin ? sh.pause_fin - sh.pause_deb : 0);
    }, 0);
    return { prenom, nom: existing?.nom||'', role: existing?.role||'EMP', contrat: existing?.contrat||35, pin: existing?.pin||String(1000+idx+1), totalSemaine: Math.round(total*4)/4, shifts };
  });
}

function parseHeureExcel(str) {
  if (!str || str === '0' || str === '-' || str === 'R') return 0;
  str = String(str).trim().replace(',', '.');
  const hm = str.match(/^(\d{1,2})[hH](\d{0,2})$/);
  if (hm) return parseInt(hm[1]) + (parseInt(hm[2]||'0')/60);
  const hc = str.match(/^(\d{1,2}):(\d{2})$/);
  if (hc) return parseInt(hc[1]) + parseInt(hc[2])/60;
  const n = parseFloat(str);
  if (!isNaN(n) && n > 0 && n < 1) return Math.round(n * 24 * 4) / 4;
  if (!isNaN(n) && n >= 1) return n;
  return 0;
}

function parseDateFr(str) {
  if (!str) return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
}

function loadStaffOverride() {
  try {
    const activeNum = typeof getActiveWeekNum === 'function' ? getActiveWeekNum() : null;
    if (activeNum) {
      const weekSaved = localStorage.getItem('noz_staff_S' + activeNum);
      if (weekSaved) {
        const data = JSON.parse(weekSaved);
        if (Array.isArray(data) && data.length > 0) { STAFF.length = 0; STAFF.push(...data); return true; }
      }
    }
  } catch {}
  return false;
}

function imprimerPlanning(type) {
  showToast('Préparation impression…');
  setTimeout(() => window.print(), 300);
}

function renderRecapTable() {
  const sel  = document.getElementById('recap-mois-select');
  const zone = document.getElementById('recap-table-zone');
  if (!sel || !zone) return;

  const moisKey = sel.value;
  const recap   = getRecapMensuel();
  const semaines = recap[moisKey];
  if (!semaines) { zone.innerHTML = '<p style="color:var(--text-muted)">Aucune donnée pour ce mois.</p>'; return; }

  // Colonnes = semaines triées
  const semKeys = Object.keys(semaines).sort((a, b) => {
    const na = parseInt(a.replace('S',''));
    const nb = parseInt(b.replace('S',''));
    return na - nb;
  });

  // Lignes = tous les employés trouvés
  const employes = [...new Set(semKeys.flatMap(sk => Object.keys(semaines[sk].heures)))];

  // En-têtes
  const thSems = semKeys.map(sk => {
    const d = semaines[sk].debut || '';
    const f = semaines[sk].fin   || '';
    const label = d ? `${d.slice(8)}/${d.slice(5,7)}` : sk;
    return `<th style="padding:8px 12px;text-align:center;background:var(--noz-navy);color:#fff;font-size:12px;white-space:nowrap">${sk}<br><span style="font-weight:400;opacity:.7;font-size:10px">${label}</span></th>`;
  }).join('');

  // Lignes employés
  const rows = employes.map((prenom, ri) => {
    const s      = STAFF.find(x => x.prenom === prenom);
    const rc     = s ? roleColor(s.role) : '#888';
    const ini    = s ? initiales(s) : prenom[0].toUpperCase();
    const bg     = ri % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-muted)';

    const cells = semKeys.map(sk => {
      const h = semaines[sk].heures[prenom];
      if (h === undefined || h === null) return `<td style="padding:8px 12px;text-align:center;background:${bg};color:var(--text-muted);font-size:13px">—</td>`;
      const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      const label = mm > 0 ? `${hh}h${String(mm).padStart(2,'0')}` : `${hh}h`;
      const contrat = s ? s.contrat : 35;
      const over = h > contrat;
      const color = over ? '#dc2626' : h < contrat * 0.8 ? '#f59e0b' : 'var(--text)';
      return `<td style="padding:8px 12px;text-align:center;background:${bg};font-size:13px;font-weight:600;color:${color}">${label}</td>`;
    }).join('');

    const total = semKeys.reduce((sum, sk) => sum + (semaines[sk].heures[prenom] || 0), 0);
    const th = Math.floor(total), tm = Math.round((total - th) * 60);
    const totalLabel = tm > 0 ? `${th}h${String(tm).padStart(2,'0')}` : `${th}h`;

    return `<tr>
      <td style="padding:8px 12px;background:${bg};white-space:nowrap">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="width:26px;height:26px;border-radius:50%;background:${rc};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0">${ini}</span>
          <span style="font-size:13px;font-weight:600;color:var(--text)">${prenom}</span>
        </div>
      </td>
      ${cells}
      <td style="padding:8px 12px;text-align:center;background:var(--noz-navy);color:#fff;font-size:13px;font-weight:700">${totalLabel}</td>
    </tr>`;
  }).join('');

  // Ligne totaux par semaine
  const totaux = semKeys.map(sk => {
    const t = Object.values(semaines[sk].heures).reduce((s, h) => s + (h || 0), 0);
    const hh = Math.floor(t), mm = Math.round((t - hh) * 60);
    return `<td style="padding:8px 12px;text-align:center;background:#0D2240;color:#fff;font-size:12px;font-weight:700">${hh}h${String(mm).padStart(2,'0')}</td>`;
  }).join('');

  zone.innerHTML = `
    <div style="overflow-x:auto;border-radius:var(--radius-md);border:1px solid var(--border)">
      <table style="width:100%;border-collapse:collapse;min-width:400px">
        <thead>
          <tr>
            <th style="padding:10px 12px;text-align:left;background:var(--noz-navy);color:#fff;font-size:12px">Employé</th>
            ${thSems}
            <th style="padding:10px 12px;text-align:center;background:var(--noz-navy);color:#fff;font-size:12px">Total mois</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td style="padding:8px 12px;background:#0D2240;color:#fff;font-size:12px;font-weight:700">Total équipe</td>
            ${totaux}
            <td style="background:#0D2240"></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <div style="margin-top:8px;font-size:11px;color:var(--text-muted)">
      🔴 Dépassement contrat &nbsp;|&nbsp; 🟡 &lt; 80% contrat &nbsp;|&nbsp; ⚫ Normal
    </div>
  `;
}

function imprimerRecap() {
  showToast('Impression en cours…');
  setTimeout(() => window.print(), 200);
}


/* ——— SÉLECTEUR DE SEMAINE ————————————————— */
function buildWeekBadge() {
  const badge = document.getElementById('week-badge');
  if (!badge) return;

  const weeks = typeof getAllWeeks === 'function' ? getAllWeeks() : {};
  const nums  = Object.keys(weeks).sort((a, b) => Number(a) - Number(b));

  // Toujours afficher le numéro de semaine + flèche cliquable
  badge.style.cursor = 'pointer';
  badge.title = nums.length > 1 ? 'Changer de semaine' : 'Actualiser le planning';
  badge.innerHTML = `S${SEMAINE.numero} <span style="font-size:9px;opacity:.6">▼</span>`;
  badge.onclick = (e) => { e.stopPropagation(); toggleWeekPicker(badge, nums); };
}

function toggleWeekPicker(badge, nums) {
  const existing = document.getElementById('week-picker');
  if (existing) { existing.remove(); return; }

  const rect   = badge.getBoundingClientRect();
  const active = String(typeof getActiveWeekNum === 'function' ? getActiveWeekNum() : SEMAINE.numero);

  const picker = document.createElement('div');
  picker.id = 'week-picker';
  picker.style.cssText = `
    position:fixed;top:${rect.bottom + 6}px;right:12px;
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,0.15);
    z-index:9999;overflow:hidden;min-width:180px;
  `;

  if (nums.length === 0) {
    // Aucune semaine sauvegardée — juste bouton actualiser
    const div = document.createElement('div');
    div.style.cssText = 'padding:10px 14px;font-size:12px;color:var(--text-muted)';
    div.textContent = 'Aucune semaine enregistrée';
    picker.appendChild(div);
  } else {
    nums.forEach(num => {
      const isActive = num === active;
      const btn = document.createElement('button');
      btn.style.cssText = `
        display:flex;align-items:center;justify-content:space-between;
        width:100%;padding:12px 16px;border:none;border-bottom:1px solid var(--border);
        background:${isActive ? 'var(--noz-navy)' : 'transparent'};
        color:${isActive ? '#fff' : 'var(--text)'};
        font-size:14px;font-weight:${isActive ? '700' : '400'};
        text-align:left;cursor:pointer;gap:12px;
      `;
      btn.innerHTML = `<span>Semaine ${num}</span>${isActive ? '<span style="font-size:11px">✓</span>' : ''}`;
      btn.onclick = (e) => { e.stopPropagation(); switchWeek(num); };
      picker.appendChild(btn);
    });
  }

  // Bouton Actualiser toujours présent
  const refreshBtn = document.createElement('button');
  refreshBtn.style.cssText = `
    display:flex;align-items:center;gap:8px;
    width:100%;padding:10px 16px;border:none;
    background:transparent;color:var(--text-light);
    font-size:12px;text-align:left;cursor:pointer;
  `;
  refreshBtn.innerHTML = '🔄 Actualiser le planning';
  refreshBtn.onclick = (e) => { e.stopPropagation(); picker.remove(); switchWeek(active || String(SEMAINE.numero)); };
  picker.appendChild(refreshBtn);

  document.body.appendChild(picker);
  setTimeout(() => {
    document.addEventListener('click', () => document.getElementById('week-picker')?.remove(), { once: true });
  }, 50);
}

async function switchWeek(num) {
  document.getElementById('week-picker')?.remove();
  if (typeof setActiveWeekNum === 'function') setActiveWeekNum(num);
  showSyncToast(`Chargement semaine ${num}…`);

  loadStaffOverride();
  if (typeof fetchAndApplySheet === 'function') await fetchAndApplySheet();

  // Reconstruire toute l'interface
  document.getElementById('nav').innerHTML   = '';
  document.getElementById('pages').innerHTML = '';

  sauvegarderSemaineRecap();
  buildNav();
  buildWeekBadge();
  buildGlobalPage();
  buildCalendarPage();
  buildAdminLockPage();
  buildAdminPage();
  STAFF.forEach((s, i) => buildPersonPage(s, i));
  STAFF.forEach((s, i) => {
    const ct = document.getElementById('consigne-count-' + i);
    renderConsignesFor(s.prenom, null, ct);
  });
  showPage('global');
  showSyncToast(`Semaine ${SEMAINE.numero} chargée ✓`);
}

/* ——— INIT ———————————————————————————————— */
async function init() {
  // Synchroniser les semaines depuis Firebase
  if (typeof loadSheetURLFromFirebase === 'function') {
    await loadSheetURLFromFirebase();
  }

  // Nettoyer la semaine active si elle n'existe plus dans la liste
  const _allWeeks = typeof getAllWeeks === 'function' ? getAllWeeks() : {};
  const _storedActive = typeof getActiveWeekNum === 'function' ? getActiveWeekNum() : null;
  if (_storedActive && !_allWeeks[_storedActive]) {
    // Semaine active périmée → la réinitialiser
    localStorage.removeItem('noz_active_week');
  }

  // Auto-sélectionner la semaine en cours selon la date
  if (typeof detectCurrentWeek === 'function') {
    const current = detectCurrentWeek();
    if (current && typeof setActiveWeekNum === 'function') {
      setActiveWeekNum(current);
    } else {
      // Aucune semaine avec dates — prendre la plus récente disponible
      const nums = Object.keys(_allWeeks).sort((a, b) => Number(a) - Number(b));
      if (nums.length > 0 && typeof setActiveWeekNum === 'function') setActiveWeekNum(nums[nums.length - 1]);
    }
  }

  // Charger les données Excel importées (priorité sur data.js)
  loadStaffOverride();

  // Charger le planning depuis Google Sheets
  if (typeof fetchAndApplySheet === 'function') {
    const ok = await fetchAndApplySheet();
    if (!ok) console.warn('[NOZ] fetchAndApplySheet a échoué — données data.js utilisées');
  }

  document.getElementById('week-badge').textContent = `S${SEMAINE.numero}`;

  sauvegarderSemaineRecap();
  buildNav();
  buildWeekBadge();
  buildGlobalPage();
  buildCalendarPage();
  buildAdminLockPage();
  buildAdminPage();
  STAFF.forEach((s, i) => buildPersonPage(s, i));

  STAFF.forEach((s, i) => {
    const countEl = document.getElementById('consigne-count-' + i);
    renderConsignesFor(s.prenom, null, countEl);
  });

  showPage('global');
  setupPDF();

  // Firebase : charger les données puis écouter les changements en temps réel
  if (typeof initFirebase === 'function') {
    await initFirebase();
    await syncGetOverrides();
    onRemoteChange();

    startRealTimeSync(
      () => onRemoteChange(),
      () => {
        STAFF.forEach((s, i) => {
          const ct = document.getElementById('consigne-count-' + i);
          renderConsignesFor(s.prenom, null, ct);
        });
        renderConsignesPage();
        showSyncToast('Consignes mises à jour ↗');
      }
    );
  }
}

document.addEventListener('DOMContentLoaded', init);
