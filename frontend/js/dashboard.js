// Auto-Trader Dashboard JavaScript

const API_BASE_URL = 'http://localhost:4000/api';

// Estado global
let currentSection = 'dashboard';
let assetChart = null;
let loadingModal = null;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    
    // Carregar dados iniciais
    loadDashboardData();
    
    // Configurar formulário de IA
    setupAIForm();
    
    // Atualizar dados a cada 30 segundos
    setInterval(loadDashboardData, 30000);
});

// Navegação entre seções
function showSection(sectionName) {
    // Esconder todas as seções
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Mostrar seção selecionada
    document.getElementById(sectionName).style.display = 'block';
    
    // Atualizar navegação
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
    
    currentSection = sectionName;
    
    // Carregar dados específicos da seção
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'trades':
            loadTrades();
            break;
        case 'ai':
            // Seção IA não precisa carregar dados iniciais
            break;
    }
}

// Carregar dados do dashboard
async function loadDashboardData() {
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if (!response.ok) throw new Error('Erro ao carregar estatísticas');
        
        const data = await response.json();
        
        // Atualizar KPIs
        updateKPIs(data);
        
        // Atualizar gráfico
        updateAssetChart(data.assetStats || []);
        
        // Atualizar trades recentes
        updateRecentTrades(data.recentTrades || []);
        
        hideLoading();
        
    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        showError('Erro ao carregar dados do dashboard');
        hideLoading();
    }
}

// Atualizar KPIs
function updateKPIs(data) {
    document.getElementById('totalTrades').textContent = data.totalTrades || 0;
    
    // Calcular estatísticas por decisão
    const decisionStats = data.decisionStats || [];
    let buyCount = 0, sellCount = 0, holdCount = 0;
    
    decisionStats.forEach(stat => {
        switch(stat._id) {
            case 'buy':
                buyCount = stat.count;
                break;
            case 'sell':
                sellCount = stat.count;
                break;
            case 'hold':
                holdCount = stat.count;
                break;
        }
    });
    
    document.getElementById('buyOrders').textContent = buyCount;
    document.getElementById('sellOrders').textContent = sellCount;
    document.getElementById('holdOrders').textContent = holdCount;
}

