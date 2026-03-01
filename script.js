/**
 * @typedef {Object} StudentRow
 * @property {string} Matrícula
 * @property {string} Nome do Aluno
 * @property {string} E-mail
 * @property {Object.<string, string>} [Disciplines] - Dynamic keys for grades
 */

/**
 * @typedef {Object} PeriodStats
 * @property {number} period
 * @property {number} studentMean
 * @property {number} cohortMean
 * @property {number} cohortStdDev
 */

// Estado Global (Architectural Debt: Em produção, o estado reside no Redux/Context e vem sanitizado do backend)
const STATE = {
    rawData: [],
    currentUser: null,
    cohortStats: null,
    chartInstances: []
};

// ==========================================
// 1. INICIALIZAÇÃO & AUTENTICAÇÃO
// ==========================================

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const matricula = document.getElementById('matricula').value.trim();
    const errorEl = document.getElementById('login-error');

    try {
        if (STATE.rawData.length === 0) {
            await loadCSVData();
        }
        
        // CORREÇÃO: Conversão rigorosa de tipos para evitar Type Mismatch e normalização do e-mail
        const user = STATE.rawData.find(row => 
            String(row['E-mail']).toLowerCase() === email.toLowerCase() && 
            String(row['Matrícula']) === matricula
        );
        
        if (user) {
            STATE.currentUser = user;
            errorEl.classList.add('hidden');
            transitionToDashboard();
        } else {
            errorEl.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Erro no login:", error);
        errorEl.textContent = "Erro ao processar a base de dados.";
        errorEl.classList.remove('hidden');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    STATE.currentUser = null;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    document.getElementById('login-form').reset();
    STATE.chartInstances.forEach(chart => chart.destroy());
    STATE.chartInstances = [];
});

/**
 * Carrega e faz o parse do arquivo CSV.
 * @returns {Promise<void>}
 */
