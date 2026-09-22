// Storage key for localStorage
const STORAGE_KEY = 'silver-lever-inputs';

// Chart instance
let stopChart = null;

// Price scenarios
const priceScenarios = [60, 65, 70, 75, 80, 90, 100, 120, 150, 180, 200, 250, 300];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadInputs();
    setupInputListeners();
    updateAll();
});

// Setup input listeners
function setupInputListeners() {
    const inputs = ['cashInput', 'leverageInput', 'priceInput'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            saveInputs();
            updateAll();
        });
    });
}

// Save inputs to localStorage
function saveInputs() {
    const data = {
        cash: document.getElementById('cashInput').value,
        leverage: document.getElementById('leverageInput').value,
        price: document.getElementById('priceInput').value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Load inputs from localStorage
function loadInputs() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            const data = JSON.parse(stored);
            document.getElementById('cashInput').value = data.cash || 100000;
            document.getElementById('leverageInput').value = data.leverage || 5;
            document.getElementById('priceInput').value = data.price || 60;
        } catch (e) {
            console.error('Error loading stored inputs:', e);
        }
    }
}

// Reset to defaults
function resetInputs() {
    document.getElementById('cashInput').value = 100000;
    document.getElementById('leverageInput').value = 5;
    document.getElementById('priceInput').value = 60;
    saveInputs();
    updateAll();
}

// Get current inputs
function getInputs() {
    return {
        cash: parseFloat(document.getElementById('cashInput').value) || 100000,
        leverage: parseFloat(document.getElementById('leverageInput').value) || 5,
        price: parseFloat(document.getElementById('priceInput').value) || 60,
    };
}

// Calculate position metrics
function calculateMetrics(inputs) {
    const { cash, leverage, price } = inputs;

    const positionSize = (cash * leverage) / price;
    const notional = cash * leverage;
    const maxLoss = cash / leverage;
    const riskPerOz = maxLoss / positionSize;
    const initialStop = price - riskPerOz;
    const bufferPct = (price - initialStop) / price;

    return {
        positionSize,
        notional,
        maxLoss,
        riskPerOz,
        initialStop,
        bufferPct,
    };
}

// Calculate scenario at price
function calculateScenario(inputs, scenarioPrice) {
    const { cash, leverage } = inputs;
    const { positionSize, notional, maxLoss: initialMaxLoss } = calculateMetrics(inputs);

    // Unrealized P&L
    const unrealizedPnl = (scenarioPrice - inputs.price) * positionSize;

    // Account Equity
    const accountEquity = cash + unrealizedPnl;

    // Current Leverage Ratio (Notional / Equity)
    const currentLeverage = notional / accountEquity;

    // Max Loss Allowed (to maintain leverage ratio)
    const maxLossAllowed = accountEquity / leverage;

    // Required Stop Price
    const requiredStop = scenarioPrice - (maxLossAllowed / positionSize);

    // Buffer to Stop
    const bufferToStop = scenarioPrice - requiredStop;

    return {
        price: scenarioPrice,
        entryPrice: inputs.price,
        positionSize,
        unrealizedPnl,
        accountEquity,
        currentLeverage,
        maxLossAllowed,
        requiredStop,
        bufferToStop,
    };
}

// Format currency
function formatCurrency(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

// Format number
function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

// Format percentage
function formatPercent(value) {
    if (value === null || value === undefined) return '-';
    return (value * 100).toFixed(1) + '%';
}

// Update summary section
function updateSummary(inputs, metrics) {
    document.getElementById('positionSize').textContent = formatNumber(metrics.positionSize, 0);
    document.getElementById('notionalValue').textContent = formatCurrency(metrics.notional);
    document.getElementById('maxLoss').textContent = formatCurrency(metrics.maxLoss);
    document.getElementById('initStop').textContent = formatCurrency(metrics.initialStop);
    document.getElementById('bufferPct').textContent = formatPercent(metrics.bufferPct);
    document.getElementById('riskPerUnit').textContent = formatCurrency(metrics.riskPerOz);
}

// Update scenarios table
function updateScenariosTable(inputs) {
    const tbody = document.getElementById('scenariosBody');
    tbody.innerHTML = '';

    priceScenarios.forEach(scenarioPrice => {
        const scenario = calculateScenario(inputs, scenarioPrice);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatCurrency(scenario.price)}</td>
            <td>${formatCurrency(scenario.entryPrice)}</td>
            <td>${formatNumber(scenario.positionSize, 0)}</td>
            <td>${formatCurrency(scenario.unrealizedPnl)}</td>
            <td>${formatCurrency(scenario.accountEquity)}</td>
            <td>${formatNumber(scenario.currentLeverage, 2)}x</td>
            <td>${formatCurrency(scenario.maxLossAllowed)}</td>
            <td>${formatCurrency(scenario.requiredStop)}</td>
            <td>${formatCurrency(scenario.bufferToStop)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update chart
function updateChart(inputs) {
    const chartData = priceScenarios.map(price => calculateScenario(inputs, price));

    const ctx = document.getElementById('stopChart').getContext('2d');

    if (stopChart) {
        stopChart.destroy();
    }

    stopChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => '$' + d.price.toFixed(0)),
            datasets: [
                {
                    label: 'Silver Price',
                    data: chartData.map(d => d.price),
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#1e40af',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y',
                },
                {
                    label: 'Required Stop Price',
                    data: chartData.map(d => d.requiredStop),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y',
                },
                {
                    label: 'Buffer to Stop ($)',
                    data: chartData.map(d => d.bufferToStop),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y1',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 12,
                            weight: 'bold',
                        },
                        padding: 15,
                        usePointStyle: true,
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 12 },
                    cornerRadius: 4,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                if (context.dataset.yAxisID === 'y1') {
                                    label += '$' + context.parsed.y.toFixed(2);
                                } else {
                                    label += '$' + context.parsed.y.toFixed(2) + '/oz';
                                }
                            }
                            return label;
                        },
                    },
                },
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Price ($/oz)',
                        font: { size: 12, weight: 'bold' },
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        },
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Buffer ($)',
                        font: { size: 12, weight: 'bold' },
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        },
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            },
        },
    });
}

// Main update function
function updateAll() {
    const inputs = getInputs();
    const metrics = calculateMetrics(inputs);

    updateSummary(inputs, metrics);
    updateScenariosTable(inputs);
    updateChart(inputs);
}
