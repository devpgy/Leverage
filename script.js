// Storage key for localStorage
const STORAGE_KEY = 'silver-lever-rebalance-inputs';

// Chart instance
let rebalanceChart = null;

// Initialize app
console.log('Script loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing...');
    try {
        loadInputs();
        setupInputListeners();
        updateAll();
        console.log('Initialization complete');
    } catch (e) {
        console.error('Error during initialization:', e);
    }
});

// Setup input listeners
function setupInputListeners() {
    const inputs = ['cashInput', 'leverageInput', 'entryPriceInput'];
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

// Calculate what we need at a given price
function calculateAtPrice(inputs, price) {
    const { cash, leverage, entryPrice } = inputs;
    const initial = calculateInitialPosition(inputs);
    const currentPositionSize = initial.positionSize;

    const unrealizedPnl = (price - entryPrice) * currentPositionSize;
    const accountEquity = cash + unrealizedPnl;
    const currentNotional = price * currentPositionSize;
    const currentLeverage = currentNotional / accountEquity;
    const targetNotional = accountEquity * leverage;
    const additionalOzNeeded = (targetNotional - currentNotional) / price;

    // Round to nearest 0.01 lots (50 oz)
    const MIN_LOT = 0.01;
    const LOT_SIZE = 5000;
    const lotsNeeded = additionalOzNeeded > 0 ? Math.ceil((additionalOzNeeded / LOT_SIZE) / MIN_LOT) * MIN_LOT : 0;
    const additionalOzPurchased = lotsNeeded * LOT_SIZE;
    const costToBuy = additionalOzPurchased * price;
    const newTotalPosition = currentPositionSize + additionalOzPurchased;
    const newLeverage = (price * newTotalPosition) / accountEquity;

    return {
        price,
        unrealizedPnl,
        accountEquity,
        currentLeverage,
        lotsNeeded,
        additionalOzPurchased,
        costToBuy,
        newTotalPosition,
        newLeverage,
    };
}

// Generate buying schedule - all prices where action is needed
function generateBuyingSchedule(inputs) {
    const { entryPrice } = inputs;
    const schedule = [];
    let lastLotsNeeded = 0;
    let cumulativeLots = 0;

    // Generate prices from entry to $300 in $0.01 increments
    for (let price = Math.ceil(entryPrice * 100) / 100; price <= 300; price = Math.round((price + 0.01) * 100) / 100) {
        const calc = calculateAtPrice(inputs, price);

        // Only add to schedule if lots needed has changed (new 0.01 lot threshold)
        if (calc.lotsNeeded !== lastLotsNeeded) {
            schedule.push({
                price,
                ...calc,
                cumulativeLots: calc.lotsNeeded,
            });
            lastLotsNeeded = calc.lotsNeeded;
        }
    }

    return schedule;
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

// Update summary section
function updateSummary(inputs, initial) {
    try {
        const el1 = document.getElementById('initialOunces');
        const el2 = document.getElementById('notionalValue');
        const el3 = document.getElementById('initialLeverage');
        const el4 = document.getElementById('equityAtRisk');

        console.log('Elements found:', !!el1, !!el2, !!el3, !!el4);

        if (el1) el1.textContent = formatNumber(initial.positionSize, 0);
        if (el2) el2.textContent = formatCurrency(initial.notional);
        if (el3) el3.textContent = formatNumber(initial.leverage, 1) + 'x';
        if (el4) el4.textContent = formatCurrency(inputs.cash);

        console.log('Summary updated');
    } catch (e) {
        console.error('Error in updateSummary:', e);
    }
}

// Update buying schedule table
function updateBuyingScheduleTable(inputs) {
    try {
        const tbody = document.getElementById('rebalanceBody');
        if (!tbody) {
            console.error('Table body not found');
            return;
        }
        tbody.innerHTML = '';

        const schedule = generateBuyingSchedule(inputs);
        console.log('Generated schedule with', schedule.length, 'entries');

        let cumulativeLots = 0;
        let cumulativeOz = 0;
        let cumulativeCost = 0;

        schedule.forEach((entry, idx) => {
            cumulativeLots += entry.lotsNeeded;
            cumulativeOz += entry.additionalOzPurchased;
            cumulativeCost += entry.costToBuy;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatNumber(entry.price, 2)}</td>
                <td>${formatNumber(entry.accountEquity, 0)}</td>
                <td>${formatNumber(entry.currentLeverage, 2)}x</td>
                <td>${formatNumber(entry.lotsNeeded, 2)} lots</td>
                <td>${formatNumber(entry.additionalOzPurchased, 0)} oz</td>
                <td>${formatCurrency(entry.costToBuy)}</td>
                <td>${formatNumber(cumulativeLots, 2)} lots</td>
                <td>${formatNumber(cumulativeOz, 0)} oz</td>
                <td>${formatCurrency(cumulativeCost)}</td>
                <td>${formatNumber(entry.newTotalPosition, 0)} oz</td>
                <td>${formatNumber(entry.newLeverage, 2)}x</td>
            `;
            tbody.appendChild(row);
        });

        console.log('Table updated with', schedule.length, 'rows');
    } catch (e) {
        console.error('Error in updateBuyingScheduleTable:', e);
        console.error('Stack:', e.stack);
    }
}

// Update chart
function updateChart(inputs) {
    try {
        const schedule = generateBuyingSchedule(inputs);

        // Limit chart to first 100 entries for performance
        const chartData = schedule.slice(0, 100);

        const ctx = document.getElementById('buyingChart');
        if (!ctx) {
            console.error('Chart canvas not found');
            return;
        }

        if (rebalanceChart) {
            rebalanceChart.destroy();
        }

        rebalanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.map(d => '$' + d.price.toFixed(2)),
                datasets: [
                    {
                        label: 'Your Total Position',
                        data: chartData.map(d => d.newTotalPosition),
                        borderColor: '#1e40af',
                        backgroundColor: 'rgba(30, 64, 175, 0.05)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 3,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Buy Amount at Price',
                        data: chartData.map(d => d.additionalOzPurchased),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 2,
                        yAxisID: 'y1',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: { font: { size: 12, weight: 'bold' }, padding: 15 },
                    },
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Position Size (oz)', font: { size: 12, weight: 'bold' } },
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Buy Amount (oz)', font: { size: 12, weight: 'bold' } },
                        grid: { drawOnChartArea: false },
                    },
                },
            },
        });

        console.log('Chart updated');
    } catch (e) {
        console.error('Error in updateChart:', e);
    }
}

// Main update function
function updateAll() {
    try {
        const inputs = getInputs();
        console.log('Inputs:', inputs);

        const initial = calculateInitialPosition(inputs);
        console.log('Initial position:', initial);

        updateSummary(inputs, initial);
        updateBuyingScheduleTable(inputs);
        updateChart(inputs);
        console.log('Update complete');
    } catch (e) {
        console.error('Error in updateAll:', e);
        console.error('Stack:', e.stack);
    }
}
