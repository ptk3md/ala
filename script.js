/**
 * MedDash Analytics — script.js (v2.1)
 */

// ─────────────────────────────────────────────
// CONFIG & CONSTANTS
// ─────────────────────────────────────────────
const CR_MIN_REQUIRED = 5.0; // Limiar mínimo exigido pela instituição (item 3)

// Mapeamento explícito de disciplinas por categoria (item 17)
const DISC_CATEGORY_MAP = {
  'Ativ. Integradoras I':            'Humanidades',
  'Ativ. Integradoras II':           'Humanidades',
  'Ativ. Integradoras III':          'Humanidades',
  'Bases Morfofuncionais':           'Básicas',
  'Bioquímica Mol. e Metab. I':      'Básicas',
  'Bioquímica Mol. e Metab. II':     'Básicas',
  'Biologia Molecular':              'Básicas',
  'Fund. Pesquisa Medicina I':       'Saúde Pública',
  'Fund. Pesquisa Medicina II':      'Saúde Pública',
  'Saúde e Sociedade I':             'Saúde Pública',
  'Saúde e Sociedade II':            'Saúde Pública',
  'Saúde e Sociedade III':           'Saúde Pública',
  'Sociologia e Antropologia I':     'Humanidades',
  'Sociologia e Antropologia II':    'Humanidades',
  'Sist. Int. - Nervoso/Endócrino':  'Básicas',
  'Sist. Int. - Digestório/Reprodutor':'Básicas',
  'Sist. Int. - Cardiocirc.':        'Básicas',
  'Sist. Int. - Resp./Urinário':     'Básicas',
  'Interação Agente Hosp. I':        'Básicas',
  'Interação Agente Hosp. II':       'Básicas',
  'Imunologia Básica':               'Básicas',
  'Imunologia Clínica':              'Clínica',
  'Farmacologia I':                  'Básicas',
  'Farmacologia II':                 'Clínica',
  'Habilidades Médicas I':           'Clínica',
  'Habilidades Médicas II':          'Clínica',
  'Habilidades Médicas III':         'Clínica',
  'Fisiopatologia':                  'Clínica',
  'Patologia Geral':                 'Clínica',
  'Patologia Especial':              'Clínica',
  'Saúde Mental I':                  'Humanidades',
  'Saúde Mental II':                 'Humanidades',
  'Saúde Mental III':                'Humanidades',
  'Semiologia I':                    'Clínica',
  'Semiologia II':                   'Clínica',
  'Semiologia Criança/Adol.':        'Clínica',
  'Semiologia Ginec./Obst.':         'Clínica',
  'Medicina Legal':                  'Saúde Pública',
  'Epidemiologia Clínica':           'Saúde Pública',
  'Dermatologia':                    'Clínica',
  'Doenças Infec. e Parasitárias':   'Clínica',
  'Raciocínio Clínico':              'Clínica',
  'Otorrinolaringologia':            'Clínica',
  'Clínica Criança/Adol.':           'Clínica',
  'Clínica Ginec./Obst.':            'Clínica',
  'Clínica Médica I':                'Clínica',
  'Clínica Médica II':               'Clínica',
  'Ortopedia':                       'Cirurgia',
  'Oftalmologia':                    'Clínica',
  'Clínica Cirúrgica':               'Cirurgia',
  'Urgência e Emergência':           'Clínica',
};

// Dependências entre disciplinas (item 8)
const DISC_DEPS = {
  'Farmacologia II':               ['Farmacologia I'],
  'Bioquímica Mol. e Metab. II':   ['Bioquímica Mol. e Metab. I'],
  'Imunologia Clínica':            ['Imunologia Básica'],
  'Patologia Especial':            ['Patologia Geral', 'Fisiopatologia'],
  'Semiologia II':                 ['Semiologia I', 'Habilidades Médicas I'],
  'Clínica Médica I':              ['Semiologia II', 'Fisiopatologia'],
  'Clínica Médica II':             ['Clínica Médica I'],
  'Clínica Cirúrgica':             ['Clínica Médica I', 'Fisiopatologia'],
  'Urgência e Emergência':         ['Clínica Médica I', 'Clínica Cirúrgica'],
  'Habilidades Médicas II':        ['Habilidades Médicas I'],
  'Habilidades Médicas III':       ['Habilidades Médicas II'],
};

// Fases do curso (item 6)
const COURSE_PHASES = [
  { label: 'Básico',      periods: [1, 2, 3, 4],   color: '#2563eb' },
  { label: 'Pré-Clínico', periods: [5, 6, 7, 8],   color: '#0891b2' },
  { label: 'Internato',   periods: [9, 10, 11, 12], color: '#16a34a' },
];

const CAT_LABELS = ['Básicas', 'Clínica', 'Cirurgia', 'Saúde Pública', 'Humanidades'];
const CAT_COLORS = {
  'Básicas': '#2563eb', 'Clínica': '#0891b2',
  'Cirurgia': '#e05252', 'Saúde Pública': '#16a34a', 'Humanidades': '#d97706',
};

const STATE = {
  rawDataMap: new Map(),
  currentUser: null,
  fullData: null,
  activeFilters: { periods: new Set(), categories: new Set() },
  tableSort: { key: 'period', dir: 'asc' },
  notes: {},
  activeSection: 'overview',
};

const _charts = {};
const $ = (t, p = {}, h = '') => Object.assign(document.createElement(t), p, { innerHTML: h });

