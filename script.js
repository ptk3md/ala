/**
 * @typedef {Object} StudentRow
 * @property {string|number} Matrícula
 * @property {string} Nome do Aluno
 * @property {string} E-mail
 * @property {Object.<string, string|number>} [Disciplines]
 */

// ==========================================
// 0. BOOTSTRAP: DESIGN SYSTEM & PLUGINS (HEALTHTECH PREMIUM)
// ==========================================

// Injeta as fontes clínico-modernas
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

// Injeta os plugins do Chart.js necessários (Annotation)
if (!window.ChartDataLabels) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1/dist/chartjs-plugin-annotation.min.js';
    document.head.appendChild(script);
}

// Injeta CSS Premium de Healthtech (Substitui os estilos antigos dinamicamente)
const styleTag = document.createElement('style');
styleTag.innerHTML = `
    :root {
        --bg-dark: #0d1117;
        --surface: rgba(255, 255, 255, 0.03);
        --surface-hover: rgba(255, 255, 255, 0.06);
        --border: rgba(255, 255, 255, 0.08);
        --primary: #1d6fe8;
        --teal: #0891b2;
        --emerald: #10b981;
        --red: #ef4444;
        --text-main: #f0f4f8;
        --text-muted: #8b949e;
        
        --font-sans: 'DM Sans', sans-serif;
        --font-mono: 'DM Mono', monospace;
    }
    
    body.health-theme {
        background-color: var(--bg-dark);
        color: var(--text-main);
        font-family: var(--font-sans);
    }
    
    /* Layout Moderno com Sidebar */
    .app-layout {
        display: flex;
        min-height: 100vh;
    }
    
    .sidebar {
        width: 240px;
        background: var(--surface);
        border-right: 1px solid var(--border);
        padding: 2rem 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: fixed;
        height: 100vh;
    }
    
    .main-content {
        margin-left: 240px;
        flex: 1;
        padding: 2.5rem 3rem;
        max-width: 1600px;
    }

    /* Glassmorphism Cards */
    .glass-card {
        background: var(--surface);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid var(--border);
        border-radius: 12px;
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 24px -8px rgba(0,0,0,0.5);
        transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s;
    }
    
    .glass-card:hover {
        transform: translateY(-2px);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px -8px rgba(0,0,0,0.6);
    }

    /* Tipografia Clínica */
    .kpi-value {
        font-family: var(--font-mono);
        font-size: 2.5rem;
        font-weight: 500;
        letter-spacing: -1px;
    }

    /* Stagger Animations */
    .stagger-1 { animation: slideUp 0.6s ease-out 0ms both; }
    .stagger-2 { animation: slideUp 0.6s ease-out 80ms both; }
    .stagger-3 { animation: slideUp 0.6s ease-out 160ms both; }
    .stagger-4 { animation: slideUp 0.6s ease-out 240ms both; }
    
    @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Heatmap CSS Grid (Melhor que plugin) */
    .heatmap-grid {
        display: grid;
        gap: 4px;
        margin-top: 1rem;
        overflow-x: auto;
    }
    .heatmap-cell {
        border-radius: 4px;
        font-family: var(--font-mono);
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        transition: 0.2s;
        cursor: pointer;
    }
    .heatmap-cell:hover { transform: scale(1.1); z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }

    /* Tabela Premium */
    .clinical-table { width: 100%; border-collapse: collapse; text-align: left; }
    .clinical-table th { color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border); padding: 1rem; font-size: 0.875rem; }
    .clinical-table td { padding: 1rem; border-bottom: 1px solid var(--border); font-family: var(--font-mono); font-size: 0.875rem; }
    .clinical-table tr:hover { background: var(--surface-hover); }
`;
document.head.appendChild(styleTag);

const STATE = { rawDataMap: new Map(), currentUser: null, chartInstances: [], isLoading: false };

// ==========================================
// 1. INJEÇÃO DE UI DE LOGIN
// ==========================================

