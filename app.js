// =============================================
//  NOZ P854 — Application Planning
//  app.js — logique principale
// =============================================

/* ——— NAV ——————————————————————————————————— */
function buildNav() {
  const nav = document.getElementById('nav');

  const tabs = [
    { id: 'global',     label: 'Planning global', icon: '📅' },
    { id: 'calendar',   label: 'Calendrier',      icon: '🗓' },
    { id: 'consignes',  label: 'Consignes',        icon: '📌' },
    ...STAFF.map((s, i) => ({ id: 'p' + i, label: s.prenom, staff: s })),
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

    btn.addEventListener('click', () => showPage(tab.id));

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
      if (!sh || !sh.deb) return `<td style="padding:5px 4px"><span class="shift-pill shift-repos">Repos</span></td>`;
      const t = TASKS[sh.task] || { color: '#888', label: sh.task };
      return `<td style="padding:5px 4px">
        <span class="shift-pill" style="background:${t.color}" title="${sh.task} — ${sh.deb}h à ${sh.fin}h">
          ${sh.deb}h–${sh.fin}h
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
        <span class="${ok ? 'h-ok' : 'h-warn'}">${total}h</span>
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
        <div class="stat-card-num">${totalPlannif}h</div>
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

    if (!sh.deb) {
      return `
        <div class="day-card repos">
          <div class="day-card-inner">
            <span class="day-label">${jour}</span>
            <span class="day-date">${jourFull} ${date}</span>
            <span style="font-size:12px;color:var(--text-light);font-style:italic">Jour de repos</span>
          </div>
        </div>`;
    }

    const t = TASKS[sh.task] || { color: '#888', label: sh.task || '' };
    const dur = sh.fin - sh.deb;

    const leftPct  = ((sh.deb - TL_START) / TL_SPAN * 100).toFixed(1);
    const widthPct = (dur / TL_SPAN * 100).toFixed(1);

    const ticks = [];
    for (let h = TL_START; h <= TL_END; h += 3) {
      ticks.push(`<span>${h}h</span>`);
    }

    return `
      <div class="day-card">
        <div class="day-card-inner">
          <span class="day-label">${jour}</span>
          <span class="day-date">${jourFull} ${date}</span>
          <span class="day-task-badge" style="background:${t.color}">${t.label}</span>
          <span class="day-hours-range" style="margin-left:8px">${sh.deb}h00 → ${sh.fin}h00</span>
          <span class="day-dur">${dur}h</span>
        </div>
        <div class="tl-wrap">
          <div class="tl-track">
            <div class="tl-fill" style="left:${leftPct}%;width:${widthPct}%;background:${t.color}">
              ${sh.deb}h–${sh.fin}h
            </div>
          </div>
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
      </div>
      <div class="ph-stats">
        <div class="ph-stat-num ${ok ? 'ph-stat-ok' : 'ph-stat-warn'}">${total}h</div>
        <div class="ph-stat-label">planifiées / ${s.contrat}h</div>
      </div>
    </div>

    <div class="week-list">${dayCards}</div>

    <div style="margin-top:12px;padding:10px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:space-between;font-size:12px;">
      <span style="color:var(--text-muted)">Heures planifiées cette semaine</span>
      <span style="font-weight:700;color:${ok?'#16a34a':'#ea580c'}">
        ${total}h / ${s.contrat}h · Écart : ${total >= s.contrat ? '+' : ''}${total - s.contrat}h
      </span>
    </div>

    <div style="margin-top:16px">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--text-muted);margin-bottom:8px;display:flex;align-items:center;gap:8px">
        Consignes du gérant
        <span id="consigne-count-${i}" style="background:var(--noz-red);color:#fff;font-size:9px;padding:1px 6px;border-radius:10px;font-weight:700"></span>
      </div>
      <div id="consignes-${i}"></div>
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
  let current = new Date(2026, 3, 1); // Avril 2026

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
    const weekDates = {
      'Lun': '2026-04-13', 'Mar': '2026-04-14', 'Mer': '2026-04-15',
      'Jeu': '2026-04-16', 'Ven': '2026-04-17', 'Sam': '2026-04-18', 'Dim': '2026-04-19',
    };
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
        `<div class="cal-event" style="background:${ev.color}" title="${ev.prenom} — ${ev.task} ${ev.deb}h–${ev.fin}h">
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

function renderConsignesFor(prenom, containerEl, countEl) {
  const list = getConsignesFor(prenom);
  if (countEl) countEl.textContent = list.length > 0 ? list.length : '';

  if (!list.length) {
    containerEl.innerHTML = '<div class="consigne-empty">Aucune consigne en cours</div>';
    return;
  }

  containerEl.innerHTML = list.map(c => {
    const icons = { haute: '🔴', normale: '🟡', info: '🔵' };
    const icon  = icons[c.priority] || '🟡';
    return `
      <div class="consigne-banner priority-${c.priority}" data-id="${c.id}">
        <span class="consigne-icon">${icon}</span>
        <div class="consigne-body">
          <div class="consigne-from">
            ${c.from}
            <span class="priority-badge priority-${c.priority}">${c.priority}</span>
            ${c.dest === 'Tous' ? '<span class="priority-badge" style="background:var(--bg-muted);color:var(--text-muted)">Tous</span>' : ''}
          </div>
          <div class="consigne-text">${escHtml(c.text)}</div>
          <div class="consigne-date">${c.date}</div>
        </div>
        <button class="consigne-del" onclick="deleteConsigne(${c.id})" title="Supprimer">×</button>
      </div>`;
  }).join('');
}

function refreshAllConsignes() {
  STAFF.forEach((s, i) => {
    const container = document.getElementById('consignes-' + i);
    const countEl   = document.getElementById('consigne-count-' + i);
    if (container) renderConsignesFor(s.prenom, container, countEl);
  });
  // Refresh consignes page if open
  renderConsignesPage();
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
  const text     = document.getElementById('consigne-text').value.trim();
  const dest     = document.getElementById('consigne-dest').value;
  const priority = document.getElementById('consigne-priority').value;
  if (!text) {
    document.getElementById('consigne-text').style.borderColor = '#dc2626';
    setTimeout(() => document.getElementById('consigne-text').style.borderColor = 'var(--border)', 1500);
    return;
  }
  addConsigne(dest, text, priority);
  document.getElementById('consigne-text').value = '';
  showToast('Consigne envoyée ✓');
}

function clearAllConsignes() {
  if (!confirm('Effacer toutes les consignes ?')) return;
  localStorage.removeItem(CONSIGNES_KEY);
  refreshAllConsignes();
  updateNavBadges();
  showToast('Consignes effacées');
}

/* ——— INIT ———————————————————————————————— */
function init() {
  document.getElementById('week-badge').textContent = `Semaine ${SEMAINE.numero}`;

  buildNav();
  buildGlobalPage();
  buildCalendarPage();
  buildConsignesPage();
  STAFF.forEach((s, i) => buildPersonPage(s, i));

  // Render consignes on person pages
  STAFF.forEach((s, i) => {
    const container = document.getElementById('consignes-' + i);
    const countEl   = document.getElementById('consigne-count-' + i);
    if (container) renderConsignesFor(s.prenom, container, countEl);
  });

  showPage('global');
  setupPDF();
}

document.addEventListener('DOMContentLoaded', init);
