document.addEventListener('DOMContentLoaded', () => {
    initAnalytics();
});

async function initAnalytics() {
    try {
        const response = await fetch('data/collisions_processed.json');
        if (!response.ok) throw new Error('Failed to load data');
        const data = await response.json();


        renderCharts(data);

    } catch (error) {
        console.error("Error loading analytics data:", error);
    }
}

function renderCharts(data) {
    // 1. Incidents Over Time (Aggregated by Month)
    renderTimeChart(data);

    // 2. Incidents by Manufacturer
    renderManufacturerChart(data);

    // 3. Collision Types
    renderTypeChart(data);

    // 4. Severity
    renderSeverityChart(data);
}

function renderTimeChart(data) {
    const ctx = document.getElementById('timeChart').getContext('2d');

    // Group by Month (YYYY-MM)
    const dateCounts = {};
    data.forEach(item => {
        if (!item.date) return;
        // Assuming date is in ISO format YYYY-MM-DD or close to it. 
        // We'll try to parse it safely.
        try {
            const dateObj = new Date(item.date);
            const key = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
            dateCounts[key] = (dateCounts[key] || 0) + 1;
        } catch (e) {
        }
    });

    // Sort keys
    const sortedKeys = Object.keys(dateCounts).sort();
    const values = sortedKeys.map(k => dateCounts[k]);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: sortedKeys,
            datasets: [{
                label: 'Incidents',
                data: values,
                borderColor: '#6366f1', // Indigo 500
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

function renderManufacturerChart(data) {
    const ctx = document.getElementById('manufacturerChart').getContext('2d');

    const counts = {};
    data.forEach(item => {
        const m = item.manufacturer || 'Unknown';
        counts[m] = (counts[m] || 0) + 1;
    });

    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(e => e[0]);
    const values = sortedEntries.map(e => e[1]);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Incidents',
                data: values,
                backgroundColor: '#10b981', // Emerald 500
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y', // Horizontal Bar
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function renderTypeChart(data) {
    const ctx = document.getElementById('typeChart').getContext('2d');

    const counts = {};
    data.forEach(item => {
        const t = item.collision_type || 'Unknown';
        counts[t] = (counts[t] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    '#f59e0b', // Amber
                    '#3b82f6', // Blue
                    '#ef4444', // Red
                    '#8b5cf6', // Violet
                    '#ec4899', // Pink
                    '#64748b'  // Slate
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}

function renderSeverityChart(data) {
    const ctx = document.getElementById('severityChart').getContext('2d');

    const counts = {};
    data.forEach(item => {
        const s = item.severity || 'Unknown';
        counts[s] = (counts[s] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const values = Object.values(counts);

    // color mapping for severity
    const colorMap = {
        'Property Damage Only': '#3b82f6', // Blue
        'Injury': '#f59e0b', // Amber
        'Fatality': '#ef4444' // Red
    };

    const bgColors = labels.map(l => colorMap[l] || '#9ca3af');

    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: bgColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' }
            }
        }
    });
}