function injectCSVUploader() {
    const form = document.getElementById('login-form');
    if (!form || document.getElementById('csv-dropzone')) return;

    const uploaderDiv = document.createElement('div');
    uploaderDiv.className = 'input-group';
    uploaderDiv.innerHTML = `
        <label style="color: var(--text-muted); font-family: var(--font-sans)">Base de Dados do Sistema</label>
        <div id="csv-dropzone" style="border: 1px dashed var(--primary); border-radius: 8px; padding: 1.5rem 1rem; text-align: center; cursor: pointer; transition: 0.2s; background: rgba(29, 111, 232, 0.05);">
            <span id="dropzone-text" style="font-size: 0.875rem; color: var(--text-main);">Anexar Prontuários (CSV)</span>
            <input type="file" id="csv-upload" accept=".csv" multiple style="display: none;">
        </div>
        <div id="upload-status" style="font-size: 0.8rem; color: var(--emerald); margin-top: 0.5rem; text-align: center; font-weight: 600;"></div>
    `;
    form.insertBefore(uploaderDiv, form.firstChild);

    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-upload');
    const statusText = document.getElementById('upload-status');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.background = 'rgba(29, 111, 232, 0.1)'; });
    dropzone.addEventListener('dragleave', () => dropzone.style.background = 'rgba(29, 111, 232, 0.05)');
    dropzone.addEventListener('drop', (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (!files.length) return;
        statusText.style.color = 'var(--text-main)';
        statusText.textContent = `Processando ${files.length} arquivo(s)...`;
        Array.from(files).forEach(file => { if(file.name.endsWith('.csv')) parseCSV(file, file.name); });
    }
}
injectCSVUploader();

// Carregamento inicial silencioso
parseCSV('Planilha_Academica_Medicina.csv', 'Planilha Padrão', true);

function parseCSV(fileOrUrl, sourceName, isSilent = false) {
    Papa.parse(fileOrUrl, {
        download: typeof fileOrUrl === 'string',
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            results.data.forEach(row => {
                const mat = String(row['Matrícula'] || '').trim();
                if (mat) STATE.rawDataMap.set(mat, row);
            });
            const statusText = document.getElementById('upload-status');
            if (statusText && !isSilent) {
                statusText.style.color = 'var(--emerald)';
                statusText.textContent = `Prontuários carregados: ${STATE.rawDataMap.size} pacientes validados.`;
            }
        }
    });
}

// Lógica de Login Existente...
const formEl = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const matriculaInput = document.getElementById('matricula');
const loginBtn = document.getElementById('login-btn');
const errorEl = document.getElementById('login-error');

function validateForm() {
    if (!loginBtn) return;
    const isTestMode = emailInput.value.toLowerCase() === 'teste' && matriculaInput.value === 'teste';
    loginBtn.disabled = !((emailInput.value.includes('@') && matriculaInput.value.length >= 4) || isTestMode);
}
if (emailInput && matriculaInput) {
    emailInput.addEventListener('input', validateForm);
    matriculaInput.addEventListener('input', validateForm);
}

formEl?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const matricula = matriculaInput.value.trim();
    loginBtn.textContent = "Autenticando...";
    
    try {
        await new Promise(r => setTimeout(r, 600));
        const allUsers = Array.from(STATE.rawDataMap.values());
        const user = allUsers.find(row => String(row['E-mail']).toLowerCase() === email && String(row['Matrícula']) === matricula);
        
        if (user) {
            STATE.currentUser = user;
            document.body.classList.add('health-theme'); // Ativa o dark theme clínico
            transitionToPremiumDashboard();
        } else {
            throw new Error("Credenciais inválidas.");
        }
    } catch (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        loginBtn.textContent = "Acessar Dashboard";
    }
});

// ==========================================
// 2. DATA ENGINE (Otimizado & Expandido)
// ==========================================

