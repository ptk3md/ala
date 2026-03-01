/**
 * @typedef {Object} StudentRow
 * @property {string|number} Matrícula
 * @property {string} Nome do Aluno
 * @property {string} E-mail
 * @property {Object.<string, string|number>} [Disciplines]
 */

// ==========================================
// 0. BOOTSTRAP — DESIGN SYSTEM (LIGHT MODE)
// ==========================================

const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

const styleTag = document.createElement('style');
styleTag.innerHTML = `
  /* ─── TOKENS ─────────────────────────────────── */
  :root {
    --bg:           #f5f6fa;
    --surface:      #ffffff;
    --surface-2:    #f0f2f7;
    --border:       #e2e5ef;
    --border-focus: #4361ee;

    --primary:      #4361ee;
    --primary-dim:  rgba(67,97,238,.10);
    --teal:         #0096c7;
    --teal-dim:     rgba(0,150,199,.10);
    --green:        #2d9d78;
    --green-dim:    rgba(45,157,120,.10);
    --red:          #e05252;
    --red-dim:      rgba(224,82,82,.10);
    --amber:        #d97706;
    --amber-dim:    rgba(217,119,6,.10);

    --text:         #1a1d2e;
    --text-2:       #5a607a;
    --text-3:       #9299b0;

    --radius-sm:    6px;
    --radius:       10px;
    --radius-lg:    16px;
    --shadow-sm:    0 1px 3px rgba(26,29,46,.07), 0 1px 2px rgba(26,29,46,.04);
    --shadow:       0 4px 16px rgba(26,29,46,.08), 0 1px 4px rgba(26,29,46,.04);
    --shadow-lg:    0 8px 32px rgba(26,29,46,.10), 0 2px 8px rgba(26,29,46,.06);

    --font:         'Sora', sans-serif;
    --mono:         'IBM Plex Mono', monospace;
    --t-base:       0.875rem;
    --t-sm:         0.8125rem;
    --t-xs:         0.75rem;
  }

  /* ─── RESET & BASE ────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body.med-light {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    font-size: var(--t-base);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ─── LAYOUT ──────────────────────────────────── */
  .layout {
    display: flex;
    min-height: 100vh;
  }

  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--surface);
    border-right: 1px solid var(--border);
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: .75rem;
    position: fixed;
    height: 100vh;
    overflow-y: auto;
    z-index: 100;
  }

  .main {
    margin-left: 220px;
    flex: 1;
    padding: 2rem 2.5rem;
    max-width: 1400px;
  }

  /* ─── SIDEBAR COMPONENTS ──────────────────────── */
  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: .5rem .75rem;
    margin-bottom: .75rem;
  }
  .sidebar-brand-icon {
    width: 32px; height: 32px;
    background: var(--primary);
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
  }
  .sidebar-brand-name {
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -.3px;
  }

  .sidebar-profile {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1rem;
    margin-bottom: .5rem;
  }
  .sidebar-avatar {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: var(--primary);
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--mono);
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: .625rem;
  }
  .sidebar-name {
    font-size: var(--t-sm);
    font-weight: 600;
    line-height: 1.3;
    color: var(--text);
  }
  .sidebar-id {
    font-family: var(--mono);
    font-size: var(--t-xs);
    color: var(--text-3);
    margin-top: 2px;
  }
  .badge-pct {
    display: inline-flex;
    margin-top: .5rem;
    padding: 2px 8px;
    border-radius: 99px;
    background: var(--green-dim);
    color: var(--green);
    font-size: var(--t-xs);
    font-weight: 600;
  }

  .nav-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: .625rem .875rem;
    border-radius: var(--radius-sm);
    text-decoration: none;
    font-size: var(--t-sm);
    font-weight: 500;
    color: var(--text-2);
    transition: background .15s, color .15s;
  }
  .nav-link:hover { background: var(--surface-2); color: var(--text); }
  .nav-link.active { background: var(--primary-dim); color: var(--primary); }

  /* ─── CARDS ───────────────────────────────────── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-sm);
    padding: 1.5rem;
    transition: box-shadow .2s;
  }
  .card:hover { box-shadow: var(--shadow); }

  .card-title {
    font-size: var(--t-sm);
    font-weight: 600;
    color: var(--text);
    margin-bottom: 1rem;
    letter-spacing: -.2px;
  }

  /* ─── KPI CARDS ───────────────────────────────── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .kpi-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 1.25rem 1.5rem;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  }
  .kpi-card.primary::before { background: var(--primary); }
  .kpi-card.green::before   { background: var(--green); }
  .kpi-card.teal::before    { background: var(--teal); }
  .kpi-card.amber::before   { background: var(--amber); }

  .kpi-label {
    font-size: var(--t-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .7px;
    color: var(--text-3);
    margin-bottom: .375rem;
  }
  .kpi-value {
    font-family: var(--mono);
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: -1px;
    color: var(--text);
    line-height: 1;
    margin-bottom: .375rem;
  }
  .kpi-sub {
    font-size: var(--t-xs);
    color: var(--text-3);
  }

  /* ─── CHART WRAPPERS ──────────────────────────── */
  .chart-section {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  .chart-section.cols-2-1 { grid-template-columns: 2fr 1fr; }
  .chart-section.cols-2   { grid-template-columns: 1fr 1fr; }
  .chart-section.cols-3   { grid-template-columns: repeat(3,1fr); }

  .chart-wrap { position: relative; }
  .chart-wrap canvas { display: block; }

  /* ─── INSIGHTS ────────────────────────────────── */
  .insight-strip {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .insight {
    padding: .875rem 1rem;
    border-radius: var(--radius);
    border-left: 3px solid;
    font-size: var(--t-sm);
  }
  .insight.green  { background: var(--green-dim);  border-color: var(--green);  }
  .insight.red    { background: var(--red-dim);    border-color: var(--red);    }
  .insight.teal   { background: var(--teal-dim);   border-color: var(--teal);   }
  .insight-head {
    font-weight: 600;
    margin-bottom: .25rem;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--t-xs);
    text-transform: uppercase;
    letter-spacing: .5px;
  }
  .insight.green .insight-head { color: var(--green); }
  .insight.red   .insight-head { color: var(--red);   }
  .insight.teal  .insight-head { color: var(--teal);  }
  .insight-body { color: var(--text); line-height: 1.5; }

  /* ─── HEATMAP ─────────────────────────────────── */
  .heatmap-wrap { overflow-x: auto; margin-top: .5rem; }
  .heatmap-grid {
    display: grid;
    gap: 3px;
    min-width: max-content;
  }
  .hm-header {
    font-family: var(--mono);
    font-size: var(--t-xs);
    color: var(--text-3);
    text-align: center;
    padding: 2px;
  }
  .hm-row-label {
    font-size: var(--t-xs);
    color: var(--text-2);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 8px;
    display: flex;
    align-items: center;
  }
  .hm-cell {
    width: 38px; height: 38px;
    border-radius: 4px;
    font-family: var(--mono);
    font-size: 10px;
    font-weight: 500;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: transform .15s, box-shadow .15s;
    position: relative;
  }
  .hm-cell:hover {
    transform: scale(1.15);
    z-index: 10;
    box-shadow: var(--shadow);
  }
  .hm-cell.empty     { background: var(--surface-2); }
  .hm-cell.grade-hi  { background: #2d9d78; color: #fff; }
  .hm-cell.grade-mid { background: #0096c7; color: #fff; }
  .hm-cell.grade-low { background: #e05252; color: #fff; }

  /* ─── TABLE ───────────────────────────────────── */
  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th {
    font-size: var(--t-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .6px;
    color: var(--text-3);
    border-bottom: 2px solid var(--border);
    padding: .875rem 1rem;
    text-align: left;
  }
  .data-table td {
    padding: .75rem 1rem;
    border-bottom: 1px solid var(--border);
    font-size: var(--t-sm);
    vertical-align: middle;
  }
  .data-table td.mono { font-family: var(--mono); }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr:hover td { background: var(--bg); }
  .badge {
    display: inline-flex;
    padding: 2px 9px;
    border-radius: 99px;
    font-size: var(--t-xs);
    font-weight: 600;
  }
  .badge.ok  { background: var(--green-dim); color: var(--green); }
  .badge.bad { background: var(--red-dim);   color: var(--red);   }

  /* ─── UPLOAD UI ───────────────────────────────── */
  .dropzone {
    border: 1.5px dashed var(--border-focus);
    border-radius: var(--radius);
    padding: 1.25rem;
    text-align: center;
    cursor: pointer;
    background: var(--primary-dim);
    transition: background .15s;
    font-size: var(--t-sm);
  }
  .dropzone:hover { background: rgba(67,97,238,.15); }
  .upload-status { font-size: var(--t-xs); margin-top: .5rem; text-align: center; font-weight: 600; }

  /* ─── PAGE HEADER ──────────────────────────────── */
  .page-header { margin-bottom: 1.75rem; }
  .page-title {
    font-size: 1.625rem;
    font-weight: 700;
    letter-spacing: -.5px;
    color: var(--text);
  }
  .page-sub { font-size: var(--t-sm); color: var(--text-3); margin-top: 2px; }

  /* ─── SECTION HEADING ─────────────────────────── */
  .section-head {
    font-size: var(--t-xs);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .8px;
    color: var(--text-3);
    padding-bottom: .625rem;
    margin-bottom: 1rem;
    border-bottom: 1px solid var(--border);
  }

  /* ─── ANIMATIONS ──────────────────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-1 { animation: fadeUp .45s ease-out .00s both; }
  .fade-2 { animation: fadeUp .45s ease-out .07s both; }
  .fade-3 { animation: fadeUp .45s ease-out .14s both; }
  .fade-4 { animation: fadeUp .45s ease-out .21s both; }
  .fade-5 { animation: fadeUp .45s ease-out .28s both; }

  /* ─── DIVIDER ──────────────────────────────────── */
  .divider { height: 1px; background: var(--border); margin: 1.5rem 0; }

  /* ─── SCROLLBAR ────────────────────────────────── */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }
`;
document.head.appendChild(styleTag);

