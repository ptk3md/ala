/**
 * @typedef {Object} StudentRow
 * @property {string|number} Matrícula
 * @property {string} Nome do Aluno
 * @property {string} E-mail
 * @property {Object.<string, string|number>} [Disciplines]
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

const getCSSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// ==========================================
// 1. INICIALIZAÇÃO & AUTENTICAÇÃO
// ==========================================

const form = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const matriculaInput = document.getElementById('matricula');
const loginBtn = document.getElementById('login-btn');
const errorEl = document.getElementById('login-error');

function validateForm() {
    if (!loginBtn) return;
    const isTestMode = emailInput.value.toLowerCase() === 'teste' && matriculaInput.value === 'teste';
    const isValid = (emailInput.value.includes('@') && matriculaInput.value.length >= 4) || isTestMode;
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
        
        await new Promise(r => setTimeout(r, 600)); // UX delay
        
        const user = STATE.rawData.find(row => 
            String(row['E-mail']).toLowerCase() === email && 
            String(row['Matrícula']) === matricula
        );
        
        if (user) {
            STATE.currentUser = user;
            errorEl.classList.add('hidden');
            emailInput.removeAttribute('aria-invalid');
            transitionToDashboard();
        } else {
            showAuthError("Credenciais inválidas. Verifique seu e-mail e matrícula.");
        }
    } catch (error) {
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

async function loadCSVData() {
    return new Promise((resolve, reject) => {
        // OTIMIZAÇÃO: worker: true faz o processamento em background (não congela a UI para milhões de linhas)
        Papa.parse('Planilha_Academica_Medicina.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            worker: true, 
            complete: (results) => {
                STATE.rawData = results.data;
                resolve();
            },
            error: (err) => reject(err)
        });
    });
}

// ==========================================
// 2. PROCESSAMENTO ALTA PERFORMANCE O(N)
// ==========================================

function processDashboardData() {
    const user = STATE.currentUser;
    const allUsers = STATE.rawData;
    const totalUsers = allUsers.length;
    
    const periodsMap = {}; 
    Object.keys(user).forEach(key => {
        const match = key.match(/\((\d+)º Período\)/);
        if (match) {
            const p = parseInt(match[1], 10);
            if (!periodsMap[p]) periodsMap[p] = [];
            periodsMap[p].push(key);
        }
    });

    const periods = Object.keys(periodsMap).map(Number).sort((a, b) => a - b);
    
    // OTIMIZAÇÃO DE MEMÓRIA: Usando TypedArray ao invés de Objetos
    const cohortCRs = new Float32Array(totalUsers); 
    
    const periodAcc = {};
    periods.forEach(p => periodAcc[p] = { sum: 0, sumSq: 0, count: 0 });

    let userCR = 0;
    const userPeriodMeans = {};
    const userMatricula = String(user['Matrícula']);

    // OTIMIZAÇÃO DE TEMPO: Loop de Passagem Única O(N) para Extrair TUDO (Média, Variância e Notas)
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
                const grade = u[subjects[sIdx]];
                if (typeof grade === 'number') {
                    pSum += grade;
                    pCount++;
                }
            }

            if (pCount > 0) {
                const pMean = pSum / pCount;
                periodAcc[p].sum += pMean;
                periodAcc[p].sumSq += (pMean * pMean);
                periodAcc[p].count++;
                
                if (isUser) userPeriodMeans[p] = pMean;
            }
            
            uTotalSum += pSum;
            uTotalCount += pCount;
        }

        const cr = uTotalCount > 0 ? (uTotalSum / uTotalCount) : 0;
        cohortCRs[i] = cr;
        
        if (isUser) userCR = cr;
    }

    // OTIMIZAÇÃO DE SORTING: Rank O(N) (Não usamos mais o .sort() que custa O(N log N))
    let userRank = 1;
    for (let i = 0; i < totalUsers; i++) {
        if (cohortCRs[i] > userCR) userRank++;
    }

    // Calcula Desvio Padrão final baseado nos acumuladores
    const statsPerPeriod = periods.map(p => {
        const acc = periodAcc[p];
        const cohortMean = acc.count > 0 ? (acc.sum / acc.count) : 0;
        let variance = 0;
        if (acc.count > 1) {
            variance = (acc.sumSq - ((acc.sum * acc.sum) / acc.count)) / (acc.count - 1);
        }
        return {
            period: p,
            studentMean: userPeriodMeans[p] || 0,
            cohortMean: cohortMean,
            cohortStdDev: Math.sqrt(Math.max(0, variance))
        };
    });

    const userPercentile = Math.round(((totalUsers - userRank) / totalUsers) * 100);
    const lastPeriodMean = statsPerPeriod[statsPerPeriod.length - 1]?.studentMean || 0;

    return {
        statsPerPeriod, userCR, userRank, totalStudents: totalUsers,
        userPercentile, trendDiff: lastPeriodMean - userCR, cohortCRs
    };
}

// ==========================================
// 3. RENDERIZAÇÃO E UX DOS GRÁFICOS
// ==========================================

function transitionToDashboard() {
    const loginView = document.getElementById('login-view');
    const dashView = document.getElementById('dashboard-view');
    
    loginView.style.opacity = '0';
    setTimeout(() => {
        loginView.classList.add('hidden');
        dashView.classList.remove('hidden');
        dashView.style.opacity = '0';
        
        requestAnimationFrame(() => {
            dashView.style.transition = 'opacity 0.4s ease-out';
            dashView.style.opacity = '1';
        });

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
    const crValue = document.getElementById('val-cr');
    crValue.textContent = data.userCR.toFixed(2);
    crValue.className = `kpi-value font-bold text-4xl mt-2 mb-1 ${data.userCR >= 8.5 ? 'text-[color:var(--success)]' : data.userCR >= 6 ? 'text-[color:var(--primary)]' : 'text-[color:var(--danger)]'}`;

    document.getElementById('val-rank').textContent = `${data.userRank}º`;
    document.getElementById('val-total-students').textContent = `de ${data.totalStudents} alunos`;
    
    const percentilEl = document.getElementById('val-percentile');
    percentilEl.textContent = `P${data.userPercentile}`;
    percentilEl.nextElementSibling.textContent = `Acima de ${data.userPercentile}% da turma`;

    const trendText = document.getElementById('val-trend-text');
    const trendDiff = document.getElementById('val-trend-diff');
    const trendIcon = document.getElementById('trend-icon-container');

    if (data.trendDiff > 0.2) {
        trendText.textContent = "Melhorando"; trendText.style.color = 'var(--success)';
        trendDiff.textContent = `+${data.trendDiff.toFixed(2)} vs Média Geral`;
        if(trendIcon) trendIcon.innerHTML = `<i data-lucide="arrow-up-right" color="var(--success)"></i>`;
    } else if (data.trendDiff < -0.2) {
        trendText.textContent = "Em Queda"; trendText.style.color = 'var(--danger)';
        trendDiff.textContent = `${data.trendDiff.toFixed(2)} vs Média Geral`;
        if(trendIcon) trendIcon.innerHTML = `<i data-lucide="arrow-down-right" color="var(--danger)"></i>`;
    } else {
        trendText.textContent = "Estável"; trendText.style.color = 'var(--text-main)';
        trendDiff.textContent = "Consistente com Histórico";
        if(trendIcon) trendIcon.innerHTML = `<i data-lucide="minus" color="var(--text-muted)"></i>`;
    }
}

function renderCharts(data) {
    const labels = data.statsPerPeriod.map(s => `${s.period}º`);
    const studentMeans = data.statsPerPeriod.map(s => Number(s.studentMean.toFixed(2)));
    const cohortMeans = data.statsPerPeriod.map(s => Number(s.cohortMean.toFixed(2)));

    const colorStudent = getCSSVar('--chart-student') || '#2563eb';
    const colorCohort = getCSSVar('--chart-cohort') || '#94a3b8';
    const colorDeviation = getCSSVar('--chart-deviation') || 'rgba(241, 245, 249, 0.8)';
    const colorGrid = getCSSVar('--border') || '#e2e8f0';

    Chart.defaults.font.family = 'Inter, -apple-system, sans-serif';
    Chart.defaults.color = getCSSVar('--text-muted') || '#64748b';
    
    const commonOptions = {
        responsive: true, maintainAspectRatio: false,
        animation: { duration: 800, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1', padding: 12, cornerRadius: 8 }
        },
        scales: { x: { grid: { display: false } }, y: { min: 0, max: 10, grid: { color: colorGrid, drawBorder: false } } }
    };

    // 1. Evolução
    const ctxEvo = document.getElementById('evolutionChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxEvo, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Sua Média', data: studentMeans, borderColor: colorStudent, backgroundColor: colorStudent, tension: 0.4, borderWidth: 3, pointRadius: 4 },
                { label: 'Média da Turma', data: cohortMeans, borderColor: colorCohort, borderDash: [5, 5], tension: 0.4, borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: commonOptions
    }));

    // 2. Curva de Crescimento (Desvio Padrão)
    const upperLimit = data.statsPerPeriod.map(s => s.cohortMean + s.cohortStdDev);
    const lowerLimit = data.statsPerPeriod.map(s => s.cohortMean - s.cohortStdDev);
    const ctxGrowth = document.getElementById('growthChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxGrowth, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { label: 'Sua Nota', data: studentMeans, borderColor: colorStudent, tension: 0.4, borderWidth: 3, pointBackgroundColor: colorStudent, pointRadius: 4, zIndex: 10 },
                { label: '+1 Desvio Padrão', data: upperLimit, borderColor: 'transparent', backgroundColor: colorDeviation, fill: '+1', pointRadius: 0, tension: 0.4 },
                { label: 'Média da Turma', data: cohortMeans, borderColor: colorCohort, borderDash: [5, 5], pointRadius: 0, tension: 0.4 },
                { label: '-1 Desvio Padrão', data: lowerLimit, borderColor: 'transparent', backgroundColor: colorDeviation, fill: '-1', pointRadius: 0, tension: 0.4 }
            ]
        },
        options: { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { labels: { filter: (item) => !item.text.includes('Desvio Padrão') } } } }
    }));

    // 3. Distribuição (Histograma O(N) Tracking)
    const faixas = [
        { label: '< 5.0', min: 0, max: 4.99 },
        { label: '5.0 - 5.4', min: 5.0, max: 5.49 },
        { label: '5.5 - 5.9', min: 5.5, max: 5.99 },
        { label: '6.0 - 6.4', min: 6.0, max: 6.49 },
        { label: '6.5 - 6.9', min: 6.5, max: 6.99 },
        { label: '7.0 - 7.4', min: 7.0, max: 7.49 },
        { label: '7.5 - 7.9', min: 7.5, max: 7.99 },
        { label: '8.0 - 8.4', min: 8.0, max: 8.49 },
        { label: '8.5 - 8.9', min: 8.5, max: 8.99 },
        { label: '9.0 - 9.4', min: 9.0, max: 9.49 },
        { label: '9.5 - 10', min: 9.5, max: 10.0 }
    ];

    const histogramData = new Int32Array(faixas.length);
    let userFaixaIndex = -1;

    // Localiza a faixa do usuário instantaneamente
    for(let i=0; i<faixas.length; i++) {
        if (data.userCR >= faixas[i].min && data.userCR <= faixas[i].max) {
            userFaixaIndex = i; break;
        }
    }

    // Preenche o Histograma de forma veloz
    for(let j=0; j<data.cohortCRs.length; j++) {
        const cr = data.cohortCRs[j];
        for(let i=0; i<faixas.length; i++) {
            if (cr >= faixas[i].min && cr <= faixas[i].max) {
                histogramData[i]++; break;
            }
        }
    }

    const bgColors = Array.from(histogramData).map((_, i) => i === userFaixaIndex ? colorStudent : getCSSVar('--surface-subtle') || '#e2e8f0');
    const borderColors = Array.from(histogramData).map((_, i) => i === userFaixaIndex ? getCSSVar('--primary-hover') || '#1d4ed8' : colorGrid);

    const ctxDist = document.getElementById('distributionChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxDist, {
        type: 'bar',
        data: {
            labels: faixas.map(f => f.label),
            datasets: [{
                label: 'Número de Alunos',
                data: Array.from(histogramData), // ChartJS precisa de Array padrão
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    padding: 12,
                    callbacks: {
                        title: (ctx) => `Faixa de Notas: ${ctx[0].label}`,
                        label: (ctx) => {
                            const isUserHere = ctx.dataIndex === userFaixaIndex;
                            return `${ctx.raw} alunos nesta faixa${isUserHere ? ' (Você está aqui!)' : ''}`;
                        }
                    }
                }
            },
            scales: {
                y: { title: { display: true, text: 'Volume de Alunos' }, grid: { color: colorGrid } },
                x: { grid: { display: false } }
            }
        }
    }));
}