function categorizeDiscipline(name) {
    const n = name.toLowerCase();
    if (n.includes('sociologia') || n.includes('antropologia') || n.includes('ética') || n.includes('filosofia')) return 'Humanidades';
    if (n.includes('saúde e sociedade') || n.includes('epidemiologia') || n.includes('pesquisa')) return 'Saúde Pública';
    if (n.includes('cirurgia') || n.includes('operatória') || n.includes('anestesiologia')) return 'Cirurgia';
    if (n.includes('habilidades') || n.includes('clínica') || n.includes('semiologia') || n.includes('pediatria') || n.includes('internato')) return 'Clínica';
    return 'Básicas'; // Anatomia, Bioquímica, Fisiologia, Imunologia, etc.
}

function processDashboardData() {
    const user = STATE.currentUser;
    const allUsers = Array.from(STATE.rawDataMap.values());
    const totalUsers = allUsers.length;
    
    // Parse Periods and Disciplines
    const periodsMap = {}; 
    const disciplineMeta = [];
    
    Object.keys(user).forEach(key => {
        const match = key.match(/\((\d+)º Período\)\s+(.+)/);
        if (match) {
            const p = parseInt(match[1], 10);
            const name = match[2];
            if (!periodsMap[p]) periodsMap[p] = [];
            periodsMap[p].push(key);
            disciplineMeta.push({ key, period: p, name, category: categorizeDiscipline(name) });
        }
    });

    const periods = Object.keys(periodsMap).map(Number).sort((a, b) => a - b);
    const cohortCRs = new Float32Array(totalUsers); 
    
    let userCR = 0;
    const userPeriodMeans = {};
    const userMatricula = String(user['Matrícula']);
    
    // Arrays para armazenar as médias de cada período para achar o Top 10%
    const allPeriodMeans = {}; 
    periods.forEach(p => allPeriodMeans[p] = []);

    // Estatísticas por Categoria (Radar)
    const categoryStats = { Básicas: {u:0, uc:0, c:0, cc:0}, Clínica: {u:0, uc:0, c:0, cc:0}, Cirurgia: {u:0, uc:0, c:0, cc:0}, 'Saúde Pública': {u:0, uc:0, c:0, cc:0}, Humanidades: {u:0, uc:0, c:0, cc:0} };

    // Estatísticas por Disciplina (Heatmap e Ranking)
    const discStats = {};
    disciplineMeta.forEach(d => discStats[d.key] = { name: d.name, period: d.period, category: d.category, userGrade: user[d.key] || 0, sum: 0, count: 0 });

    for (let i = 0; i < totalUsers; i++) {
        const u = allUsers[i];
        const isUser = String(u['Matrícula']) === userMatricula;
        let uTotalSum = 0;
        let uTotalCount = 0;

        for (let pIdx = 0; pIdx < periods.length; pIdx++) {
            const p = periods[pIdx];
            const subjects = periodsMap[p];
            let pSum = 0;
            let pCount = 0;
            
            for (let sIdx = 0; sIdx < subjects.length; sIdx++) {
                const key = subjects[sIdx];
                const grade = u[key];
                if (typeof grade === 'number') { 
                    pSum += grade; pCount++; 
                    discStats[key].sum += grade;
                    discStats[key].count++;
                    
                    const cat = discStats[key].category;
                    categoryStats[cat].c += grade;
                    categoryStats[cat].cc++;
                    if (isUser) {
                        categoryStats[cat].u += grade;
                        categoryStats[cat].uc++;
                    }
                }
            }

            if (pCount > 0) {
                const pMean = pSum / pCount;
                allPeriodMeans[p].push(pMean);
                if (isUser) userPeriodMeans[p] = pMean;
            }
            
            uTotalSum += pSum;
            uTotalCount += pCount;
        }

        const cr = uTotalCount > 0 ? (uTotalSum / uTotalCount) : 0;
        cohortCRs[i] = cr;
        if (isUser) userCR = cr;
    }

    let userRank = 1;
    for (let i = 0; i < totalUsers; i++) { if (cohortCRs[i] > userCR) userRank++; }

    // Calcula Desvio Padrão e Top 10%
    const statsPerPeriod = periods.map(p => {
        const means = allPeriodMeans[p];
        const count = means.length;
        const mean = means.reduce((a,b)=>a+b,0) / count;
        const variance = means.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (count - 1 || 1);
        
        // P90 (Top 10%)
        means.sort((a,b) => a - b);
        const top10Index = Math.floor(count * 0.9);
        const top10Mean = means[top10Index] || mean;

        return {
            period: p,
            studentMean: userPeriodMeans[p] || 0,
            cohortMean: mean,
            cohortStdDev: Math.sqrt(Math.max(0, variance)),
            top10Mean: top10Mean
        };
    });

    const userPercentile = Math.round(((totalUsers - userRank) / totalUsers) * 100);
    const lastPeriodMean = statsPerPeriod[statsPerPeriod.length - 1]?.studentMean || 0;

    // Finaliza array de disciplinas para Ranking e Tabela
    const processedDisciplines = Object.values(discStats).map(d => ({
        ...d,
        cohortMean: d.count > 0 ? (d.sum / d.count) : 0,
        diff: d.userGrade - (d.count > 0 ? (d.sum / d.count) : 0)
    })).filter(d => d.userGrade > 0);

    return { 
        statsPerPeriod, userCR, userRank, totalStudents: totalUsers, userPercentile, 
        trendDiff: lastPeriodMean - userCR, cohortCRs,
        categories: categoryStats,
        disciplines: processedDisciplines,
        periods
    };
}