// ==========================================
// STATE
// ==========================================

const STATE = {
  rawDataMap: new Map(),
  currentUser: null,
  chartInstances: [],
};

// ==========================================
// SHARED CHART DEFAULTS (UX/UI normalized)
// ==========================================

function applyChartDefaults() {
  Chart.defaults.font.family = "'Sora', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.color = '#5a607a';

  // Tooltip — normalized for readability
  Chart.defaults.plugins.tooltip.backgroundColor = '#1a1d2e';
  Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
  Chart.defaults.plugins.tooltip.bodyColor = '#c8cde0';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.cornerRadius = 6;
  Chart.defaults.plugins.tooltip.titleFont = { family: "'IBM Plex Mono', monospace", size: 11 };
  Chart.defaults.plugins.tooltip.bodyFont  = { family: "'IBM Plex Mono', monospace", size: 11 };
  Chart.defaults.plugins.tooltip.displayColors = true;
  Chart.defaults.plugins.tooltip.boxPadding = 4;

  // Legend
  Chart.defaults.plugins.legend.position = 'bottom';
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 8;
  Chart.defaults.plugins.legend.labels.boxHeight = 8;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.legend.labels.font = { size: 11, family: "'Sora', sans-serif" };
}

// Normalized axis grid options for light mode
function gridOpts() {
  return { color: '#e2e5ef', drawBorder: false };
}

