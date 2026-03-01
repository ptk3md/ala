/**
 * @typedef {Object} StudentRow
 * @property {string|number} Matrícula
 * @property {string} Nome do Aluno
 * @property {string} E-mail
 * @property {Object.<string, string|number>} [Disciplines]
 */

/**
 * @typedef {Object} PeriodStats
 * @property {number} period
 * @property {number} studentMean
 * @property {number} cohortMean
 * @property {number} cohortStdDev
 */

// ==========================================
// 0. ESTADO GLOBAL & UTILITÁRIOS
// ==========================================

const STATE = {
    rawData: [],
    currentUser: null,
    chartInstances: [],
    isLoading: false
};

// Utilitário para ler CSS Tokens (Permite que o Chart.js respeite o Light/Dark mode)
const getCSSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

// Inicializar ícones (caso use Lucide via CDN no HTML)
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// ==========================================
// 1. INICIALIZAÇÃO & AUTENTICAÇÃO (UI/UX Melhorada)
// ==========================================

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const matriculaInput = document.getElementById('matricula');
const loginBtn = document.getElementById('login-btn');
const errorEl = document.getElementById('login-error');

// Validação em tempo real
function validateForm() {
    if (!loginBtn) return;
    const isValid = emailInput.value.includes('@') && matriculaInput.value.length >= 4;
    loginBtn.disabled = !isValid;
}

if (emailInput && matriculaInput) {
    emailInput.addEventListener('input', validateForm);
    matriculaInput.addEventListener('input', validateForm);
}

form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const matricula = matriculaInput.value.trim();
    
    setLoadingState(true);

    try {
        if (STATE.rawData.length === 0) {
            await loadCSVData();
        }
        
        // Simular delay de rede para UX (Micro-interação de Loading)
        await new Promise(r => setTimeout(r, 800));
        
        const user = STATE.rawData.find(row => 
            String(row['E-mail']).toLowerCase() === email && 
            String(row['Matrícula']) === matricula
        );
        
        if (user) {
            STATE.currentUser = user;
            errorEl.classList.add('hidden');
            // Acessibilidade: remove aviso de erro
            emailInput.removeAttribute('aria-invalid');
            transitionToDashboard();
        } else {
            showAuthError("Credenciais inválidas. Verifique seu e-mail e matrícula.");
        }
    } catch (error) {
        console.error("Erro no login:", error);
        showAuthError("Erro de conexão ao processar a base de dados.");
    } finally {
        setLoadingState(false);
    }
});

function setLoadingState(isLoading) {
    STATE.isLoading = isLoading;
    const btnText = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');
    
    if (isLoading) {
        loginBtn.disabled = true;
        if(btnText) btnText.textContent = "Autenticando...";
        if(spinner) spinner.classList.remove('hidden');
    } else {
        loginBtn.disabled = false;
        if(btnText) btnText.textContent = "Acessar Dashboard";
        if(spinner) spinner.classList.add('hidden');
    }
}

function showAuthError(message) {
    const errorText = document.getElementById('error-text');
    if (errorText) errorText.textContent = message;
    errorEl.classList.remove('hidden');
    
    // Animação de Shake e Acessibilidade
    form.classList.add('shake-animation');
    emailInput.setAttribute('aria-invalid', 'true');
    setTimeout(() => form.classList.remove('shake-animation'), 400);
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    STATE.currentUser = null;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    form.reset();
    validateForm();
    STATE.chartInstances.forEach(chart => chart.destroy());
    STATE.chartInstances = [];
});

/**
 * Faz o parse do CSV usando PapaParse em streaming via Promise
 */
async function loadCSVData() {
    return new Promise((resolve, reject) => {
        Papa.parse('Planilha_Academica_Medicina.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                STATE.rawData = results.data;
                resolve();
            },
            error: (err) => reject(err)
        });
    });
}

// ==========================================
// 2. PROCESSAMENTO DE DADOS E MATEMÁTICA
// ==========================================

function calculateStats(arr) {
    const validArr = arr.filter(n => typeof n === 'number' && !isNaN(n));
    if (validArr.length === 0) return { mean: 0, stdDev: 0 };
    
    const mean = validArr.reduce((a, b) => a + b, 0) / validArr.length;
    const variance = validArr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (validArr.length - 1 || 1);
    return { mean, stdDev: Math.sqrt(variance) };
}