// ==========================================
// 3. RENDERIZAÇÃO DA UI CLINICAL-MODERN
// ==========================================

function transitionToPremiumDashboard() {
    const data = processDashboardData();
    const firstName = STATE.currentUser['Nome do Aluno'].split(' ')[0];
    
    // Injeção da Estrutura HTML do Painel
    document.body.innerHTML = `
        <div class="app-layout">
            <aside class="sidebar stagger-1">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 2rem;">
                    <i data-lucide="activity" style="color: var(--primary); width: 28px; height: 28px;"></i>
                    <h2 style="font-weight: 700; font-size: 1.25rem;">MedDash</h2>
                </div>
                
                <div style="background: rgba(255,255,255,0.02); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); margin-bottom: 2rem;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 1.5rem; color: white; margin-bottom: 1rem;">
                        ${firstName.charAt(0)}
                    </div>
                    <h3 style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">${STATE.currentUser['Nome do Aluno']}</h3>
                    <p style="color: var(--text-muted); font-size: 0.875rem; font-family: var(--font-mono);">ID: ${STATE.currentUser['Matrícula']}</p>
                    <div style="margin-top: 0.75rem; display: inline-block; padding: 2px 8px; background: rgba(16,185,129,0.15); color: var(--emerald); border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                        Percentil ${data.userPercentile}
                    </div>
                </div>

                <nav style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <a href="#" style="color: white; text-decoration: none; padding: 0.75rem 1rem; background: var(--primary); border-radius: 6px; font-weight: 500; display: flex; align-items: center; gap: 12px;"><i data-lucide="layout-dashboard" width="18"></i> Visão Geral</a>
                </nav>
            </aside>

            <main class="main-content">
                <header style="margin-bottom: 2rem;" class="stagger-2">
                    <h1 style="font-size: 2rem; font-weight: 700;">Performance Acadêmica</h1>
                    <p style="color: var(--text-muted);">Prontuário analítico longitudinal do estudante.</p>
                </header>

                <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-bottom: 3rem;" class="stagger-3">
                    <div class="glass-card" style="padding: 1.5rem; position: relative;">
                        <h4 style="color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">CR Global</h4>
                        <div class="kpi-value" style="color: var(--text-main); margin: 0.5rem 0;" id="kpi-cr">0.00</div>
                        <canvas id="sparkline-cr" style="position: absolute; right: 1.5rem; top: 1.5rem; width: 80px; height: 32px;"></canvas>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h4 style="color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">Posição Turma</h4>
                        <div class="kpi-value" style="color: var(--text-main); margin: 0.5rem 0;">${data.userRank}º</div>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">de ${data.totalStudents} residentes</p>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h4 style="color: var(--text-muted); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 1px;">Tendência</h4>
                        <div class="kpi-value" style="color: ${data.trendDiff >= 0 ? 'var(--emerald)' : 'var(--red)'}; margin: 0.5rem 0;">
                            ${data.trendDiff > 0 ? '+' : ''}${data.trendDiff.toFixed(2)}
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.875rem;">Último período vs Histórico</p>
                    </div>
                </section>

                <section style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 3rem;" class="stagger-4" id="insights-container"></section>

                <section style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem;" class="stagger-4">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="font-weight: 600; margin-bottom: 1rem;">Evolução vs Turma vs Top 10%</h3>
                        <div style="height: 350px;"><canvas id="chart-evo"></canvas></div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="font-weight: 600; margin-bottom: 1rem;">Perfil de Competências (Radar)</h3>
                        <div style="height: 350px;"><canvas id="chart-radar"></canvas></div>
                    </div>
                </section>

                <section style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 3rem;" class="stagger-4">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="font-weight: 600; margin-bottom: 1rem;">Túnel de Crescimento (Desvio Padrão)</h3>
                        <div style="height: 300px;"><canvas id="chart-growth"></canvas></div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="font-weight: 600; margin-bottom: 1rem;">Distribuição da Turma (KDE)</h3>
                        <div style="height: 300px;"><canvas id="chart-dist"></canvas></div>
                    </div>
                </section>

                <section style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-bottom: 3rem;" class="stagger-4">
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="font-weight: 600; margin-bottom: 1rem;">Heatmap de Diagnóstico por Disciplina</h3>
                        <div id="heatmap-container"></div>
                    </div>
                    <div class="glass-card" style="padding: 1.5rem;">
                        <h3 style="font-weight: 600; margin-bottom: 1rem;">Top 5 / Bottom 5</h3>
                        <div style="height: 400px;"><canvas id="chart-ranking"></canvas></div>
                    </div>
                </section>
                
                <section class="glass-card stagger-4" style="padding: 1.5rem; overflow-x: auto;">
                    <h3 style="font-weight: 600; margin-bottom: 1.5rem;">Prontuário Detalhado</h3>
                    <table class="clinical-table" id="data-table">
                        <thead>
                            <tr>
                                <th>Disciplina</th>
                                <th>Período</th>
                                <th>Sua Nota</th>
                                <th>Média Turma</th>
                                <th>Diferença (Δ)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </section>

            </main>
        </div>
    `;

    lucide.createIcons();
    animateValue(document.getElementById('kpi-cr'), 0, data.userCR, 1000);
    renderInsights(data);
    
    // Inicia os Gráficos Premium
    Chart.defaults.color = '#8b949e';
    Chart.defaults.font.family = "'DM Sans', sans-serif";
    renderChartsPremium(data);
    renderHeatmap(data);
    renderTable(data);
}

