/* ==========================================================================
   MedDash Analytics — script.js  (reescrita completa)
   17 melhorias implementadas:
   1.  Sistema de alertas proativos de risco acadêmico
   2.  Simulador de CR futuro
   3.  Indicador de risco de reprovação por CR (limiar configurável)
   4.  Detecção de tendência de queda gradual
   5.  Linha do tempo visual dos 6 anos / 12 períodos
   6.  Separação por fases do curso (Básico, Pré-Clínico, Clínico)
   7.  Histórico de ranking ao longo do tempo
   8.  Mapa de dependências entre disciplinas
   9.  Análise de consistência vs. volatilidade (desvio-padrão pessoal)
   10. Evolução do perfil por área ao longo do tempo
   11. Login sem upload obrigatório (CSV via URL + upload opcional com erros claros)
   12. Responsividade mobile melhorada (sidebar hambúrguer)
   13. Exportar relatório em PDF (html2canvas + jsPDF)
   14. Anotações pessoais por período (localStorage)
   15. CSV carregado de forma explícita com feedback de erro visível
   16. CR calculado com créditos ponderados (configurável)
   17. Mapeamento explícito de categorias por tabela
   ========================================================================== */

// ─── CONFIG ─────────────────────────────────────────────────────────────────

const CONFIG = {
  CR_MINIMO: 5.0,          // CR mínimo exigido para formatura
  CSV_URL: 'Planilha_Academica_Medicina.csv',
  TOTAL_PERIODOS: 12,      // 6 anos × 2 semestres

  // Mapeamento explícito disciplina → categoria (melhoria 17)
  CATEGORIA_MAP: {
    'Ativ. Integradoras I':           'Humanidades',
    'Ativ. Integradoras II':          'Humanidades',
    'Ativ. Integradoras III':         'Humanidades',
    'Bases Morfofuncionais':          'Básicas',
    'Bioquímica Mol. e Metab. I':     'Básicas',
    'Bioquímica Mol. e Metab. II':    'Básicas',
    'Biologia Molecular':             'Básicas',
    'Fund. Pesquisa Medicina I':      'Saúde Pública',
    'Fund. Pesquisa Medicina II':     'Saúde Pública',
    'Saúde e Sociedade I':            'Saúde Pública',
    'Saúde e Sociedade II':           'Saúde Pública',
    'Saúde e Sociedade III':          'Saúde Pública',
    'Sociologia e Antropologia I':    'Humanidades',
    'Sociologia e Antropologia II':   'Humanidades',
    'Imunologia Básica':              'Básicas',
    'Imunologia Clínica':             'Clínica',
    'Interação Agente Hosp. I':       'Básicas',
    'Interação Agente Hosp. II':      'Básicas',
    'Farmacologia I':                 'Básicas',
    'Farmacologia II':                'Clínica',
    'Fisiopatologia':                 'Básicas',
    'Habilidades Médicas I':          'Clínica',
    'Habilidades Médicas II':         'Clínica',
    'Habilidades Médicas III':        'Clínica',
    'Patologia Geral':                'Básicas',
    'Patologia Especial':             'Clínica',
    'Saúde Mental I':                 'Saúde Pública',
    'Saúde Mental II':                'Saúde Pública',
    'Saúde Mental III':               'Saúde Pública',
    'Semiologia I':                   'Clínica',
    'Semiologia II':                  'Clínica',
    'Semiologia Criança/Adol.':       'Clínica',
    'Semiologia Ginec./Obst.':        'Clínica',
    'Sist. Int. - Nervoso/Endócrino': 'Básicas',
    'Sist. Int. - Digestório/Reprodutor': 'Básicas',
    'Sist. Int. - Cardiocirc.':       'Básicas',
    'Sist. Int. - Resp./Urinário':    'Básicas',
    'Medicina Legal':                 'Saúde Pública',
    'Epidemiologia Clínica':          'Saúde Pública',
    'Dermatologia':                   'Clínica',
    'Doenças Infec. e Parasitárias':  'Clínica',
    'Raciocínio Clínico':             'Clínica',
    'Otorrinolaringologia':           'Clínica',
    'Oftalmologia':                   'Clínica',
    'Clínica Criança/Adol.':          'Clínica',
    'Clínica Ginec./Obst.':           'Clínica',
    'Clínica Médica I':               'Clínica',
    'Clínica Médica II':              'Clínica',
    'Ortopedia':                      'Cirurgia',
    'Clínica Cirúrgica':              'Cirurgia',
    'Urgência e Emergência':          'Cirurgia',
  },

  // Mapeamento disciplina → disciplinas que dependem dela (melhoria 8)
  DEPENDENCIAS: {
    'Bioquímica Mol. e Metab. I':     ['Bioquímica Mol. e Metab. II', 'Farmacologia I'],
    'Bioquímica Mol. e Metab. II':    ['Farmacologia II'],
    'Imunologia Básica':              ['Imunologia Clínica', 'Doenças Infec. e Parasitárias'],
    'Farmacologia I':                 ['Farmacologia II'],
    'Patologia Geral':                ['Patologia Especial', 'Fisiopatologia'],
    'Semiologia I':                   ['Semiologia II', 'Raciocínio Clínico'],
    'Semiologia II':                  ['Clínica Médica I'],
    'Clínica Médica I':               ['Clínica Médica II', 'Urgência e Emergência'],
    'Habilidades Médicas I':          ['Habilidades Médicas II'],
    'Habilidades Médicas II':         ['Habilidades Médicas III'],
    'Fisiopatologia':                 ['Raciocínio Clínico'],
    'Interação Agente Hosp. I':       ['Interação Agente Hosp. II'],
  },

  // Créditos por disciplina — fallback = 4 (melhoria 16)
  CREDITOS: {
    'Bases Morfofuncionais': 6,
    'Bioquímica Mol. e Metab. I': 5,
    'Bioquímica Mol. e Metab. II': 5,
    'Farmacologia I': 5,
    'Farmacologia II': 5,
    'Fisiopatologia': 6,
    'Patologia Geral': 6,
    'Patologia Especial': 5,
    'Clínica Médica I': 6,
    'Clínica Médica II': 6,
    'Clínica Cirúrgica': 6,
    'Urgência e Emergência': 5,
    'Internato Clínico': 10,
  },

  // Fases do curso (melhoria 6)
  FASES: [
    { nome: 'Básico', periodos: [1, 2, 3, 4], cor: '#6366f1', dim: 'rgba(99,102,241,.12)' },
    { nome: 'Pré-Clínico', periodos: [5, 6, 7, 8], cor: '#0891b2', dim: 'rgba(8,145,178,.12)' },
    { nome: 'Internato', periodos: [9, 10, 11, 12], cor: '#16a34a', dim: 'rgba(22,163,74,.12)' },
  ],
};

const CAT_LABELS = ['Básicas', 'Clínica', 'Cirurgia', 'Saúde Pública', 'Humanidades'];
const CAT_COLORS = {
  'Básicas':      { border: '#6366f1', bg: 'rgba(99,102,241,.15)' },
  'Clínica':      { border: '#0891b2', bg: 'rgba(8,145,178,.15)' },
  'Cirurgia':     { border: '#dc2626', bg: 'rgba(220,38,38,.15)' },
  'Saúde Pública':{ border: '#16a34a', bg: 'rgba(22,163,74,.15)' },
  'Humanidades':  { border: '#d97706', bg: 'rgba(217,119,6,.15)' },
};

// ─── STATE ────────────────────────────────────────────────────────────────────

const STATE = {
  rawDataMap: new Map(),
  currentUser: null,
  fullData: null,
  activeFilters: { periods: new Set(), categories: new Set() },
  tableSort: { key: 'period', dir: 'desc' },
  activePage: 'overview',
  csvLoaded: false,
};
const _charts = {};

// ─── UTILITIES ───────────────────────────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const el = (tag, attrs = {}, html = '') => {
  const e = document.createElement(tag);
  Object.assign(e, attrs);
  if (html) e.innerHTML = html;
  return e;
};

const mean = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const stdDev = arr => {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
};

const fmtGrade = v => (v ?? 0).toFixed(1);
const fmtDiff  = v => (v > 0 ? '+' : '') + v.toFixed(2);
const fmtPct   = v => `${v}%`;

function animateValue(el, from, to, duration) {
  if (!el) return;
  let start = null;
  const step = ts => {
    start ??= ts;
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (eased * (to - from) + from).toFixed(2);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function destroyCharts(...ids) {
  const keys = ids.length ? ids : Object.keys(_charts);
  keys.forEach(k => { _charts[k]?.destroy(); delete _charts[k]; });
}

function makeChart(id, type, data, opts = {}) {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  destroyCharts(id);
  _charts[id] = new Chart(canvas.getContext('2d'), {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      ...opts,
    },
  });
  return _charts[id];
}

const gridOpts = () => ({ color: '#e2e8f0', drawBorder: false });
const tickOpts = () => ({ color: '#94a3b8', font: { size: 11 } });
const scaleY = (min = 0, max = 10) => ({
  min, max,
  ticks: { stepSize: 2, ...tickOpts() },
  grid: gridOpts(),
  border: { display: false },
});
const scaleX = () => ({
  ticks: tickOpts(),
  grid: { display: false },
  border: { display: false },
});

function applyChartDefaults() {
  Object.assign(Chart.defaults, {
    font: { family: "'Sora', sans-serif", size: 12 },
    color: '#475569',
  });
  Object.assign(Chart.defaults.plugins.tooltip, {
    backgroundColor: '#0f172a',
    titleColor: '#f8fafc',
    bodyColor: '#cbd5e1',
    padding: 12,
    cornerRadius: 8,
    displayColors: true,
    boxPadding: 4,
  });
  Chart.defaults.plugins.legend.labels = {
    ...Chart.defaults.plugins.legend.labels,
    usePointStyle: true,
    pointStyleWidth: 8,
    boxHeight: 8,
    padding: 16,
    font: { size: 11, family: "'Sora', sans-serif" },
  };
}

// ─── LOCALSTORAGE HELPERS (melhoria 14) ──────────────────────────────────────

const NOTES_KEY = mat => `meddash_notes_${mat}`;
function getNotes(matricula) {
  try { return JSON.parse(localStorage.getItem(NOTES_KEY(matricula)) || '{}'); }
  catch { return {}; }
}
function saveNote(matricula, period, text) {
  const notes = getNotes(matricula);
  notes[period] = text;
  localStorage.setItem(NOTES_KEY(matricula), JSON.stringify(notes));
}

// ─── CSV PARSING (melhorias 11, 15) ──────────────────────────────────────────

function parseCSV(source, onDone, onError) {
  Papa.parse(source, {
    download: typeof source === 'string',
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete({ data }) {
      data.forEach(r => {
        const mat = String(r['Matrícula'] || '').trim();
        if (mat) STATE.rawDataMap.set(mat, r);
      });
      STATE.csvLoaded = true;
      onDone?.(STATE.rawDataMap.size);
    },
    error(err) { onError?.(err); },
  });
}

// ─── LOGIN VIEW ───────────────────────────────────────────────────────────────

(function setupLogin() {
  // Inject CSV upload block before the form inputs
  const form = $('#login-form');
  if (!form || $('#csv-dropzone')) return;

  const uploadBlock = el('div', { className: 'input-group' }, `
    <label style="font-size:var(--t-sm);font-weight:600;display:block;margin-bottom:.4rem;">
      Base de Dados Acadêmica
      <span style="font-weight:400;color:var(--text-3);"> (carregamento automático ou faça upload)</span>
    </label>
    <div id="csv-dropzone" class="dropzone">
      <span id="dropzone-text">Clique ou arraste o arquivo CSV aqui</span>
      <input type="file" id="csv-upload" accept=".csv" multiple style="display:none;">
    </div>
    <div id="upload-status" class="upload-status"></div>
  `);
  form.prepend(uploadBlock);

  const dz  = $('#csv-dropzone');
  const fi  = $('#csv-upload');
  const st  = $('#upload-status');

  const setStatus = (msg, color = 'var(--text-3)') => { if (st) { st.style.color = color; st.textContent = msg; } };

  const processFiles = files => {
    const csvs = [...files].filter(f => f.name.endsWith('.csv'));
    if (!csvs.length) { setStatus('Nenhum arquivo .csv detectado.', 'var(--danger)'); return; }
    STATE.rawDataMap.clear();
    setStatus(`Processando ${csvs.length} arquivo(s)…`, 'var(--text-2)');
    let done = 0;
    csvs.forEach(f => parseCSV(f,
      count => { done++; if (done === csvs.length) setStatus(`✓ ${count} registros carregados com sucesso`, 'var(--success)'); },
      err   => setStatus(`Erro ao ler CSV: ${err.message}`, 'var(--danger)')
    ));
  };

  dz.onclick = () => fi.click();
  dz.ondragover = e => { e.preventDefault(); dz.classList.add('drag-over'); };
  dz.ondragleave = () => dz.classList.remove('drag-over');
  dz.ondrop = e => { e.preventDefault(); dz.classList.remove('drag-over'); processFiles(e.dataTransfer.files); };
  fi.onchange = e => processFiles(e.target.files);

  // Tentativa de carregar automaticamente o CSV padrão (melhoria 15)
  setStatus('Buscando base de dados automática…', 'var(--text-3)');
  parseCSV(CONFIG.CSV_URL,
    count => setStatus(`✓ ${count} registros carregados automaticamente`, 'var(--success)'),
    ()    => setStatus('CSV padrão não encontrado. Faça o upload manualmente.', 'var(--warning)')
  );

  // Form validation
  const emailEl  = $('#email');
  const matEl    = $('#matricula');
  const loginBtn = $('#login-btn');
  const errorEl  = $('#login-error');

  const validate = () => {
    if (!loginBtn) return;
    const ok = emailEl.value.includes('@') && matEl.value.length >= 4;
    loginBtn.disabled = !ok;
  };
  [emailEl, matEl].forEach(e => e?.addEventListener('input', validate));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btnText    = $('#btn-text');
    const spinner    = $('#btn-spinner');
    btnText.textContent = 'Autenticando…';
    spinner?.classList.remove('hidden');

    await new Promise(r => setTimeout(r, 450));

    if (!STATE.csvLoaded || !STATE.rawDataMap.size) {
      showLoginError('Nenhuma base de dados carregada. Faça o upload do CSV primeiro.');
      btnText.textContent = 'Acessar Dashboard';
      spinner?.classList.add('hidden');
      return;
    }

    const email = emailEl.value.trim().toLowerCase();
    const mat   = matEl.value.trim();

    // Modo demo
    if (email === 'teste' && mat === 'teste') {
      STATE.currentUser = Array.from(STATE.rawDataMap.values())[0];
    } else {
      STATE.currentUser = Array.from(STATE.rawDataMap.values()).find(r =>
        String(r['E-mail']).toLowerCase() === email &&
        String(r['Matrícula']) === mat
      );
    }

    if (!STATE.currentUser) {
      showLoginError('Credenciais inválidas. Verifique e-mail e matrícula.');
      loginBtn.classList.add('shake-animation');
      setTimeout(() => loginBtn.classList.remove('shake-animation'), 500);
      btnText.textContent = 'Acessar Dashboard';
      spinner?.classList.add('hidden');
      return;
    }

    buildDashboard();
  });

  function showLoginError(msg) {
    const errText = $('#error-text');
    if (errText) errText.textContent = msg;
    errorEl?.classList.remove('hidden');
  }
})();