// ─────────────────────────────────────────────
// CSS RESPONSIVO & FIXES INJETADOS NO JS
// ─────────────────────────────────────────────
function injectResponsiveCSS() {
  if (document.getElementById('meddash-responsive-styles')) return;
  const style = document.createElement('style');
  style.id = 'meddash-responsive-styles';
  style.innerHTML = `
    @media (max-width: 992px) {
      .layout { flex-direction: column; min-height: 100vh; }
      .sidebar { width: 100%; height: auto; position: static; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; padding: 1rem; }
      .sidebar-profile { display: none; }
      #main-nav { display: flex; flex-direction: row; flex-wrap: wrap; gap: 0.5rem; width: 100%; margin-top: 1rem; }
      #main-nav .nav-link { padding: 0.5rem; flex: 1; text-align: center; justify-content: center; font-size: 0.8rem; white-space: nowrap; }
      .main { margin-left: 0; padding: 1rem; width: 100%; }
      .kpi-grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
      .cols-2, .cols-2-1 { grid-template-columns: 1fr; }
      .insight-strip { flex-direction: column; gap: 0.5rem; }
      .chart-wrap { height: 280px !important; }
    }
    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr; }
      .chart-wrap { height: 240px !important; }
      .heatmap-grid { overflow-x: auto; }
      .data-table th, .data-table td { font-size: 0.75rem; padding: 0.4rem; }
    }
    .period-progress-badge { font-size: 0.65rem; background: var(--surface-2); color: var(--text-2); padding: 2px 6px; border-radius: 4px; margin-left: 6px; border: 1px solid var(--border); }
    .period-progress-badge.partial { background: var(--warning-dim); color: var(--warning); border-color: transparent; }
    .period-progress-badge.full { background: var(--success-dim); color: var(--success); border-color: transparent; }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// CHART DEFAULTS
// ─────────────────────────────────────────────
function applyChartDefaults() {
  Object.assign(Chart.defaults, {
    font: { family: "'Sora', sans-serif", size: 12 },
    color: '#5a607a',
  });
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: '#1a1d2e', titleColor: '#fff', bodyColor: '#c8cde0',
    padding: 10, cornerRadius: 6, displayColors: true, boxPadding: 4,
  });
  Chart.defaults.plugins.legend.labels = {
    ...Chart.defaults.plugins.legend.labels,
    usePointStyle: true, pointStyleWidth: 8, boxHeight: 8,
    padding: 16, font: { size: 11, family: "'Sora', sans-serif" },
  };
}

const gridOpts = () => ({ color: '#e2e5ef', drawBorder: false });
const tickOpts = () => ({ color: '#9299b0', font: { size: 11 } });
const baseOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  interaction: { mode: 'index', intersect: false },
};

function makeChart(id, type, data, opts) {
  const el = document.getElementById(id);
  if (!el) return;
  _charts[id]?.destroy();
  _charts[id] = new Chart(el.getContext('2d'), { type, data, options: { ...baseOpts, ...opts } });
  return _charts[id];
}

function destroyCharts(...ids) {
  (ids.length ? ids : Object.keys(_charts)).forEach(k => { _charts[k]?.destroy(); delete _charts[k]; });
}

// ─────────────────────────────────────────────
// CATEGORIZATION (item 17)
// ─────────────────────────────────────────────
function categorize(name) {
  if (DISC_CATEGORY_MAP[name]) return DISC_CATEGORY_MAP[name];
  const lower = name.toLowerCase();
  if (/cirurgi|operat|anestesio/.test(lower)) return 'Cirurgia';
  if (/clínica|semiolog|pediatr|intern|habilidad/.test(lower)) return 'Clínica';
  if (/epidemio|saúde pública|pesquisa/.test(lower)) return 'Saúde Pública';
  if (/sociolog|antropolog|ética|filosofia|humanidade|mental/.test(lower)) return 'Humanidades';
  return 'Básicas';
}

// ─────────────────────────────────────────────
// LOCAL STORAGE — notas pessoais (item 14)
// ─────────────────────────────────────────────
function loadNotes(mat) {
  try { return JSON.parse(localStorage.getItem('meddash_notes_' + mat) || '{}'); } catch { return {}; }
}
function saveNotes(mat, notes) {
  try { localStorage.setItem('meddash_notes_' + mat, JSON.stringify(notes)); } catch {}
}

// ─────────────────────────────────────────────
// LOGIN & CSV UPLOAD (items 11, 15)
// ─────────────────────────────────────────────
(function initLogin() {
  const form = document.getElementById('login-form');
  if (!form || document.getElementById('csv-dropzone')) return;

  const uploadGroup = $('div', { className: 'input-group' }, `
    <label style="color:var(--text-2);font-size:.8125rem;font-weight:600;margin-bottom:.4rem;display:block;">
      Base de Dados Acadêmica
    </label>
    <div id="csv-dropzone" class="dropzone">
      <span id="dropzone-text">Clique ou arraste o arquivo CSV da planilha acadêmica</span>
      <input type="file" id="csv-upload" accept=".csv" multiple style="display:none;">
    </div>
    <div id="upload-status" class="upload-status"></div>
  `);
  form.prepend(uploadGroup);

  const dz = document.getElementById('csv-dropzone');
  const fi = document.getElementById('csv-upload');
  const st = document.getElementById('upload-status');

  dz.onclick = () => fi.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag-over'); };
  dz.ondragleave = () => dz.classList.remove('drag-over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); };
  fi.onchange = e => handleFiles(e.target.files);

  function handleFiles(files) {
    if (!files.length) return;
    st.style.color = 'var(--text-2)';
    st.textContent = 'Processando ' + files.length + ' arquivo(s)…';
    Array.from(files).forEach(f => { if (f.name.endsWith('.csv')) parseCSV(f); });
  }

  fetch('Planilha_Academica_Medicina.csv')
    .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
    .then(blob => parseCSV(new File([blob], 'Planilha_Academica_Medicina.csv'), true))
    .catch(() => {});
})();

function parseCSV(fileOrUrl, isSilent) {
  isSilent = isSilent || false;
  Papa.parse(fileOrUrl, {
    download: typeof fileOrUrl === 'string',
    header: true, dynamicTyping: true, skipEmptyLines: true,
    complete: function(result) {
      if (result.errors.length && !isSilent) {
        const st = document.getElementById('upload-status');
        if (st) { st.style.color = 'var(--danger)'; st.textContent = '⚠ Erro ao processar o CSV. Verifique o arquivo.'; }
        return;
      }
      result.data.forEach(function(r) {
        const mat = String(r['Matrícula'] || '').trim();
        if (mat) STATE.rawDataMap.set(mat, r);
      });
      const st = document.getElementById('upload-status');
      if (st && !isSilent) {
        st.style.color = 'var(--success)';
        st.textContent = '✓ ' + STATE.rawDataMap.size + ' registros carregados com sucesso.';
      }
      validateLoginForm();
    },
    error: function() {
      const st = document.getElementById('upload-status');
      if (st && !isSilent) { st.style.color = 'var(--danger)'; st.textContent = '⚠ Falha ao ler o arquivo CSV.'; }
    },
  });
}

const emailInput     = document.getElementById('email');
const matriculaInput = document.getElementById('matricula');
const loginBtn       = document.getElementById('login-btn');
const errorEl        = document.getElementById('login-error');
const formEl         = document.getElementById('login-form');

function validateLoginForm() {
  if (!loginBtn) return;
  const hasEmail = emailInput && (emailInput.value.includes('@') || emailInput.value.toLowerCase() === 'teste');
  const hasMat   = matriculaInput && (matriculaInput.value.length >= 4 || matriculaInput.value === 'teste');
  loginBtn.disabled = !(hasEmail && hasMat);
}
[emailInput, matriculaInput].forEach(function(el) { el && el.addEventListener('input', validateLoginForm); });

formEl && formEl.addEventListener('submit', async function(e) {
  e.preventDefault();
  const btnText  = document.getElementById('btn-text');
  const spinner  = document.getElementById('btn-spinner');
  if (btnText)  btnText.textContent = 'Autenticando…';
  if (spinner)  spinner.classList.remove('hidden');

  await new Promise(function(r) { setTimeout(r, 480); });

  const email = emailInput.value.trim().toLowerCase();
  const mat   = matriculaInput.value.trim();
  const user  = Array.from(STATE.rawDataMap.values()).find(function(r) {
    return String(r['E-mail']).toLowerCase() === email && String(r['Matrícula']) === mat;
  });

  if (!user) {
    if (btnText) btnText.textContent = 'Acessar Dashboard';
    if (spinner) spinner.classList.add('hidden');
    const errText = document.getElementById('error-text');
    if (errText) errText.textContent = 'Credenciais inválidas. Verifique e-mail e matrícula.';
    if (errorEl) errorEl.classList.remove('hidden');
    if (formEl)  { formEl.classList.add('shake-animation'); setTimeout(function() { formEl.classList.remove('shake-animation'); }, 500); }
    return;
  }

  STATE.currentUser = user;
  STATE.notes = loadNotes(String(user['Matrícula']));
  document.body.classList.add('med-light');
  injectResponsiveCSS();
  buildDashboard();
});

// ─────────────────────────────────────────────
// DATA ENGINE (items 7, 9, 16) - REWORKED FOR FAIR COHORTS
// ─────────────────────────────────────────────
function processData() {
  const user     = STATE.currentUser;
  const allUsers = Array.from(STATE.rawDataMap.values());

  // 1. Mapeamento de períodos e disciplinas globais
  const periodsMap = {}; // period → [colKey]
  const discStats  = {}; // colKey → stats
  allUsers.forEach(function(u) {
    Object.keys(u).forEach(function(k) {
      if (discStats[k]) return; 
      const m = k.match(/\((\d+)º Período\)\s+(.+)/);
      if (!m) return;
      const p = +m[1], name = m[2].trim();
      if (!periodsMap[p]) periodsMap[p] = [];
      if (!periodsMap[p].includes(k)) periodsMap[p].push(k);
      discStats[k] = { name: name, period: p, category: categorize(name), userGrade: 0, sum: 0, count: 0 };
    });
  });

  // Preencher notas do usuário atual
  const userTakenDiscs = [];
  Object.keys(discStats).forEach(function(k) {
    const g = user[k];
    if (typeof g === 'number' && !isNaN(g) && g > 0) {
      discStats[k].userGrade = g;
      userTakenDiscs.push(k);
    }
  });

  const allPeriods = Object.keys(periodsMap).map(Number).sort((a,b)=>a-b);
  
  // Informações de períodos (lidar com períodos parciais)
  const userPeriodsInfo = allPeriods.map(p => {
    const pCols = periodsMap[p] || [];
    const takenCols = pCols.filter(k => user[k] > 0);
    return { p: p, total: pCols.length, taken: takenCols.length, takenCols: takenCols };
  }).filter(info => info.taken > 0);

  const userPeriods = userPeriodsInfo.map(info => info.p);
  const userMaxPeriodActual = userPeriods.length > 0 ? Math.max(...userPeriods) : 0;

  // 2. Classificação de coorte: "comparável apenas aos alunos que cumpriram a mesma carga horária"
  // Um par é alguém que cursou pelo menos UMA disciplina no `userMaxPeriodActual` ou além
  function getStudentMaxPeriod(u) {
    return Math.max(0, ...allPeriods.filter(p => (periodsMap[p]||[]).some(k => u[k] > 0)));
  }

  const peerUsers = allUsers.filter(u => getStudentMaxPeriod(u) >= userMaxPeriodActual);

  // Calcular CR apenas pelas matérias em intersecção com o usuário
  const peerCRs = peerUsers.map(u => {
    let tSum = 0, tCount = 0;
    userTakenDiscs.forEach(k => {
      if (u[k] > 0) { tSum += u[k]; tCount++; }
    });
    return tCount > 0 ? tSum / tCount : 0;
  });

  let userTSum = 0, userTCount = 0;
  userTakenDiscs.forEach(k => {
    userTSum += user[k]; userTCount++;
  });
  let userCR = userTCount > 0 ? userTSum / userTCount : 0;

  const peerTotal   = peerCRs.length;
  const userRank    = peerCRs.filter(cr => cr > userCR).length + 1;
  const userPercentile = peerTotal > 0 ? Math.round(((peerTotal - userRank) / peerTotal) * 100) : 0;

  // 3. Stats por período (lidando com períodos cursados parcialmente)
  const statsPerPeriod = userPeriodsInfo.map(info => {
    const p = info.p;
    // Turma do período = Todos que chegaram ao período p
    const peersP = allUsers.filter(u => getStudentMaxPeriod(u) >= p);
    
    // Média dos peers APENAS nas disciplinas que o aluno fez nesse período
    const peerMeansP = peersP.map(u => {
      let s = 0, c = 0;
      info.takenCols.forEach(k => {
        if (u[k] > 0) { s += u[k]; c++; }
      });
      return c > 0 ? s / c : null;
    }).filter(v => v !== null);

    const n    = peerMeansP.length;
    const sorted = peerMeansP.slice().sort((a,b)=>a-b);
    const mean = n > 0 ? sorted.reduce((a,b)=>a+b,0)/n : 0;
    const variance = n > 1 ? sorted.reduce((sq,v)=>sq+Math.pow(v-mean,2),0)/(n-1) : 0;
    const stdDev = Math.sqrt(Math.max(0, variance));
    const top10  = sorted[Math.floor(n * 0.9)] || mean;

    let uSum = 0, uCnt = 0;
    info.takenCols.forEach(k => { uSum += user[k]; uCnt++; });
    const userM = uCnt > 0 ? uSum / uCnt : 0;

    const pRank = peerMeansP.filter(m => m > userM).length + 1;
    const pPct  = n > 0 ? Math.round(((n - pRank) / n) * 100) : 0;

    return {
      period: p, studentMean: userM, cohortMean: mean,
      cohortStdDev: stdDev, top10Mean: top10,
      periodRank: pRank, periodPct: pPct,
      periodPeerCount: peersP.length,
      total: info.total, taken: info.taken
    };
  });

  // 4. CatStats (Áreas)
  const catStats = {};
  CAT_LABELS.forEach(c => catStats[c] = { u: 0, uc: 0, c: 0, cc: 0 });
  Object.keys(discStats).forEach(k => {
    const d = discStats[k];
    if (d.userGrade > 0) {
      catStats[d.category].u  += d.userGrade;
      catStats[d.category].uc += 1;
    }
  });

  allUsers.forEach(u => {
    Object.keys(discStats).forEach(k => {
      const g = u[k];
      if (typeof g === 'number' && !isNaN(g) && g > 0) {
        discStats[k].sum   += g;
        discStats[k].count += 1;
        // Compute area averages from everyone who took it
        catStats[discStats[k].category].c  += g;
        catStats[discStats[k].category].cc += 1;
      }
    });
  });

  // 5. Complementares
  const userAllGrades = Object.values(discStats).filter(d => d.userGrade > 0).map(d => d.userGrade);
  const gradeMean    = userAllGrades.length > 0 ? userAllGrades.reduce((a,b)=>a+b,0)/userAllGrades.length : 0;
  const gradeVar     = userAllGrades.reduce((sq,v)=>sq+Math.pow(v-gradeMean,2),0)/Math.max(1,userAllGrades.length-1);
  const gradeStdDev  = Math.sqrt(gradeVar);

  const doneSP = statsPerPeriod.filter(s => s.studentMean > 0);
  let trendSlope = 0;
  if (doneSP.length >= 2) {
    const xs = doneSP.map((_,i) => i), ys = doneSP.map(s => s.studentMean);
    const xMean = xs.reduce((a,b)=>a+b,0)/xs.length, yMean = ys.reduce((a,b)=>a+b,0)/ys.length;
    const num = xs.reduce((s,x,i) => s+(x-xMean)*(ys[i]-yMean),0);
    const den = xs.reduce((s,x) => s+Math.pow(x-xMean,2),0);
    trendSlope = den > 0 ? num/den : 0;
  }
  const trendDiff = doneSP.length > 0 ? (doneSP[doneSP.length-1].studentMean - userCR) : 0;

  const depWarnings = [];
  Object.keys(DISC_DEPS).forEach(disc => {
    DISC_DEPS[disc].forEach(dep => {
      const depEntry    = Object.values(discStats).find(d => d.name === dep);
      const targetEntry = Object.values(discStats).find(d => d.name === disc);
      if (depEntry && depEntry.userGrade > 0 && depEntry.userGrade < 6.5 && targetEntry) {
        depWarnings.push({ dependency: dep, target: disc, depGrade: depEntry.userGrade });
      }
    });
  });

  const disciplines = Object.values(discStats).filter(d => d.userGrade > 0).map(d => {
    const cohortMean = d.count > 0 ? d.sum / d.count : 0;
    return Object.assign({}, d, { cohortMean: cohortMean, diff: d.userGrade - cohortMean });
  });

  return {
    statsPerPeriod:       statsPerPeriod,
    userPeriodsInfo:      userPeriodsInfo,
    userCR:               userCR,
    userRank:             userRank,
    totalStudents:        peerTotal,
    totalAllStudents:     allUsers.length,
    userMaxPeriod:        userMaxPeriodActual,
    userPercentile:       userPercentile,
    trendDiff:            trendDiff,
    trendSlope:           trendSlope,
    cohortCRs:            new Float32Array(peerCRs),
    catStats:             catStats,
    disciplines:          disciplines,
    periods:              userPeriods,
    allPeriods:           allPeriods,
    gradeStdDev:          gradeStdDev,
    gradeMean:            gradeMean,
    depWarnings:          depWarnings,
    crMargin:             userCR - CR_MIN_REQUIRED,
    completedPeriods:     userPeriods.length,
    totalExpectedPeriods: 12,
  };
}

function getFilteredView(fd) {
  const ap = STATE.activeFilters.periods;
  const ac = STATE.activeFilters.categories;
  const disciplines = fd.disciplines.filter(function(d) {
    return (!ap.size || ap.has(d.period)) && (!ac.size || ac.has(d.category));
  });
  const catStats = {};
  CAT_LABELS.forEach(function(k) { catStats[k] = { u: 0, uc: 0, c: 0, cc: 0 }; });
  disciplines.forEach(function(d) {
    const c = catStats[d.category];
    c.u += d.userGrade; c.uc++;
    c.c += d.cohortMean; c.cc++;
  });
  return Object.assign({}, fd, {
    disciplines: disciplines,
    periods: ap.size ? fd.periods.filter(function(p) { return ap.has(p); }) : fd.periods,
    statsPerPeriod: ap.size ? fd.statsPerPeriod.filter(function(s) { return ap.has(s.period); }) : fd.statsPerPeriod,
    catStats: catStats,
  });
}

// ─────────────────────────────────────────────
// ANIMATE VALUE
// ─────────────────────────────────────────────
function animateValue(el, from, to, duration) {
  if (!el) return;
  let start = null;
  function step(ts) {
    if (!start) start = ts;
    const p = Math.min((ts - start) / duration, 1);
    el.textContent = (p * (to - from) + from).toFixed(2);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function riskBadge(level) {
  const map = {
    ok:     '<span style="background:var(--success-dim);color:var(--success);padding:2px 9px;border-radius:99px;font-size:.75rem;font-weight:600;">✓ OK</span>',
    warn:   '<span style="background:var(--warning-dim);color:var(--warning);padding:2px 9px;border-radius:99px;font-size:.75rem;font-weight:600;">⚠ Atenção</span>',
    danger: '<span style="background:var(--danger-dim);color:var(--danger);padding:2px 9px;border-radius:99px;font-size:.75rem;font-weight:600;">🚨 Risco</span>',
  };
  return map[level] || '';
}

// ─────────────────────────────────────────────
// BUILD DASHBOARD SHELL
// ─────────────────────────────────────────────
function buildDashboard() {
  applyChartDefaults();
  const data = STATE.fullData = processData();
  const u = STATE.currentUser;
  const { userPercentile, userPeriodsInfo } = data;
  
  // Progress status string for header
  const curPeriodInfo = userPeriodsInfo[userPeriodsInfo.length - 1];
  const curPeriodBadge = curPeriodInfo.taken < curPeriodInfo.total 
    ? `<span class="period-progress-badge partial">Cursando (${curPeriodInfo.taken}/${curPeriodInfo.total} disc.)</span>` 
    : `<span class="period-progress-badge full">Concluído</span>`;

  document.body.innerHTML = `
<div class="layout">
  <aside class="sidebar fade-1" id="sidebar">
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <span class="sidebar-brand-name">MedDash</span>
    </div>
    <div class="sidebar-profile">
      <div class="sidebar-avatar">${u['Nome do Aluno'][0]}</div>
      <div class="sidebar-name">${u['Nome do Aluno']}</div>
      <div class="sidebar-id">ID ${u['Matrícula']}</div>
      <span class="badge-pct">Superou ${userPercentile}%</span>
      <div style="font-size:9px;color:var(--text-3);margin-top:4px;">${data.userMaxPeriod}º período ${curPeriodBadge}</div>
    </div>
    <nav id="main-nav">
      <a href="#" class="nav-link active" data-section="overview">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Visão Geral
      </a>
      <a href="#" class="nav-link" data-section="timeline">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Linha do Tempo
      </a>
      <a href="#" class="nav-link" data-section="risk">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        Alertas
      </a>
      <a href="#" class="nav-link" data-section="simulator">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        Simulador
      </a>
      <a href="#" class="nav-link" data-section="disciplines">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        Disciplinas
      </a>
      <a href="#" class="nav-link" data-section="notes">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        Anotações
      </a>
    </nav>
    <div style="margin-top:auto;padding:.5rem;width:100%;">
      <button id="btn-export-pdf" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface);color:var(--text-2);font-size:var(--t-xs);font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        PDF
      </button>
      <button id="btn-logout" style="width:100%;margin-top:.5rem;padding:.5rem;border:1px solid var(--border);border-radius:var(--r-md);background:transparent;color:var(--text-3);font-size:var(--t-xs);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;">
        Sair
      </button>
    </div>
  </aside>
  <main class="main" id="main-content">
    <div id="section-content"></div>
  </main>