function tickOpts() {
  return { color: '#9299b0', font: { size: 11 } };
}

// ==========================================
// 1. LOGIN AREA — CSV UPLOADER
// ==========================================

function injectCSVUploader() {
  const form = document.getElementById('login-form');
  if (!form || document.getElementById('csv-dropzone')) return;

  const wrap = document.createElement('div');
  wrap.className = 'input-group';
  wrap.innerHTML = `
    <label style="color:var(--text-2);font-family:var(--font);font-size:.8125rem;font-weight:600;margin-bottom:.4rem;display:block;">
      Base de Dados Acadêmica
    </label>
    <div id="csv-dropzone" class="dropzone">
      <span id="dropzone-text">Clique ou arraste o arquivo CSV</span>
      <input type="file" id="csv-upload" accept=".csv" multiple style="display:none;">
    </div>
    <div id="upload-status" class="upload-status" style="color:var(--green);"></div>
  `;
  form.insertBefore(wrap, form.firstChild);

  const dz  = document.getElementById('csv-dropzone');
  const fi  = document.getElementById('csv-upload');
  const st  = document.getElementById('upload-status');

  dz.addEventListener('click',     () => fi.click());
  dz.addEventListener('dragover',  (e) => { e.preventDefault(); dz.style.background = 'rgba(67,97,238,.18)'; });
  dz.addEventListener('dragleave', ()  => { dz.style.background = ''; });
  dz.addEventListener('drop', (e)      => { e.preventDefault(); dz.style.background = ''; handleFiles(e.dataTransfer.files); });
  fi.addEventListener('change',   (e)  => handleFiles(e.target.files));

  function handleFiles(files) {
    if (!files.length) return;
    st.style.color = 'var(--text-2)';
    st.textContent = `Processando ${files.length} arquivo(s)…`;
    Array.from(files).forEach(f => { if (f.name.endsWith('.csv')) parseCSV(f, f.name); });
  }
}

injectCSVUploader();
parseCSV('Planilha_Academica_Medicina.csv', 'Planilha Padrão', true);

function parseCSV(fileOrUrl, _sourceName, isSilent = false) {
  Papa.parse(fileOrUrl, {
    download: typeof fileOrUrl === 'string',
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete({ data }) {
      data.forEach(row => {
        const mat = String(row['Matrícula'] || '').trim();
        if (mat) STATE.rawDataMap.set(mat, row);
      });
      const st = document.getElementById('upload-status');
      if (st && !isSilent) {
        st.style.color = 'var(--green)';
        st.textContent = `✓ ${STATE.rawDataMap.size} registros carregados`;
      }
    },
  });
}

