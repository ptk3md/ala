/**
 * @typedef {Object} StudentRow
 * @property {string|number} Matrícula
 * @property {string} Nome do Aluno
 * @property {string} E-mail
 * @property {Object.<string, string|number>} [Disciplines]
 */

// ==========================================
// 0. BOOTSTRAP, DOM HELPER & CSS COMPRIMIDO
// ==========================================
const $ = (t, p = {}, h = '') => Object.assign(document.createElement(t), p, { innerHTML: h });

document.head.append(
  $('link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap' }),
  $('style', {}, `:root{--bg:#f5f6fa;--surface:#fff;--surface-2:#f0f2f7;--border:#e2e5ef;--border-focus:#4361ee;--primary:#4361ee;--primary-dim:rgba(67,97,238,.1);--teal:#0096c7;--teal-dim:rgba(0,150,199,.1);--green:#2d9d78;--green-dim:rgba(45,157,120,.1);--red:#e05252;--red-dim:rgba(224,82,82,.1);--amber:#d97706;--amber-dim:rgba(217,119,6,.1);--text:#1a1d2e;--text-2:#5a607a;--text-3:#9299b0;--radius-sm:6px;--radius:10px;--radius-lg:16px;--shadow-sm:0 1px 3px rgba(26,29,46,.07),0 1px 2px rgba(26,29,46,.04);--shadow:0 4px 16px rgba(26,29,46,.08),0 1px 4px rgba(26,29,46,.04);--font:'Sora',sans-serif;--mono:'IBM Plex Mono',monospace;--t-base:.875rem;--t-sm:.8125rem;--t-xs:.75rem}*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body.med-light{background:var(--bg);color:var(--text);font-family:var(--font);font-size:var(--t-base);line-height:1.6;-webkit-font-smoothing:antialiased}.layout{display:flex;min-height:100vh}.sidebar{width:220px;flex-shrink:0;background:var(--surface);border-right:1px solid var(--border);padding:1.5rem 1rem;display:flex;flex-direction:column;gap:.75rem;position:fixed;height:100vh;overflow-y:auto;z-index:100}.main{margin-left:220px;flex:1;padding:2rem 2.5rem;max-width:1400px}.sidebar-brand{display:flex;align-items:center;gap:10px;padding:.5rem .75rem;margin-bottom:.75rem}.sidebar-brand-icon{width:32px;height:32px;background:var(--primary);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;color:#fff}.sidebar-brand-name{font-size:1.0625rem;font-weight:700;color:var(--text);letter-spacing:-.3px}.sidebar-profile{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:1rem;margin-bottom:.5rem}.sidebar-avatar{width:40px;height:40px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--mono);font-size:1.125rem;font-weight:500;margin-bottom:.625rem}.sidebar-name{font-size:var(--t-sm);font-weight:600;line-height:1.3;color:var(--text)}.sidebar-id{font-family:var(--mono);font-size:var(--t-xs);color:var(--text-3);margin-top:2px}.badge-pct{display:inline-flex;margin-top:.5rem;padding:2px 8px;border-radius:99px;background:var(--green-dim);color:var(--green);font-size:var(--t-xs);font-weight:600}.nav-link{display:flex;align-items:center;gap:10px;padding:.625rem .875rem;border-radius:var(--radius-sm);text-decoration:none;font-size:var(--t-sm);font-weight:500;color:var(--text-2);transition:background .15s,color .15s}.nav-link:hover{background:var(--surface-2);color:var(--text)}.nav-link.active{background:var(--primary-dim);color:var(--primary)}.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:var(--shadow-sm);padding:1.5rem;transition:box-shadow .2s}.card:hover{box-shadow:var(--shadow)}.card-title{font-size:var(--t-sm);font-weight:600;color:var(--text);margin-bottom:1rem;letter-spacing:-.2px}.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1.75rem}.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1.25rem 1.5rem;box-shadow:var(--shadow-sm);position:relative;overflow:hidden}.kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;border-radius:var(--radius-lg) var(--radius-lg) 0 0}.kpi-card.primary::before{background:var(--primary)}.kpi-card.green::before{background:var(--green)}.kpi-card.teal::before{background:var(--teal)}.kpi-card.amber::before{background:var(--amber)}.kpi-label{font-size:var(--t-xs);font-weight:600;text-transform:uppercase;letter-spacing:.7px;color:var(--text-3);margin-bottom:.375rem}.kpi-value{font-family:var(--mono);font-size:2rem;font-weight:500;letter-spacing:-1px;color:var(--text);line-height:1;margin-bottom:.375rem}.kpi-sub{font-size:var(--t-xs);color:var(--text-3)}.chart-section{display:grid;gap:1rem;margin-bottom:1.5rem}.chart-section.cols-2-1{grid-template-columns:2fr 1fr}.chart-section.cols-2{grid-template-columns:1fr 1fr}.chart-wrap{position:relative}.chart-wrap canvas{display:block}.insight-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.75rem}.insight{padding:.875rem 1rem;border-radius:var(--radius);border-left:3px solid;font-size:var(--t-sm)}.insight.green{background:var(--green-dim);border-color:var(--green)}.insight.red{background:var(--red-dim);border-color:var(--red)}.insight.teal{background:var(--teal-dim);border-color:var(--teal)}.insight-head{font-weight:600;margin-bottom:.25rem;display:flex;align-items:center;gap:6px;font-size:var(--t-xs);text-transform:uppercase;letter-spacing:.5px}.insight.green .insight-head{color:var(--green)}.insight.red .insight-head{color:var(--red)}.insight.teal .insight-head{color:var(--teal)}.insight-body{color:var(--text);line-height:1.5}.filter-bar{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:1rem 1.25rem;margin-bottom:1.5rem;display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;box-shadow:var(--shadow-sm)}.filter-group{display:flex;flex-direction:column;gap:.375rem;min-width:0}.filter-label{font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--text-3)}.filter-chips{display:flex;flex-wrap:wrap;gap:.375rem}.chip{display:inline-flex;align-items:center;padding:4px 12px;border-radius:99px;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);font-size:var(--t-xs);font-weight:600;cursor:pointer;transition:all .15s;user-select:none;white-space:nowrap;font-family:var(--font)}.chip:hover,.chip.active{border-color:var(--primary);color:var(--primary);background:var(--primary-dim)}.filter-sep{width:1px;background:var(--border);align-self:stretch;flex-shrink:0}.filter-summary{margin-left:auto;align-self:center;font-size:var(--t-xs);color:var(--text-3);white-space:nowrap}.filter-summary strong{color:var(--primary)}.filter-reset{align-self:center;display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;border:1.5px solid var(--border);background:transparent;color:var(--text-3);font-size:var(--t-xs);font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:var(--font)}.filter-reset:hover{border-color:var(--red);color:var(--red);background:var(--red-dim)}.empty-state{text-align:center;padding:3rem 1rem;color:var(--text-3)}.empty-state svg{margin:0 auto .75rem;display:block;opacity:.4}.empty-state p{font-size:var(--t-sm)}.heatmap-wrap{overflow-x:auto;margin-top:.5rem}.heatmap-grid{display:grid;gap:3px;min-width:max-content}.hm-header{font-family:var(--mono);font-size:var(--t-xs);color:var(--text-3);text-align:center;padding:2px}.hm-row-label{font-size:var(--t-xs);color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:8px;display:flex;align-items:center}.hm-cell{width:38px;height:38px;border-radius:4px;font-family:var(--mono);font-size:10px;font-weight:500;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .15s,box-shadow .15s;position:relative}.hm-cell:hover{transform:scale(1.15);z-index:10;box-shadow:var(--shadow)}.hm-cell.empty{background:var(--surface-2)}.hm-cell.grade-hi{background:#2d9d78;color:#fff}.hm-cell.grade-mid{background:#0096c7;color:#fff}.hm-cell.grade-low{background:#e05252;color:#fff}.data-table{width:100%;border-collapse:collapse}.data-table th{font-size:var(--t-xs);font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:var(--text-3);border-bottom:2px solid var(--border);padding:.875rem 1rem;text-align:left;cursor:pointer;user-select:none;white-space:nowrap}.data-table th:hover{color:var(--text-2)}.data-table th .sort-icon{margin-left:4px;opacity:.4;font-style:normal}.data-table th.sorted .sort-icon{opacity:1;color:var(--primary)}.data-table td{padding:.75rem 1rem;border-bottom:1px solid var(--border);font-size:var(--t-sm);vertical-align:middle}.data-table td.mono{font-family:var(--mono)}.data-table tr:last-child td{border-bottom:none}.data-table tr:hover td{background:var(--bg)}.badge{display:inline-flex;padding:2px 9px;border-radius:99px;font-size:var(--t-xs);font-weight:600}.badge.ok{background:var(--green-dim);color:var(--green)}.badge.bad{background:var(--red-dim);color:var(--red)}.dropzone{border:1.5px dashed var(--border-focus);border-radius:var(--radius);padding:1.25rem;text-align:center;cursor:pointer;background:var(--primary-dim);transition:background .15s;font-size:var(--t-sm)}.dropzone:hover{background:rgba(67,97,238,.15)}.upload-status{font-size:var(--t-xs);margin-top:.5rem;text-align:center;font-weight:600}.page-header{margin-bottom:1.75rem}.page-title{font-size:1.625rem;font-weight:700;letter-spacing:-.5px;color:var(--text)}.page-sub{font-size:var(--t-sm);color:var(--text-3);margin-top:2px}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}.fade-1{animation:fadeUp .45s ease-out .0s both}.fade-2{animation:fadeUp .45s ease-out .07s both}.fade-3{animation:fadeUp .45s ease-out .14s both}.fade-4{animation:fadeUp .45s ease-out .21s both}.fade-5{animation:fadeUp .45s ease-out .28s both}::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--border);border-radius:99px}@media(max-width:1024px){.sidebar,.filter-sep{display:none}.main{margin-left:0;padding:1.5rem}.chart-section.cols-2-1,.chart-section.cols-2,.insight-strip{grid-template-columns:1fr}.filter-bar{gap:1rem}}`)
);