// Atualizar gráfico de ativos
function updateAssetChart(assetStats) {
    const ctx = document.getElementById('assetChart').getContext('2d');
    
    if (assetChart) {
        assetChart.destroy();
    }
    
    const labels = assetStats.map(asset => asset._id);
    const counts = assetStats.map(asset => asset.count);
    
    assetChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Número de Ordens',
                data: counts,
                backgroundColor: [
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(255, 205, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                borderColor: [
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 205, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Atualizar trades recentes
function updateRecentTrades(recentTrades) {
    const container = document.getElementById('recentTrades');
    container.innerHTML = '';
    
    if (recentTrades.length === 0) {
        container.innerHTML = '<p class="text-muted text-center">Nenhuma ordem recente</p>';
        return;
    }
    
    recentTrades.slice(0, 5).forEach(trade => {
        const tradeElement = document.createElement('div');
        tradeElement.className = `recent-trade-item ${trade.decision}`;
        
        const timeAgo = getTimeAgo(new Date(trade.timestamp));
        
        tradeElement.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${trade.ativo}</strong>
                    <span class="badge decision-${trade.decision} ms-2">${getDecisionText(trade.decision)}</span>
                </div>
                <small class="text-muted">${timeAgo}</small>
            </div>
            <div class="mt-1">
                <small>RSI: ${trade.rsi} | MACD: ${trade.macd}</small>
            </div>
        `;
        
        container.appendChild(tradeElement);
    });
}

// Carregar lista de trades
async function loadTrades() {
    try {
        showLoading();
        
        const asset = document.getElementById('filterAsset')?.value || '';
        const decision = document.getElementById('filterDecision')?.value || '';
        
        let url = `${API_BASE_URL}/trades?limit=50`;
        if (asset) url += `&ativo=${asset}`;
        if (decision) url += `&decision=${decision}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erro ao carregar trades');
        
        const data = await response.json();
        
        updateTradesTable(data.trades || []);
        
        hideLoading();
        
    } catch (error) {
        console.error('Erro ao carregar trades:', error);
        showError('Erro ao carregar lista de trades');
        hideLoading();
    }
}

// Atualizar tabela de trades
function updateTradesTable(trades) {
    const tbody = document.getElementById('tradesTable');
    tbody.innerHTML = '';
    
    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhuma ordem encontrada</td></tr>';
        return;
    }
    
    trades.forEach(trade => {
        const row = document.createElement('tr');
        
        const date = new Date(trade.timestamp).toLocaleString('pt-BR');
        const tendencyIcon = getTendencyIcon(trade.tendencia);
        
        row.innerHTML = `
            <td>${date}</td>
            <td><strong>${trade.ativo}</strong></td>
            <td>${tendencyIcon} ${trade.tendencia}</td>
            <td>${trade.rsi}</td>
            <td>${trade.macd}</td>
            <td><span class="badge decision-${trade.decision}">${getDecisionText(trade.decision)}</span></td>
            <td><span class="badge status-${trade.status || 'pending'}">${getStatusText(trade.status || 'pending')}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Configurar formulário de IA
function setupAIForm() {
    const form = document.getElementById('aiMessageForm');
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const message = document.getElementById('aiMessage').value.trim();
        const context = document.getElementById('aiContext').value.trim();
        
        if (!message) {
            showError('Por favor, digite uma mensagem');
            return;
        }
        
        try {
            showLoading();
            
            const response = await fetch(`${API_BASE_URL}/ai/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    context: context
                })
            });
            
            if (!response.ok) throw new Error('Erro ao enviar mensagem para IA');
            
            const data = await response.json();
            
            // Mostrar resposta
            const responseContainer = document.getElementById('aiResponse');
            responseContainer.innerHTML = `
                <div class="ai-response-content">${data.response}</div>
                <hr>
                <small class="text-muted">Resposta recebida em: ${new Date(data.timestamp).toLocaleString('pt-BR')}</small>
            `;
            
            // Limpar formulário
            document.getElementById('aiMessage').value = '';
            document.getElementById('aiContext').value = '';
            
            hideLoading();
            
        } catch (error) {
            console.error('Erro ao enviar mensagem para IA:', error);
            showError('Erro ao comunicar com a IA');
            hideLoading();
        }
    });
}

// Funções utilitárias
function getDecisionText(decision) {
    switch(decision) {
        case 'buy': return 'Compra';
        case 'sell': return 'Venda';
        case 'hold': return 'Hold';
        default: return decision;
    }
}

function getStatusText(status) {
    switch(status) {
        case 'pending': return 'Pendente';
        case 'executed': return 'Executada';
        case 'cancelled': return 'Cancelada';
        default: return status;
    }
}

function getTendencyIcon(tendencia) {
    switch(tendencia) {
        case 'alta': return '<i class="bi bi-arrow-up text-success"></i>';
        case 'baixa': return '<i class="bi bi-arrow-down text-danger"></i>';
        case 'lateral': return '<i class="bi bi-arrow-right text-warning"></i>';
        default: return '';
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
}

function showLoading() {
    if (loadingModal) {
        loadingModal.show();
    }
}

function hideLoading() {
    if (loadingModal) {
        loadingModal.hide();
    }
}

function showError(message) {
    // Criar toast de erro
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1055';
    
    toastContainer.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header bg-danger text-white">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                <strong class="me-auto">Erro</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    // Remover após 5 segundos
    setTimeout(() => {
        toastContainer.remove();
    }, 5000);
}

function showSuccess(message) {
    // Criar toast de sucesso
    const toastContainer = document.createElement('div');
    toastContainer.className = 'position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1055';
    
    toastContainer.innerHTML = `
        <div class="toast show" role="alert">
            <div class="toast-header bg-success text-white">
                <i class="bi bi-check-circle-fill me-2"></i>
                <strong class="me-auto">Sucesso</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    document.body.appendChild(toastContainer);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toastContainer.remove();
    }, 3000);
}