</div>`;

  document.getElementById('main-nav').addEventListener('click', function(e) {
    const link = e.target.closest('[data-section]');
    if (!link) return;
    e.preventDefault();
    document.querySelectorAll('#main-nav .nav-link').forEach(function(l) { l.classList.remove('active'); });
    link.classList.add('active');
    STATE.activeSection = link.dataset.section;
    renderSection(STATE.activeSection);
  });

  document.getElementById('btn-logout').onclick = function() { location.reload(); };
  document.getElementById('btn-export-pdf').onclick = exportPDF;

  renderSection('overview');
}

// ─────────────────────────────────────────────
// SECTION ROUTER
// ─────────────────────────────────────────────
function renderSection(section) {
  destroyCharts();
  const container = document.getElementById('section-content');
  const data = STATE.fullData;
  if      (section === 'overview')    renderOverview(container, data);
  else if (section === 'timeline')    renderTimeline(container, data);
  else if (section === 'risk')        renderRisk(container, data);
  else if (section === 'simulator')   renderSimulator(container, data);
  else if (section === 'disciplines') renderDisciplines(container, data);
  else if (section === 'notes')       renderNotes(container, data);
}

// ─────────────────────────────────────────────
// SECTION: OVERVIEW
// ─────────────────────────────────────────────
function renderOverview(container, data) {
  const { userCR, userRank, totalStudents, totalAllStudents, userMaxPeriod, userPercentile, trendDiff, crMargin, gradeStdDev, gradeMean, statsPerPeriod, disciplines, catStats, cohortCRs, userPeriodsInfo } = data;
  const trendColor = trendDiff >= 0 ? 'var(--success)' : 'var(--danger)';
  const trendSign  = trendDiff > 0 ? '+' : '';
  const crMarginColor = crMargin < 0.5 ? 'var(--danger)' : crMargin < 1.5 ? 'var(--warning)' : 'var(--success)';
  const volatilityLabel = gradeStdDev < 1 ? 'Estável' : gradeStdDev < 1.8 ? 'Moderada' : 'Alta';
  const volatilityColor = gradeStdDev < 1 ? 'var(--success)' : gradeStdDev < 1.8 ? 'var(--warning)' : 'var(--danger)';
  
  const curPeriodInfo = userPeriodsInfo[userPeriodsInfo.length - 1];

  container.innerHTML = `
<div class="page-header fade-2">
  <h1 class="page-title">Performance Acadêmica</h1>
  <p class="page-sub">Prontuário analítico longitudinal · ${STATE.currentUser['Nome do Aluno']}</p>
