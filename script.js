// Storage key for localStorage
const STORAGE_KEY = 'silver-lever-rebalance-inputs';

// Chart instance
let rebalanceChart = null;

// Price scenarios - can be customized
let priceScenarios = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadInputs();
    setupInputListeners();
    generatePriceScenarios();
    updateAll();
});

// Setup input listeners
function setupInputListeners() {
    const inputs = ['cashInput', 'leverageInput', 'entryPriceInput'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            saveInputs();
            generatePriceScenarios();
            updateAll();
        });
    });
}

// Save inputs to localStorage
function saveInputs() {
    const data = {
        cash: document.getElementById('cashInput').value,
        leverage: document.getElementById('leverageInput').value,
        entryPrice: document.getElementById('entryPriceInput').value,
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
            document.getElementById('entryPriceInput').value = data.entryPrice || 60;
        } catch (e) {
            console.error('Error loading stored inputs:', e);
        }
    }
}

// Reset to defaults
function resetInputs() {
    document.getElementById('cashInput').value = 100000;
    document.getElementById('leverageInput').value = 5;
    document.getElementById('entryPriceInput').value = 60;
    saveInputs();
    generatePriceScenarios();
    updateAll();
}

// Get current inputs
function getInputs() {
    return {
        cash: parseFloat(document.getElementById('cashInput').value) || 100000,
        leverage: parseFloat(document.getElementById('leverageInput').value) || 5,
        entryPrice: parseFloat(document.getElementById('entryPriceInput').value) || 60,
    };
}

// Generate price scenarios dynamically based on entry price
function generatePriceScenarios() {
    const inputs = getInputs();
    const entry = inputs.entryPrice;

    // Generate scenarios from entry to $300 with varying step sizes
    priceScenarios = [];

    // From entry to +50%: $1 increments
    for (let p = entry; p <= entry * 1.5; p += 1) {
        priceScenarios.push(Math.round(p * 100) / 100);
    }

    // From +50% to +150%: $5 increments
    for (let p = Math.ceil((entry * 1.5) / 5) * 5; p <= entry * 2.5; p += 5) {
        if (p > entry * 1.5) priceScenarios.push(p);
    }

    // From +150% to $300: $10 increments
    for (let p = Math.ceil((entry * 2.5) / 10) * 10; p <= 300; p += 10) {
        if (p > entry * 2.5) priceScenarios.push(p);
    }

    // Ensure $300 is included
    if (!priceScenarios.includes(300)) {
        priceScenarios.push(300);
    }

    priceScenarios.sort((a, b) => a - b);
}

// Calculate initial position metrics
function calculateInitialPosition(inputs) {
    const { cash, leverage, entryPrice } = inputs;

    const positionSize = (cash * leverage) / entryPrice;
    const notional = cash * leverage;

    return {
        positionSize,
        notional,
        leverage,
    };
}