// ─── DATA ENGINE ──────────────────────────────────────────────────────────────

function getCredits(name) {
  return CONFIG.CREDITOS[name] ?? 4;
}

function getCategory(name) {
  if (CONFIG.CATEGORIA_MAP[name]) return CONFIG.CATEGORIA_MAP[name];
  // fallback por palavras-chave
  const n = name.toLowerCase();
  if (['cirurgia','operatória','anestesiologia','ortopedia','urgência'].some(k => n.includes(k))) return 'Cirurgia';
  if (['clínica','semiologia','habilidades','pediatria','internato','raciocínio'].some(k => n.includes(k))) return 'Clínica';
  if (['epidemiologia','saúde','pesquisa','medicina legal','mental'].some(k => n.includes(k))) return 'Saúde Pública';
  if (['sociologia','antropologia','ética','filosofia','integradoras','humanidades'].some(k => n.includes(k))) return 'Humanidades';
  return 'Básicas';
}

function getFase(periodo) {
  return CONFIG.FASES.find(f => f.periodos.includes(periodo)) ?? CONFIG.FASES[0];
}

function processData() {
  const user     = STATE.currentUser;
  const allUsers = Array.from(STATE.rawDataMap.values());
  const total    = allUsers.length;
  const userMat  = String(user['Matrícula']);

  // Build disciplines map from columns
  const periodsMap = {};   // period → [col]
  const discMeta   = {};   // col → { name, period, category, credits }

  Object.keys(user).forEach(col => {
    const m = col.match(/\((\d+)º Período\)\s+(.+)/);
    if (!m) return;
    const [,p, name] = [null, +m[1], m[2]];
    (periodsMap[p] ??= []).push(col);
    discMeta[col] = {
      name,
      period: p,
      category: getCategory(name),
      credits: getCredits(name),
    };
  });

  const periods = Object.keys(periodsMap).map(Number).sort((a, b) => a - b);

  // Per-period accumulators for all users
  const periodAllMeans   = {};
  const periodUserGrades = {};
  periods.forEach(p => periodAllMeans[p] = []);

  // Category stats per period (melhoria 10)
  const catPerPeriod = {}; // period → { cat → { u,uc,c,cc } }
  periods.forEach(p => {
    catPerPeriod[p] = {};
    CAT_LABELS.forEach(c => catPerPeriod[p][c] = { u:0,uc:0,c:0,cc:0 });
  });

  // Discipline raw stats
  const discStats = {}; // col → { name,period,category,credits,userGrade,sum,sumW,totalW,count }
  Object.entries(discMeta).forEach(([col, meta]) => {
    discStats[col] = { ...meta, userGrade: 0, sum: 0, sumW: 0, totalW: 0, count: 0 };
  });

  const cohortCRs = [];
  let userCR = 0;
  let userCRWeighted = 0;

  allUsers.forEach(u => {
    const isUser = String(u['Matrícula']) === userMat;
    let totalW = 0, sumW = 0;

    periods.forEach(p => {
      let pSumW = 0, pTotW = 0;
      (periodsMap[p] || []).forEach(col => {
        const g = u[col];
        if (typeof g !== 'number') return;
        const { credits, category } = discMeta[col];

        discStats[col].sum += g;
        discStats[col].sumW += g * credits;
        discStats[col].totalW += credits;
        discStats[col].count++;

        const cp = catPerPeriod[p][category];
        cp.c += g; cp.cc++;

        if (isUser) {
          discStats[col].userGrade = g;
          cp.u += g; cp.uc++;
        }

        pSumW  += g * credits;
        pTotW  += credits;
        sumW   += g * credits;
        totalW += credits;
      });

      if (pTotW > 0) {
        const pMean = pSumW / pTotW;
        periodAllMeans[p].push(pMean);
        if (isUser) periodUserGrades[p] = pMean;
      }
    });

    const cr = totalW > 0 ? sumW / totalW : 0;
    cohortCRs.push(cr);
    if (isUser) { userCR = cr; userCRWeighted = cr; }
  });

  // Stats per period
  const statsPerPeriod = periods.map(p => {
    const arr  = [...periodAllMeans[p]].sort((a, b) => a - b);
    const m    = mean(arr);
    const sd   = stdDev(arr);
    const top10 = arr[Math.floor(arr.length * 0.9)] ?? m;
    const bot10 = arr[Math.floor(arr.length * 0.1)] ?? m;
    return {
      period:       p,
      studentMean:  periodUserGrades[p] ?? null,
      cohortMean:   m,
      cohortStdDev: sd,
      top10Mean:    top10,
      bot10Mean:    bot10,
    };
  });

  // Ranking ao longo do tempo (melhoria 7)
  // Para cada período, qual seria o ranking acumulado até aquele período?
  const rankingHistory = periods.map(p => {
    const pIdx = periods.indexOf(p);
    const periodsUntil = periods.slice(0, pIdx + 1);
    const colsUntil = periodsUntil.flatMap(pp => periodsMap[pp] || []);
    const usersRanks = allUsers.map(u => {
      let s = 0, w = 0;
      colsUntil.forEach(col => {
        const g = u[col];
        if (typeof g === 'number') { s += g * discMeta[col].credits; w += discMeta[col].credits; }
      });
      return { mat: String(u['Matrícula']), cr: w ? s / w : 0 };
    }).sort((a, b) => b.cr - a.cr);
    const pos = usersRanks.findIndex(r => r.mat === userMat) + 1;
    const pct = Math.round((pos / total) * 100);
    return { period: p, rank: pos, percentile: pct };
  });

  // Rank & percentile current
  const sortedCRs = [...cohortCRs].sort((a, b) => b - a);
  const userRank  = sortedCRs.findIndex(cr => cr <= userCR) + 1;
  const userPct   = Math.round((userRank / total) * 100);

  // Discipline list
  const disciplines = Object.values(discStats)
    .map(d => ({
      ...d,
      cohortMean:  d.count ? d.sum / d.count : 0,
      cohortMeanW: d.totalW ? d.sumW / d.totalW : 0,
      diff: d.userGrade - (d.count ? d.sum / d.count : 0),
    }))
    .filter(d => d.userGrade > 0);

  // Volatilidade do aluno (melhoria 9)
  const userGrades = disciplines.map(d => d.userGrade);
  const userStdDev = stdDev(userGrades);
  const userMeanGrades = mean(userGrades);

  // Trend: media das notas dos últimos 2 períodos vs CR global
  const lastPeriods = statsPerPeriod.slice(-2).filter(s => s.studentMean !== null);
  const recentMean  = mean(lastPeriods.map(s => s.studentMean));
  const trendDiff   = recentMean - userCRWeighted;

  // Detecção de queda gradual (melhoria 4)
  const gradualDropPeriods = [];
  const validPStats = statsPerPeriod.filter(s => s.studentMean !== null);
  for (let i = 2; i < validPStats.length; i++) {
    const a = validPStats[i-2].studentMean;
    const b = validPStats[i-1].studentMean;
    const c = validPStats[i].studentMean;
    if (a > b && b > c) {
      gradualDropPeriods.push({ period: validPStats[i].period, delta: c - a });
    }
  }

  // CR por fase (melhoria 6)
  const crPorFase = CONFIG.FASES.map(fase => {
    const cols = fase.periodos.flatMap(p => periodsMap[p] || []);
    let s = 0, w = 0;
    cols.forEach(col => {
      const g = user[col];
      if (typeof g === 'number') { s += g * discMeta[col].credits; w += discMeta[col].credits; }
    });
    return { fase: fase.nome, cr: w ? s / w : null };
  });

  // Alertas de risco (melhoria 1)
  const alertas = buildAlertas({ userCR: userCRWeighted, statsPerPeriod, disciplines, userStdDev, gradualDropPeriods, trendDiff });

  // CatStats global
  const catStats = {};
  CAT_LABELS.forEach(c => catStats[c] = { u:0,uc:0,c:0,cc:0 });
  disciplines.forEach(d => {
    const cs = catStats[d.category];
    cs.u += d.userGrade; cs.uc++;
    cs.c += d.cohortMean; cs.cc++;
  });

  return {
    statsPerPeriod, disciplines, periods, catStats, catPerPeriod,
    cohortCRs: new Float32Array(cohortCRs),
    userCR: userCRWeighted, userRank, totalStudents: total, userPercentile: userPct,
    trendDiff, rankingHistory, userStdDev, userMeanGrades, crPorFase,
    alertas, gradualDropPeriods,
  };
}

// ─── ALERTAS (melhoria 1) ────────────────────────────────────────────────────