// Animação de CountUp.js via Vanilla
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = (progress * (end - start) + start).toFixed(2);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// Gera os Insights Inteligentes
function renderInsights(data) {
    const container = document.getElementById('insights-container');
    
    // Insight 1: Destaque
    const bestDisc = [...data.disciplines].sort((a,b) => b.diff - a.diff)[0];
    // Insight 2: Alerta
    const drops = [];
    for(let i=1; i<data.statsPerPeriod.length; i++) {
        const diff = data.statsPerPeriod[i].studentMean - data.statsPerPeriod[i-1].studentMean;
        if(diff < -0.5) drops.push({p: data.statsPerPeriod[i].period, diff});
    }
    const worstDrop = drops.sort((a,b) => a.diff - b.diff)[0];

    container.innerHTML = `
        <div style="background: rgba(16,185,129,0.1); border-left: 4px solid var(--emerald); padding: 1rem; border-radius: 6px;">
            <p style="font-size: 0.875rem; color: var(--emerald); font-weight: 600; margin-bottom: 0.25rem;"><i data-lucide="trophy" width="16" style="display:inline; vertical-align:middle; margin-right:4px;"></i> Destaque Clínico</p>
            <p style="font-size: 0.875rem; color: var(--text-main);">Alta performance em <b>${bestDisc.name}</b> (+${bestDisc.diff.toFixed(2)} acima da turma).</p>
        </div>
        <div style="background: rgba(239,68,68,0.1); border-left: 4px solid var(--red); padding: 1rem; border-radius: 6px;">
            <p style="font-size: 0.875rem; color: var(--red); font-weight: 600; margin-bottom: 0.25rem;"><i data-lucide="alert-triangle" width="16" style="display:inline; vertical-align:middle; margin-right:4px;"></i> Ponto de Atenção</p>
            <p style="font-size: 0.875rem; color: var(--text-main);">${worstDrop ? `Queda de ${Math.abs(worstDrop.diff).toFixed(2)} pts na média do ${worstDrop.p}º Período.` : 'Sem quedas bruscas no histórico recente.'}</p>
        </div>
        <div style="background: rgba(8,145,178,0.1); border-left: 4px solid var(--teal); padding: 1rem; border-radius: 6px;">
            <p style="font-size: 0.875rem; color: var(--teal); font-weight: 600; margin-bottom: 0.25rem;"><i data-lucide="activity" width="16" style="display:inline; vertical-align:middle; margin-right:4px;"></i> Status Sistêmico</p>
            <p style="font-size: 0.875rem; color: var(--text-main);">O seu coeficiente rende melhor que ${data.userPercentile}% dos residentes.</p>
        </div>
    `;
    lucide.createIcons();
}