// ==========================================
// 2. LOGIN FORM
// ==========================================

const formEl        = document.getElementById('login-form');
const emailInput    = document.getElementById('email');
const matriculaInput = document.getElementById('matricula');
const loginBtn      = document.getElementById('login-btn');
const errorEl       = document.getElementById('login-error');

function validateForm() {
  if (!loginBtn) return;
  const test = emailInput.value.toLowerCase() === 'teste' && matriculaInput.value === 'teste';
  loginBtn.disabled = !((emailInput.value.includes('@') && matriculaInput.value.length >= 4) || test);
}
emailInput?.addEventListener('input', validateForm);
matriculaInput?.addEventListener('input', validateForm);

formEl?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = emailInput.value.trim().toLowerCase();
  const matricula = matriculaInput.value.trim();
  loginBtn.textContent = 'Autenticando…';

  try {
    await new Promise(r => setTimeout(r, 500));
    const user = Array.from(STATE.rawDataMap.values()).find(
      row => String(row['E-mail']).toLowerCase() === email && String(row['Matrícula']) === matricula
    );
    if (!user) throw new Error('Credenciais inválidas.');
    STATE.currentUser = user;
    document.body.classList.add('med-light');
    buildDashboard();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    loginBtn.textContent = 'Acessar Dashboard';
  }
});

// ==========================================
// 3. DATA ENGINE
// ==========================================

function categorizeDiscipline(name) {
  const n = name.toLowerCase();
  if (n.includes('sociologia') || n.includes('antropologia') || n.includes('ética') || n.includes('filosofia')) return 'Humanidades';
  if (n.includes('saúde e sociedade') || n.includes('epidemiologia') || n.includes('pesquisa')) return 'Saúde Pública';
  if (n.includes('cirurgia') || n.includes('operatória') || n.includes('anestesiologia')) return 'Cirurgia';
  if (n.includes('habilidades') || n.includes('clínica') || n.includes('semiologia') || n.includes('pediatria') || n.includes('internato')) return 'Clínica';
  return 'Básicas';
}

function processData() {
  const user      = STATE.currentUser;
  const allUsers  = Array.from(STATE.rawDataMap.values());
  const total     = allUsers.length;
  const userMat   = String(user['Matrícula']);

  // Parse discipline keys
  const periodsMap  = {};
  const discMeta    = [];
  Object.keys(user).forEach(key => {
    const m = key.match(/\((\d+)º Período\)\s+(.+)/);
    if (m) {
      const p = parseInt(m[1], 10);
      const name = m[2];
      if (!periodsMap[p]) periodsMap[p] = [];
      periodsMap[p].push(key);
      discMeta.push({ key, period: p, name, category: categorizeDiscipline(name) });
    }
  });

  const periods = Object.keys(periodsMap).map(Number).sort((a, b) => a - b);

  // Per-discipline accumulators
  const discStats = {};
  discMeta.forEach(d => {
    discStats[d.key] = {
      name: d.name, period: d.period, category: d.category,
      userGrade: user[d.key] || 0,
      sum: 0, count: 0,
    };
  });

  // Category radar accumulators
  const catKeys = ['Básicas', 'Clínica', 'Cirurgia', 'Saúde Pública', 'Humanidades'];
  const catStats = {};
  catKeys.forEach(k => { catStats[k] = { u: 0, uc: 0, c: 0, cc: 0 }; });

  // Period means per student (for P90)
  const allPeriodMeans = {};
  periods.forEach(p => { allPeriodMeans[p] = []; });

  const userPeriodMeans = {};
  const cohortCRs = new Float32Array(total);
  let userCR = 0;

  for (let i = 0; i < total; i++) {
    const u      = allUsers[i];
    const isUser = String(u['Matrícula']) === userMat;
    let totalSum = 0, totalCount = 0;

    for (const p of periods) {
      let pSum = 0, pCount = 0;
      for (const key of periodsMap[p]) {
        const g = u[key];
        if (typeof g === 'number') {
          pSum += g; pCount++;
          discStats[key].sum   += g;
          discStats[key].count += 1;
          const cat = discStats[key].category;
          catStats[cat].c  += g;
          catStats[cat].cc += 1;
          if (isUser) {
            catStats[cat].u  += g;
            catStats[cat].uc += 1;
          }
        }
      }
      if (pCount > 0) {
        const pm = pSum / pCount;
        allPeriodMeans[p].push(pm);
        if (isUser) userPeriodMeans[p] = pm;
      }
      totalSum   += pSum;
      totalCount += pCount;
    }

    const cr = totalCount > 0 ? totalSum / totalCount : 0;
    cohortCRs[i] = cr;
    if (isUser) userCR = cr;
  }

  // Rank
  let userRank = 1;
  for (let i = 0; i < total; i++) if (cohortCRs[i] > userCR) userRank++;
  const userPct = Math.round(((total - userRank) / total) * 100);

  // Per-period stats + P90
  const statsPerPeriod = periods.map(p => {
    const means = [...allPeriodMeans[p]];
    const n     = means.length;
    const mean  = means.reduce((a, b) => a + b, 0) / n;
    const variance = means.reduce((sq, v) => sq + (v - mean) ** 2, 0) / (n - 1 || 1);
    means.sort((a, b) => a - b);
    const top10 = means[Math.floor(n * 0.9)] ?? mean;
    return {
      period:        p,
      studentMean:   userPeriodMeans[p] ?? 0,
      cohortMean:    mean,
      cohortStdDev:  Math.sqrt(Math.max(0, variance)),
      top10Mean:     top10,
    };
  });

  const disciplines = Object.values(discStats)
    .map(d => ({
      ...d,
      cohortMean: d.count > 0 ? d.sum / d.count : 0,
      diff:       d.userGrade - (d.count > 0 ? d.sum / d.count : 0),
    }))
    .filter(d => d.userGrade > 0);

  const lastMean = statsPerPeriod.at(-1)?.studentMean ?? 0;

  return {
    statsPerPeriod, userCR, userRank, totalStudents: total,
    userPercentile: userPct, trendDiff: lastMean - userCR,
    cohortCRs, catStats, disciplines, periods,
  };
}

