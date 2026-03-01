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
    rawDataMap: new Map(), // Usar Map para Deduplicação (chave: Matrícula)
    currentUser: null,
    chartInstances: [],
    isLoading: false
};

const getCSSVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

// ==========================================
// 1. INJEÇÃO DE UI (UPLOAD DINÂMICO) E AUTENTICAÇÃO
// ==========================================

// Injeta o uploader sem você precisar mexer no HTML
function injectCSVUploader() {
    const form = document.getElementById('login-form');
    if (!form || document.getElementById('csv-dropzone')) return;

    const uploaderDiv = document.createElement('div');
    uploaderDiv.className = 'input-group';
    uploaderDiv.innerHTML = `
        <label>Base de Dados (Arraste seus CSVs aqui)</label>
        <div id="csv-dropzone" style="border: 2px dashed var(--border); border-radius: var(--radius-md); padding: 1.5rem 1rem; text-align: center; cursor: pointer; transition: 0.2s; background: var(--surface-subtle);">
            <i data-lucide="database" style="color: var(--text-muted); margin: 0 auto 0.5rem; display: block;"></i>
            <span id="dropzone-text" style="font-size: 0.875rem; color: var(--text-muted);">Clique ou solte os arquivos CSV aqui</span>
            <input type="file" id="csv-upload" accept=".csv" multiple style="display: none;">
        </div>
        <div id="upload-status" style="font-size: 0.8rem; color: var(--success); margin-top: 0.5rem; text-align: center; font-weight: 600;"></div>
    `;
    form.insertBefore(uploaderDiv, form.firstChild);
    lucide.createIcons();

    const dropzone = document.getElementById('csv-dropzone');
    const fileInput = document.getElementById('csv-upload');
    const statusText = document.getElementById('upload-status');

    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--primary)';
        dropzone.style.background = 'var(--primary-light)';
    });
    
    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'var(--border)';
        dropzone.style.background = 'var(--surface-subtle)';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border)';
        dropzone.style.background = 'var(--surface-subtle)';
        handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleFiles(files) {
        if (!files.length) return;
        statusText.style.color = 'var(--text-main)';
        statusText.textContent = `Processando ${files.length} arquivo(s)...`;
        
        Array.from(files).forEach(file => {
            if(file.name.endsWith('.csv')) {
                parseCSV(file, file.name);
            }
        });
    }
}

// Inicia o processo de UI
injectCSVUploader();

// Tentativa Silenciosa de carregar o CSV default na mesma pasta
parseCSV('Planilha_Academica_Medicina.csv', 'Planilha Padrão', true);

function parseCSV(fileOrUrl, sourceName, isSilent = false) {
    Papa.parse(fileOrUrl, {
        download: typeof fileOrUrl === 'string',
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
            let adicionados = 0;
            results.data.forEach(row => {
                const mat = String(row['Matrícula'] || '').trim();
                if (mat) {
                    STATE.rawDataMap.set(mat, row); // Set substitui automagicamente alunos repetidos!
                    adicionados++;
                }
            });
            const statusText = document.getElementById('upload-status');
            if (statusText && !isSilent) {
                statusText.style.color = 'var(--success)';
                statusText.textContent = `Total na Base: ${STATE.rawDataMap.size} alunos (Deduplicados)`;
            }
        },
        error: (err) => {
            if (!isSilent) console.error(`Erro ao ler ${sourceName}:`, err);
        }
    });
}

// Eventos de Formulário
const formEl = document.getElementById('login-form');
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