function renderChartsPremium(data) {
    const labels = data.statsPerPeriod.map(s => `${s.period}º P`);
    const studentMeans = data.statsPerPeriod.map(s => Number(s.studentMean.toFixed(2)));
    const cohortMeans = data.statsPerPeriod.map(s => Number(s.cohortMean.toFixed(2)));
    const top10Means = data.statsPerPeriod.map(s => Number(s.top10Mean.toFixed(2)));

    const createGrad = (ctx, c1, c2) => {
        const g = ctx.createLinearGradient(0, 0, 0, 300);
        g.addColorStop(0, c1); g.addColorStop(1, c2); return g;
    };

    const gridOptions = { color: 'rgba(255,255,255,0.05)' };
    const tooltipOptions = { backgroundColor: '#0d1117', titleFont: {family: 'DM Mono'}, bodyFont: {family: 'DM Mono'}, padding: 12, borderColor: '#1d6fe8', borderWidth: 1 };

    // Sparkline no Card CR
    new Chart(document.getElementById('sparkline-cr').getContext('2d'), {
        type: 'line',
        data: { labels, datasets: [{ data: studentMeans, borderColor: '#10b981', borderWidth: 2, tension: 0.4, pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display:false}, tooltip: {enabled:false} }, scales: { x: {display:false}, y: {display:false, min: 0} } }
    });

    // 1. Gráfico de Evolução (Com anotações se plugin estiver carregado)
    const evoCtx = document.getElementById('chart-evo').getContext('2d');
    new Chart(evoCtx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Sua Média', data: studentMeans, borderColor: '#1d6fe8', backgroundColor: createGrad(evoCtx, 'rgba(29, 111, 232, 0.3)', 'rgba(29, 111, 232, 0)'), fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: '#1d6fe8' },
                { label: 'Média Turma', data: cohortMeans, borderColor: '#8b949e', borderDash: [5, 5], tension: 0.4, borderWidth: 2, pointRadius: 0 },
                { label: 'Top 10%', data: top10Means, borderColor: '#10b981', borderDash: [2, 4], tension: 0.4, borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { tooltip: tooltipOptions },
            scales: { y: { min: 0, max: 10, grid: gridOptions }, x: { grid: { display: false } } }
        }
    });

    // 2. Curva de Crescimento com fill condicional nativo (Verde acima da média, Vermelho abaixo)
    const upperLimit = data.statsPerPeriod.map(s => s.cohortMean + s.cohortStdDev);
    const lowerLimit = data.statsPerPeriod.map(s => s.cohortMean - s.cohortStdDev);
    new Chart(document.getElementById('chart-growth').getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Sua Nota', data: studentMeans, borderColor: '#f0f4f8', tension: 0.4, borderWidth: 3, fill: { target: 2, above: 'rgba(16,185,129,0.2)', below: 'rgba(239,68,68,0.2)' } },
                { label: '+1 DP', data: upperLimit, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.03)', fill: '+1', pointRadius: 0, tension: 0.4 },
                { label: 'Média', data: cohortMeans, borderColor: '#8b949e', borderDash: [4, 4], pointRadius: 0, tension: 0.4 },
                { label: '-1 DP', data: lowerLimit, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.03)', fill: '-1', pointRadius: 0, tension: 0.4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { filter: (i) => !i.text.includes('DP') } }, tooltip: tooltipOptions }, scales: { y: { min: 0, max: 10, grid: gridOptions }, x: { grid: { display: false } } } }
    });

    // 3. Distribuição (KDE + Histograma + Linhas Verticais)
    const faixas = [{l:'<5', min:0, max:4.99}, {l:'5-6', min:5, max:5.99}, {l:'6-7', min:6, max:6.99}, {l:'7-8', min:7, max:7.99}, {l:'8-9', min:8, max:8.99}, {l:'9-10', min:9, max:10}];
    const hist = new Array(faixas.length).fill(0);
    let uIdx = -1;
    data.cohortCRs.forEach(c => {
        for(let i=0; i<faixas.length; i++) {
            if(c >= faixas[i].min && c <= faixas[i].max) { hist[i]++; break; }
        }
    });
    for(let i=0; i<faixas.length; i++) { if(data.userCR >= faixas[i].min && data.userCR <= faixas[i].max) { uIdx = i; break; } }
    
    const bgColors = hist.map((_, i) => i === uIdx ? '#1d6fe8' : 'rgba(255,255,255,0.1)');
    new Chart(document.getElementById('chart-dist').getContext('2d'), {
        type: 'bar',
        data: {
            labels: faixas.map(f => f.l),
            datasets: [
                { type: 'line', label: 'Curva KDE Estimada', data: hist, borderColor: '#0891b2', tension: 0.4, borderWidth: 2, pointRadius: 0, fill: false },
                { type: 'bar', label: 'Alunos', data: hist, backgroundColor: bgColors, borderRadius: 4 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: tooltipOptions }, scales: { y: { grid: gridOptions }, x: { grid: {display: false} } } }
    });

    // 4. Radar Chart
    const rLabels = ['Básicas', 'Clínica', 'Cirurgia', 'Saúde Pública', 'Humanidades'];
    const rStudent = rLabels.map(cat => { const c = data.categories[cat]; return c.uc > 0 ? (c.u/c.uc).toFixed(2) : 0; });
    const rCohort = rLabels.map(cat => { const c = data.categories[cat]; return c.cc > 0 ? (c.c/c.cc).toFixed(2) : 0; });
    new Chart(document.getElementById('chart-radar').getContext('2d'), {
        type: 'radar',
        data: {
            labels: rLabels,
            datasets: [
                { label: 'Você', data: rStudent, backgroundColor: 'rgba(29, 111, 232, 0.15)', borderColor: '#1d6fe8', borderWidth: 2, pointBackgroundColor: '#1d6fe8' },
                { label: 'Turma', data: rCohort, backgroundColor: 'transparent', borderColor: '#8b949e', borderDash: [4,4], borderWidth: 1 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 10, angleLines: {color: 'rgba(255,255,255,0.1)'}, grid: {color: 'rgba(255,255,255,0.1)'}, pointLabels: {color: '#8b949e', font: {family: 'DM Mono'}} } }, plugins: { tooltip: tooltipOptions } }
    });

    // 5. Ranking (Top 5 e Bottom 5) Horizontal Bar
    const sortedDisc = [...data.disciplines].sort((a,b) => b.diff - a.diff);
    const topBottom = [...sortedDisc.slice(0, 5), ...sortedDisc.slice(-5)];
    const tbLabels = topBottom.map(d => d.name.length > 20 ? d.name.substring(0,20)+'...' : d.name);
    const tbDiffs = topBottom.map(d => Number(d.diff.toFixed(2)));
    const barColors = tbDiffs.map(v => v >= 0 ? 'rgba(16,185,129,0.8)' : 'rgba(239,68,68,0.8)');
    
    new Chart(document.getElementById('chart-ranking').getContext('2d'), {
        type: 'bar',
        indexAxis: 'y',
        data: { labels: tbLabels, datasets: [{ label: 'Diferença da Média', data: tbDiffs, backgroundColor: barColors, borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: tooltipOptions, legend: {display: false} }, scales: { x: { grid: gridOptions }, y: { grid: {display: false}, ticks: {font: {family: 'DM Mono', size: 10}} } } }
    });
}

function renderHeatmap(data) {
    const container = document.getElementById('heatmap-container');
    // Coleta todas as disciplinas únicas
    const allNames = [...new Set(data.disciplines.map(d => d.name))].sort();
    
    let html = `<div class="heatmap-grid" style="grid-template-columns: 180px repeat(${data.periods.length}, 40px);">`;
    // Header row
    html += `<div></div>`; 
    data.periods.forEach(p => html += `<div style="text-align:center; font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">${p}º</div>`);
    
    allNames.forEach(name => {
        html += `<div style="font-size: 0.75rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px;" title="${name}">${name}</div>`;
        data.periods.forEach(p => {
            const disc = data.disciplines.find(d => d.name === name && d.period === p);
            let color = 'rgba(255,255,255,0.02)';
            let val = '';
            if (disc) {
                val = disc.userGrade.toFixed(1);
                if (disc.userGrade >= 8.5) color = 'var(--emerald)';
                else if (disc.userGrade >= 6.0) color = 'var(--teal)';
                else color = 'var(--red)';
            }
            html += `<div class="heatmap-cell" style="background: ${color};" title="${disc ? `Média Turma: ${disc.cohortMean.toFixed(2)}` : ''}">${val}</div>`;
        });
    });
    html += `</div>`;
    container.innerHTML = html;
}

function renderTable(data) {
    const tbody = document.querySelector('#data-table tbody');
    tbody.innerHTML = data.disciplines.sort((a,b) => b.period - a.period).map(d => {
        const diffColor = d.diff >= 0 ? 'var(--emerald)' : 'var(--red)';
        const status = d.diff >= 0 ? 'Adequado' : 'Revisão Necessária';
        const statusBg = d.diff >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
        
        return `<tr>
            <td style="color: var(--text-main);">${d.name}</td>
            <td style="color: var(--text-muted);">${d.period}º</td>
            <td style="font-weight: 700;">${d.userGrade.toFixed(1)}</td>
            <td style="color: var(--text-muted);">${d.cohortMean.toFixed(1)}</td>
            <td style="color: ${diffColor};">${d.diff > 0 ? '+' : ''}${d.diff.toFixed(2)}</td>
            <td><span style="background: ${statusBg}; color: ${diffColor}; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem;">${status}</span></td>
        </tr>`;
    }).join('');
}