// ==========================================
// STATE & CONFIG
// ==========================================
const STATE = { rawDataMap: new Map(), currentUser: null, fullData: null, activeFilters: { periods: new Set(), categories: new Set() }, tableSort: { key: 'period', dir: 'desc' } };
const CAT_LABELS = ['Básicas', 'Clínica', 'Cirurgia', 'Saúde Pública', 'Humanidades'];
const _charts = {};

// ==========================================
// CHART HELPERS
// ==========================================
const gridOpts = () => ({ color: '#e2e5ef', drawBorder: false });
const tickOpts = () => ({ color: '#9299b0', font: { size: 11 } });
const baseOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, interaction: { mode: 'index', intersect: false } };
const makeChart = (id, type, data, opts) => _charts[id] = new Chart(document.getElementById(id).getContext('2d'), { type, data, options: { ...baseOpts, ...opts } });

function applyChartDefaults() {
  Object.assign(Chart.defaults, { font: { family: "'Sora', sans-serif", size: 12 }, color: '#5a607a' });
  Object.assign(Chart.defaults.plugins.tooltip, { backgroundColor: '#1a1d2e', titleColor: '#fff', bodyColor: '#c8cde0', padding: 10, cornerRadius: 6, displayColors: true, boxPadding: 4 });
  Chart.defaults.plugins.legend.labels = { ...Chart.defaults.plugins.legend.labels, usePointStyle: true, pointStyleWidth: 8, boxHeight: 8, padding: 16, font: { size: 11, family: "'Sora', sans-serif" } };
}