</div>
<div class="kpi-grid fade-3">
  <div class="kpi-card primary"><div class="kpi-label">CR Global</div><div class="kpi-value" id="kpi-cr">0.00</div><div class="kpi-sub">Calculado na intersecção com a turma</div></div>
  <div class="kpi-card teal"><div class="kpi-label">Posição Turma</div><div class="kpi-value">${userRank}º</div><div class="kpi-sub">entre ${totalStudents} alunos c/ msm carga horária</div></div>
  <div class="kpi-card ${trendDiff >= 0 ? 'green' : 'amber'}"><div class="kpi-label">Tendência Recente</div><div class="kpi-value" style="color:${trendColor};">${trendSign}${trendDiff.toFixed(2)}</div><div class="kpi-sub">Último período vs histórico</div></div>
  <div class="kpi-card green"><div class="kpi-label">Percentil</div><div class="kpi-value" style="color:var(--success);">${userPercentile}%</div><div class="kpi-sub">Melhor que ${userPercentile}% da coorte comparável</div></div>
  <div class="kpi-card ${crMargin < 0.5 ? 'danger' : crMargin < 1.5 ? 'amber' : 'green'}"><div class="kpi-label">Margem CR Mínimo</div><div class="kpi-value" style="color:${crMarginColor};">${crMargin >= 0 ? '+' : ''}${crMargin.toFixed(2)}</div><div class="kpi-sub">vs mínimo exigido (${CR_MIN_REQUIRED.toFixed(1)})</div></div>
  <div class="kpi-card ${gradeStdDev < 1 ? 'green' : gradeStdDev < 1.8 ? 'amber' : 'danger'}"><div class="kpi-label">Volatilidade</div><div class="kpi-value" style="color:${volatilityColor};font-size:1.5rem;">${volatilityLabel}</div><div class="kpi-sub">DP: ${gradeStdDev.toFixed(2)} · Média: ${gradeMean.toFixed(2)}</div></div>
</div>
<div id="insights-strip" class="insight-strip fade-3"></div>
<div class="chart-section cols-2-1 fade-4">
  <div class="card"><div class="card-title">Evolução por Período (vs Intersecção de Disciplinas)</div><div class="chart-wrap" style="height:300px;"><canvas id="chart-evo"></canvas></div></div>
  <div class="card"><div class="card-title">Perfil de Competências por Área</div><div class="chart-wrap" style="height:300px;"><canvas id="chart-radar"></canvas></div></div>
</div>
<div class="chart-section cols-2 fade-4">
  <div class="card"><div class="card-title">Túnel de Crescimento (±1 DP da turma)</div><div class="chart-wrap" style="height:260px;"><canvas id="chart-growth"></canvas></div></div>
  <div class="card"><div class="card-title">Distribuição da Turma (CR Normalizado)</div><div class="chart-wrap" style="height:260px;"><canvas id="chart-dist"></canvas></div></div>
</div>
<div class="chart-section cols-2-1 fade-5">
  <div class="card"><div class="card-title">Heatmap de Notas por Disciplina</div><div id="heatmap-container" class="heatmap-wrap"></div></div>
  <div class="card"><div class="card-title">Top 5 / Bottom 5 — Δ vs Turma</div><div class="chart-wrap" style="height:380px;"><canvas id="chart-ranking"></canvas></div></div>
</div>`;

  animateValue(document.getElementById('kpi-cr'), 0, userCR, 900);
  renderInsights(data);
  renderOverviewCharts(data);
}

function renderInsights(data) {
  const { disciplines, statsPerPeriod, userPercentile, trendSlope, depWarnings, crMargin, userPeriodsInfo } = data;
  const strip = document.getElementById('insights-strip');
  if (!strip) return;
  const insights = [];

  const curInfo = userPeriodsInfo[userPeriodsInfo.length - 1];
  if (curInfo.taken < curInfo.total) {
    insights.push({ cls: 'warning', icon: '⏳', title: 'Período Incompleto', body: 'Você cursou <strong>' + curInfo.taken + ' de ' + curInfo.total + '</strong> disciplinas no ' + curInfo.p + 'º P. As comparações são feitas com justiça sobre as disciplinas que você cursou.' });
  }

  const best = disciplines.slice().sort(function(a, b) { return b.diff - a.diff; })[0];
  if (best) insights.push({ cls: 'green', icon: '🏆', title: 'Destaque', body: 'Alta performance em <strong>' + best.name + '</strong> (+' + best.diff.toFixed(2) + ' vs turma).' });

  const drops = statsPerPeriod.slice(1)
    .map(function(s, i) { return { p: s.period, d: s.studentMean - statsPerPeriod[i].studentMean }; })
    .filter(function(x) { return x.d < -0.5; })
    .sort(function(a, b) { return a.d - b.d; });
  if (drops.length > 0)
    insights.push({ cls: 'red', icon: '⚠', title: 'Queda Brusca', body: 'Queda de <strong>' + Math.abs(drops[0].d).toFixed(2) + ' pts</strong> no ' + drops[0].p + 'º período. Veja os alertas.' });

  if (trendSlope < -0.2)
    insights.push({ cls: 'warning', icon: '📉', title: 'Tendência de Queda', body: 'Declínio gradual nos últimos 3 períodos (' + trendSlope.toFixed(2) + '/período). Aja preventivamente.' });

  if (crMargin < 0.5)
    insights.push({ cls: 'red', icon: '🚨', title: 'Risco de CR Mínimo', body: 'Seu CR está ' + (crMargin < 0 ? 'abaixo — ' : '') + '<strong>' + Math.abs(crMargin).toFixed(2) + ' pts</strong> do mínimo exigido.' });

  if (depWarnings.length > 0)
    insights.push({ cls: 'warning', icon: '🔗', title: 'Dependências em Risco', body: 'Baixo desempenho em <strong>' + depWarnings[0].dependency + '</strong> (' + depWarnings[0].depGrade.toFixed(1) + ') pode afetar ' + depWarnings[0].target + '.' });

  insights.push({ cls: 'teal', icon: '📊', title: 'Posição (Ajustada)', body: 'Comparado estritamente à mesma carga horária, você superou <strong>' + userPercentile + '%</strong> de ' + data.totalStudents + ' peers.' });

  strip.innerHTML = insights.slice(0, 6).map(function(ins) {
    return '<div class="insight ' + ins.cls + '"><div class="insight-head">' + ins.icon + ' ' + ins.title + '</div><div class="insight-body">' + ins.body + '</div></div>';
  }).join('');
}

function renderOverviewCharts(data) {
  const { statsPerPeriod, disciplines, catStats, cohortCRs, userCR } = data;
  const labels = statsPerPeriod.map(function(s) { return s.period + 'º P'; });
  const stu = statsPerPeriod.map(function(s) { return +s.studentMean.toFixed(2); });
  const coh = statsPerPeriod.map(function(s) { return +s.cohortMean.toFixed(2); });
  const t10 = statsPerPeriod.map(function(s) { return +s.top10Mean.toFixed(2); });
  const up  = statsPerPeriod.map(function(s) { return +(s.cohortMean + s.cohortStdDev).toFixed(2); });
  const low = statsPerPeriod.map(function(s) { return +Math.max(0, s.cohortMean - s.cohortStdDev).toFixed(2); });
  const yS  = { min: 0, max: 10, ticks: Object.assign({ stepSize: 2 }, tickOpts()), grid: gridOpts(), border: { display: false } };
  const xS  = { ticks: tickOpts(), grid: { display: false }, border: { display: false } };

  const evoCanvas = document.getElementById('chart-evo');
  if (evoCanvas) {
    const grad = evoCanvas.getContext('2d').createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, 'rgba(37,99,235,.18)');
    grad.addColorStop(1, 'rgba(37,99,235,0)');
    makeChart('chart-evo', 'line', {
      labels: labels,
      datasets: [
        { label: 'Sua Média',    data: stu, borderColor: '#2563eb', backgroundColor: grad, fill: true, tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#2563eb', pointRadius: 4, pointHoverRadius: 6, order: 1 },
        { label: 'Turma (Comparável)', data: coh, borderColor: '#9299b0', borderDash: [5,4], tension: 0.4, borderWidth: 1.5, pointRadius: 0, fill: false, order: 2 },
        { label: 'Top 10%',     data: t10, borderColor: '#16a34a', borderDash: [2,4], tension: 0.4, borderWidth: 1.5, pointRadius: 0, fill: false, order: 3 },
      ],
    }, { scales: { y: yS, x: xS } });
  }

  makeChart('chart-growth', 'line', {
    labels: labels,
    datasets: [
      { label: 'Sua Nota', data: stu, borderColor: '#2563eb', tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#2563eb', pointRadius: 4, fill: false, order: 1 },
      { label: '+1 DP',    data: up,  borderColor: 'transparent', backgroundColor: 'rgba(22,163,74,.12)', fill: '+1', tension: 0.4, pointRadius: 0, order: 3 },
      { label: 'Média Turma', data: coh, borderColor: '#9299b0', borderDash: [4,4], borderWidth: 1.5, tension: 0.4, pointRadius: 0, fill: false, order: 2 },
      { label: '-1 DP',    data: low, borderColor: 'transparent', backgroundColor: 'rgba(22,163,74,.12)', fill: '-1', tension: 0.4, pointRadius: 0, order: 4 },
    ],
  }, {
    scales: { y: yS, x: xS },
    plugins: { legend: { labels: { filter: function(i) { return i.text !== '+1 DP' && i.text !== '-1 DP'; } } } },
  });

  const bands = [
    { l: '< 5', min: 0, max: 4.99 }, { l: '5–6', min: 5, max: 5.99 }, { l: '6–7', min: 6, max: 6.99 },
    { l: '7–8', min: 7, max: 7.99 }, { l: '8–9', min: 8, max: 8.99 }, { l: '9–10', min: 9, max: 10 },
  ];
  const hist = new Array(6).fill(0);
  Array.from(cohortCRs).forEach(function(cr) {
    const i = bands.findIndex(function(b) { return cr >= b.min && cr <= b.max; });
    if (i > -1) hist[i]++;
  });
  const uBIdx = bands.findIndex(function(b) { return userCR >= b.min && userCR <= b.max; });
  makeChart('chart-dist', 'bar', {
    labels: bands.map(function(b) { return b.l; }),
    datasets: [
      { label: 'Alunos', data: hist, backgroundColor: hist.map(function(_, i) { return i === uBIdx ? '#2563eb' : 'rgba(37,99,235,.18)'; }), borderColor: hist.map(function(_, i) { return i === uBIdx ? '#2563eb' : 'rgba(37,99,235,.4)'; }), borderWidth: 1, borderRadius: 5, order: 2 },
      { type: 'line', label: 'Densidade', data: hist, borderColor: '#0891b2', borderWidth: 2, tension: 0.45, pointRadius: 0, fill: false, order: 1 },
    ],
  }, {
    indexAxis: 'y',
    scales: { x: { ticks: Object.assign({ precision: 0 }, tickOpts()), grid: gridOpts(), border: { display: false } }, y: { ticks: tickOpts(), grid: { display: false }, border: { display: false } } },
  });

  makeChart('chart-radar', 'radar', {
    labels: CAT_LABELS,
    datasets: [
      { label: 'Você',   data: CAT_LABELS.map(function(c) { return catStats[c].uc ? +(catStats[c].u / catStats[c].uc).toFixed(2) : 0; }), backgroundColor: 'rgba(37,99,235,.15)', borderColor: '#2563eb', borderWidth: 2, pointBackgroundColor: '#2563eb', pointRadius: 3 },
      { label: 'Turma Global',  data: CAT_LABELS.map(function(c) { return catStats[c].cc ? +(catStats[c].c / catStats[c].cc).toFixed(2) : 0; }), backgroundColor: 'transparent', borderColor: '#9299b0', borderDash: [4,3], borderWidth: 1.5, pointRadius: 0 },
    ],
  }, { scales: { r: { min: 0, max: 10, ticks: { stepSize: 2, backdropColor: 'transparent', color: '#9299b0', font: { size: 11 } }, angleLines: { color: '#e2e5ef' }, grid: { color: '#e2e5ef' }, pointLabels: { color: '#5a607a', font: { size: 11, family: "'Sora', sans-serif" } } } } });

  const sorted = disciplines.slice().sort(function(a, b) { return b.diff - a.diff; });
  const tb = sorted.slice(0, 5).concat(sorted.slice(-5));
  makeChart('chart-ranking', 'bar', {
    labels: tb.map(function(d) { return d.name.length > 22 ? d.name.slice(0, 22) + '…' : d.name; }),
    datasets: [{ label: 'Δ vs Turma', data: tb.map(function(d) { return +d.diff.toFixed(2); }), backgroundColor: tb.map(function(d) { return d.diff >= 0 ? 'rgba(22,163,74,.25)' : 'rgba(220,38,38,.25)'; }), borderColor: tb.map(function(d) { return d.diff >= 0 ? '#16a34a' : '#dc2626'; }), borderWidth: 1.5, borderRadius: 4 }],
  }, {
    indexAxis: 'y',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(c) { return ' ' + (c.parsed.x > 0 ? '+' : '') + c.parsed.x.toFixed(2) + ' vs média'; } } } },
    scales: { x: { ticks: tickOpts(), grid: gridOpts(), border: { display: false } }, y: { ticks: { color: '#5a607a', font: { size: 10.5 } }, grid: { display: false }, border: { display: false } } },
  });

  renderHeatmap('heatmap-container', disciplines, data.periods);
}

function renderHeatmap(containerId, disciplines, periods) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const names = Array.from(new Set(disciplines.map(function(d) { return d.name; }))).sort();
  if (!names.length) return;
  container.innerHTML = '<div class="heatmap-grid" style="display:grid;grid-template-columns:minmax(120px,180px) repeat(' + periods.length + ',minmax(30px,40px));gap:2px;">'
    + '<div></div>' + periods.map(function(p) { return '<div class="hm-header">' + p + 'º</div>'; }).join('')
    + names.map(function(n) {
        return '<div class="hm-row-label" title="' + n + '">' + n + '</div>'
          + periods.map(function(p) {
              const d = disciplines.find(function(x) { return x.name === n && x.period === p; });
              if (!d) return '<div class="hm-cell empty"></div>';
              const cls = d.userGrade >= 8.5 ? 'grade-hi' : d.userGrade >= 6 ? 'grade-mid' : 'grade-low';
              return '<div class="hm-cell ' + cls + '" title="' + n + ' · ' + p + 'º P&#10;Nota: ' + d.userGrade.toFixed(1) + ' | Turma: ' + d.cohortMean.toFixed(1) + '">' + d.userGrade.toFixed(1) + '</div>';
            }).join('');
      }).join('')
    + '</div>';
}

// ─────────────────────────────────────────────
// SECTION: LINHA DO TEMPO (items 5, 6, 7, 10)
// ─────────────────────────────────────────────
function renderTimeline(container, data) {
  const { statsPerPeriod, periods, totalExpectedPeriods, userPeriodsInfo } = data;
  const completedSet = new Set(statsPerPeriod.filter(function(s) { return s.studentMean > 0; }).map(function(s) { return s.period; }));
  const maxDone = completedSet.size > 0 ? Math.max.apply(null, Array.from(completedSet)) : 0;

  const phaseHTML = COURSE_PHASES.map(function(ph) {
    const phDone = ph.periods.filter(function(p) { return completedSet.has(p); });
    const phMean = phDone.length
      ? statsPerPeriod.filter(function(s) { return ph.periods.includes(s.period) && s.studentMean > 0; }).reduce(function(a, s) { return a + s.studentMean; }, 0) / phDone.length
      : null;
    return '<div style="background:var(--surface);border:1px solid var(--border);border-left:4px solid ' + ph.color + ';border-radius:var(--r-lg);padding:1rem 1.25rem;flex:1;min-width:180px;">'
      + '<div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);">' + ph.label + '</div>'
      + '<div style="font-size:var(--t-xs);color:var(--text-3);margin-bottom:.5rem;">Períodos ' + ph.periods[0] + '–' + ph.periods[ph.periods.length - 1] + '</div>'
      + (phMean !== null
          ? '<div style="font-family:var(--mono);font-size:1.5rem;font-weight:500;color:var(--text);">' + phMean.toFixed(2) + '</div><div style="font-size:var(--t-xs);color:var(--text-3);">média da fase</div>'
          : '<div style="font-size:var(--t-sm);color:var(--text-3);">Não iniciada</div>')
      + '<div style="margin-top:.5rem;">'
      + ph.periods.map(function(p) { return '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;margin:2px;background:' + (completedSet.has(p) ? ph.color : 'var(--border)') + ';" title="' + p + 'º período"></span>'; }).join('')
      + '</div></div>';
  }).join('');

  const doneSP = statsPerPeriod.filter(function(s) { return s.studentMean > 0; });
  const rankLabels = doneSP.map(function(s) { return s.period + 'º P'; });
  const rankData   = doneSP.map(function(s) { return s.periodPct; });

  container.innerHTML = `