async function loadCSVData() {
    return new Promise((resolve, reject) => {
        // Assume que o arquivo CSV está na mesma pasta e servido localmente
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

/**
 * Calcula Média e Desvio Padrão de um array de números.
 * @param {number[]} arr 
 * @returns {{mean: number, stdDev: number}}
 */
function calculateStats(arr) {
    const validArr = arr.filter(n => typeof n === 'number' && !isNaN(n));
    if (validArr.length === 0) return { mean: 0, stdDev: 0 };
    
    const mean = validArr.reduce((a, b) => a + b, 0) / validArr.length;
    const variance = validArr.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / (validArr.length - 1 || 1);
    return { mean, stdDev: Math.sqrt(variance) };
}

/**
 * Agrupa disciplinas por período e extrai métricas do aluno atual vs turma.
 */
function processDashboardData() {
    const user = STATE.currentUser;
    const allUsers = STATE.rawData;
    
    // Identificar períodos (ex: "(1º Período)")
    const keys = Object.keys(user);
    const periodRegex = /\((\d+)º Período\)/;
    const periodsMap = {}; // { 1: ['disciplina1', 'disciplina2'], 2: [...] }

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
    
    // CR Global calculation arrays
    let userTotalGrades = [];
    let cohortCRs = [];

    // Processar Turma Total (Para o gráfico de distribuição)
    allUsers.forEach(u => {
        let uTotalGrades = [];
        periods.forEach(p => {
            periodsMap[p].forEach(subject => {
                if (typeof u[subject] === 'number') uTotalGrades.push(u[subject]);
            });
        });
        const uCR = uTotalGrades.length > 0 ? (uTotalGrades.reduce((a,b)=>a+b,0)/uTotalGrades.length) : 0;
        cohortCRs.push({ matricula: u['Matrícula'], cr: uCR });
    });

    // Processar Evolução por Período
    periods.forEach(p => {
        const subjects = periodsMap[p];
        
        // Aluno Atual
        const userGrades = subjects.map(sub => user[sub]).filter(g => typeof g === 'number');
        const userPeriodMean = userGrades.length ? userGrades.reduce((a,b)=>a+b,0)/userGrades.length : 0;
        userTotalGrades.push(...userGrades);

        // Turma (Cohort)
        const cohortPeriodGrades = [];
        allUsers.forEach(u => {
            const uGrades = subjects.map(sub => u[sub]).filter(g => typeof g === 'number');
            if (uGrades.length) {
                cohortPeriodGrades.push(uGrades.reduce((a,b)=>a+b,0)/uGrades.length);
            }
        });

        const cohortStats = calculateStats(cohortPeriodGrades);
        
        statsPerPeriod.push({
            period: p,
            studentMean: userPeriodMean,
            cohortMean: cohortStats.mean,
            cohortStdDev: cohortStats.stdDev
        });
    });

    // Métricas Finais do Aluno
    const userCR = userTotalGrades.reduce((a,b)=>a+b,0) / userTotalGrades.length;
    
    // Rank
    cohortCRs.sort((a, b) => b.cr - a.cr); // Decrescente
    const userRank = cohortCRs.findIndex(c => c.matricula === user['Matrícula']) + 1;
    const userPercentile = ((userRank / cohortCRs.length) * 100).toFixed(0);

    // Tendência (Último período vs CR Geral)
    const lastPeriodMean = statsPerPeriod[statsPerPeriod.length - 1]?.studentMean || 0;
    const trendDiff = lastPeriodMean - userCR;

    return {
        statsPerPeriod,
        userCR,
        userRank,
        totalStudents: cohortCRs.length,
        userPercentile,
        trendDiff,
        cohortCRs // array ordenado para o scatter plot
    };
}

// ==========================================
// 3. ATUALIZAÇÃO DE UI E CHARTS (Chart.js)
// ==========================================

function transitionToDashboard() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('dashboard-view').classList.remove('hidden');
    
    document.getElementById('student-name').textContent = STATE.currentUser['Nome do Aluno'];
    document.getElementById('student-id').textContent = STATE.currentUser['Matrícula'];

    const data = processDashboardData();
    renderKPIs(data);
    renderCharts(data);
}

function renderKPIs(data) {
    document.getElementById('kpi-cr').textContent = data.userCR.toFixed(2);
    document.getElementById('kpi-rank').textContent = `${data.userRank}º / ${data.totalStudents}`;
    document.getElementById('kpi-percentile').textContent = `Entre os Top ${data.userPercentile}% da turma`;
    
    const trendEl = document.getElementById('kpi-trend');
    if (data.trendDiff > 0.2) {
        trendEl.textContent = "Melhorando (↑)";
        trendEl.className = "kpi-value trend-up";
    } else if (data.trendDiff < -0.2) {
        trendEl.textContent = "Atenção (↓)";
        trendEl.className = "kpi-value trend-down";
    } else {
        trendEl.textContent = "Estável (-)";
        trendEl.className = "kpi-value";
    }
}

function renderCharts(data) {
    const labels = data.statsPerPeriod.map(s => `${s.period}º Período`);
    const studentMeans = data.statsPerPeriod.map(s => s.studentMean);
    const cohortMeans = data.statsPerPeriod.map(s => s.cohortMean);
    
    // 1. Gráfico de Evolução (Linha Simples)
    const ctxEvo = document.getElementById('evolutionChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxEvo, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Sua Média', data: studentMeans, borderColor: '#2563eb', backgroundColor: '#2563eb', tension: 0.3, borderWidth: 3 },
                { label: 'Média da Turma', data: cohortMeans, borderColor: '#94a3b8', borderDash: [5, 5], tension: 0.3 }
            ]
        },
        options: { responsive: true, scales: { y: { min: 0, max: 10 } } }
    }));

    // 2. Gráfico Curva de Crescimento (Desvio Padrão) [Semelhante à pediatria]
    const upperStdDev = data.statsPerPeriod.map(s => s.cohortMean + s.cohortStdDev);
    const lowerStdDev = data.statsPerPeriod.map(s => s.cohortMean - s.cohortStdDev);

    const ctxGrowth = document.getElementById('growthChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxGrowth, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Sua Nota', data: studentMeans, borderColor: '#16a34a', backgroundColor: '#16a34a', tension: 0.4, borderWidth: 3, zIndex: 10 },
                { label: '+1 Desvio Padrão', data: upperStdDev, borderColor: 'rgba(203, 213, 225, 0.8)', backgroundColor: 'rgba(241, 245, 249, 0.4)', fill: '+1', pointRadius: 0, tension: 0.4 },
                { label: 'Média da Turma', data: cohortMeans, borderColor: '#64748b', borderDash: [5, 5], pointRadius: 0, tension: 0.4 },
                { label: '-1 Desvio Padrão', data: lowerStdDev, borderColor: 'rgba(203, 213, 225, 0.8)', backgroundColor: 'rgba(241, 245, 249, 0.4)', fill: '-1', pointRadius: 0, tension: 0.4 }
            ]
        },
        options: { 
            responsive: true, 
            plugins: { tooltip: { mode: 'index', intersect: false } },
            scales: { y: { min: 0, max: 10 } } 
        }
    }));

    // 3. Gráfico de Distribuição da Turma (Histograma/Scatter aproximado)
    // Mostra o CR de todos os alunos de forma anônima, destacando o aluno logado.
    const scatterData = data.cohortCRs.map((c, index) => ({
        x: index + 1, // Posição (Rank)
        y: c.cr,      // CR
        isUser: c.matricula === STATE.currentUser['Matrícula']
    }));

    const ctxDist = document.getElementById('distributionChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxDist, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Alunos da Turma',
                data: scatterData,
                backgroundColor: scatterData.map(d => d.isUser ? '#ef4444' : '#cbd5e1'),
                pointRadius: scatterData.map(d => d.isUser ? 8 : 4),
                pointHoverRadius: scatterData.map(d => d.isUser ? 10 : 5),
                borderColor: scatterData.map(d => d.isUser ? '#991b1b' : 'transparent'),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const pt = ctx.raw;
                            return pt.isUser ? `VOCÊ (CR: ${pt.y.toFixed(2)})` : `Aluno Anônimo (CR: ${pt.y.toFixed(2)})`;
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: 'Posição no Ranking Geral' }, reverse: false },
                y: { title: { display: true, text: 'CR Global' }, min: 0, max: 10 }
            }
        }
    }));
}