// ==========================================
// 1. LOGIN & UPLOADER
// ==========================================
(function injectCSVUploader() {
  const form = document.getElementById('login-form');
  if (!form || document.getElementById('csv-dropzone')) return;
  form.prepend($('div', { className: 'input-group' }, `<label style="color:var(--text-2);font-family:var(--font);font-size:.8125rem;font-weight:600;margin-bottom:.4rem;display:block;">Base de Dados Acadêmica</label><div id="csv-dropzone" class="dropzone"><span id="dropzone-text">Clique ou arraste o arquivo CSV</span><input type="file" id="csv-upload" accept=".csv" multiple style="display:none;"></div><div id="upload-status" class="upload-status" style="color:var(--green);"></div>`));
  const [dz, fi, st] = ['csv-dropzone', 'csv-upload', 'upload-status'].map(id => document.getElementById(id));
  dz.onclick = () => fi.click();
  dz.ondragover = e => { e.preventDefault(); dz.style.background = 'rgba(67,97,238,.18)'; };
  dz.ondragleave = () => dz.style.background = '';
  dz.ondrop = e => { e.preventDefault(); dz.style.background = ''; handleFiles(e.dataTransfer.files); };
  fi.onchange = e => handleFiles(e.target.files);

  const handleFiles = files => {
    if (!files.length) return;
    st.style.color = 'var(--text-2)'; st.textContent = `Processando ${files.length} arquivo(s)…`;
    Array.from(files).forEach(f => f.name.endsWith('.csv') && parseCSV(f));
  };
})();

function parseCSV(fileOrUrl, isSilent = false) {
  Papa.parse(fileOrUrl, {
    download: typeof fileOrUrl === 'string', header: true, dynamicTyping: true, skipEmptyLines: true,
    complete({ data }) {
      data.forEach(r => String(r['Matrícula'] || '').trim() && STATE.rawDataMap.set(String(r['Matrícula']).trim(), r));
      const st = document.getElementById('upload-status');
      if (st && !isSilent) { st.style.color = 'var(--green)'; st.textContent = `✓ ${STATE.rawDataMap.size} registros carregados`; }
    },
  });
}
parseCSV('Planilha_Academica_Medicina.csv', true);