function buildAlertas({ userCR, statsPerPeriod, disciplines, userStdDev, gradualDropPeriods, trendDiff }) {
  const alertas = [];

  // CR perto do limite
  const gap = userCR - CONFIG.CR_MINIMO;
  if (gap < 1.5) {
    alertas.push({
      nivel: gap < 0.5 ? 'critico' : 'atencao',
      icone: '🚨',
      titulo: gap < 0 ? 'CR abaixo do mínimo' : 'CR próximo do limite',
      corpo: `Seu CR atual (${fmtGrade(userCR)}) está a apenas ${gap.toFixed(2)} pontos do mínimo exigido (${CONFIG.CR_MINIMO}).`,
    });
  }

  // Queda brusca em último período
  const drops = statsPerPeriod.slice(1).map((s, i) => ({
    p: s.period,
    d: (s.studentMean ?? 0) - (statsPerPeriod[i].studentMean ?? 0),
  })).filter(x => x.d < -0.8).sort((a, b) => a.d - b.d);
  if (drops.length) {
    const worst = drops[0];
    alertas.push({
      nivel: 'atencao',
      icone: '📉',
      titulo: 'Queda brusca detectada',
      corpo: `Queda de ${Math.abs(worst.d).toFixed(2)} pts no ${worst.p}º período em relação ao anterior.`,
    });
  }

  // Queda gradual (melhoria 4)
  if (gradualDropPeriods.length) {
    alertas.push({
      nivel: 'aviso',
      icone: '⚠️',
      titulo: 'Tendência de queda gradual',
      corpo: `Detectada queda contínua por 3+ períodos consecutivos (tendência de ${gradualDropPeriods[0]?.delta.toFixed(2)} pts).`,
    });
  }

  // Alta volatilidade (melhoria 9)
  if (userStdDev > 1.5) {
    alertas.push({
      nivel: 'aviso',
      icone: '📊',
      titulo: 'Alta variabilidade de notas',
      corpo: `Seu desvio-padrão de notas é ${userStdDev.toFixed(2)} — indica rendimento inconsistente entre disciplinas.`,
    });
  }

  // Disciplinas com risco de dependência (melhoria 8)
  const discByName = {};
  disciplines.forEach(d => { discByName[d.name] = d; });
  const riscoDep = [];
  Object.entries(CONFIG.DEPENDENCIAS).forEach(([base, filhos]) => {
    const d = discByName[base];
    if (d && d.userGrade < 6.5) {
      const filhosPresentes = filhos.filter(f => discByName[f]);
      if (filhosPresentes.length) {
        riscoDep.push({ base, nota: d.userGrade, filhos: filhosPresentes });
      }
    }
  });
  if (riscoDep.length) {
    alertas.push({
      nivel: 'aviso',
      icone: '🔗',
      titulo: 'Risco em disciplinas dependentes',
      corpo: `Nota baixa em "${riscoDep[0].base}" (${fmtGrade(riscoDep[0].nota)}) pode impactar: ${riscoDep[0].filhos.join(', ')}.`,
    });
  }

  // Tendência positiva
  if (trendDiff > 0.5 && !alertas.some(a => a.nivel === 'critico')) {
    alertas.push({
      nivel: 'positivo',
      icone: '🚀',
      titulo: 'Trajetória ascendente',
      corpo: `Seu desempenho recente está ${trendDiff.toFixed(2)} pts acima do seu CR histórico. Continue assim!`,
    });
  }

  return alertas;
}

// ─── FILTERED VIEW ────────────────────────────────────────────────────────────

function getFilteredView(fd) {
  const { periods: ap, categories: ac } = STATE.activeFilters;
  const disciplines = fd.disciplines.filter(d =>
    (!ap.size || ap.has(d.period)) &&
    (!ac.size || ac.has(d.category))
  );
  const catStats = {};
  CAT_LABELS.forEach(k => catStats[k] = { u:0,uc:0,c:0,cc:0 });
  disciplines.forEach(d => {
    const cs = catStats[d.category];
    cs.u += d.userGrade; cs.uc++;
    cs.c += d.cohortMean; cs.cc++;
  });
  return {
    ...fd,
    disciplines,
    periods: ap.size ? fd.periods.filter(p => ap.has(p)) : fd.periods,
    statsPerPeriod: ap.size ? fd.statsPerPeriod.filter(s => ap.has(s.period)) : fd.statsPerPeriod,
    catStats,
  };
}

// ─── DASHBOARD SCAFFOLD ───────────────────────────────────────────────────────