// ==========================================
// 4. DASHBOARD HTML SCAFFOLD
// ==========================================

function buildDashboard() {
  applyChartDefaults();
  const data      = processData();
  const firstName = STATE.currentUser['Nome do Aluno'].split(' ')[0];

  document.body.innerHTML = `
    <div class="layout">
      <aside class="sidebar fade-1">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <span class="sidebar-brand-name">MedDash</span>
        </div>

        <div class="sidebar-profile">
          <div class="sidebar-avatar">${firstName.charAt(0)}</div>
          <div class="sidebar-name">${STATE.currentUser['Nome do Aluno']}</div>
          <div class="sidebar-id">ID ${STATE.currentUser['Matrícula']}</div>
          <span class="badge-pct">Percentil ${data.userPercentile}</span>
        </div>

        <nav>
          <a href="#" class="nav-link active">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Visão Geral
          </a>
        </nav>
      </aside>

      <main class="main">
        <div class="page-header fade-2">
          <h1 class="page-title">Performance Acadêmica</h1>
          <p class="page-sub">Prontuário analítico longitudinal · ${STATE.currentUser['Nome do Aluno']}</p>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid fade-3">
          <div class="kpi-card primary">
            <div class="kpi-label">CR Global</div>
            <div class="kpi-value" id="kpi-cr">0.00</div>
            <div class="kpi-sub">Coeficiente de rendimento</div>
          </div>
          <div class="kpi-card teal">
            <div class="kpi-label">Posição Turma</div>
            <div class="kpi-value">${data.userRank}º</div>
            <div class="kpi-sub">de ${data.totalStudents} alunos</div>
          </div>
          <div class="kpi-card ${data.trendDiff >= 0 ? 'green' : 'amber'}">
            <div class="kpi-label">Tendência</div>
            <div class="kpi-value" style="color:${data.trendDiff >= 0 ? 'var(--green)' : 'var(--red)'};">
              ${data.trendDiff > 0 ? '+' : ''}${data.trendDiff.toFixed(2)}
            </div>
            <div class="kpi-sub">Último período vs histórico</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-label">Percentil</div>
            <div class="kpi-value" style="color:var(--green);">${data.userPercentile}</div>
            <div class="kpi-sub">Melhor que ${data.userPercentile}% da turma</div>
          </div>
        </div>

        <!-- Insights -->
        <div class="insight-strip fade-3" id="insights"></div>

        <!-- Row 1: Evolution + Radar -->
        <div class="chart-section cols-2-1 fade-4">
          <div class="card">
            <div class="card-title">Evolução por Período</div>
            <div class="chart-wrap" style="height:280px;"><canvas id="chart-evo"></canvas></div>
          </div>
          <div class="card">
            <div class="card-title">Perfil de Competências</div>
            <div class="chart-wrap" style="height:280px;"><canvas id="chart-radar"></canvas></div>
          </div>
        </div>

        <!-- Row 2: Growth Tunnel + Distribution -->
        <div class="chart-section cols-2 fade-4">
          <div class="card">
            <div class="card-title">Túnel de Crescimento (±1 DP)</div>
            <div class="chart-wrap" style="height:240px;"><canvas id="chart-growth"></canvas></div>
          </div>
          <div class="card">
            <div class="card-title">Distribuição da Turma</div>
            <div class="chart-wrap" style="height:240px;"><canvas id="chart-dist"></canvas></div>
          </div>
        </div>

        <!-- Row 3: Heatmap + Ranking -->
        <div class="chart-section cols-2-1 fade-5">
          <div class="card">
            <div class="card-title">Heatmap por Disciplina</div>
            <div id="heatmap-container" class="heatmap-wrap"></div>
          </div>
          <div class="card">
            <div class="card-title">Top 5 / Bottom 5 (Δ Turma)</div>
            <div class="chart-wrap" style="height:360px;"><canvas id="chart-ranking"></canvas></div>
          </div>
        </div>

        <!-- Table -->
        <div class="card fade-5" style="overflow-x:auto;">
          <div class="card-title">Prontuário Detalhado</div>
          <table class="data-table" id="data-table">
            <thead>
              <tr>
                <th>Disciplina</th>
                <th>Período</th>
                <th>Sua Nota</th>
                <th>Média Turma</th>
                <th>Δ Diferença</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </main>
    </div>
  `;

  // Lucide icons (if available)
  if (window.lucide) lucide.createIcons();

  // Animate CR counter
  animateValue(document.getElementById('kpi-cr'), 0, data.userCR, 900);

  renderInsights(data);
  renderCharts(data);
  renderHeatmap(data);
  renderTable(data);
}