const [formEl, emailInput, matriculaInput, loginBtn, errorEl] = ['login-form', 'email', 'matricula', 'login-btn', 'login-error'].map(id => document.getElementById(id));
const validateForm = () => loginBtn && (loginBtn.disabled = !((emailInput.value.includes('@') && matriculaInput.value.length >= 4) || (emailInput.value.toLowerCase() === 'teste' && matriculaInput.value === 'teste')));
[emailInput, matriculaInput].forEach(el => el?.addEventListener('input', validateForm));

formEl?.addEventListener('submit', async e => {
  e.preventDefault();
  loginBtn.textContent = 'Autenticando…';
  try {
    await new Promise(r => setTimeout(r, 500));
    const user = Array.from(STATE.rawDataMap.values()).find(r => String(r['E-mail']).toLowerCase() === emailInput.value.trim().toLowerCase() && String(r['Matrícula']) === matriculaInput.value.trim());
    if (!user) throw new Error('Credenciais inválidas.');
    STATE.currentUser = user; document.body.classList.add('med-light'); buildDashboard();
  } catch (err) {
    errorEl.textContent = err.message; errorEl.classList.remove('hidden'); loginBtn.textContent = 'Acessar Dashboard';
  }
});

// ==========================================
// 3. DATA ENGINE (Otimizado)
// ==========================================
const categorizeDiscipline = name => {
  const map = { 'sociologia':'Humanidades','antropologia':'Humanidades','ética':'Humanidades','filosofia':'Humanidades','saúde e sociedade':'Saúde Pública','epidemiologia':'Saúde Pública','pesquisa':'Saúde Pública','cirurgia':'Cirurgia','operatória':'Cirurgia','anestesiologia':'Cirurgia','habilidades':'Clínica','clínica':'Clínica','semiologia':'Clínica','pediatria':'Clínica','internato':'Clínica' };
  const key = Object.keys(map).find(k => name.toLowerCase().includes(k));
  return key ? map[key] : 'Básicas';
};

function processData() {
  const [user, allUsers] = [STATE.currentUser, Array.from(STATE.rawDataMap.values())];
  const [total, userMat] = [allUsers.length, String(user['Matrícula'])];
  const [periodsMap, discStats, catStats, allPeriodMeans, userPeriodMeans] = [{}, {}, {}, {}, {}];
  
  Object.keys(user).forEach(k => {
    const m = k.match(/\((\d+)º Período\)\s+(.+)/);
    if (!m) return;
    const [_, p, name] = [null, +m[1], m[2]];
    (periodsMap[p] ??= []).push(k);
    discStats[k] = { name, period: p, category: categorizeDiscipline(name), userGrade: user[k] || 0, sum: 0, count: 0 };
  });

  const periods = Object.keys(periodsMap).map(Number).sort((a, b) => a - b);
  CAT_LABELS.forEach(k => catStats[k] = { u: 0, uc: 0, c: 0, cc: 0 });
  periods.forEach(p => allPeriodMeans[p] = []);

  const cohortCRs = new Float32Array(total);
  let userCR = 0;

  allUsers.forEach((u, i) => {
    const isUser = String(u['Matrícula']) === userMat;
    let [tSum, tCount] = [0, 0];
    periods.forEach(p => {
      let [pSum, pCount] = [0, 0];
      periodsMap[p].forEach(k => {
        const g = u[k];
        if (typeof g === 'number') {
          pSum += g; pCount++;
          discStats[k].sum += g; discStats[k].count++;
          const c = catStats[discStats[k].category];
          c.c += g; c.cc++;
          if (isUser) { c.u += g; c.uc++; }
        }
      });
      if (pCount > 0) { allPeriodMeans[p].push(pSum / pCount); if (isUser) userPeriodMeans[p] = pSum / pCount; }
      tSum += pSum; tCount += pCount;
    });
    cohortCRs[i] = tCount > 0 ? tSum / tCount : 0;
    if (isUser) userCR = cohortCRs[i];
  });

  const userRank = cohortCRs.reduce((acc, cr) => cr > userCR ? acc + 1 : acc, 1);
  const userPct = Math.round((userRank / total) * 100); // Ajustado para métrica "Top %"

  const statsPerPeriod = periods.map(p => {
    const means = [...allPeriodMeans[p]].sort((a, b) => a - b);
    const mean = means.reduce((a, b) => a + b, 0) / means.length;
    return { period: p, studentMean: userPeriodMeans[p] ?? 0, cohortMean: mean, cohortStdDev: Math.sqrt(Math.max(0, means.reduce((sq, v) => sq + (v - mean) ** 2, 0) / (means.length - 1 || 1))), top10Mean: means[Math.floor(means.length * 0.9)] ?? mean };
  });

  return { statsPerPeriod, userCR, userRank, totalStudents: total, userPercentile: userPct, trendDiff: (statsPerPeriod.at(-1)?.studentMean ?? 0) - userCR, cohortCRs, catStats, disciplines: Object.values(discStats).map(d => ({ ...d, cohortMean: d.count ? d.sum / d.count : 0, diff: d.userGrade - (d.count ? d.sum / d.count : 0) })).filter(d => d.userGrade > 0), periods };
}