function processDashboardData() {
    const user = STATE.currentUser;
    const allUsers = STATE.rawData;
    
    const keys = Object.keys(user);
    const periodRegex = /\((\d+)º Período\)/;
    const periodsMap = {}; 

    keys.forEach(key => {
        const match = key.match(periodRegex);
        if (match) {
            const periodNum = parseInt(match[1], 10);
            if (!periodsMap[periodNum]) periodsMap[periodNum] = [];
            periodsMap[periodNum].push(key);
        }
    });

    const periods = Object.keys(periodsMap).map(Number).sort((a, b) => a - b);
    const statsPerPeriod = [];
    
    let userTotalGrades = [];
    let cohortCRs = [];

    // Turma
    allUsers.forEach(u => {
        let uTotalGrades = [];
        periods.forEach(p => {
            periodsMap[p].forEach(subject => {
                if (typeof u[subject] === 'number') uTotalGrades.push(u[subject]);
            });
        });
        const uCR = uTotalGrades.length > 0 ? (uTotalGrades.reduce((a,b)=>a+b,0)/uTotalGrades.length) : 0;
        cohortCRs.push({ matricula: String(u['Matrícula']), cr: uCR });
    });

    // Evolução
    periods.forEach(p => {
        const subjects = periodsMap[p];
        const userGrades = subjects.map(sub => user[sub]).filter(g => typeof g === 'number');
        const userPeriodMean = userGrades.length ? userGrades.reduce((a,b)=>a+b,0)/userGrades.length : 0;
        userTotalGrades.push(...userGrades);

        const cohortPeriodGrades = [];
        allUsers.forEach(u => {
            const uGrades = subjects.map(sub => u[sub]).filter(g => typeof g === 'number');
            if (uGrades.length) cohortPeriodGrades.push(uGrades.reduce((a,b)=>a+b,0)/uGrades.length);
        });

        const cohortStats = calculateStats(cohortPeriodGrades);
        statsPerPeriod.push({
            period: p,
            studentMean: userPeriodMean,
            cohortMean: cohortStats.mean,
            cohortStdDev: cohortStats.stdDev
        });
    });

    const userCR = userTotalGrades.reduce((a,b)=>a+b,0) / userTotalGrades.length;
    
    cohortCRs.sort((a, b) => b.cr - a.cr);
    const userRank = cohortCRs.findIndex(c => c.matricula === String(user['Matrícula'])) + 1;
    const userPercentile = ((userRank / cohortCRs.length) * 100).toFixed(0);
    const lastPeriodMean = statsPerPeriod[statsPerPeriod.length - 1]?.studentMean || 0;

    return {
        statsPerPeriod, userCR, userRank, totalStudents: cohortCRs.length,
        userPercentile, trendDiff: lastPeriodMean - userCR, cohortCRs
    };
}

// ==========================================
// 3. ATUALIZAÇÃO DE UI E CHARTS PREMIUM
// ==========================================