<div class="page-header fade-2">
  <h1 class="page-title">Linha do Tempo — 6 Anos</h1>
  <p class="page-sub">Sua jornada acadêmica completa por período e fase do curso.</p>
</div>

<div class="card fade-3" style="margin-bottom:1rem;">
  <div class="card-title">Roadmap dos ${totalExpectedPeriods} Períodos</div>
  <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:1rem;">
    ${Array.from({length: totalExpectedPeriods}, function(_, i) { return i + 1; }).map(function(p) {
      const sp      = statsPerPeriod.find(function(s) { return s.period === p; });
      const done    = sp && sp.studentMean > 0;
      const current = !done && p === maxDone + 1;
      const phase   = COURSE_PHASES.find(function(ph) { return ph.periods.includes(p); });
      const color   = phase ? phase.color : '#9299b0';
      const bg      = done ? color : current ? color + '22' : 'var(--surface-2)';
      const border  = done || current ? color : 'var(--border)';
      const textCol = done ? '#fff' : current ? color : 'var(--text-3)';
      return '<div style="flex:1;min-width:80px;max-width:110px;padding:.75rem .5rem;border-radius:var(--r-lg);border:2px solid ' + border + ';background:' + bg + ';text-align:center;" title="' + p + 'º Período">'
        + '<div style="font-size:var(--t-xs);font-weight:700;color:' + textCol + ';">' + p + 'º</div>'
        + '<div style="font-family:var(--mono);font-size:var(--t-sm);font-weight:600;color:' + textCol + ';">' + (done ? sp.studentMean.toFixed(1) : current ? '…' : '–') + '</div>'
        + (done ? '<div style="font-size:9px;color:rgba(255,255,255,.8);margin-top:2px;">' + sp.taken + '/' + sp.total + ' disc.</div>' : '')
        + '</div>';
    }).join('')}
  </div>
  <div style="display:flex;gap:.5rem;font-size:var(--t-xs);color:var(--text-3);">
    ${COURSE_PHASES.map(function(ph) { return '<span><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:' + ph.color + ';margin-right:4px;"></span>' + ph.label + '</span>'; }).join('<span style="margin:0 .25rem;">·</span>')}
  </div>
</div>

<div class="card fade-3" style="margin-bottom:1rem;">
  <div class="card-title">Desempenho por Fase do Curso</div>
  <div style="display:flex;gap:1rem;flex-wrap:wrap;">${phaseHTML}</div>
</div>

<div class="chart-section cols-2 fade-4">
  <div class="card">
    <div class="card-title">Evolução do Percentil por Período</div>
    <div class="chart-wrap" style="height:260px;"><canvas id="chart-rank-history"></canvas></div>
  </div>
  <div class="card">
    <div class="card-title">Média por Período — por Fase</div>
    <div class="chart-wrap" style="height:260px;"><canvas id="chart-period-detail"></canvas></div>
  </div>
</div>

<div class="card fade-5" style="margin-bottom:1rem;">
  <div class="card-title">Evolução por Área ao Longo do Tempo</div>
  <div class="chart-wrap" style="height:300px;"><canvas id="chart-area-evolution"></canvas></div>