const getFilteredView = fd => {
  const { periods: ap, categories: ac } = STATE.activeFilters;
  const disciplines = fd.disciplines.filter(d => (!ap.size || ap.has(d.period)) && (!ac.size || ac.has(d.category)));
  const catStats = Object.fromEntries(CAT_LABELS.map(k => [k, { u: 0, uc: 0, c: 0, cc: 0 }]));
  disciplines.forEach(d => { const c = catStats[d.category]; c.u += d.userGrade; c.uc++; c.c += d.cohortMean; c.cc++; });
  return { ...fd, disciplines, periods: ap.size ? fd.periods.filter(p => ap.has(p)) : fd.periods, statsPerPeriod: ap.size ? fd.statsPerPeriod.filter(s => ap.has(s.period)) : fd.statsPerPeriod, catStats };
};

// ==========================================
// 4. DASHBOARD RENDER & ANIMATION
// ==========================================
const animateValue = (el, from, to, duration, start = null) => {
  if (!el) return;
  const step = ts => {
    start ??= ts; const p = Math.min((ts - start) / duration, 1);
    el.textContent = (p * (to - from) + from).toFixed(2);
    p < 1 && requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

function buildDashboard() {
  applyChartDefaults();
  const data = STATE.fullData = processData();
  const { userCR, userRank, totalStudents, userPercentile, trendDiff } = data;

  document.body.innerHTML = `
    <div class="layout">
      <aside class="sidebar fade-1">
        <div class="sidebar-brand"><div class="sidebar-brand-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div><span class="sidebar-brand-name">MedDash</span></div>
        <div class="sidebar-profile"><div class="sidebar-avatar">${STATE.currentUser['Nome do Aluno'][0]}</div><div class="sidebar-name">${STATE.currentUser['Nome do Aluno']}</div><div class="sidebar-id">ID ${STATE.currentUser['Matrícula']}</div><span class="badge-pct">Top ${userPercentile}%</span></div>
        <nav><a href="#" class="nav-link active"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> Visão Geral</a></nav>
      </aside>
      <main class="main">
        <div class="page-header fade-2"><h1 class="page-title">Performance Acadêmica</h1><p class="page-sub">Prontuário analítico longitudinal · ${STATE.currentUser['Nome do Aluno']}</p></div>
        <div class="kpi-grid fade-3">
          <div class="kpi-card primary"><div class="kpi-label">CR Global</div><div class="kpi-value" id="kpi-cr">0.00</div><div class="kpi-sub">Coeficiente de rendimento</div></div>
          <div class="kpi-card teal"><div class="kpi-label">Posição Turma</div><div class="kpi-value">${userRank}º</div><div class="kpi-sub">de ${totalStudents} alunos</div></div>
          <div class="kpi-card ${trendDiff >= 0 ? 'green' : 'amber'}"><div class="kpi-label">Tendência</div><div class="kpi-value" style="color:var(--${trendDiff >= 0 ? 'green' : 'red'});">${trendDiff > 0 ? '+' : ''}${trendDiff.toFixed(2)}</div><div class="kpi-sub">Último período vs histórico</div></div>
          <div class="kpi-card green"><div class="kpi-label">Ranking</div><div class="kpi-value" style="color:var(--green);">Top ${userPercentile}%</div><div class="kpi-sub">Dos melhores alunos da turma</div></div>
        </div>
        <div class="insight-strip fade-3" id="insights"></div>
        <div class="filter-bar fade-4" id="filter-bar"><div class="filter-group"><span class="filter-label">Período</span><div class="filter-chips" id="chips-periods"></div></div><div class="filter-sep"></div><div class="filter-group"><span class="filter-label">Área</span><div class="filter-chips" id="chips-categories"></div></div><span class="filter-summary" id="filter-summary"></span><button class="filter-reset" id="filter-reset"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Limpar</button></div>
        <div id="filtered-content"></div>
      </main>
    </div>`;
  
  window.lucide?.createIcons();
  animateValue(document.getElementById('kpi-cr'), 0, userCR, 900);
  
  const bD = [...data.disciplines].sort((a, b) => b.diff - a.diff)[0];
  const wD = data.statsPerPeriod.slice(1).map((s, i) => ({ p: s.period, d: s.studentMean - data.statsPerPeriod[i].studentMean })).filter(x => x.d < -0.5).sort((a, b) => a.d - b.d)[0];
  document.getElementById('insights').innerHTML = `<div class="insight green"><div class="insight-head">🏆 Destaque</div><div class="insight-body">Alta performance em <strong>${bD?.name ?? '—'}</strong> (+${bD?.diff.toFixed(2) ?? 0} vs turma).</div></div><div class="insight ${wD ? 'red' : 'teal'}"><div class="insight-head">${wD ? '⚠ Atenção' : '✓ Estável'}</div><div class="insight-body">${wD ? `Queda de <strong>${Math.abs(wD.d).toFixed(2)} pts</strong> no ${wD.p}º P.` : 'Sem quedas bruscas no histórico recente.'}</div></div><div class="insight teal"><div class="insight-head">📊 Posição</div><div class="insight-body">Você está no <strong>Top ${userPercentile}%</strong> da sua turma.</div></div>`;
  
  const [pCt, cCt] = [document.getElementById('chips-periods'), document.getElementById('chips-categories')];
  data.periods.forEach(p => pCt.append($('button', { className: 'chip', textContent: `${p}º P`, onclick: function() { toggleFilter('periods', p, this); } })));
  CAT_LABELS.filter(c => data.disciplines.some(d => d.category === c)).forEach(c => cCt.append($('button', { className: 'chip', textContent: c, onclick: function() { toggleFilter('categories', c, this); } })));
  document.getElementById('filter-reset').onclick = () => { STATE.activeFilters.periods.clear(); STATE.activeFilters.categories.clear(); document.querySelectorAll('.chip.active').forEach(c => c.classList.remove('active')); updateFilterSummary(); renderAll(STATE.fullData); };
  
  updateFilterSummary(); renderAll(data);
  document.addEventListener('click', e => { const th = e.target.closest('th[data-sort]'); if (!th) return; STATE.tableSort.dir = STATE.tableSort.key === th.dataset.sort && STATE.tableSort.dir === 'desc' ? 'asc' : 'desc'; STATE.tableSort.key = th.dataset.sort; renderTable(getFilteredView(STATE.fullData)); });
}

const toggleFilter = (type, val, chip) => { STATE.activeFilters[type].has(val) ? (STATE.activeFilters[type].delete(val), chip.classList.remove('active')) : (STATE.activeFilters[type].add(val), chip.classList.add('active')); updateFilterSummary(); renderAll(getFilteredView(STATE.fullData)); };
const updateFilterSummary = () => { const { periods: p, categories: c } = STATE.activeFilters; document.getElementById('filter-summary').innerHTML = p.size || c.size ? `Filtrado por <strong>${[p.size && `${p.size} período(s)`, c.size && `${c.size} área(s)`].filter(Boolean).join(' · ')}</strong>` : 'Exibindo <strong>todos</strong> os dados'; };

// ==========================================
// 8. RENDER ALL (Charts, Heatmap, Table)
// ==========================================
function renderAll(data) {
  Object.keys(_charts).forEach(k => { _charts[k]?.destroy(); delete _charts[k]; });
  const fc = document.getElementById('filtered-content');
  if (!data.disciplines.length) return fc.innerHTML = `<div class="card empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>Nenhuma disciplina encontrada.</p></div>`;
  if (!document.getElementById('chart-evo')) fc.innerHTML = `<div class="chart-section cols-2-1 fade-4"><div class="card"><div class="card-title">Evolução por Período</div><div class="chart-wrap" style="height:280px;"><canvas id="chart-evo"></canvas></div></div><div class="card"><div class="card-title">Perfil de Competências</div><div class="chart-wrap" style="height:280px;"><canvas id="chart-radar"></canvas></div></div></div><div class="chart-section cols-2 fade-4"><div class="card"><div class="card-title">Túnel de Crescimento (±1 DP)</div><div class="chart-wrap" style="height:240px;"><canvas id="chart-growth"></canvas></div></div><div class="card"><div class="card-title">Distribuição da Turma</div><div class="chart-wrap" style="height:240px;"><canvas id="chart-dist"></canvas></div></div></div><div class="chart-section cols-2-1 fade-5"><div class="card"><div class="card-title">Heatmap por Disciplina</div><div id="heatmap-container" class="heatmap-wrap"></div></div><div class="card"><div class="card-title">Top 5 / Bottom 5 (Δ Turma)</div><div class="chart-wrap" style="height:360px;"><canvas id="chart-ranking"></canvas></div></div></div><div class="card fade-5" style="overflow-x:auto;"><div class="card-title" id="table-title">Prontuário Detalhado</div><table class="data-table" id="data-table"><thead><tr><th data-sort="name">Disciplina <i class="sort-icon">↕</i></th><th data-sort="period">Período <i class="sort-icon">↕</i></th><th data-sort="userGrade">Sua Nota <i class="sort-icon">↕</i></th><th data-sort="cohortMean">Média Turma <i class="sort-icon">↕</i></th><th data-sort="diff">Δ Diferença <i class="sort-icon">↕</i></th><th>Status</th></tr></thead><tbody></tbody></table></div>`;

  const [sp, labels, stu, coh, t10, up, low] = [data.statsPerPeriod, data.statsPerPeriod.map(s => `${s.period}º P`), data.statsPerPeriod.map(s => +s.studentMean.toFixed(2)), data.statsPerPeriod.map(s => +s.cohortMean.toFixed(2)), data.statsPerPeriod.map(s => +s.top10Mean.toFixed(2)), data.statsPerPeriod.map(s => +(s.cohortMean + s.cohortStdDev).toFixed(2)), data.statsPerPeriod.map(s => +(s.cohortMean - s.cohortStdDev).toFixed(2))];
  const [yS, xS, grad] = [{ min: 0, max: 10, ticks: { stepSize: 2, ...tickOpts() }, grid: gridOpts(), border: { display: false } }, { ticks: tickOpts(), grid: { display: false }, border: { display: false } }, document.getElementById('chart-evo').getContext('2d').createLinearGradient(0, 0, 0, 280)];
  grad.addColorStop(0, 'rgba(67,97,238,.18)'); grad.addColorStop(1, 'rgba(67,97,238,.00)');

  makeChart('chart-evo', 'line', { labels, datasets: [{ label: 'Sua Média', data: stu, borderColor: '#4361ee', backgroundColor: grad, fill: true, tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#4361ee', pointRadius: 4, pointHoverRadius: 6, order: 1 }, { label: 'Média Turma', data: coh, borderColor: '#9299b0', borderDash: [5,4], tension: 0.4, borderWidth: 1.5, pointRadius: 0, fill: false, order: 2 }, { label: 'Top 10%', data: t10, borderColor: '#2d9d78', borderDash: [2,4], tension: 0.4, borderWidth: 1.5, pointRadius: 0, fill: false, order: 3 }] }, { scales: { y: yS, x: xS } });
  makeChart('chart-growth', 'line', { labels, datasets: [{ label: 'Sua Nota', data: stu, borderColor: '#4361ee', tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#4361ee', pointRadius: 4, fill: false, order: 1 }, { label: '+1 DP', data: up, borderColor: 'transparent', backgroundColor: 'rgba(45,157,120,.12)', fill: '+1', tension: 0.4, pointRadius: 0, order: 3 }, { label: 'Média', data: coh, borderColor: '#9299b0', borderDash: [4,4], borderWidth: 1.5, tension: 0.4, pointRadius: 0, fill: false, order: 2 }, { label: '-1 DP', data: low, borderColor: 'transparent', backgroundColor: 'rgba(45,157,120,.12)', fill: '-1', tension: 0.4, pointRadius: 0, order: 4 }] }, { scales: { y: yS, x: xS }, plugins: { legend: { labels: { filter: i => !['+1 DP', '-1 DP'].includes(i.text) } } } });

  const bands = [{ l: '< 5', min:0, max:4.99 }, { l: '5–6', min:5, max:5.99 }, { l: '6–7', min:6, max:6.99 }, { l: '7–8', min:7, max:7.99 }, { l: '8–9', min:8, max:8.99 }, { l: '9–10', min:9, max:10 }];
  const hist = new Array(6).fill(0); STATE.fullData.cohortCRs.forEach(cr => { const i = bands.findIndex(b => cr >= b.min && cr <= b.max); if(i>-1) hist[i]++; });
  const uBIdx = bands.findIndex(b => STATE.fullData.userCR >= b.min && STATE.fullData.userCR <= b.max);
  
  makeChart('chart-dist', 'bar', { labels: bands.map(b => b.l), datasets: [{ label: 'Alunos', data: hist, backgroundColor: hist.map((_,i) => i===uBIdx ? '#4361ee' : 'rgba(67,97,238,.18)'), borderColor: hist.map((_,i) => i===uBIdx ? '#4361ee' : 'rgba(67,97,238,.4)'), borderWidth: 1, borderRadius: 5, order: 2 }, { type: 'line', label: 'Curva de densidade', data: hist, borderColor: '#0096c7', borderWidth: 2, tension: 0.45, pointRadius: 0, fill: false, order: 1 }] }, { indexAxis: 'y', scales: { x: { ticks: { precision:0, ...tickOpts() }, grid: gridOpts(), border: { display:false }, title: { display:true, text:'Nº Alunos', color:'#9299b0', font:{size:11} } }, y: { ...xS, title: { display:true, text:'Faixa de CR', color:'#9299b0', font:{size:11} } } } });

  makeChart('chart-radar', 'radar', { labels: CAT_LABELS, datasets: [{ label: 'Você', data: CAT_LABELS.map(c => data.catStats[c].uc ? +(data.catStats[c].u/data.catStats[c].uc).toFixed(2) : 0), backgroundColor: 'rgba(67,97,238,.15)', borderColor: '#4361ee', borderWidth: 2, pointBackgroundColor: '#4361ee', pointRadius: 3 }, { label: 'Turma', data: CAT_LABELS.map(c => data.catStats[c].cc ? +(data.catStats[c].c/data.catStats[c].cc).toFixed(2) : 0), backgroundColor: 'transparent', borderColor: '#9299b0', borderDash: [4,3], borderWidth: 1.5, pointRadius: 0 }] }, { scales: { r: { min:0, max:10, ticks: { stepSize:2, backdropColor:'transparent', ...tickOpts() }, angleLines: { color:'#e2e5ef' }, grid: { color:'#e2e5ef' }, pointLabels: { color:'#5a607a', font:{size:11,family:"'Sora', sans-serif"} } } } });

  const sorted = [...data.disciplines].sort((a, b) => b.diff - a.diff);
  const tb = [...sorted.slice(0, 5), ...sorted.slice(-5)];
  makeChart('chart-ranking', 'bar', { labels: tb.map(d => d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name), datasets: [{ label: 'Δ vs Turma', data: tb.map(d => +d.diff.toFixed(2)), backgroundColor: tb.map(d => d.diff>=0 ? 'rgba(45,157,120,.25)' : 'rgba(224,82,82,.25)'), borderColor: tb.map(d => d.diff>=0 ? '#2d9d78' : '#e05252'), borderWidth: 1.5, borderRadius: 4 }] }, { indexAxis: 'y', plugins: { legend:{display:false}, tooltip:{callbacks:{label: c => ` ${c.parsed.x>0?'+':''}${c.parsed.x.toFixed(2)} vs média`}} }, scales: { x: { ticks:tickOpts(), grid:gridOpts(), border:{display:false}, title:{display:true,text:'Δ Nota',color:'#9299b0',font:{size:11}} }, y: { ticks:{color:'#5a607a',font:{size:10.5,family:"'IBM Plex Mono', monospace"}}, grid:{display:false}, border:{display:false} } } });

  const names = [...new Set(data.disciplines.map(d => d.name))].sort();
  document.getElementById('heatmap-container').innerHTML = !names.length ? '' : `<div class="heatmap-grid" style="grid-template-columns:180px repeat(${data.periods.length},40px);"><div></div>` + data.periods.map(p => `<div class="hm-header">${p}º</div>`).join('') + names.map(n => `<div class="hm-row-label" title="${n}">${n}</div>` + data.periods.map(p => { const d = data.disciplines.find(x => x.name === n && x.period === p); return !d ? '<div class="hm-cell empty"></div>' : `<div class="hm-cell ${d.userGrade>=8.5?'grade-hi':d.userGrade>=6?'grade-mid':'grade-low'}" title="${n} · ${p}º P&#10;Nota: ${d.userGrade.toFixed(1)} | Turma: ${d.cohortMean.toFixed(1)}">${d.userGrade.toFixed(1)}</div>`; }).join('')).join('') + '</div>';

  renderTable(data);
  const title = document.getElementById('table-title');
  if (title) title.textContent = STATE.activeFilters.periods.size || STATE.activeFilters.categories.size ? `Prontuário Detalhado · ${data.disciplines.length} disciplina(s)` : 'Prontuário Detalhado';
}

function renderTable({ disciplines }) {
  const { key, dir } = STATE.tableSort;
  document.querySelectorAll('#data-table th[data-sort]').forEach(th => { th.classList.toggle('sorted', th.dataset.sort === key); th.querySelector('.sort-icon').textContent = th.dataset.sort === key ? (dir === 'asc' ? '↑' : '↓') : '↕'; });
  document.querySelector('#data-table tbody').innerHTML = [...disciplines].sort((a, b) => (typeof a[key] === 'string' ? a[key].localeCompare(b[key], 'pt') : a[key] - b[key]) * (dir === 'asc' ? 1 : -1)).map(d => `<tr><td>${d.name}</td><td class="mono">${d.period}º</td><td class="mono" style="font-weight:600;">${d.userGrade.toFixed(1)}</td><td class="mono" style="color:var(--text-3);">${d.cohortMean.toFixed(1)}</td><td class="mono" style="color:var(--${d.diff>=0?'green':'red'});">${d.diff>0?'+':''}${d.diff.toFixed(2)}</td><td><span class="badge ${d.diff>=0?'ok':'bad'}">${d.diff>=0?'Adequado':'Atenção'}</span></td></tr>`).join('');
}