// ==========================================
// 5. ANIMATED COUNTER
// ==========================================

function animateValue(el, from, to, duration) {
  if (!el) return;
  let start = null;
  const step = ts => {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    el.textContent = (p * (to - from) + from).toFixed(2);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ==========================================
// 6. INSIGHTS
// ==========================================

function renderInsights(data) {
  const container = document.getElementById('insights');

  const bestDisc = [...data.disciplines].sort((a, b) => b.diff - a.diff)[0];

  const drops = [];
  for (let i = 1; i < data.statsPerPeriod.length; i++) {
    const diff = data.statsPerPeriod[i].studentMean - data.statsPerPeriod[i - 1].studentMean;
    if (diff < -0.5) drops.push({ p: data.statsPerPeriod[i].period, diff });
  }
  const worstDrop = drops.sort((a, b) => a.diff - b.diff)[0];

  container.innerHTML = `
    <div class="insight green">
      <div class="insight-head">🏆 Destaque</div>
      <div class="insight-body">Alta performance em <strong>${bestDisc?.name ?? '—'}</strong>
        (+${bestDisc?.diff.toFixed(2) ?? 0} acima da turma).</div>
    </div>
    <div class="insight ${worstDrop ? 'red' : 'teal'}">
      <div class="insight-head">${worstDrop ? '⚠ Atenção' : '✓ Estável'}</div>
      <div class="insight-body">
        ${worstDrop
          ? `Queda de <strong>${Math.abs(worstDrop.diff).toFixed(2)} pts</strong> no ${worstDrop.p}º Período.`
          : 'Sem quedas bruscas no histórico recente.'}
      </div>
    </div>
    <div class="insight teal">
      <div class="insight-head">📊 Posição</div>
      <div class="insight-body">Você supera <strong>${data.userPercentile}%</strong> dos alunos da turma.</div>
    </div>
  `;
}

// ==========================================
// 7. CHARTS (light-mode, UX-normalized)
// ==========================================

function renderCharts(data) {
  const sp      = data.statsPerPeriod;
  const labels  = sp.map(s => `${s.period}º P`);
  const student = sp.map(s => +s.studentMean.toFixed(2));
  const cohort  = sp.map(s => +s.cohortMean.toFixed(2));
  const top10   = sp.map(s => +s.top10Mean.toFixed(2));

  // ── Shared y-axis config (0-10, academic scale)
  const yScale = {
    min: 0,
    max: 10,
    ticks: { stepSize: 2, ...tickOpts() },
    grid: gridOpts(),
    border: { display: false },
  };

  const xScale = {
    ticks: tickOpts(),
    grid: { display: false },
    border: { display: false },
  };

  // ── 1. Evolution line chart
  const evoCtx = document.getElementById('chart-evo').getContext('2d');
  const evoGrad = evoCtx.createLinearGradient(0, 0, 0, 280);
  evoGrad.addColorStop(0, 'rgba(67,97,238,.18)');
  evoGrad.addColorStop(1, 'rgba(67,97,238,.00)');

  new Chart(evoCtx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Sua Média',
          data: student,
          borderColor: '#4361ee',
          backgroundColor: evoGrad,
          fill: true,
          tension: 0.4,
          borderWidth: 2.5,
          pointBackgroundColor: '#4361ee',
          pointRadius: 4,
          pointHoverRadius: 6,
          order: 1,
        },
        {
          label: 'Média Turma',
          data: cohort,
          borderColor: '#9299b0',
          borderDash: [5, 4],
          tension: 0.4,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          order: 2,
        },
        {
          label: 'Top 10%',
          data: top10,
          borderColor: '#2d9d78',
          borderDash: [2, 4],
          tension: 0.4,
          borderWidth: 1.5,
          pointRadius: 0,
          fill: false,
          order: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      scales: { y: yScale, x: xScale },
    },
  });

  // ── 2. Growth tunnel (band chart)
  const upper = sp.map(s => +(s.cohortMean + s.cohortStdDev).toFixed(2));
  const lower = sp.map(s => +(s.cohortMean - s.cohortStdDev).toFixed(2));

  new Chart(document.getElementById('chart-growth').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Sua Nota',
          data: student,
          borderColor: '#4361ee',
          tension: 0.4,
          borderWidth: 2.5,
          pointBackgroundColor: '#4361ee',
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: false,
          order: 1,
          z: 10,
        },
        {
          label: '+1 DP',
          data: upper,
          borderColor: 'transparent',
          backgroundColor: 'rgba(45,157,120,.12)',
          fill: '+1',
          tension: 0.4,
          pointRadius: 0,
          order: 3,
        },
        {
          label: 'Média',
          data: cohort,
          borderColor: '#9299b0',
          borderDash: [4, 4],
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 0,
          fill: false,
          order: 2,
        },
        {
          label: '-1 DP',
          data: lower,
          borderColor: 'transparent',
          backgroundColor: 'rgba(45,157,120,.12)',
          fill: '-1',
          tension: 0.4,
          pointRadius: 0,
          order: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: {
            filter: i => !['+ 1 DP', '-1 DP'].includes(i.text),
          },
        },
      },
      scales: { y: yScale, x: xScale },
    },
  });

  // ── 3. Distribution histogram
  const bands = [
    { l: '< 5',  min: 0, max: 4.99 },
    { l: '5–6',  min: 5, max: 5.99 },
    { l: '6–7',  min: 6, max: 6.99 },
    { l: '7–8',  min: 7, max: 7.99 },
    { l: '8–9',  min: 8, max: 8.99 },
    { l: '9–10', min: 9, max: 10   },
  ];
  let uBandIdx = -1;
  const hist = new Array(bands.length).fill(0);
  data.cohortCRs.forEach(cr => {
    for (let i = 0; i < bands.length; i++) {
      if (cr >= bands[i].min && cr <= bands[i].max) { hist[i]++; break; }
    }
  });
  for (let i = 0; i < bands.length; i++) {
    if (data.userCR >= bands[i].min && data.userCR <= bands[i].max) { uBandIdx = i; break; }
  }

  new Chart(document.getElementById('chart-dist').getContext('2d'), {
    type: 'bar',
    data: {
      labels: bands.map(b => b.l),
      datasets: [
        {
          label: 'Alunos',
          data: hist,
          backgroundColor: hist.map((_, i) =>
            i === uBandIdx ? '#4361ee' : 'rgba(67,97,238,.18)'
          ),
          borderColor: hist.map((_, i) =>
            i === uBandIdx ? '#4361ee' : 'rgba(67,97,238,.4)'
          ),
          borderWidth: 1,
          borderRadius: 5,
          borderSkipped: false,
          order: 2,
        },
        {
          type: 'line',
          label: 'Curva de densidade',
          data: hist,
          borderColor: '#0096c7',
          borderWidth: 2,
          tension: 0.45,
          pointRadius: 0,
          fill: false,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      scales: {
        y: {
          ticks: { precision: 0, ...tickOpts() },
          grid: gridOpts(),
          border: { display: false },
          title: { display: true, text: 'Nº Alunos', color: '#9299b0', font: { size: 11 } },
        },
        x: {
          ...xScale,
          title: { display: true, text: 'Faixa de CR', color: '#9299b0', font: { size: 11 } },
        },
      },
    },
  });

  // ── 4. Radar
  const catLabels = ['Básicas', 'Clínica', 'Cirurgia', 'Saúde Pública', 'Humanidades'];
  const rStudent  = catLabels.map(c => { const v = data.catStats[c]; return v.uc > 0 ? +(v.u / v.uc).toFixed(2) : 0; });
  const rCohort   = catLabels.map(c => { const v = data.catStats[c]; return v.cc > 0 ? +(v.c / v.cc).toFixed(2) : 0; });

  new Chart(document.getElementById('chart-radar').getContext('2d'), {
    type: 'radar',
    data: {
      labels: catLabels,
      datasets: [
        {
          label: 'Você',
          data: rStudent,
          backgroundColor: 'rgba(67,97,238,.15)',
          borderColor: '#4361ee',
          borderWidth: 2,
          pointBackgroundColor: '#4361ee',
          pointRadius: 3,
        },
        {
          label: 'Turma',
          data: rCohort,
          backgroundColor: 'transparent',
          borderColor: '#9299b0',
          borderDash: [4, 3],
          borderWidth: 1.5,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          min: 0,
          max: 10,
          ticks: { stepSize: 2, backdropColor: 'transparent', ...tickOpts() },
          angleLines: { color: '#e2e5ef' },
          grid: { color: '#e2e5ef' },
          pointLabels: { color: '#5a607a', font: { size: 11, family: "'Sora', sans-serif" } },
        },
      },
      plugins: { legend: { position: 'bottom' } },
    },
  });

  // ── 5. Top/Bottom 5 horizontal bar
  const sorted    = [...data.disciplines].sort((a, b) => b.diff - a.diff);
  const topBottom = [...sorted.slice(0, 5), ...sorted.slice(-5)];
  const tbLabels  = topBottom.map(d => d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name);
  const tbDiffs   = topBottom.map(d => +d.diff.toFixed(2));

  new Chart(document.getElementById('chart-ranking').getContext('2d'), {
    type: 'bar',
    indexAxis: 'y',
    data: {
      labels: tbLabels,
      datasets: [
        {
          label: 'Δ vs Turma',
          data: tbDiffs,
          backgroundColor: tbDiffs.map(v => v >= 0 ? 'rgba(45,157,120,.25)' : 'rgba(224,82,82,.25)'),
          borderColor:     tbDiffs.map(v => v >= 0 ? '#2d9d78' : '#e05252'),
          borderWidth: 1.5,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.parsed.x > 0 ? '+' : ''}${ctx.parsed.x.toFixed(2)} vs média`,
          },
        },
      },
      scales: {
        x: {
          ticks: tickOpts(),
          grid: gridOpts(),
          border: { display: false },
          title: { display: true, text: 'Δ Nota', color: '#9299b0', font: { size: 11 } },
        },
        y: {
          ticks: { color: '#5a607a', font: { size: 10.5, family: "'IBM Plex Mono', monospace" } },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  });
}

// ==========================================
// 8. HEATMAP
// ==========================================

function renderHeatmap(data) {
  const container = document.getElementById('heatmap-container');
  const names     = [...new Set(data.disciplines.map(d => d.name))].sort();
  const totalCols = data.periods.length;

  let html = `<div class="heatmap-grid" style="grid-template-columns:180px repeat(${totalCols},40px);">`;

  // Header row
  html += '<div></div>';
  data.periods.forEach(p => {
    html += `<div class="hm-header">${p}º</div>`;
  });

  // Data rows
  names.forEach(name => {
    html += `<div class="hm-row-label" title="${name}">${name}</div>`;
    data.periods.forEach(p => {
      const disc = data.disciplines.find(d => d.name === name && d.period === p);
      if (!disc) {
        html += '<div class="hm-cell empty"></div>';
        return;
      }
      const cls  = disc.userGrade >= 8.5 ? 'grade-hi' : disc.userGrade >= 6 ? 'grade-mid' : 'grade-low';
      const tip  = `${name} · ${p}º P\nNota: ${disc.userGrade.toFixed(1)} | Turma: ${disc.cohortMean.toFixed(1)}`;
      html += `<div class="hm-cell ${cls}" title="${tip}">${disc.userGrade.toFixed(1)}</div>`;
    });
  });

  html += '</div>';
  container.innerHTML = html;
}

// ==========================================
// 9. TABLE
// ==========================================

function renderTable(data) {
  const tbody = document.querySelector('#data-table tbody');
  tbody.innerHTML = data.disciplines
    .sort((a, b) => b.period - a.period || b.userGrade - a.userGrade)
    .map(d => {
      const sign = d.diff > 0 ? '+' : '';
      const ok   = d.diff >= 0;
      return `
        <tr>
          <td>${d.name}</td>
          <td class="mono">${d.period}º</td>
          <td class="mono" style="font-weight:600;">${d.userGrade.toFixed(1)}</td>
          <td class="mono" style="color:var(--text-3);">${d.cohortMean.toFixed(1)}</td>
          <td class="mono" style="color:${ok ? 'var(--green)' : 'var(--red)'};">${sign}${d.diff.toFixed(2)}</td>
          <td><span class="badge ${ok ? 'ok' : 'bad'}">${ok ? 'Adequado' : 'Atenção'}</span></td>
        </tr>
      `;
    })
    .join('');
}