</div>`;

  makeChart('chart-rank-history', 'line', {
    labels: rankLabels,
    datasets: [{ label: 'Seu Percentil no Período', data: rankData, borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,.1)', fill: true, tension: 0.4, borderWidth: 2.5, pointBackgroundColor: '#2563eb', pointRadius: 4, pointHoverRadius: 6 }],
  }, {
    scales: {
      y: { min: 0, max: 100, ticks: Object.assign({}, tickOpts(), { callback: function(v) { return v + '%'; } }), grid: gridOpts(), border: { display: false } },
      x: { ticks: tickOpts(), grid: { display: false }, border: { display: false } },
    },
    plugins: { tooltip: { callbacks: { label: function(c) { const sp = doneSP[c.dataIndex]; return ' Superou ' + c.parsed.y + '% dos ' + (sp ? sp.periodPeerCount : '?') + ' alunos (mesma carga)'; } } } },
  });

  makeChart('chart-period-detail', 'bar', {
    labels: rankLabels,
    datasets: [{
      label: 'Sua Média',
      data: doneSP.map(function(s) { return +s.studentMean.toFixed(2); }),
      backgroundColor: doneSP.map(function(s) {
        const ph = COURSE_PHASES.find(function(ph) { return ph.periods.includes(s.period); });
        return (ph ? ph.color : '#2563eb') + '88';
      }),
      borderColor: doneSP.map(function(s) {
        const ph = COURSE_PHASES.find(function(ph) { return ph.periods.includes(s.period); });
        return ph ? ph.color : '#2563eb';
      }),
      borderWidth: 2, borderRadius: 6,
    }],
  }, {
    scales: {
      y: { min: 0, max: 10, ticks: Object.assign({ stepSize: 2 }, tickOpts()), grid: gridOpts(), border: { display: false } },
      x: { ticks: tickOpts(), grid: { display: false }, border: { display: false } },
    },
  });

  const areaByPeriod = {};
  data.disciplines.forEach(function(d) {
    if (!areaByPeriod[d.category]) areaByPeriod[d.category] = {};
    if (!areaByPeriod[d.category][d.period]) areaByPeriod[d.category][d.period] = [];
    areaByPeriod[d.category][d.period].push(d.userGrade);
  });
  const cpArr = doneSP.map(function(s) { return s.period; });
  makeChart('chart-area-evolution', 'line', {
    labels: cpArr.map(function(p) { return p + 'º P'; }),
    datasets: CAT_LABELS.map(function(cat, ci) {
      return {
        label: cat,
        data: cpArr.map(function(p) {
          const gs = areaByPeriod[cat] && areaByPeriod[cat][p];
          return gs && gs.length ? +(gs.reduce(function(a, b) { return a + b; }, 0) / gs.length).toFixed(2) : null;
        }),
        borderColor: Object.values(CAT_COLORS)[ci],
        backgroundColor: 'transparent',
        tension: 0.4, borderWidth: 2, pointRadius: 3, spanGaps: true,
      };
    }),
  }, {
    scales: {
      y: { min: 0, max: 10, ticks: Object.assign({ stepSize: 2 }, tickOpts()), grid: gridOpts(), border: { display: false } },
      x: { ticks: tickOpts(), grid: { display: false }, border: { display: false } },
    },
  });
}

// ─────────────────────────────────────────────
// SECTION: ALERTAS DE RISCO (items 1, 3, 4, 8, 9)
// ─────────────────────────────────────────────
function renderRisk(container, data) {
  const { statsPerPeriod, disciplines, crMargin, trendSlope, depWarnings, gradeStdDev, userCR, userRank, totalStudents, userMaxPeriod } = data;

  const consecutiveDrops = [];
  for (let i = 2; i < statsPerPeriod.length; i++) {
    if (statsPerPeriod[i].studentMean < statsPerPeriod[i-1].studentMean &&
        statsPerPeriod[i-1].studentMean < statsPerPeriod[i-2].studentMean) {
      consecutiveDrops.push({ from: statsPerPeriod[i-2].period, to: statsPerPeriod[i].period });
    }
  }

  const riskDiscs   = disciplines.filter(function(d) { return d.userGrade < 6; }).sort(function(a, b) { return a.userGrade - b.userGrade; });
  const belowMedia  = disciplines.filter(function(d) { return d.diff < -1; }).sort(function(a, b) { return a.diff - b.diff; });
  const crRiskLevel = crMargin < 0 ? 'danger' : crMargin < 0.5 ? 'danger' : crMargin < 1.5 ? 'warn' : 'ok';

  function alertCard(level, icon, title, body) {
    const colors = { danger: '#dc2626', warn: '#d97706', ok: '#16a34a', info: '#0891b2' };
    const bgs    = { danger: 'var(--danger-dim)', warn: 'var(--warning-dim)', ok: 'var(--success-dim)', info: 'var(--teal-dim)' };
    return '<div style="background:' + bgs[level] + ';border-left:4px solid ' + colors[level] + ';border-radius:var(--r-lg);padding:1rem 1.25rem;margin-bottom:.75rem;">'
      + '<div style="font-weight:700;font-size:var(--t-sm);color:' + colors[level] + ';margin-bottom:.25rem;">' + icon + ' ' + title + '</div>'
      + '<div style="font-size:var(--t-sm);color:var(--text);">' + body + '</div>'
      + '</div>';
  }

  let alertsHTML = '';
  if (crMargin < 0)
    alertsHTML += alertCard('danger', '🚨', 'CR Abaixo do Mínimo Exigido', 'Seu CR (' + userCR.toFixed(2) + ') está <strong>' + Math.abs(crMargin).toFixed(2) + ' pts abaixo</strong> do mínimo de ' + CR_MIN_REQUIRED.toFixed(1) + '.');
  else if (crMargin < 1.5)
    alertsHTML += alertCard('warn', '⚠', 'CR Próximo do Limite', 'Você tem apenas <strong>' + crMargin.toFixed(2) + ' pts de margem</strong> acima do mínimo.');

  if (trendSlope < -0.3)
    alertsHTML += alertCard('danger', '📉', 'Declínio Gradual Detectado', 'Suas notas caem em média <strong>' + Math.abs(trendSlope).toFixed(2) + ' pts/período</strong> nos últimos 3 períodos.');

  consecutiveDrops.forEach(function(drop) {
    alertsHTML += alertCard('warn', '⬇', 'Quedas Consecutivas (' + drop.from + 'º→' + drop.to + 'º P)', 'Três períodos seguidos de queda. Verifique o padrão de estudo.');
  });

  if (gradeStdDev >= 1.8)
    alertsHTML += alertCard('warn', '📈', 'Alta Volatilidade de Notas', 'Desvio padrão de <strong>' + gradeStdDev.toFixed(2) + '</strong>: desempenho instável entre disciplinas.');

  riskDiscs.slice(0, 5).forEach(function(d) {
    alertsHTML += alertCard('danger', '📚', 'Nota Crítica — ' + d.name, 'Nota de <strong>' + d.userGrade.toFixed(1) + '</strong> no ' + d.period + 'º período. (Área: ' + d.category + ').');
  });

  depWarnings.forEach(function(dw) {
    alertsHTML += alertCard('warn', '🔗', 'Dependência Pedagógica em Risco', 'Nota de <strong>' + dw.depGrade.toFixed(1) + '</strong> em <em>' + dw.dependency + '</em> pode dificultar <strong>' + dw.target + '</strong>.');
  });

  belowMedia.slice(0, 3).forEach(function(d) {
    alertsHTML += alertCard('info', '📉', 'Abaixo da Turma — ' + d.name, 'Sua nota (' + d.userGrade.toFixed(1) + ') está <strong>' + Math.abs(d.diff).toFixed(2) + ' pts abaixo</strong> da média comparável.');
  });

  if (!alertsHTML)
    alertsHTML = alertCard('ok', '✅', 'Nenhum Risco Crítico Detectado', 'Seu desempenho está dentro dos parâmetros seguros.');

  container.innerHTML = `
<div class="page-header fade-2">
  <h1 class="page-title">Alertas de Risco Acadêmico</h1>
  <p class="page-sub">Detecção proativa de riscos à sua estadia na faculdade.</p>
</div>
<div class="chart-section cols-2-1 fade-3" style="margin-bottom:1rem;">
  <div>
    <h3 style="font-size:var(--t-base);font-weight:600;margin-bottom:.75rem;">Alertas Ativos</h3>
    ${alertsHTML}
  </div>
  <div>
    <div class="card" style="margin-bottom:1rem;">
      <div class="card-title">Semáforo de Risco CR</div>
      <div style="text-align:center;padding:1rem 0;">
        <div style="font-family:var(--mono);font-size:3rem;font-weight:500;color:${crMargin < 0 ? 'var(--danger)' : crMargin < 1.5 ? 'var(--warning)' : 'var(--success)'};">${userCR.toFixed(2)}</div>
        <div style="color:var(--text-3);font-size:var(--t-sm);margin:.25rem 0;">Seu CR Global</div>
        <div style="color:var(--text-3);font-size:var(--t-xs);">Mínimo exigido: ${CR_MIN_REQUIRED.toFixed(1)}</div>
        <div style="color:var(--text-3);font-size:var(--t-xs);margin-top:.25rem;">Posição: ${userRank}º entre ${totalStudents} pares c/ mesma carga horária</div>
        <div style="margin-top:1rem;">${riskBadge(crRiskLevel)}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r-md);height:12px;overflow:hidden;margin-top:.75rem;">
        <div style="height:100%;width:${Math.min(100, (userCR / 10) * 100)}%;background:${crMargin < 0 ? 'var(--danger)' : crMargin < 1.5 ? 'var(--warning)' : 'var(--success)'};border-radius:var(--r-md);"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:var(--t-xs);color:var(--text-3);margin-top:.25rem;"><span>0</span><span>Mín. ${CR_MIN_REQUIRED}</span><span>10</span></div>
    </div>
  </div>