// Calculate rebalancing scenario at a given price
function calculateRebalancingScenario(inputs, scenarioPrice) {
    const { cash, leverage, entryPrice } = inputs;
    const initial = calculateInitialPosition(inputs);

    // Current position (hasn't changed - still the initial position)
    const currentPositionSize = initial.positionSize;

    // Unrealized P&L from initial position
    const unrealizedPnl = (scenarioPrice - entryPrice) * currentPositionSize;

    // Account equity
    const accountEquity = cash + unrealizedPnl;

    // Current notional (price × position)
    const currentNotional = scenarioPrice * currentPositionSize;

    // Current leverage ratio
    const currentLeverage = currentNotional / accountEquity;

    // Target notional to maintain target leverage
    const targetNotional = accountEquity * leverage;

    // Additional oz needed to reach target
    let additionalOzNeeded = (targetNotional - currentNotional) / scenarioPrice;

    // Round to 0.01 oz minimum
    additionalOzNeeded = Math.ceil(additionalOzNeeded * 100) / 100;

    // Cost to buy additional oz
    const costToBuy = additionalOzNeeded * scenarioPrice;

    // New total position after rebalancing
    const newTotalPosition = currentPositionSize + additionalOzNeeded;

    // New leverage after rebalancing
    const newLeverage = (scenarioPrice * newTotalPosition) / accountEquity;

    return {
        price: scenarioPrice,
        entryPrice,
        initialPosition: currentPositionSize,
        unrealizedPnl,
        accountEquity,
        currentLeverage,
        currentNotional,
        targetNotional,
        additionalOzNeeded,
        costToBuy,
        newTotalPosition,
        newLeverage,
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

// Format oz with minimum 0.01
function formatOunces(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value) + ' oz';
}

// Update summary section
function updateSummary(inputs, initial) {
    document.getElementById('initialOunces').textContent = formatNumber(initial.positionSize, 0);
    document.getElementById('notionalValue').textContent = formatCurrency(initial.notional);
    document.getElementById('initialLeverage').textContent = formatNumber(initial.leverage, 1) + 'x';
    document.getElementById('equityAtRisk').textContent = formatCurrency(inputs.cash);
}

// Update rebalancing table
function updateRebalancingTable(inputs) {
    const tbody = document.getElementById('rebalanceBody');
    tbody.innerHTML = '';

    priceScenarios.forEach(price => {
        const scenario = calculateRebalancingScenario(inputs, price);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatCurrency(scenario.price)}</td>
            <td>${formatNumber(scenario.initialPosition, 0)}</td>
            <td>${formatCurrency(scenario.unrealizedPnl)}</td>
            <td>${formatCurrency(scenario.accountEquity)}</td>
            <td>${formatNumber(scenario.currentLeverage, 2)}x</td>
            <td>${formatCurrency(scenario.currentNotional)}</td>
            <td>${formatCurrency(scenario.targetNotional)}</td>
            <td>${formatOunces(scenario.additionalOzNeeded)}</td>
            <td>${formatCurrency(scenario.costToBuy)}</td>
            <td>${formatNumber(scenario.newTotalPosition, 0)}</td>
        `;
        tbody.appendChild(row);
    });
}

// Update chart
function updateChart(inputs) {
    const chartData = priceScenarios.map(price => calculateRebalancingScenario(inputs, price));
    const initial = calculateInitialPosition(inputs);

    const ctx = document.getElementById('rebalanceChart').getContext('2d');

    if (rebalanceChart) {
        rebalanceChart.destroy();
    }

    rebalanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.map(d => '$' + d.price.toFixed(2)),
            datasets: [
                {
                    label: 'Your Position Size',
                    data: chartData.map(d => d.newTotalPosition),
                    borderColor: '#1e40af',
                    backgroundColor: 'rgba(30, 64, 175, 0.05)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#1e40af',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y',
                },
                {
                    label: 'Additional Oz to Buy (cumulative)',
                    data: chartData.map((d, idx) => {
                        // Cumulative sum
                        return chartData.slice(0, idx + 1).reduce((sum, s) => sum + s.additionalOzNeeded, 0);
                    }),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y1',
                },
                {
                    label: 'Current Leverage Ratio',
                    data: chartData.map(d => d.currentLeverage),
                    borderColor: '#ef4444',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#ef4444',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    yAxisID: 'y2',
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
                                if (context.dataset.yAxisID === 'y') {
                                    label += context.parsed.y.toFixed(0) + ' oz';
                                } else if (context.dataset.yAxisID === 'y1') {
                                    label += context.parsed.y.toFixed(0) + ' oz (cumulative)';
                                } else if (context.dataset.yAxisID === 'y2') {
                                    label += context.parsed.y.toFixed(2) + 'x';
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
                        text: 'Position Size (oz)',
                        font: { size: 12, weight: 'bold' },
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        },
                    },
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'center',
                    title: {
                        display: true,
                        text: 'Additional Oz (cumulative)',
                        font: { size: 12, weight: 'bold' },
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0);
                        },
                    },
                    grid: {
                        drawOnChartArea: true,
                        color: 'rgba(16, 185, 129, 0.1)',
                    },
                },
                y2: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Current Leverage (x)',
                        font: { size: 12, weight: 'bold' },
                    },
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(1) + 'x';
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
    const initial = calculateInitialPosition(inputs);

    updateSummary(inputs, initial);
    updateRebalancingTable(inputs);
    updateChart(inputs);
}