formEl?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const matricula = matriculaInput.value.trim();
    
    setLoadingState(true);

    try {
        await new Promise(r => setTimeout(r, 600)); // UX delay

        if (STATE.rawDataMap.size === 0) {
            throw new Error("Nenhum CSV carregado.");
        }
        
        // Converte o Map em Array para busca
        const allUsers = Array.from(STATE.rawDataMap.values());
        const user = allUsers.find(row => 
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
        showAuthError(error.message === "Nenhum CSV carregado." ? "Por favor, arraste um CSV na área pontilhada acima." : "Erro de conexão ao processar a base de dados.");
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
    formEl.classList.add('shake-animation');
    emailInput.setAttribute('aria-invalid', 'true');
    setTimeout(() => formEl.classList.remove('shake-animation'), 400);
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    STATE.currentUser = null;
    document.getElementById('dashboard-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    formEl.reset();
    validateForm();
    STATE.chartInstances.forEach(chart => chart.destroy());
    STATE.chartInstances = [];
});

// ==========================================
// 2. PROCESSAMENTO ALTA PERFORMANCE O(N)
// ==========================================

function processDashboardData() {
    const user = STATE.currentUser;
    const allUsers = Array.from(STATE.rawDataMap.values());
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
    const cohortCRs = new Float32Array(totalUsers); 
    const periodAcc = {};
    periods.forEach(p => periodAcc[p] = { sum: 0, sumSq: 0, count: 0 });

    let userCR = 0;
    const userPeriodMeans = {};
    const userMatricula = String(user['Matrícula']);

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
                if (typeof grade === 'number') { pSum += grade; pCount++; }
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

    let userRank = 1;
    for (let i = 0; i < totalUsers; i++) {
        if (cohortCRs[i] > userCR) userRank++;
    }

    const statsPerPeriod = periods.map(p => {
        const acc = periodAcc[p];
        const cohortMean = acc.count > 0 ? (acc.sum / acc.count) : 0;
        let variance = 0;
        if (acc.count > 1) variance = (acc.sumSq - ((acc.sum * acc.sum) / acc.count)) / (acc.count - 1);
        return {
            period: p,
            studentMean: userPeriodMeans[p] || 0,
            cohortMean: cohortMean,
            cohortStdDev: Math.sqrt(Math.max(0, variance))
        };
    });

    const userPercentile = Math.round(((totalUsers - userRank) / totalUsers) * 100);
    const lastPeriodMean = statsPerPeriod[statsPerPeriod.length - 1]?.studentMean || 0;

    return { statsPerPeriod, userCR, userRank, totalStudents: totalUsers, userPercentile, trendDiff: lastPeriodMean - userCR, cohortCRs };
}

// ==========================================
// 3. RENDERIZAÇÃO E GRÁFICOS PREMIUM (GRADIENTES)
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
        animation: { duration: 1200, easing: 'easeOutQuart' },
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, padding: 20 } },
            tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.95)', titleColor: '#fff', bodyColor: '#cbd5e1', padding: 12, cornerRadius: 8 }
        },
        scales: { x: { grid: { display: false } }, y: { min: 0, max: 10, grid: { color: colorGrid, drawBorder: false } } }
    };

    // Função Criadora de Gradiente Premium
    const createGradient = (ctx, colorStart, colorEnd) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, colorStart);
        gradient.addColorStop(1, colorEnd);
        return gradient;
    };

    // 1. Gráfico de Evolução (Com Fill Gradient)
    const ctxEvo = document.getElementById('evolutionChart').getContext('2d');
    STATE.chartInstances.push(new Chart(ctxEvo, {
        type: 'line',
        data: {
            labels,
            datasets: [
                { 
                    label: 'Sua Média', data: studentMeans, borderColor: colorStudent, 
                    backgroundColor: createGradient(ctxEvo, 'rgba(37, 99, 235, 0.25)', 'rgba(37, 99, 235, 0)'),
                    fill: true, tension: 0.4, borderWidth: 3, pointRadius: 4, pointHoverRadius: 6 
                },
                { label: 'Média da Turma', data: cohortMeans, borderColor: colorCohort, borderDash: [5, 5], tension: 0.4, borderWidth: 2, pointRadius: 0 }
            ]
        },
        options: commonOptions
    }));

    // 2. Curva de Crescimento (Desvio Padrão Otimizado)
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

    // 3. Distribuição (Histograma Dinâmico)
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

    for(let i=0; i<faixas.length; i++) {
        if (data.userCR >= faixas[i].min && data.userCR <= faixas[i].max) { userFaixaIndex = i; break; }
    }

    for(let j=0; j<data.cohortCRs.length; j++) {
        const cr = data.cohortCRs[j];
        for(let i=0; i<faixas.length; i++) {
            if (cr >= faixas[i].min && cr <= faixas[i].max) { histogramData[i]++; break; }
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
                data: Array.from(histogramData),
                backgroundColor: bgColors,
                borderColor: borderColors,
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 12,
                    callbacks: {
                        title: (ctx) => `Faixa de Notas: ${ctx[0].label}`,
                        label: (ctx) => {
                            const isUserHere = ctx.dataIndex === userFaixaIndex;
                            return `${ctx.raw} alunos nesta faixa${isUserHere ? ' (Você está aqui!)' : ''}`;
                        }
                    }
                }
            },
            scales: { y: { title: { display: true, text: 'Volume de Alunos' }, grid: { color: colorGrid } }, x: { grid: { display: false } } }
        }
    }));
}