</div>`;
}

// ─────────────────────────────────────────────
// SECTION: SIMULADOR (item 2)
// ─────────────────────────────────────────────
function renderSimulator(container, data) {
  const { userCR, totalExpectedPeriods, statsPerPeriod, userMaxPeriod } = data;
  const futurePeriods = [];
  for (var fp = userMaxPeriod + 1; fp <= totalExpectedPeriods; fp++) { futurePeriods.push(fp); }
  const remaining   = futurePeriods.length;
  const sumCompleted = statsPerPeriod.filter(function(s) { return s.studentMean > 0; }).reduce(function(a, s) { return a + s.studentMean; }, 0);

  const slidersHTML = remaining > 0
    ? futurePeriods.map(function(p, i) {
        const phase = COURSE_PHASES.find(function(ph) { return ph.periods.includes(p); });
        return '<div style="margin-bottom:1.25rem;">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.375rem;">'
          + '<label style="font-size:var(--t-sm);font-weight:600;">' + p + 'º Período '
          + (phase ? '<span style="font-size:var(--t-xs);font-weight:400;color:' + phase.color + ';">(' + phase.label + ')</span>' : '') + '</label>'
          + '<span id="sim-val-' + p + '" style="font-family:var(--mono);font-weight:600;color:var(--primary);">7.00</span>'
          + '</div>'
          + '<input type="range" id="sim-slider-' + p + '" min="0" max="10" step="0.1" value="7" style="width:100%;accent-color:var(--primary);"'
          + ' oninput="document.getElementById(\'sim-val-' + p + '\').textContent=parseFloat(this.value).toFixed(2);window._simUpdate()">'
          + '</div>';
      }).join('')
    : '<p style="color:var(--success);font-weight:600;">✅ Você completou todos os períodos do curso!</p>';

  const scenarios = [
    { label: 'Pessimista (média 5.5)', val: 5.5 },
    { label: 'Realista (média 7.0)',   val: 7.0 },
    { label: 'Otimista (média 8.5)',   val: 8.5 },
    { label: 'Excelência (média 9.5)', val: 9.5 },
  ];

  const crNeeded7 = remaining > 0 ? (7.0 * totalExpectedPeriods - sumCompleted) / remaining : null;

  container.innerHTML = `
<div class="page-header fade-2">
  <h1 class="page-title">Simulador de CR Final</h1>
  <p class="page-sub">Projete seu coeficiente ao fim do curso com diferentes cenários.</p>
</div>
<div class="chart-section cols-2-1 fade-3">
  <div class="card">
    <div class="card-title">Configure os Próximos Períodos</div>
    <p style="font-size:var(--t-sm);color:var(--text-3);margin-bottom:1.25rem;">Projetando <strong>${remaining}</strong> períodos futuros.</p>
    ${slidersHTML}
    ${remaining > 0 ? '<button onclick="window._simReset()" style="padding:.5rem 1rem;border:1px solid var(--border);border-radius:var(--r-md);background:var(--surface);color:var(--text-2);font-size:var(--t-sm);cursor:pointer;">↺ Resetar para 7.0</button>' : ''}
  </div>
  <div>
    <div class="card" style="margin-bottom:1rem;">
      <div class="card-title">CR Projetado ao Final</div>
      <div style="text-align:center;padding:1rem 0;">
        <div id="sim-cr-final" style="font-family:var(--mono);font-size:3.5rem;font-weight:500;color:var(--primary);">${userCR.toFixed(2)}</div>
        <div style="color:var(--text-3);font-size:var(--t-sm);margin-top:.25rem;">CR estimado</div>
        <div style="margin-top:.75rem;" id="sim-badge">${riskBadge(userCR >= 7 ? 'ok' : userCR >= CR_MIN_REQUIRED ? 'warn' : 'danger')}</div>
      </div>
      <div style="background:var(--bg);border-radius:var(--r-md);height:12px;overflow:hidden;margin-top:.75rem;">
        <div id="sim-progress" style="height:100%;width:${(userCR / 10) * 100}%;background:var(--primary);border-radius:var(--r-md);transition:width .4s;"></div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Nota Mín. p/ CR ≥ 7.0</div>
      ${crNeeded7 !== null
        ? '<div style="font-family:var(--mono);font-size:2rem;font-weight:600;color:' + (crNeeded7 > 10 ? 'var(--danger)' : crNeeded7 > 8 ? 'var(--warning)' : 'var(--success)') + ';">' + Math.max(0, crNeeded7).toFixed(2) + '</div>'
          + '<div style="font-size:var(--t-xs);color:var(--text-3);">por período restante' + (crNeeded7 > 10 ? ' — meta impossível' : '') + '</div>'
        : '<div style="color:var(--success);font-size:var(--t-sm);">Curso concluído.</div>'}
    </div>
  </div>
</div>`;

  window._simUpdate = function() {
    let total = sumCompleted;
    futurePeriods.forEach(function(p) {
      const s = document.getElementById('sim-slider-' + p);
      if (s) total += parseFloat(s.value);
    });
    const proj = totalExpectedPeriods > 0 ? total / totalExpectedPeriods : 0;
    const el = document.getElementById('sim-cr-final');
    if (el) el.textContent = proj.toFixed(2);
    const pr = document.getElementById('sim-progress');
    if (pr) pr.style.width = Math.min(100, (proj / 10) * 100) + '%';
    const bd = document.getElementById('sim-badge');
    if (bd) bd.innerHTML = riskBadge(proj >= 7 ? 'ok' : proj >= CR_MIN_REQUIRED ? 'warn' : 'danger');
  };

  window._simReset = function() {
    futurePeriods.forEach(function(p) {
      const s = document.getElementById('sim-slider-' + p);
      const v = document.getElementById('sim-val-' + p);
      if (s) s.value = 7;
      if (v) v.textContent = '7.00';
    });
    window._simUpdate();
  };
}

// ─────────────────────────────────────────────
// SECTION: DISCIPLINAS
// ─────────────────────────────────────────────
function renderDisciplines(container, data) {
  container.innerHTML = `
<div class="page-header fade-2">
  <h1 class="page-title">Disciplinas</h1>
  <p class="page-sub">Análise detalhada de todas as disciplinas efetivamente cursadas.</p>
</div>
<div class="filter-bar fade-3" id="filter-bar" style="display:flex;flex-wrap:wrap;gap:1rem;">
  <div class="filter-group"><span class="filter-label">Período</span><div class="filter-chips" id="chips-periods"></div></div>
  <div class="filter-sep" style="border-left:1px solid var(--border);height:20px;align-self:center;"></div>
  <div class="filter-group"><span class="filter-label">Área</span><div class="filter-chips" id="chips-categories"></div></div>
  <span class="filter-summary" id="filter-summary" style="margin-left:auto;font-size:var(--t-xs);color:var(--text-3);white-space:nowrap;"></span>
  <button id="filter-reset" style="align-self:center;padding:5px 12px;border-radius:99px;border:1.5px solid var(--border);background:transparent;color:var(--text-3);font-size:var(--t-xs);font-weight:600;cursor:pointer;">✕ Limpar</button>
</div>
<div class="card fade-4" style="margin-bottom:1rem;">
  <div class="card-title">Heatmap por Disciplina</div>
  <div id="heatmap-container2" class="heatmap-wrap"></div>
</div>
<div class="card fade-5" style="overflow-x:auto;">
  <div class="card-title" id="table-title">Prontuário Detalhado</div>
  <table class="data-table" id="data-table">
    <thead><tr>
      <th data-sort="name" style="cursor:pointer;white-space:nowrap;">Disciplina <i class="sort-icon">↕</i></th>
      <th data-sort="period" style="cursor:pointer;white-space:nowrap;">Período <i class="sort-icon">↕</i></th>
      <th data-sort="category" style="cursor:pointer;white-space:nowrap;">Área <i class="sort-icon">↕</i></th>
      <th data-sort="userGrade" style="cursor:pointer;white-space:nowrap;">Sua Nota <i class="sort-icon">↕</i></th>
      <th data-sort="cohortMean" style="cursor:pointer;white-space:nowrap;">Turma <i class="sort-icon">↕</i></th>
      <th data-sort="diff" style="cursor:pointer;white-space:nowrap;">Δ <i class="sort-icon">↕</i></th>
      <th>Status</th>
    </tr></thead>
    <tbody></tbody>
  </table>
</div>`;

  const pCt = document.getElementById('chips-periods');
  const cCt = document.getElementById('chips-categories');

  data.periods.forEach(function(p) {
    const btn = $('button', { className: 'chip' + (STATE.activeFilters.periods.has(p) ? ' active' : ''), textContent: p + 'º P' });
    btn.onclick = function() { toggleFilter('periods', p, this); renderDiscContent(getFilteredView(STATE.fullData)); };
    pCt.append(btn);
  });

  CAT_LABELS.filter(function(c) { return data.disciplines.some(function(d) { return d.category === c; }); }).forEach(function(c) {
    const btn = $('button', { className: 'chip' + (STATE.activeFilters.categories.has(c) ? ' active' : ''), textContent: c });
    btn.onclick = function() { toggleFilter('categories', c, this); renderDiscContent(getFilteredView(STATE.fullData)); };
    cCt.append(btn);
  });

  document.getElementById('filter-reset').onclick = function() {
    STATE.activeFilters.periods.clear();
    STATE.activeFilters.categories.clear();
    document.querySelectorAll('.chip.active').forEach(function(c) { c.classList.remove('active'); });
    updateFilterSummary();
    renderDiscContent(STATE.fullData);
  };

  document.getElementById('data-table').addEventListener('click', function(e) {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    STATE.tableSort.dir = STATE.tableSort.key === th.dataset.sort && STATE.tableSort.dir === 'desc' ? 'asc' : 'desc';
    STATE.tableSort.key = th.dataset.sort;
    renderDiscContent(getFilteredView(STATE.fullData));
  });

  updateFilterSummary();
  renderDiscContent(data);
}

function renderDiscContent(data) {
  renderHeatmap('heatmap-container2', data.disciplines, data.periods);
  renderTable(data);
  updateFilterSummary();
  const title = document.getElementById('table-title');
  if (title) title.textContent = 'Prontuário Detalhado · ' + data.disciplines.length + ' disciplina(s) cursada(s)';
}

function renderTable(fdata) {
  const key  = STATE.tableSort.key;
  const dir  = STATE.tableSort.dir;
  const tbody = document.querySelector('#data-table tbody');
  if (!tbody) return;
  document.querySelectorAll('#data-table th[data-sort]').forEach(function(th) {
    th.classList.toggle('sorted', th.dataset.sort === key);
    const ic = th.querySelector('.sort-icon');
    if (ic) ic.textContent = th.dataset.sort === key ? (dir === 'asc' ? '↑' : '↓') : '↕';
  });
  tbody.innerHTML = fdata.disciplines.slice().sort(function(a, b) {
    return (typeof a[key] === 'string' ? a[key].localeCompare(b[key], 'pt') : a[key] - b[key]) * (dir === 'asc' ? 1 : -1);
  }).map(function(d) {
    return '<tr>'
      + '<td style="white-space:nowrap;">' + d.name + '</td>'
      + '<td class="mono">' + d.period + 'º</td>'
      + '<td><span style="display:inline-flex;padding:2px 8px;border-radius:99px;font-size:var(--t-xs);font-weight:600;background:' + CAT_COLORS[d.category] + '22;color:' + CAT_COLORS[d.category] + ';">' + d.category + '</span></td>'
      + '<td class="mono" style="font-weight:600;color:' + (d.userGrade < 6 ? 'var(--danger)' : d.userGrade >= 8.5 ? 'var(--success)' : 'var(--text)') + '">' + d.userGrade.toFixed(1) + '</td>'
      + '<td class="mono" style="color:var(--text-3);">' + d.cohortMean.toFixed(1) + '</td>'
      + '<td class="mono" style="color:var(--' + (d.diff >= 0 ? 'success' : 'danger') + ');">' + (d.diff > 0 ? '+' : '') + d.diff.toFixed(2) + '</td>'
      + '<td>' + riskBadge(d.userGrade < 6 ? 'danger' : d.diff < -1 ? 'warn' : 'ok') + '</td>'
      + '</tr>';
  }).join('');
}

function toggleFilter(type, val, chip) {
  STATE.activeFilters[type].has(val)
    ? (STATE.activeFilters[type].delete(val), chip.classList.remove('active'))
    : (STATE.activeFilters[type].add(val), chip.classList.add('active'));
}

function updateFilterSummary() {
  const el = document.getElementById('filter-summary');
  if (!el) return;
  const p = STATE.activeFilters.periods.size;
  const c = STATE.activeFilters.categories.size;
  el.innerHTML = (p || c)
    ? 'Filtrado: <strong>' + [p && p + ' período(s)', c && c + ' área(s)'].filter(Boolean).join(' · ') + '</strong>'
    : 'Exibindo <strong>todas</strong>';
}

// ─────────────────────────────────────────────
// SECTION: ANOTAÇÕES (item 14)
// ─────────────────────────────────────────────
function renderNotes(container, data) {
  const mat    = String(STATE.currentUser['Matrícula']);
  const notes  = STATE.notes;
  const periods = data.periods;

  container.innerHTML = `