function buildDashboard() {
  applyChartDefaults();
  const data = STATE.fullData = processData();
  const u    = STATE.currentUser;

  document.body.classList.add('med-light');
  document.body.innerHTML = `
  <div class="layout" id="app-layout">
    <aside class="sidebar fade-1" id="sidebar">
      <div class="sidebar-brand">
        <div class="sidebar-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        </div>
        <span class="sidebar-brand-name">MedDash</span>
      </div>
      <div class="sidebar-profile">
        <div class="sidebar-avatar">${u['Nome do Aluno'][0].toUpperCase()}</div>
        <div class="sidebar-name">${u['Nome do Aluno']}</div>
        <div class="sidebar-id">ID ${u['Matrícula']}</div>
        <span class="badge-pct" id="sb-pct">Top ${data.userPercentile}%</span>
      </div>
      <nav id="sidebar-nav">
        <a href="#" class="nav-link active" data-page="overview">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Visão Geral
        </a>
        <a href="#" class="nav-link" data-page="risk">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          Riscos & Alertas
          ${data.alertas.filter(a=>a.nivel==='critico'||a.nivel==='atencao').length > 0 ?
            `<span style="margin-left:auto;background:var(--danger);color:#fff;border-radius:99px;font-size:10px;font-weight:700;padding:1px 7px;">${data.alertas.filter(a=>a.nivel==='critico'||a.nivel==='atencao').length}</span>` : ''}
        </a>
        <a href="#" class="nav-link" data-page="timeline">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
          Linha do Tempo
        </a>
        <a href="#" class="nav-link" data-page="simulator">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Simulador CR
        </a>
        <a href="#" class="nav-link" data-page="disciplines">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Prontuário
        </a>
        <a href="#" class="nav-link" data-page="notes">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Anotações
        </a>
      </nav>
      <div style="margin-top:auto;padding-top:1rem;border-top:1px solid var(--border);">
        <button id="btn-export-pdf" style="width:100%;display:flex;align-items:center;gap:8px;padding:.6rem .875rem;border-radius:var(--r-md);border:1px solid var(--border);background:transparent;color:var(--text-2);font-size:var(--t-sm);font-weight:500;cursor:pointer;transition:all .15s;" 
          onmouseover="this.style.background='var(--surface-hover)';this.style.color='var(--text)'" 
          onmouseout="this.style.background='transparent';this.style.color='var(--text-2)'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          Exportar PDF
        </button>
        <button id="logout-btn" style="margin-top:.5rem;width:100%;display:flex;align-items:center;gap:8px;padding:.6rem .875rem;border-radius:var(--r-md);border:1px solid var(--border);background:transparent;color:var(--text-2);font-size:var(--t-sm);font-weight:500;cursor:pointer;transition:all .15s;"
          onmouseover="this.style.background='var(--danger-dim)';this.style.color='var(--danger)';this.style.borderColor='var(--danger)'"
          onmouseout="this.style.background='transparent';this.style.color='var(--text-2)';this.style.borderColor='var(--border)'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sair
        </button>
      </div>
    </aside>

    <div class="main" id="main-content">
      <!-- Hambúrguer mobile (melhoria 12) -->
      <div id="mobile-topbar" style="display:none;align-items:center;justify-content:space-between;padding:.875rem 1rem;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:50;box-shadow:0 1px 3px rgba(0,0,0,.07);">
        <div style="display:flex;align-items:center;gap:.625rem;">
          <div style="width:28px;height:28px;background:var(--primary);border-radius:var(--r-md);display:flex;align-items:center;justify-content:center;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <span style="font-weight:700;font-size:1rem;">MedDash</span>
        </div>
        <button id="mobile-menu-btn" style="background:transparent;border:none;padding:.5rem;cursor:pointer;color:var(--text-2);">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div id="page-container" style="padding:2rem 2.5rem;"></div>
    </div>
  </div>
  <div id="mobile-drawer" style="display:none;position:fixed;inset:0;z-index:200;">
    <div id="drawer-backdrop" style="position:absolute;inset:0;background:rgba(15,23,42,.4);backdrop-filter:blur(2px);"></div>
    <nav style="position:absolute;left:0;top:0;bottom:0;width:260px;background:var(--surface);padding:1.5rem 1rem;overflow-y:auto;box-shadow:var(--shadow-lg);" id="drawer-nav">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;">
        <span style="font-weight:700;font-size:1rem;">MedDash</span>
        <button id="drawer-close" style="background:transparent;border:none;padding:.375rem;cursor:pointer;color:var(--text-2);">✕</button>
      </div>
      <div class="sidebar-profile" style="margin-bottom:1rem;">
        <div class="sidebar-avatar">${u['Nome do Aluno'][0].toUpperCase()}</div>
        <div class="sidebar-name">${u['Nome do Aluno']}</div>
        <div class="sidebar-id">ID ${u['Matrícula']}</div>
        <span class="badge-pct">Top ${data.userPercentile}%</span>
      </div>
    </nav>
  </div>`;

  // Responsive: show mobile topbar + drawer nav (melhoria 12)
  const mq = window.matchMedia('(max-width: 1024px)');
  const applyResponsive = () => {
    const mobile = mq.matches;
    const topbar = $('#mobile-topbar');
    const sidebar = $('#sidebar');
    const mainContent = $('#main-content');
    if (topbar) topbar.style.display = mobile ? 'flex' : 'none';
    if (sidebar) sidebar.style.display = mobile ? 'none' : 'flex';
    if (mainContent) mainContent.style.marginLeft = mobile ? '0' : '220px';
    const pageContainer = $('#page-container');
    if (pageContainer) pageContainer.style.padding = mobile ? '1rem' : '2rem 2.5rem';
  };
  applyResponsive();
  mq.addEventListener('change', applyResponsive);

  // Drawer nav links clone
  const drawerNav = $('#drawer-nav');
  if (drawerNav) {
    const links = [
      ['overview','Visão Geral'],['risk','Riscos & Alertas'],
      ['timeline','Linha do Tempo'],['simulator','Simulador CR'],
      ['disciplines','Prontuário'],['notes','Anotações'],
    ];
    links.forEach(([page, label]) => {
      const a = el('a', { href:'#', className:'nav-link', style:'display:flex;align-items:center;gap:10px;' });
      a.textContent = label;
      a.dataset.page = page;
      drawerNav.append(a);
    });
    drawerNav.addEventListener('click', e => {
      const a = e.target.closest('[data-page]');
      if (a) { closeDrawer(); navigateTo(a.dataset.page); }
    });
  }

  const openDrawer  = () => { const d = $('#mobile-drawer'); if(d) d.style.display='block'; };
  const closeDrawer = () => { const d = $('#mobile-drawer'); if(d) d.style.display='none'; };
  $('#mobile-menu-btn')?.addEventListener('click', openDrawer);
  $('#drawer-close')?.addEventListener('click', closeDrawer);
  $('#drawer-backdrop')?.addEventListener('click', closeDrawer);

  // Sidebar navigation
  $('#sidebar-nav')?.addEventListener('click', e => {
    const a = e.target.closest('[data-page]');
    if (!a) return;
    e.preventDefault();
    navigateTo(a.dataset.page);
  });

  // Logout (melhoria 11 — garante reset limpo)
  $('#logout-btn')?.addEventListener('click', () => {
    destroyCharts();
    STATE.currentUser = null;
    STATE.fullData    = null;
    location.reload();
  });

  // Export PDF (melhoria 13)
  $('#btn-export-pdf')?.addEventListener('click', exportPDF);

  navigateTo('overview');
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

function navigateTo(page) {
  STATE.activePage = page;
  $$('#sidebar-nav .nav-link, #drawer-nav .nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
  const container = $('#page-container');
  if (!container) return;
  container.innerHTML = '';
  destroyCharts();

  switch (page) {
    case 'overview':    renderOverview(container); break;
    case 'risk':        renderRisk(container);     break;
    case 'timeline':    renderTimeline(container); break;
    case 'simulator':   renderSimulator(container);break;
    case 'disciplines': renderDisciplines(container); break;
    case 'notes':       renderNotes(container);    break;
  }
}

// ─── PAGE: OVERVIEW ───────────────────────────────────────────────────────────

function renderOverview(container) {
  const data = STATE.fullData;
  const { userCR, userRank, totalStudents, userPercentile, trendDiff, userStdDev, crPorFase } = data;
  const riscoGap = userCR - CONFIG.CR_MINIMO;
  const riscoColor = riscoGap < 0.5 ? 'var(--danger)' : riscoGap < 1.5 ? 'var(--warning)' : 'var(--success)';

  container.innerHTML = `
  <div class="page-header fade-1">
    <h1 class="page-title">Performance Acadêmica</h1>
    <p class="page-sub">Prontuário analítico longitudinal · ${STATE.currentUser['Nome do Aluno']}</p>
  </div>

  <!-- KPIs -->
  <div class="kpi-grid fade-2">
    <div class="kpi-card primary">
      <div class="kpi-label">CR Global (Ponderado)</div>
      <div class="kpi-value" id="kpi-cr">0.00</div>
      <div class="kpi-sub">Coeficiente de rendimento</div>
    </div>
    <div class="kpi-card teal">
      <div class="kpi-label">Posição Turma</div>
      <div class="kpi-value">${userRank}º</div>
      <div class="kpi-sub">de ${totalStudents} alunos</div>
    </div>
    <div class="kpi-card ${trendDiff >= 0 ? 'success' : 'warning'}">
      <div class="kpi-label">Tendência Recente</div>
      <div class="kpi-value" style="color:var(--${trendDiff >= 0 ? 'success' : 'danger'});">${trendDiff > 0 ? '+' : ''}${trendDiff.toFixed(2)}</div>
      <div class="kpi-sub">Últimos períodos vs CR histórico</div>
    </div>
    <div class="kpi-card ${riscoGap < 0.5 ? 'danger' : riscoGap < 1.5 ? 'warning' : 'success'}">
      <div class="kpi-label">Margem de Segurança</div>
      <div class="kpi-value" style="color:${riscoColor};">${riscoGap.toFixed(2)}</div>
      <div class="kpi-sub">Acima do CR mínimo (${CONFIG.CR_MINIMO})</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-label">Ranking Percentil</div>
      <div class="kpi-value" style="color:var(--success);">Top ${userPercentile}%</div>
      <div class="kpi-sub">Melhores alunos da turma</div>
    </div>
    <div class="kpi-card ${userStdDev > 1.5 ? 'warning' : 'teal'}">
      <div class="kpi-label">Consistência</div>
      <div class="kpi-value" style="color:var(--${userStdDev > 1.5 ? 'warning' : 'teal'});">σ ${userStdDev.toFixed(2)}</div>
      <div class="kpi-sub">${userStdDev > 1.5 ? 'Alta variabilidade' : 'Rendimento consistente'}</div>
    </div>
  </div>

  <!-- CR por Fase (melhoria 6) -->
  <div class="card fade-2" style="margin-bottom:1rem;">
    <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">📚 Desempenho por Fase do Curso</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;" id="fases-grid">
      ${crPorFase.map((f, i) => {
        const fase = CONFIG.FASES[i];
        const cr = f.cr;
        const pct = cr !== null ? Math.round((cr / 10) * 100) : 0;
        const color = cr === null ? 'var(--text-3)' : cr >= 7 ? 'var(--success)' : cr >= 5.5 ? 'var(--warning)' : 'var(--danger)';
        return `
        <div style="background:${fase.dim};border:1px solid ${fase.cor}33;border-left:4px solid ${fase.cor};border-radius:var(--r-lg);padding:1rem;">
          <div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${fase.cor};margin-bottom:.5rem;">${fase.nome}</div>
          <div style="font-family:var(--mono);font-size:1.75rem;font-weight:500;color:${cr !== null ? 'var(--text)' : 'var(--text-3)'};">${cr !== null ? cr.toFixed(2) : '—'}</div>
          <div style="margin-top:.5rem;background:var(--border);border-radius:99px;height:6px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${color};border-radius:99px;transition:width .8s ease;"></div>
          </div>
          <div style="font-size:var(--t-xs);color:var(--text-3);margin-top:.375rem;">Períodos ${fase.periodos[0]}–${fase.periodos[fase.periodos.length-1]}</div>
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- Charts -->
  <div class="chart-section cols-2-1 fade-3">
    <div class="card">
      <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">Evolução por Período + Ranking</div>
      <div class="chart-wrap" style="height:300px;"><canvas id="chart-evo"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">Perfil de Competências</div>
      <div class="chart-wrap" style="height:300px;"><canvas id="chart-radar"></canvas></div>
    </div>
  </div>

  <div class="chart-section cols-2 fade-4">
    <div class="card">
      <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">Túnel de Crescimento (±1 DP)</div>
      <div class="chart-wrap" style="height:260px;"><canvas id="chart-growth"></canvas></div>
    </div>
    <div class="card">
      <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">Distribuição da Turma</div>
      <div class="chart-wrap" style="height:260px;"><canvas id="chart-dist"></canvas></div>
    </div>
  </div>

  <!-- Evolução de categoria por período (melhoria 10) -->
  <div class="card fade-4" style="margin-bottom:1rem;">
    <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">Evolução do Perfil por Área ao Longo do Curso</div>
    <div class="chart-wrap" style="height:280px;"><canvas id="chart-cat-evo"></canvas></div>
  </div>

  <div class="chart-section cols-2-1 fade-5">
    <div class="card">
      <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">Heatmap por Disciplina</div>
      <div id="heatmap-container" class="heatmap-wrap"></div>
    </div>
    <div class="card">
      <div class="card-title" style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">Top 5 / Bottom 5 (Δ Turma)</div>
      <div class="chart-wrap" style="height:380px;"><canvas id="chart-ranking"></canvas></div>
    </div>
  </div>`;

  animateValue($('#kpi-cr'), 0, data.userCR, 900);
  renderOverviewCharts(data);
}

function renderOverviewCharts(data) {
  const fd   = getFilteredView(data);
  const sp   = fd.statsPerPeriod;
  const labels = sp.map(s => `${s.period}º P`);
  const stu  = sp.map(s => s.studentMean !== null ? +s.studentMean.toFixed(2) : null);
  const coh  = sp.map(s => +s.cohortMean.toFixed(2));
  const t10  = sp.map(s => +s.top10Mean.toFixed(2));
  const upDP = sp.map(s => +(s.cohortMean + s.cohortStdDev).toFixed(2));
  const loDP = sp.map(s => +(s.cohortMean - s.cohortStdDev).toFixed(2));

  const ctx  = document.getElementById('chart-evo')?.getContext('2d');
  const grad = ctx?.createLinearGradient(0, 0, 0, 300);
  grad?.addColorStop(0, 'rgba(37,99,235,.2)');
  grad?.addColorStop(1, 'rgba(37,99,235,.00)');

  // Evolução + ranking histórico (melhoria 7) — eixo Y2 para ranking
  const rankData = data.rankingHistory.filter(r => sp.find(s => s.period === r.period));
  makeChart('chart-evo', 'line', {
    labels,
    datasets: [
      { label: 'Sua Média', data: stu, borderColor:'#2563eb', backgroundColor: grad, fill:true, tension:.4, borderWidth:2.5, pointBackgroundColor:'#2563eb', pointRadius:4, pointHoverRadius:6, yAxisID:'y' },
      { label: 'Média Turma', data: coh, borderColor:'#94a3b8', borderDash:[5,4], tension:.4, borderWidth:1.5, pointRadius:0, fill:false, yAxisID:'y' },
      { label: 'Top 10%', data: t10, borderColor:'#16a34a', borderDash:[2,4], tension:.4, borderWidth:1.5, pointRadius:0, fill:false, yAxisID:'y' },
      { label: 'Ranking', data: rankData.map(r => r.rank), borderColor:'#d97706', borderDash:[3,3], tension:.4, borderWidth:1.5, pointRadius:0, fill:false, yAxisID:'y2' },
    ]
  }, {
    scales: {
      y:  { ...scaleY(), position:'left' },
      y2: { position:'right', reverse:true, title:{ display:true, text:'Posição Ranking', color:'#94a3b8', font:{size:10} }, ticks:{ ...tickOpts(), stepSize:1 }, grid:{ display:false }, border:{ display:false } },
      x:  scaleX(),
    },
    plugins: {
      legend: { position:'bottom' },
      annotation: {}, // reservado
    },
  });

  makeChart('chart-growth', 'line', {
    labels,
    datasets: [
      { label:'Sua Nota', data:stu, borderColor:'#2563eb', tension:.4, borderWidth:2.5, pointBackgroundColor:'#2563eb', pointRadius:4, fill:false },
      { label:'+1 DP', data:upDP, borderColor:'transparent', backgroundColor:'rgba(22,163,74,.1)', fill:'+1', tension:.4, pointRadius:0 },
      { label:'Média Turma', data:coh, borderColor:'#94a3b8', borderDash:[4,4], borderWidth:1.5, tension:.4, pointRadius:0, fill:false },
      { label:'-1 DP', data:loDP, borderColor:'transparent', backgroundColor:'rgba(22,163,74,.1)', fill:'-1', tension:.4, pointRadius:0 },
    ]
  }, {
    scales: { y: scaleY(), x: scaleX() },
    plugins: { legend:{ labels:{ filter: i => !['+1 DP','-1 DP'].includes(i.text) } } },
  });

  const bands = [{ l:'<5',min:0,max:4.99 },{ l:'5–6',min:5,max:5.99 },{ l:'6–7',min:6,max:6.99 },{ l:'7–8',min:7,max:7.99 },{ l:'8–9',min:8,max:8.99 },{ l:'9–10',min:9,max:10 }];
  const hist  = new Array(6).fill(0);
  data.cohortCRs.forEach(cr => { const i = bands.findIndex(b => cr >= b.min && cr <= b.max); if (i > -1) hist[i]++; });
  const uBIdx = bands.findIndex(b => data.userCR >= b.min && data.userCR <= b.max);
  makeChart('chart-dist', 'bar', {
    labels: bands.map(b => b.l),
    datasets: [
      { label:'Alunos', data:hist, backgroundColor:hist.map((_,i)=>i===uBIdx?'#2563eb':'rgba(37,99,235,.15)'), borderColor:hist.map((_,i)=>i===uBIdx?'#2563eb':'rgba(37,99,235,.4)'), borderWidth:1, borderRadius:5 },
      { type:'line', label:'Densidade', data:hist, borderColor:'#0891b2', borderWidth:2, tension:.45, pointRadius:0, fill:false },
    ]
  }, {
    indexAxis:'y',
    plugins:{ legend:{ position:'bottom' } },
    scales:{
      x:{ ticks:{ precision:0,...tickOpts() }, grid:gridOpts(), border:{display:false}, title:{display:true,text:'Nº Alunos',color:'#94a3b8',font:{size:11}} },
      y:{ ...scaleX(), title:{display:true,text:'Faixa de CR',color:'#94a3b8',font:{size:11}} },
    },
  });

  makeChart('chart-radar', 'radar', {
    labels: CAT_LABELS,
    datasets: [
      { label:'Você', data:CAT_LABELS.map(c=>fd.catStats[c].uc ? +(fd.catStats[c].u/fd.catStats[c].uc).toFixed(2):0), backgroundColor:'rgba(37,99,235,.15)', borderColor:'#2563eb', borderWidth:2, pointBackgroundColor:'#2563eb', pointRadius:3 },
      { label:'Turma', data:CAT_LABELS.map(c=>fd.catStats[c].cc ? +(fd.catStats[c].c/fd.catStats[c].cc).toFixed(2):0), backgroundColor:'transparent', borderColor:'#94a3b8', borderDash:[4,3], borderWidth:1.5, pointRadius:0 },
    ]
  }, {
    scales:{ r:{ min:0,max:10, ticks:{stepSize:2,backdropColor:'transparent',...tickOpts()}, angleLines:{color:'#e2e8f0'}, grid:{color:'#e2e8f0'}, pointLabels:{color:'#475569',font:{size:11,family:"'Sora', sans-serif"}} } },
  });

  // Evolução de categorias por período (melhoria 10)
  const catEvoDatasets = CAT_LABELS.map(cat => {
    const catData = sp.map(s => {
      const cp = data.catPerPeriod[s.period]?.[cat];
      return cp?.uc ? +(cp.u / cp.uc).toFixed(2) : null;
    });
    const { border, bg } = CAT_COLORS[cat];
    return { label:cat, data:catData, borderColor:border, backgroundColor:bg, tension:.4, borderWidth:2, pointRadius:3, fill:false };
  });
  makeChart('chart-cat-evo', 'line', { labels, datasets: catEvoDatasets }, { scales:{ y:scaleY(), x:scaleX() } });

  // Heatmap
  const names = [...new Set(fd.disciplines.map(d => d.name))].sort();
  const hmPeriods = fd.periods;
  if (names.length && $('#heatmap-container')) {
    $('#heatmap-container').innerHTML = `<div class="heatmap-grid" style="grid-template-columns:180px repeat(${hmPeriods.length},40px);">
      <div></div>${hmPeriods.map(p=>`<div class="hm-header">${p}º</div>`).join('')}
      ${names.map(n => `<div class="hm-row-label" title="${n}">${n}</div>` + hmPeriods.map(p => {
        const d = fd.disciplines.find(x => x.name === n && x.period === p);
        return !d ? '<div class="hm-cell empty"></div>' :
          `<div class="hm-cell ${d.userGrade>=8.5?'grade-hi':d.userGrade>=6?'grade-mid':'grade-low'}" title="${n} · ${p}º P\nNota: ${d.userGrade.toFixed(1)} | Turma: ${d.cohortMean.toFixed(1)}">${d.userGrade.toFixed(1)}</div>`;
      }).join('')).join('')}
    </div>`;
  }

  // Top/Bottom ranking
  const sorted = [...fd.disciplines].sort((a,b)=>b.diff-a.diff);
  const tb = [...sorted.slice(0,5),...sorted.slice(-5)];
  makeChart('chart-ranking', 'bar', {
    labels: tb.map(d => d.name.length>22 ? d.name.slice(0,22)+'…' : d.name),
    datasets: [{ label:'Δ vs Turma', data:tb.map(d=>+d.diff.toFixed(2)), backgroundColor:tb.map(d=>d.diff>=0?'rgba(22,163,74,.25)':'rgba(220,38,38,.25)'), borderColor:tb.map(d=>d.diff>=0?'#16a34a':'#dc2626'), borderWidth:1.5, borderRadius:4 }]
  }, {
    indexAxis:'y',
    plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>` ${c.parsed.x>0?'+':''}${c.parsed.x.toFixed(2)} vs média`}} },
    scales:{ x:{ticks:tickOpts(),grid:gridOpts(),border:{display:false},title:{display:true,text:'Δ Nota',color:'#94a3b8',font:{size:11}}}, y:{ticks:{color:'#475569',font:{size:10.5}},grid:{display:false},border:{display:false}} },
  });
}

// ─── PAGE: RISK & ALERTS (melhorias 1, 3, 4, 9) ──────────────────────────────

function renderRisk(container) {
  const data = STATE.fullData;
  const { alertas, userCR, userStdDev, userMeanGrades, statsPerPeriod, disciplines } = data;
  const riscoGap = userCR - CONFIG.CR_MINIMO;

  const nivelStyle = {
    critico:  { bg:'var(--danger-dim)',  border:'var(--danger)',  text:'var(--danger)',  label:'Crítico' },
    atencao:  { bg:'#fef3c7',            border:'var(--warning)', text:'var(--warning)', label:'Atenção' },
    aviso:    { bg:'#ecfeff',            border:'var(--teal)',    text:'var(--teal)',    label:'Aviso' },
    positivo: { bg:'var(--success-dim)', border:'var(--success)', text:'var(--success)', label:'Positivo' },
  };

  container.innerHTML = `
  <div class="page-header fade-1">
    <h1 class="page-title">Riscos & Alertas Acadêmicos</h1>
    <p class="page-sub">Monitoramento preventivo do seu percurso — ${STATE.currentUser['Nome do Aluno']}</p>
  </div>

  <!-- Indicador de CR vs Limite (melhoria 3) -->
  <div class="card fade-2" style="margin-bottom:1.25rem;">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.25rem;">
      <div>
        <div style="font-size:var(--t-sm);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:.375rem;">Indicador de CR vs Mínimo Exigido</div>
        <div style="font-size:var(--t-xs);color:var(--text-3);">CR mínimo para formatura: <strong style="color:var(--text);">${CONFIG.CR_MINIMO}</strong></div>
      </div>
      <div style="text-align:right;">
        <div style="font-family:var(--mono);font-size:1.75rem;font-weight:500;color:${riscoGap < 0 ? 'var(--danger)' : riscoGap < 1.5 ? 'var(--warning)' : 'var(--success)'};">${userCR.toFixed(2)}</div>
        <div style="font-size:var(--t-xs);color:var(--text-3);">seu CR atual</div>
      </div>
    </div>
    <div style="background:var(--border);border-radius:99px;height:12px;position:relative;overflow:visible;">
      <!-- Linha de limite -->
      <div style="position:absolute;left:${(CONFIG.CR_MINIMO/10)*100}%;top:-4px;bottom:-4px;width:2px;background:var(--danger);z-index:2;border-radius:2px;" title="CR Mínimo: ${CONFIG.CR_MINIMO}"></div>
      <!-- Barra de progresso -->
      <div style="height:100%;width:${Math.min(100,(userCR/10)*100)}%;background:${riscoGap < 0 ? 'var(--danger)' : riscoGap < 1.5 ? 'var(--warning)' : 'var(--success)'};border-radius:99px;transition:width .8s ease;position:relative;z-index:1;"></div>
    </div>
    <div style="display:flex;justify-content:space-between;margin-top:.5rem;font-size:var(--t-xs);color:var(--text-3);">
      <span>0</span><span style="color:var(--danger);">Mínimo: ${CONFIG.CR_MINIMO}</span><span>10</span>
    </div>
    <div style="margin-top:.75rem;font-size:var(--t-sm);font-weight:600;color:${riscoGap < 0 ? 'var(--danger)' : riscoGap < 1.5 ? 'var(--warning)' : 'var(--success)'};">
      ${riscoGap < 0 ? `⛔ CR abaixo do mínimo — margem negativa de ${Math.abs(riscoGap).toFixed(2)} pontos` :
        riscoGap < 0.5 ? `🚨 Situação crítica: apenas ${riscoGap.toFixed(2)} pontos de margem` :
        riscoGap < 1.5 ? `⚠️ Atenção: margem de ${riscoGap.toFixed(2)} pontos — fique atento` :
        `✅ CR seguro: ${riscoGap.toFixed(2)} pontos acima do mínimo`}
    </div>
  </div>

  <!-- Alertas dinâmicos (melhoria 1) -->
  <div class="fade-2" style="margin-bottom:1.25rem;">
    <div style="font-size:var(--t-sm);font-weight:700;color:var(--text);margin-bottom:.875rem;">Alertas Identificados (${alertas.length})</div>
    ${alertas.length ? alertas.map(a => {
      const s = nivelStyle[a.nivel] ?? nivelStyle['aviso'];
      return `<div style="background:${s.bg};border:1px solid ${s.border}33;border-left:4px solid ${s.border};border-radius:var(--r-lg);padding:1rem 1.25rem;margin-bottom:.75rem;">
        <div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${s.text};margin-bottom:.375rem;">${a.icone} ${a.titulo}</div>
        <div style="font-size:var(--t-sm);color:var(--text);line-height:1.5;">${a.corpo}</div>
      </div>`;
    }).join('') : `<div style="text-align:center;padding:2rem;color:var(--text-3);background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);">✅ Nenhum alerta identificado. Desempenho estável!</div>`}
  </div>

  <!-- Consistência (melhoria 9) -->
  <div class="card fade-3" style="margin-bottom:1.25rem;">
    <div style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">🎲 Análise de Consistência vs Volatilidade</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1.25rem;">
      <div style="text-align:center;padding:1rem;background:var(--bg);border-radius:var(--r-lg);">
        <div style="font-family:var(--mono);font-size:2rem;font-weight:500;color:var(--text);">${userMeanGrades.toFixed(2)}</div>
        <div style="font-size:var(--t-xs);color:var(--text-3);margin-top:.25rem;">Média das notas individuais</div>
      </div>
      <div style="text-align:center;padding:1rem;background:var(--bg);border-radius:var(--r-lg);">
        <div style="font-family:var(--mono);font-size:2rem;font-weight:500;color:${userStdDev > 1.5 ? 'var(--warning)' : 'var(--success)'};">σ ${userStdDev.toFixed(2)}</div>
        <div style="font-size:var(--t-xs);color:var(--text-3);margin-top:.25rem;">Desvio-padrão pessoal</div>
      </div>
    </div>
    <div style="height:240px;"><canvas id="chart-volatility"></canvas></div>
  </div>

  <!-- Dependências de risco (melhoria 8) -->
  <div class="card fade-4">
    <div style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">🔗 Mapa de Dependências — Impacto Futuro</div>
    <p style="font-size:var(--t-sm);color:var(--text-3);margin-bottom:1rem;">Disciplinas onde você teve nota baixa que podem impactar matérias futuras.</p>
    <div id="dep-map"></div>
    <div style="margin-top:1.25rem;height:260px;"><canvas id="chart-dep-radar"></canvas></div>
  </div>`;

  // Gráfico de volatilidade (scatter de notas individuais)
  const grades = disciplines.map((d,i) => ({ x:i+1, y:d.userGrade }));
  const avgLine = disciplines.map((_,i) => ({ x:i+1, y: userMeanGrades }));
  makeChart('chart-volatility', 'scatter', {
    datasets: [
      { label:'Nota individual', data: grades, backgroundColor: disciplines.map(d => d.userGrade < CONFIG.CR_MINIMO ? 'rgba(220,38,38,.6)' : 'rgba(37,99,235,.5)'), pointRadius:5 },
      { label:`Média (${userMeanGrades.toFixed(2)})`, data: avgLine, type:'line', borderColor:'#d97706', borderDash:[4,4], borderWidth:2, pointRadius:0 },
    ]
  }, {
    plugins:{ legend:{position:'bottom'}, tooltip:{callbacks:{title:()=>'',label:p=>{const d=disciplines[p.dataIndex];return d?`${d.name}: ${p.parsed.y.toFixed(1)}`:'';}}} },
    scales:{ x:{ ticks:{display:false}, grid:{display:false}, border:{display:false} }, y:{ ...scaleY(0,10), title:{display:true,text:'Nota',color:'#94a3b8',font:{size:11}} } },
  });

  // Mapa de dependências
  const depMap = $('#dep-map');
  if (depMap) {
    const discByName = {};
    disciplines.forEach(d => { discByName[d.name] = d; });
    let hasRisk = false;
    Object.entries(CONFIG.DEPENDENCIAS).forEach(([base, filhos]) => {
      const d = discByName[base];
      if (!d || d.userGrade >= 6.5) return;
      const filhosPresentes = filhos.filter(f => f);
      if (!filhosPresentes.length) return;
      hasRisk = true;
      depMap.insertAdjacentHTML('beforeend', `
        <div style="background:var(--danger-dim);border:1px solid rgba(220,38,38,.2);border-radius:var(--r-lg);padding:1rem;margin-bottom:.75rem;display:flex;align-items:flex-start;gap:.75rem;">
          <div style="background:var(--danger);color:#fff;border-radius:var(--r-full);width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:var(--t-sm);font-weight:700;">${d.userGrade.toFixed(1)}</div>
          <div>
            <div style="font-weight:600;font-size:var(--t-sm);color:var(--danger);">${base}</div>
            <div style="font-size:var(--t-xs);color:var(--text-3);margin-top:.2rem;">Pode impactar:</div>
            <div style="display:flex;flex-wrap:wrap;gap:.375rem;margin-top:.375rem;">${filhosPresentes.map(f=>`<span style="background:var(--surface);border:1px solid var(--border);border-radius:99px;padding:2px 10px;font-size:var(--t-xs);">${f}</span>`).join('')}</div>
          </div>
        </div>`);
    });
    if (!hasRisk) depMap.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--text-3);font-size:var(--t-sm);">✅ Nenhum risco de dependência identificado.</div>`;
  }

  // Radar de desempenho por categoria para o gráfico de risco
  const catData = CAT_LABELS.map(c => {
    const cs = data.fullData?.catStats[c] ?? STATE.fullData?.catStats[c];
    return cs?.uc ? +(cs.u / cs.uc).toFixed(2) : 0;
  });
  makeChart('chart-dep-radar', 'radar', {
    labels: CAT_LABELS,
    datasets: [
      { label:'Você', data:catData, backgroundColor:'rgba(37,99,235,.15)', borderColor:'#2563eb', borderWidth:2, pointBackgroundColor:'#2563eb', pointRadius:3 },
      { label:`Mínimo seguro (${CONFIG.CR_MINIMO})`, data:CAT_LABELS.map(()=>CONFIG.CR_MINIMO), backgroundColor:'rgba(220,38,38,.08)', borderColor:'#dc2626', borderDash:[4,3], borderWidth:1.5, pointRadius:0 },
    ]
  }, {
    scales:{ r:{ min:0,max:10, ticks:{stepSize:2,backdropColor:'transparent',...tickOpts()}, angleLines:{color:'#e2e8f0'}, grid:{color:'#e2e8f0'}, pointLabels:{color:'#475569',font:{size:11}} } },
  });
}

// ─── PAGE: TIMELINE (melhorias 5, 6, 7) ──────────────────────────────────────

function renderTimeline(container) {
  const data = STATE.fullData;
  const { statsPerPeriod, rankingHistory, periods } = data;
  const notes = getNotes(String(STATE.currentUser['Matrícula']));

  const donePeriods = periods;
  const totalPeriods = CONFIG.TOTAL_PERIODOS;

  container.innerHTML = `
  <div class="page-header fade-1">
    <h1 class="page-title">Linha do Tempo — 6 Anos</h1>
    <p class="page-sub">Sua jornada acadêmica de ${totalPeriods} semestres visualizada em perspectiva.</p>
  </div>

  <!-- Roadmap visual (melhoria 5) -->
  <div class="card fade-2" style="margin-bottom:1.25rem;">
    <div style="font-size:var(--t-base);font-weight:600;margin-bottom:1.25rem;">🗺️ Roadmap dos ${totalPeriods} Períodos</div>
    <div style="display:grid;grid-template-columns:repeat(${totalPeriods},1fr);gap:.5rem;margin-bottom:1rem;" id="roadmap-grid"></div>
    <div style="display:flex;gap:1.25rem;flex-wrap:wrap;margin-top:.625rem;">
      ${CONFIG.FASES.map(f => `<div style="display:flex;align-items:center;gap:.4rem;font-size:var(--t-xs);color:var(--text-2);"><div style="width:12px;height:12px;background:${f.cor};border-radius:3px;"></div>${f.nome}</div>`).join('')}
      <div style="display:flex;align-items:center;gap:.4rem;font-size:var(--t-xs);color:var(--text-2);"><div style="width:12px;height:12px;background:var(--border);border-radius:3px;"></div>Não cursado</div>
    </div>
  </div>

  <!-- Evolução CR + Ranking por período (melhoria 7) -->
  <div class="card fade-3" style="margin-bottom:1.25rem;">
    <div style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">📈 Evolução do CR e Ranking Acumulados por Período</div>
    <div style="height:300px;"><canvas id="chart-timeline-cr"></canvas></div>
  </div>

  <!-- Cards de período detalhados -->
  <div class="fade-4">
    <div style="font-size:var(--t-sm);font-weight:700;color:var(--text);margin-bottom:.875rem;">Detalhes por Período Cursado</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1rem;" id="period-cards"></div>
  </div>`;

  // Roadmap grid
  const roadmap = $('#roadmap-grid');
  if (roadmap) {
    Array.from({ length: totalPeriods }, (_, i) => i + 1).forEach(p => {
      const fase = getFase(p);
      const done = donePeriods.includes(p);
      const stat = statsPerPeriod.find(s => s.period === p);
      const nota = stat?.studentMean;
      const pct  = nota !== null && nota !== undefined ? Math.round((nota / 10) * 100) : 0;
      const isCurrent = done && p === Math.max(...donePeriods);

      const div = el('div', {}, `
        <div style="position:relative;background:${done ? fase.dim : 'var(--bg)'};border:2px solid ${done ? fase.cor : 'var(--border)'};border-radius:var(--r-lg);padding:.75rem .5rem;text-align:center;${isCurrent ? `box-shadow:0 0 0 3px ${fase.cor}55;` : ''}">
          ${isCurrent ? `<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:${fase.cor};color:#fff;font-size:9px;font-weight:700;padding:1px 7px;border-radius:99px;">ATUAL</div>` : ''}
          <div style="font-family:var(--mono);font-size:var(--t-xs);font-weight:700;color:${done ? fase.cor : 'var(--text-3)'};">${p}º</div>
          ${done && nota !== null && nota !== undefined ? `
            <div style="font-family:var(--mono);font-size:1rem;font-weight:500;color:var(--text);margin-top:.25rem;">${nota.toFixed(1)}</div>
            <div style="margin-top:.375rem;background:${done ? 'rgba(255,255,255,.5)' : 'var(--border)'};border-radius:99px;height:4px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${nota>=8?'var(--success)':nota>=6?fase.cor:'var(--danger)'};border-radius:99px;"></div>
            </div>
          ` : `<div style="font-size:var(--t-xs);color:var(--text-3);margin-top:.25rem;">—</div>`}
        </div>`);
      roadmap.append(div);
    });
  }

  // Timeline chart — CR acumulado + posição de ranking (melhoria 7)
  const crAcumulado = [];
  periods.forEach((p, i) => {
    const colsUntil = periods.slice(0, i+1).flatMap(pp =>
      Object.keys(STATE.currentUser).filter(k => k.match(new RegExp(`\\(${pp}º Período\\)`)))
    );
    let s = 0, w = 0;
    colsUntil.forEach(col => {
      const g = STATE.currentUser[col];
      const m = col.match(/\(\d+º Período\)\s+(.+)/);
      if (typeof g === 'number' && m) { const cred = getCredits(m[1]); s += g*cred; w += cred; }
    });
    crAcumulado.push(w ? +(s/w).toFixed(2) : null);
  });

  makeChart('chart-timeline-cr', 'line', {
    labels: periods.map(p => `${p}º P`),
    datasets: [
      { label:'CR Acumulado', data:crAcumulado, borderColor:'#2563eb', backgroundColor:'rgba(37,99,235,.1)', fill:true, tension:.4, borderWidth:2.5, pointBackgroundColor:'#2563eb', pointRadius:4, yAxisID:'y' },
      { label:'Média por Período', data:statsPerPeriod.map(s=>s.studentMean!==null?+s.studentMean.toFixed(2):null), borderColor:'#0891b2', borderDash:[5,4], tension:.4, borderWidth:2, pointRadius:4, fill:false, yAxisID:'y' },
      { label:'Posição Turma', data:rankingHistory.map(r=>r.rank), borderColor:'#d97706', borderDash:[3,3], tension:.4, borderWidth:1.5, pointRadius:3, fill:false, yAxisID:'y2' },
    ]
  }, {
    scales:{
      y:  { ...scaleY(), position:'left', title:{display:true,text:'CR',color:'#94a3b8',font:{size:11}} },
      y2: { position:'right', reverse:true, title:{display:true,text:'Posição',color:'#94a3b8',font:{size:10}}, ticks:{...tickOpts(),stepSize:1}, grid:{display:false}, border:{display:false} },
      x:  scaleX(),
    },
  });

  // Cards por período
  const cardsEl = $('#period-cards');
  if (cardsEl) {
    statsPerPeriod.forEach(s => {
      const nota = s.studentMean;
      if (nota === null) return;
      const fase = getFase(s.period);
      const rank = rankingHistory.find(r => r.period === s.period);
      const nota_diff = nota - s.cohortMean;
      const nota_color = nota >= 8 ? 'var(--success)' : nota >= 6 ? 'var(--text)' : 'var(--danger)';
      const noteText = notes[s.period] || '';

      const card = el('div', { className:'card', style:`border-top:3px solid ${fase.cor};` }, `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem;">
          <div>
            <div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${fase.cor};">${s.period}º Período · ${fase.nome}</div>
            <div style="font-family:var(--mono);font-size:1.75rem;font-weight:500;color:${nota_color};line-height:1.1;">${nota.toFixed(2)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:var(--t-xs);color:var(--text-3);">Posição</div>
            <div style="font-family:var(--mono);font-size:1.25rem;font-weight:500;color:var(--text);">${rank?.rank ?? '—'}º</div>
          </div>
        </div>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-bottom:.875rem;">
          <span style="background:var(--bg);border:1px solid var(--border);border-radius:99px;padding:2px 10px;font-size:var(--t-xs);">Turma: ${s.cohortMean.toFixed(2)}</span>
          <span style="background:${nota_diff>=0?'var(--success-dim)':'var(--danger-dim)'};border:1px solid ${nota_diff>=0?'rgba(22,163,74,.2)':'rgba(220,38,38,.2)'};border-radius:99px;padding:2px 10px;font-size:var(--t-xs);color:${nota_diff>=0?'var(--success)':'var(--danger)'};">${fmtDiff(nota_diff)} vs turma</span>
          <span style="background:var(--bg);border:1px solid var(--border);border-radius:99px;padding:2px 10px;font-size:var(--t-xs);">Top ${rank?.percentile ?? '—'}%</span>
        </div>
        <div>
          <label style="font-size:var(--t-xs);font-weight:600;color:var(--text-3);display:block;margin-bottom:.375rem;">📝 Anotação pessoal (melhoria 14)</label>
          <textarea data-period="${s.period}" style="width:100%;padding:.625rem .875rem;border:1px solid var(--border);border-radius:var(--r-md);font:var(--t-sm) var(--font);color:var(--text);background:var(--bg);resize:vertical;min-height:60px;outline:none;transition:border-color .15s;" placeholder="Como foi esse período?">${noteText}</textarea>
        </div>`);
      cardsEl.append(card);
    });

    cardsEl.addEventListener('input', e => {
      const ta = e.target.closest('textarea[data-period]');
      if (!ta) return;
      saveNote(String(STATE.currentUser['Matrícula']), +ta.dataset.period, ta.value);
    });
  }
}

// ─── PAGE: SIMULATOR (melhoria 2) ────────────────────────────────────────────

function renderSimulator(container) {
  const data  = STATE.fullData;
  const { periods, statsPerPeriod } = data;
  const donePeriods = new Set(periods);
  const futurePeriods = Array.from({ length: CONFIG.TOTAL_PERIODOS }, (_, i) => i + 1)
    .filter(p => !donePeriods.has(p));

  // Compute current weighted sum + weights
  let currentSumW = 0, currentTotalW = 0;
  periods.forEach(p => {
    const cols = Object.keys(STATE.currentUser).filter(k => k.match(new RegExp(`\\(${p}º Período\\)`)));
    cols.forEach(col => {
      const g = STATE.currentUser[col];
      const m = col.match(/\(\d+º Período\)\s+(.+)/);
      if (typeof g === 'number' && m) { const c = getCredits(m[1]); currentSumW += g*c; currentTotalW += c; }
    });
  });
  const avgCreditsPerPeriod = currentTotalW / Math.max(periods.length, 1);

  container.innerHTML = `
  <div class="page-header fade-1">
    <h1 class="page-title">Simulador de CR Futuro</h1>
    <p class="page-sub">Projete seu CR final com base em metas de desempenho.</p>
  </div>

  <div class="card fade-2" style="margin-bottom:1.25rem;">
    <div style="font-size:var(--t-base);font-weight:600;margin-bottom:1.25rem;">🎯 Defina suas metas para os períodos futuros</div>
    ${futurePeriods.length === 0 ? `<p style="color:var(--text-3);font-size:var(--t-sm);">Você já cursou todos os períodos mapeados na base de dados.</p>` : ''}
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;" id="sim-inputs">
      ${futurePeriods.map(p => {
        const fase = getFase(p);
        return `
        <div style="background:${fase.dim};border:1px solid ${fase.cor}33;border-radius:var(--r-lg);padding:1rem;">
          <div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${fase.cor};margin-bottom:.5rem;">${p}º Período · ${fase.nome}</div>
          <label style="font-size:var(--t-xs);color:var(--text-2);display:block;margin-bottom:.375rem;">Meta de média: <span id="sim-label-${p}" style="font-weight:700;color:var(--text);">7.0</span></label>
          <input type="range" min="0" max="10" step="0.1" value="7.0" data-period="${p}"
            style="width:100%;accent-color:${fase.cor};cursor:pointer;"
            oninput="document.getElementById('sim-label-${p}').textContent=parseFloat(this.value).toFixed(1);window._simUpdate && window._simUpdate();">
        </div>`;
      }).join('')}
    </div>
  </div>

  <div class="card fade-3" style="margin-bottom:1.25rem;">
    <div style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">📊 Projeção de CR Final</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.25rem;">
      <div style="text-align:center;padding:1rem;background:var(--bg);border-radius:var(--r-lg);">
        <div style="font-size:var(--t-xs);color:var(--text-3);margin-bottom:.25rem;">CR Atual</div>
        <div style="font-family:var(--mono);font-size:1.75rem;font-weight:500;color:var(--primary);">${data.userCR.toFixed(2)}</div>
      </div>
      <div style="text-align:center;padding:1rem;background:var(--bg);border-radius:var(--r-lg);">
        <div style="font-size:var(--t-xs);color:var(--text-3);margin-bottom:.25rem;">CR Projetado</div>
        <div style="font-family:var(--mono);font-size:1.75rem;font-weight:500;" id="sim-cr-proj">—</div>
      </div>
      <div style="text-align:center;padding:1rem;background:var(--bg);border-radius:var(--r-lg);">
        <div style="font-size:var(--t-xs);color:var(--text-3);margin-bottom:.25rem;">Δ vs Atual</div>
        <div style="font-family:var(--mono);font-size:1.75rem;font-weight:500;" id="sim-cr-diff">—</div>
      </div>
    </div>
    <div id="sim-status" style="margin-bottom:1rem;padding:.875rem 1rem;border-radius:var(--r-lg);font-size:var(--t-sm);font-weight:500;"></div>
    <div style="height:280px;"><canvas id="chart-sim"></canvas></div>
  </div>

  <div class="card fade-4">
    <div style="font-size:var(--t-base);font-weight:600;margin-bottom:1rem;">💡 Cenários de Meta</div>
    <p style="font-size:var(--t-sm);color:var(--text-3);margin-bottom:1rem;">Qual CR mínimo você precisa tirar nos períodos restantes para atingir diferentes metas?</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;" id="sim-scenarios"></div>
  </div>`;

  const update = () => {
    if (!futurePeriods.length) return;
    const sliders = $$('#sim-inputs input[type=range]');
    let futSumW = 0, futTotalW = 0;
    sliders.forEach(s => {
      const grade = parseFloat(s.value);
      const cred  = avgCreditsPerPeriod;
      futSumW   += grade * cred;
      futTotalW += cred;
    });
    const projCR = (currentSumW + futSumW) / (currentTotalW + futTotalW);
    const diff   = projCR - data.userCR;
    const projEl = $('#sim-cr-proj');
    const diffEl = $('#sim-cr-diff');
    const statEl = $('#sim-status');
    if (projEl) { projEl.textContent = projCR.toFixed(2); projEl.style.color = projCR >= 7 ? 'var(--success)' : projCR >= CONFIG.CR_MINIMO ? 'var(--warning)' : 'var(--danger)'; }
    if (diffEl) { diffEl.textContent = fmtDiff(diff); diffEl.style.color = diff >= 0 ? 'var(--success)' : 'var(--danger)'; }
    if (statEl) {
      const gap = projCR - CONFIG.CR_MINIMO;
      statEl.style.background = gap < 0 ? 'var(--danger-dim)' : gap < 0.5 ? '#fef3c7' : 'var(--success-dim)';
      statEl.style.color = gap < 0 ? 'var(--danger)' : gap < 0.5 ? 'var(--warning)' : 'var(--success)';
      statEl.textContent = gap < 0 ? `⛔ Projeção abaixo do CR mínimo! Você precisará de um desempenho excepcional.` :
        gap < 0.5 ? `⚠️ Projeção próxima do mínimo — mantenha atenção.` :
        `✅ Projeção saudável — ${gap.toFixed(2)} pts acima do mínimo requerido.`;
    }

    // Chart
    const allPeriods = [...periods, ...futurePeriods];
    const allData = [
      ...statsPerPeriod.map(s => ({ p:s.period, v:s.studentMean !== null ? s.studentMean : null, future:false })),
      ...sliders.map(s => ({ p:+s.dataset.period, v:parseFloat(s.value), future:true })),
    ].sort((a,b)=>a.p-b.p);

    makeChart('chart-sim', 'line', {
      labels: allData.map(d=>`${d.p}º P`),
      datasets: [
        { label:'Histórico real', data:allData.map(d=>!d.future?d.v:null), borderColor:'#2563eb', tension:.4, borderWidth:2.5, pointBackgroundColor:'#2563eb', pointRadius:4, fill:false, spanGaps:true },
        { label:'Projeção', data:allData.map((d,i)=>d.future?d.v:(i===allData.findLastIndex(x=>!x.future)?d.v:null)), borderColor:'#d97706', borderDash:[5,4], tension:.4, borderWidth:2, pointBackgroundColor:'#d97706', pointRadius:4, fill:false, spanGaps:true },
        { label:`CR Mínimo (${CONFIG.CR_MINIMO})`, data:allData.map(()=>CONFIG.CR_MINIMO), borderColor:'rgba(220,38,38,.5)', borderDash:[3,3], borderWidth:1.5, pointRadius:0, fill:false },
      ]
    }, { scales:{ y:scaleY(), x:scaleX() } });

    // Cenários
    const scenEl = $('#sim-scenarios');
    if (scenEl) {
      const targets = [{ label:'Aprovação mínima', target:CONFIG.CR_MINIMO },{ label:'Bom (7.0)', target:7.0 },{ label:'Excelente (8.5)', target:8.5 },{ label:'Nota máxima (10)', target:10 }];
      scenEl.innerHTML = targets.map(t => {
        const needed = futTotalW > 0 ? (t.target * (currentTotalW + futTotalW) - currentSumW) / futTotalW : null;
        const feasible = needed !== null && needed <= 10 && needed >= 0;
        return `<div style="padding:1rem;background:var(--bg);border-radius:var(--r-lg);border:1px solid var(--border);">
          <div style="font-size:var(--t-xs);font-weight:700;color:var(--text-3);margin-bottom:.25rem;">${t.label}</div>
          <div style="font-family:var(--mono);font-size:1.25rem;font-weight:500;color:${feasible?'var(--success)':'var(--danger)'};">${needed!==null?needed.toFixed(2):'—'}</div>
          <div style="font-size:var(--t-xs);color:var(--text-3);margin-top:.2rem;">${feasible?'meta por período':'inatingível'}</div>
        </div>`;
      }).join('');
    }
  };

  window._simUpdate = update;
  update();
}

// ─── PAGE: DISCIPLINES (Prontuário) ──────────────────────────────────────────

function renderDisciplines(container) {
  const data = STATE.fullData;

  container.innerHTML = `
  <div class="page-header fade-1">
    <h1 class="page-title">Prontuário Detalhado</h1>
    <p class="page-sub">Todas as disciplinas cursadas com comparativo à turma.</p>
  </div>

  <div class="card fade-2" style="margin-bottom:1rem;" id="filter-card">
    <div style="display:flex;align-items:flex-start;gap:1.5rem;flex-wrap:wrap;">
      <div>
        <div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:.5rem;">Período</div>
        <div style="display:flex;flex-wrap:wrap;gap:.375rem;" id="chips-periods"></div>
      </div>
      <div style="width:1px;background:var(--border);align-self:stretch;flex-shrink:0;"></div>
      <div>
        <div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-3);margin-bottom:.5rem;">Área</div>
        <div style="display:flex;flex-wrap:wrap;gap:.375rem;" id="chips-categories"></div>
      </div>
      <div style="margin-left:auto;align-self:center;">
        <button id="filter-reset" style="display:flex;align-items:center;gap:.4rem;padding:5px 14px;border-radius:99px;border:1.5px solid var(--border);background:transparent;color:var(--text-3);font-size:var(--t-xs);font-weight:600;cursor:pointer;font-family:var(--font);transition:all .15s;"
          onmouseover="this.style.borderColor='var(--danger)';this.style.color='var(--danger)';this.style.background='var(--danger-dim)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--text-3)';this.style.background='transparent'">
          ✕ Limpar
        </button>
      </div>
    </div>
  </div>

  <div class="card fade-3" style="overflow-x:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <div style="font-size:var(--t-base);font-weight:600;" id="table-title">Prontuário Detalhado</div>
      <span style="font-size:var(--t-xs);color:var(--text-3);" id="filter-summary">Exibindo <strong>todos</strong> os dados</span>
    </div>
    <table class="data-table" id="data-table">
      <thead><tr>
        <th data-sort="name" style="cursor:pointer;">Disciplina <span class="sort-icon">↕</span></th>
        <th data-sort="period" style="cursor:pointer;">Período <span class="sort-icon">↕</span></th>
        <th data-sort="category" style="cursor:pointer;">Área <span class="sort-icon">↕</span></th>
        <th data-sort="userGrade" style="cursor:pointer;">Sua Nota <span class="sort-icon">↕</span></th>
        <th data-sort="cohortMean" style="cursor:pointer;">Média Turma <span class="sort-icon">↕</span></th>
        <th data-sort="diff" style="cursor:pointer;">Δ Diferença <span class="sort-icon">↕</span></th>
        <th>Status</th>
      </tr></thead>
      <tbody></tbody>
    </table>
  </div>`;

  // Chips
  const pCt = $('#chips-periods');
  const cCt = $('#chips-categories');
  const chipStyle = `display:inline-flex;align-items:center;padding:4px 12px;border-radius:99px;border:1.5px solid var(--border);background:var(--surface);color:var(--text-2);font-size:var(--t-xs);font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;font-family:var(--font);`;

  data.periods.forEach(p => {
    const btn = el('button', { style: chipStyle, textContent: `${p}º P` });
    btn.onclick = () => toggleFilter('periods', p, btn, () => renderDisciplinesTable(getFilteredView(STATE.fullData)));
    pCt?.append(btn);
  });
  CAT_LABELS.filter(c => data.disciplines.some(d => d.category === c)).forEach(c => {
    const btn = el('button', { style: chipStyle, textContent: c });
    btn.onclick = () => toggleFilter('categories', c, btn, () => renderDisciplinesTable(getFilteredView(STATE.fullData)));
    cCt?.append(btn);
  });

  $('#filter-reset')?.addEventListener('click', () => {
    STATE.activeFilters.periods.clear();
    STATE.activeFilters.categories.clear();
    $$('.chip-active').forEach(c => c.classList.remove('chip-active'));
    updateFilterSummary();
    renderDisciplinesTable(STATE.fullData);
  });

  // Sort
  $('#data-table thead')?.addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (!th) return;
    STATE.tableSort.dir = STATE.tableSort.key === th.dataset.sort && STATE.tableSort.dir === 'desc' ? 'asc' : 'desc';
    STATE.tableSort.key = th.dataset.sort;
    renderDisciplinesTable(getFilteredView(STATE.fullData));
  });

  renderDisciplinesTable(data);
}

function toggleFilter(type, val, btn, onUpdate) {
  if (STATE.activeFilters[type].has(val)) {
    STATE.activeFilters[type].delete(val);
    btn.classList.remove('chip-active');
    btn.style.borderColor = 'var(--border)';
    btn.style.color = 'var(--text-2)';
    btn.style.background = 'var(--surface)';
  } else {
    STATE.activeFilters[type].add(val);
    btn.classList.add('chip-active');
    btn.style.borderColor = 'var(--primary)';
    btn.style.color = 'var(--primary)';
    btn.style.background = 'var(--primary-dim)';
  }
  updateFilterSummary();
  onUpdate?.();
}

function updateFilterSummary() {
  const { periods: p, categories: c } = STATE.activeFilters;
  const el = $('#filter-summary');
  if (!el) return;
  el.innerHTML = p.size || c.size ?
    `Filtrado por <strong>${[p.size&&`${p.size} período(s)`,c.size&&`${c.size} área(s)`].filter(Boolean).join(' · ')}</strong>` :
    'Exibindo <strong>todos</strong> os dados';
}

function renderDisciplinesTable({ disciplines }) {
  const { key, dir } = STATE.tableSort;
  $$('#data-table th[data-sort]').forEach(th => {
    const si = th.querySelector('.sort-icon');
    const sorted = th.dataset.sort === key;
    if (si) si.textContent = sorted ? (dir==='asc'?'↑':'↓') : '↕';
    th.style.color = sorted ? 'var(--primary)' : '';
  });

  const tbody = $('#data-table tbody');
  if (!tbody) return;
  const sorted = [...disciplines].sort((a, b) => {
    const av = a[key], bv = b[key];
    const cmp = typeof av === 'string' ? av.localeCompare(bv, 'pt') : av - bv;
    return cmp * (dir === 'asc' ? 1 : -1);
  });

  const catColors = { 'Básicas':'#6366f1','Clínica':'#0891b2','Cirurgia':'#dc2626','Saúde Pública':'#16a34a','Humanidades':'#d97706' };

  tbody.innerHTML = sorted.map(d => `<tr>
    <td>${d.name}</td>
    <td class="mono">${d.period}º</td>
    <td><span style="display:inline-flex;padding:2px 9px;border-radius:99px;background:${catColors[d.category]}18;color:${catColors[d.category]};font-size:var(--t-xs);font-weight:600;">${d.category}</span></td>
    <td class="mono" style="font-weight:700;color:${d.userGrade>=8?'var(--success)':d.userGrade>=6?'var(--text)':'var(--danger)'};">${fmtGrade(d.userGrade)}</td>
    <td class="mono" style="color:var(--text-3);">${fmtGrade(d.cohortMean)}</td>
    <td class="mono" style="color:var(--${d.diff>=0?'success':'danger'});">${fmtDiff(d.diff)}</td>
    <td><span class="badge ${d.userGrade>=CONFIG.CR_MINIMO?'ok':'bad'}">${d.userGrade>=CONFIG.CR_MINIMO?'Adequado':'Atenção'}</span></td>
  </tr>`).join('');

  const title = $('#table-title');
  if (title) title.textContent = `Prontuário · ${disciplines.length} disciplina(s)`;
}

// ─── PAGE: NOTES (melhoria 14) ───────────────────────────────────────────────

function renderNotes(container) {
  const data    = STATE.fullData;
  const mat     = String(STATE.currentUser['Matrícula']);
  const notes   = getNotes(mat);
  const periods = data.periods;

  container.innerHTML = `
  <div class="page-header fade-1">
    <h1 class="page-title">Anotações Pessoais</h1>
    <p class="page-sub">Registre contexto qualitativo para cada período — ajuda a entender seu histórico.</p>
  </div>
  <div style="margin-bottom:.75rem;padding:.875rem 1rem;background:var(--teal-dim, #ecfeff);border:1px solid rgba(8,145,178,.2);border-radius:var(--r-lg);font-size:var(--t-sm);color:var(--text-2);">
    💡 Suas anotações ficam salvas localmente neste navegador. Exemplos: "tive uma cirurgia esse período", "mudei de cidade", "fiz estágio extra".
  </div>
  <div style="display:grid;gap:1rem;" id="notes-list"></div>`;

  const list = $('#notes-list');
  if (!list) return;

  periods.forEach(p => {
    const fase = getFase(p);
    const stat = data.statsPerPeriod.find(s => s.period === p);
    const nota = stat?.studentMean;

    const card = el('div', { className:'card fade-2', style:`border-left:4px solid ${fase.cor};` }, `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.875rem;flex-wrap:wrap;gap:.5rem;">
        <div>
          <div style="font-size:var(--t-xs);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:${fase.cor};">${p}º Período · ${fase.nome}</div>
          ${nota !== null && nota !== undefined ? `<div style="font-family:var(--mono);font-size:1rem;font-weight:500;color:var(--text);margin-top:.2rem;">Média: ${nota.toFixed(2)}</div>` : ''}
        </div>
        <button data-period="${p}" class="btn-clear-note" style="background:transparent;border:1px solid var(--border);color:var(--text-3);font-size:var(--t-xs);padding:4px 12px;border-radius:99px;cursor:pointer;font-family:var(--font);">Limpar</button>
      </div>
      <textarea data-period="${p}" style="width:100%;min-height:80px;padding:.75rem 1rem;border:1px solid var(--border);border-radius:var(--r-md);font:var(--t-sm)/1.5 var(--font);color:var(--text);background:var(--bg);resize:vertical;outline:none;transition:border-color .15s;" 
        placeholder="O que aconteceu nesse período? Eventos, desafios, conquistas…">${notes[p] || ''}</textarea>
      <div style="font-size:var(--t-xs);color:var(--text-3);margin-top:.375rem;" id="note-status-${p}"></div>`);
    list.append(card);
  });

  list.addEventListener('input', e => {
    const ta = e.target.closest('textarea[data-period]');
    if (!ta) return;
    const p = +ta.dataset.period;
    saveNote(mat, p, ta.value);
    const st = $(`#note-status-${p}`);
    if (st) { st.textContent = '✓ Salvo'; setTimeout(() => { if (st) st.textContent = ''; }, 1500); }
  });

  list.addEventListener('click', e => {
    const btn = e.target.closest('.btn-clear-note');
    if (!btn) return;
    const p = +btn.dataset.period;
    const ta = list.querySelector(`textarea[data-period="${p}"]`);
    if (ta) ta.value = '';
    saveNote(mat, p, '');
  });
}

// ─── EXPORT PDF (melhoria 13) ─────────────────────────────────────────────────

async function exportPDF() {
  const btn = $('#btn-export-pdf');
  if (btn) { btn.textContent = 'Gerando PDF…'; btn.disabled = true; }

  try {
    // Carrega jsPDF e html2canvas dinamicamente
    if (!window.jspdf) {
      await Promise.all([
        new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
          s.onload = res; s.onerror = rej;
          document.head.append(s);
        }),
        new Promise((res, rej) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          s.onload = res; s.onerror = rej;
          document.head.append(s);
        }),
      ]);
    }

    const data  = STATE.fullData;
    const user  = STATE.currentUser;
    const { jsPDF } = window.jspdf;
    const doc   = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W = 210, M = 15;

    // Capa
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, W, 55, 'F');
    doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold'); doc.setFontSize(22);
    doc.text('MedDash Analytics', M, 22);
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text('Relatório Acadêmico Longitudinal', M, 30);
    doc.setFontSize(10);
    doc.text(`Aluno: ${user['Nome do Aluno']}   |   Matrícula: ${user['Matrícula']}`, M, 40);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, M, 48);

    // KPIs
    doc.setTextColor(15,23,42);
    doc.setFont('helvetica','bold'); doc.setFontSize(13);
    doc.text('Indicadores Gerais', M, 68);

    const kpis = [
      ['CR Global (Ponderado)', data.userCR.toFixed(2)],
      ['Posição Turma', `${data.userRank}º de ${data.totalStudents}`],
      ['Percentil', `Top ${data.userPercentile}%`],
      ['Tendência Recente', fmtDiff(data.trendDiff)],
      ['Desvio-Padrão Pessoal', `σ ${data.userStdDev.toFixed(2)}`],
      ['Margem de Segurança CR', `${(data.userCR - CONFIG.CR_MINIMO).toFixed(2)} pts`],
    ];
    doc.setFontSize(10); doc.setFont('helvetica','normal');
    kpis.forEach(([label, val], i) => {
      const x = M + (i % 2) * 92;
      const y = 78 + Math.floor(i/2) * 10;
      doc.setFont('helvetica','bold'); doc.text(label + ':', x, y);
      doc.setFont('helvetica','normal'); doc.text(val, x + 65, y);
    });

    // Alertas
    doc.setFont('helvetica','bold'); doc.setFontSize(13);
    doc.text('Alertas Acadêmicos', M, 110);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    let ay = 118;
    data.alertas.forEach(a => {
      const colorMap = { critico:[220,38,38], atencao:[217,119,6], aviso:[8,145,178], positivo:[22,163,74] };
      const [r,g,b] = colorMap[a.nivel] ?? [100,100,100];
      doc.setTextColor(r,g,b);
      doc.setFont('helvetica','bold'); doc.text(`${a.icone} ${a.titulo}`, M, ay);
      doc.setTextColor(15,23,42);
      doc.setFont('helvetica','normal');
      const lines = doc.splitTextToSize(a.corpo, W - M*2 - 5);
      doc.text(lines, M+5, ay+5);
      ay += 8 + lines.length*4;
    });

    // Desempenho por período
    if (ay < 200) {
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(15,23,42);
      doc.text('Desempenho por Período', M, ay + 8);
      ay += 16;
      doc.setFontSize(9); doc.setFont('helvetica','normal');
      // Header
      ['Período','Média','Turma','Δ','Posição'].forEach((h,i) => {
        doc.setFont('helvetica','bold');
        doc.text(h, M + [0,25,52,75,95][i], ay);
      });
      ay += 5;
      doc.setLineWidth(0.3); doc.setDrawColor(200,200,200);
      doc.line(M, ay, W-M, ay); ay += 4;
      data.statsPerPeriod.forEach(s => {
        if (s.studentMean === null) return;
        const rank = data.rankingHistory.find(r=>r.period===s.period);
        doc.setFont('helvetica','normal');
        doc.text(`${s.period}º`, M, ay);
        doc.text(s.studentMean.toFixed(2), M+25, ay);
        doc.text(s.cohortMean.toFixed(2), M+52, ay);
        const d = s.studentMean - s.cohortMean;
        doc.setTextColor(d>=0?22:220, d>=0?163:38, d>=0?74:38);
        doc.text(fmtDiff(d), M+75, ay);
        doc.setTextColor(15,23,42);
        doc.text(`${rank?.rank??'—'}º`, M+95, ay);
        ay += 7;
        if (ay > 270) { doc.addPage(); ay = 20; }
      });
    }

    // Nova página — prontuário de disciplinas
    doc.addPage();
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(15,23,42);
    doc.text('Prontuário de Disciplinas', M, 20);
    doc.setFontSize(8); doc.setFont('helvetica','normal');
    let dy = 30;
    ['Disciplina','Período','Área','Nota','Turma','Δ'].forEach((h,i)=>{
      doc.setFont('helvetica','bold');
      doc.text(h, M+[0,80,95,125,140,155][i], dy);
    });
    dy+=4; doc.line(M, dy, W-M, dy); dy+=4;
    data.disciplines.sort((a,b)=>a.period-b.period).forEach(d=>{
      doc.setFont('helvetica','normal');
      doc.text(d.name.length>30?d.name.slice(0,28)+'…':d.name, M, dy);
      doc.text(`${d.period}º`, M+80, dy);
      doc.text(d.category.slice(0,10), M+95, dy);
      const noteColor = d.userGrade>=8?[22,163,74]:d.userGrade>=6?[15,23,42]:[220,38,38];
      doc.setTextColor(...noteColor);
      doc.text(fmtGrade(d.userGrade), M+125, dy);
      doc.setTextColor(15,23,42);
      doc.text(fmtGrade(d.cohortMean), M+140, dy);
      const dc = d.diff>=0?[22,163,74]:[220,38,38];
      doc.setTextColor(...dc);
      doc.text(fmtDiff(d.diff), M+155, dy);
      doc.setTextColor(15,23,42);
      dy+=6;
      if(dy>280){doc.addPage();dy=20;}
    });

    doc.save(`meddash_${user['Matrícula']}_${new Date().toISOString().slice(0,10)}.pdf`);
  } catch(e) {
    console.error('Erro ao gerar PDF:', e);
    alert('Erro ao gerar PDF. Verifique o console para detalhes.');
  } finally {
    if (btn) { btn.textContent = 'Exportar PDF'; btn.disabled = false; }
  }
}