function transitionToDashboard() {
    const loginView = document.getElementById('login-view');
    const dashView = document.getElementById('dashboard-view');
    
    // Fade-out transition
    loginView.style.opacity = '0';
    setTimeout(() => {
        loginView.classList.add('hidden');
        dashView.classList.remove('hidden');
        dashView.style.opacity = '0';
        
        requestAnimationFrame(() => {
            dashView.style.transition = 'opacity 0.4s ease-out';
            dashView.style.opacity = '1';
        });

        // Preencher Dados do Header
        const firstName = STATE.currentUser['Nome do Aluno'].split(' ')[0];
        document.getElementById('welcome-name').textContent = `Olá, ${firstName}`;
        document.getElementById('welcome-id').textContent = STATE.currentUser['Matrícula'];
        const avatar = document.getElementById('user-avatar');
        if(avatar) avatar.textContent = firstName.charAt(0).toUpperCase();

        const data = processDashboardData();
        renderKPIs(data);
        renderCharts(data);
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 200);
}

function renderKPIs(data) {
    // 1. CR Card
    const crValue = document.getElementById('val-cr');
    crValue.textContent = data.userCR.toFixed(2);
    // Aplicação semântica de cores
    crValue.className = `kpi-value font-bold text-4xl mt-2 mb-1 ${data.userCR >= 8.5 ? 'text-[color:var(--success)]' : data.userCR >= 6 ? 'text-[color:var(--primary)]' : 'text-[color:var(--danger)]'}`;

    // 2. Ranking e Percentil
    document.getElementById('val-rank').textContent = `${data.userRank}º`;
    document.getElementById('val-total-students').textContent = `de ${data.totalStudents} alunos`;
    document.getElementById('val-percentile').textContent = `${100 - data.userPercentile}%`;

    // 3. Tendência
    const trendText = document.getElementById('val-trend-text');
    const trendDiff = document.getElementById('val-trend-diff');
    const trendIcon = document.getElementById('trend-icon-container');

    if (data.trendDiff > 0.2) {
        trendText.textContent = "Melhorando";
        trendText.style.color = 'var(--success)';
        trendDiff.textContent = `+${data.trendDiff.toFixed(2)} vs Média Geral`;
        if(trendIcon) trendIcon.innerHTML = `<i data-lucide="arrow-up-right" color="var(--success)"></i>`;
    } else if (data.trendDiff < -0.2) {
        trendText.textContent = "Em Queda";
        trendText.style.color = 'var(--danger)';
        trendDiff.textContent = `${data.trendDiff.toFixed(2)} vs Média Geral`;
        if(trendIcon) trendIcon.innerHTML = `<i data-lucide="arrow-down-right" color="var(--danger)"></i>`;
    } else {
        trendText.textContent = "Estável";
        trendText.style.color = 'var(--text-main)';
        trendDiff.textContent = "Consistente com Histórico";
        if(trendIcon) trendIcon.innerHTML = `<i data-lucide="minus" color="var(--text-muted)"></i>`;
    }
}

function renderCharts(data) {
    const labels = data.statsPerPeriod.map(s => `${s.period}º`);
    const studentMeans = data.statsPerPeriod.map(s => Number(s.studentMean.toFixed(2)));
    const cohortMeans = data.statsPerPeriod.map(s => Number(s.cohortMean.toFixed(2)));

    // Tokens CSS carregados dinamicamente
    const colorStudent = getCSSVar('--chart-student') || '#2563eb';
    const colorCohort = getCSSVar('--chart-cohort') || '#94a3b8';
    const colorDeviation = getCSSVar('--chart-deviation') || 'rgba(241, 245, 249, 0.8)';
    const colorGrid = getCSSVar('--border') || '#e2e8f0';

    // Global Chart Settings para visual SaaS Premium
    Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    Chart.defaults.color = getCSSVar('--text-muted') || '#64748b';
    
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1',
                padding: 12, cornerRadius: 8, displayColors: true
            }
        },
        scales: {
            x: { grid: { display: false } },
            y: { min: 0, max: 10, grid: { color: colorGrid, drawBorder: false } }
        }
    };

    // 1. Gráfico de Evolução (Linha Simples)
    const ctxEvo = document.getElementById('evolutionChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxEvo, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Sua Média', data: studentMeans, borderColor: colorStudent, backgroundColor: colorStudent, tension: 0.4, borderWidth: 3, pointRadius: 4, pointHoverRadius: 6 },
                { label: 'Média da Turma', data: cohortMeans, borderColor: colorCohort, borderDash: [5, 5], tension: 0.4, borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: commonOptions
    }));

    // 2. Gráfico Curva de Crescimento (Desvio Padrão - Área preenchida via Chart.js plugin-free approach)
    const upperLimit = data.statsPerPeriod.map(s => s.cohortMean + s.cohortStdDev);
    const lowerLimit = data.statsPerPeriod.map(s => s.cohortMean - s.cohortStdDev);

    const ctxGrowth = document.getElementById('growthChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxGrowth, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Sua Nota', data: studentMeans, borderColor: colorStudent, tension: 0.4, borderWidth: 3, zIndex: 10, pointBackgroundColor: colorStudent, pointRadius: 4 },
                { label: '+1 Desvio Padrão', data: upperLimit, borderColor: 'transparent', backgroundColor: colorDeviation, fill: '+1', pointRadius: 0, tension: 0.4, order: 2 },
                { label: 'Média da Turma', data: cohortMeans, borderColor: colorCohort, borderDash: [5, 5], pointRadius: 0, tension: 0.4, order: 1 },
                { label: '-1 Desvio Padrão', data: lowerLimit, borderColor: 'transparent', backgroundColor: colorDeviation, fill: '-1', pointRadius: 0, tension: 0.4, order: 3 }
            ]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                legend: { labels: { filter: (item) => !item.text.includes('Desvio Padrão') } }
            }
        }
    }));

    // 3. Gráfico de Distribuição da Turma (Scatter Anonimizado)
    const scatterData = data.cohortCRs.map((c, index) => ({
        x: index + 1, y: c.cr, isUser: c.matricula === String(STATE.currentUser['Matrícula'])
    }));

    const ctxDist = document.getElementById('distributionChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxDist, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Alunos',
                data: scatterData,
                backgroundColor: scatterData.map(d => d.isUser ? colorStudent : getCSSVar('--surface-subtle') || '#f1f5f9'),
                pointRadius: scatterData.map(d => d.isUser ? 8 : 4),
                pointHoverRadius: scatterData.map(d => d.isUser ? 10 : 6),
                borderColor: scatterData.map(d => d.isUser ? getCSSVar('--primary-hover') || '#1d4ed8' : colorGrid),
                borderWidth: 1
            }]
        },
        options: {
            ...commonOptions,
            plugins: {
                ...commonOptions.plugins,
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const pt = ctx.raw;
                            return pt.isUser ? ` VOCÊ (CR: ${pt.y.toFixed(2)})` : ` Aluno Anônimo (CR: ${pt.y.toFixed(2)})`;
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Posição no Ranking Geral' }, grid: { display: false } },
                y: { title: { display: true, text: 'CR Global' }, min: 0, max: 10, grid: { color: colorGrid } }
            }
        }
    }));
}