<div class="page-header fade-2">
  <h1 class="page-title">Anotações Pessoais</h1>
  <p class="page-sub">Registre contexto qualitativo para cada período — saúde, eventos, observações.</p>
</div>
<div class="fade-3" style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));">
  ${periods.map(function(p) {
    const sp    = data.statsPerPeriod.find(function(s) { return s.period === p; });
    const phase = COURSE_PHASES.find(function(ph) { return ph.periods.includes(p); });
    return '<div class="card">'
      + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.875rem;">'
      + '<div><div style="font-weight:700;color:var(--text);">' + p + 'º Período</div>'
      + (phase ? '<div style="font-size:var(--t-xs);color:' + phase.color + ';">' + phase.label + '</div>' : '')
      + (sp && sp.studentMean > 0 ? '<div style="font-family:var(--mono);font-size:var(--t-sm);color:var(--text-3);">Média: ' + sp.studentMean.toFixed(2) + '</div>' : '')
      + '</div>'
      + '<span id="saved-' + p + '" style="font-size:var(--t-xs);color:var(--success);opacity:0;transition:opacity .3s;">✓ Salvo</span>'
      + '</div>'
      + '<textarea id="note-' + p + '" rows="4" placeholder="Ex: Tive dificuldades com farmacologia por questões de saúde..."'
      + ' style="width:100%;padding:.625rem .75rem;border:1px solid var(--border);border-radius:var(--r-md);font:var(--t-sm) var(--font);color:var(--text);background:var(--bg);resize:vertical;outline:none;line-height:1.5;"'
      + ' onfocus="this.style.borderColor=\'var(--primary)\'" onblur="this.style.borderColor=\'var(--border)\'">'
      + (notes[p] || '')
      + '</textarea>'
      + '<button onclick="window._saveNote(\'' + p + '\')" style="margin-top:.5rem;width:100%;padding:.5rem;border:none;border-radius:var(--r-md);background:var(--primary);color:#fff;font-size:var(--t-sm);font-weight:600;cursor:pointer;">Salvar</button>'
      + '</div>';
  }).join('')}
</div>`;

  window._saveNote = function(key) {
    const ta = document.getElementById('note-' + key);
    if (!ta) return;
    STATE.notes[key] = ta.value;
    saveNotes(mat, STATE.notes);
    const ind = document.getElementById('saved-' + key);
    if (ind) { ind.style.opacity = '1'; setTimeout(function() { ind.style.opacity = '0'; }, 1500); }
  };
}

// ─────────────────────────────────────────────
// EXPORT PDF (item 13)
// ─────────────────────────────────────────────
function exportPDF() {
  const data = STATE.fullData;
  const u    = STATE.currentUser;
  if (!data) return;
  const { userCR, userRank, totalStudents, totalAllStudents, userMaxPeriod, userPercentile, statsPerPeriod, disciplines, crMargin, gradeStdDev } = data;
  const now  = new Date().toLocaleDateString('pt-BR');

  const pw = window.open('', '_blank');
  pw.document.write('<!DOCTYPE html><html><head>'
    + '<meta charset="UTF-8"><title>Relatório MedDash — ' + u['Nome do Aluno'] + '</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Sora:wght@400;500;600;700&display=swap" rel="stylesheet">'
    + '<style>'
    + 'body{font-family:\'Sora\',sans-serif;color:#1a1d2e;background:#fff;padding:2rem;max-width:900px;margin:0 auto;font-size:14px;line-height:1.6;}'
    + 'h1{font-size:1.75rem;font-weight:700;margin-bottom:.25rem;} h2{font-size:1.125rem;font-weight:700;border-bottom:2px solid #e2e5ef;padding-bottom:.5rem;margin:2rem 0 1rem;}'
    + '.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin:1.5rem 0;}'
    + '.kpi{background:#f5f6fa;border-radius:10px;padding:1rem;text-align:center;}'
    + '.kpi-lbl{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9299b0;margin-bottom:.25rem;}'
    + '.kpi-v{font-family:\'IBM Plex Mono\',monospace;font-size:1.75rem;font-weight:600;}'
    + 'table{width:100%;border-collapse:collapse;font-size:.8125rem;} th{text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9299b0;border-bottom:2px solid #e2e5ef;padding:.625rem .75rem;}'
    + 'td{padding:.5rem .75rem;border-bottom:1px solid #f0f2f7;} tr:last-child td{border-bottom:none;}'
    + '.ok{color:#16a34a;font-weight:600;} .bad{color:#dc2626;font-weight:600;} .warn{color:#d97706;font-weight:600;}'
    + '.footer{margin-top:3rem;padding-top:1rem;border-top:1px solid #e2e5ef;font-size:.75rem;color:#9299b0;display:flex;justify-content:space-between;}'
    + '@media print{button{display:none;}}'
    + '</style></head><body>'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;">'
    + '<div><h1>MedDash — Relatório Acadêmico</h1><div style="color:#5a607a;font-size:.875rem;">' + u['Nome do Aluno'] + ' · Mat. ' + u['Matrícula'] + ' · ' + userMaxPeriod + 'º período · ' + totalAllStudents + ' alunos na base · Gerado em ' + now + '</div></div>'
    + '<button onclick="window.print()" style="padding:.5rem 1rem;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-family:\'Sora\',sans-serif;">Imprimir / Salvar PDF</button>'
    + '</div>'
    + '<div class="kpis">'
    + '<div class="kpi"><div class="kpi-lbl">CR Global</div><div class="kpi-v">' + userCR.toFixed(2) + '</div></div>'
    + '<div class="kpi"><div class="kpi-lbl">Posição Turma</div><div class="kpi-v">' + userRank + 'º / ' + totalStudents + ' peers</div></div>'
    + '<div class="kpi"><div class="kpi-lbl">Percentil</div><div class="kpi-v">Superou ' + userPercentile + '%</div></div>'
    + '<div class="kpi"><div class="kpi-lbl">Margem CR Mín.</div><div class="kpi-v ' + (crMargin < 0 ? 'bad' : 'ok') + '">' + (crMargin >= 0 ? '+' : '') + crMargin.toFixed(2) + '</div></div>'
    + '</div>'
    + '<h2>Evolução por Período</h2>'
    + '<table><thead><tr><th>Período</th><th>Disciplinas Cursadas</th><th>Sua Média</th><th>Média Turma (Comparável)</th><th>Δ</th><th>Ranking</th></tr></thead><tbody>'
    + statsPerPeriod.filter(function(s) { return s.studentMean > 0; }).map(function(s) {
        const diff = s.studentMean - s.cohortMean;
        return '<tr><td>' + s.period + 'º</td><td>' + s.taken + ' / ' + s.total + ' disc.</td><td><strong>' + s.studentMean.toFixed(2) + '</strong></td><td>' + s.cohortMean.toFixed(2) + '</td><td class="' + (diff >= 0 ? 'ok' : 'bad') + '">' + (diff > 0 ? '+' : '') + diff.toFixed(2) + '</td><td>' + s.periodRank + 'º / ' + s.periodPeerCount + '</td></tr>';
      }).join('')
    + '</tbody></table>'
    + '<h2>Prontuário de Disciplinas</h2>'
    + '<table><thead><tr><th>Disciplina</th><th>Período</th><th>Sua Nota</th><th>Turma</th><th>Δ</th></tr></thead><tbody>'
    + disciplines.slice().sort(function(a, b) { return a.period - b.period || a.name.localeCompare(b.name, 'pt'); }).map(function(d) {
        return '<tr><td>' + d.name + '</td><td>' + d.period + 'º</td>'
          + '<td class="' + (d.userGrade < 6 ? 'bad' : d.userGrade >= 8.5 ? 'ok' : '') + '">' + d.userGrade.toFixed(1) + '</td>'
          + '<td>' + d.cohortMean.toFixed(1) + '</td>'
          + '<td class="' + (d.diff >= 0 ? 'ok' : 'bad') + '">' + (d.diff > 0 ? '+' : '') + d.diff.toFixed(2) + '</td></tr>';
      }).join('')
    + '</tbody></table>'
    + '<div class="footer"><span>MedDash Analytics · ' + now + '</span><span>Comparação baseada em disciplinas cursadas.</span></div>'
    + '</body></html>');
  pw.document.close();
}
