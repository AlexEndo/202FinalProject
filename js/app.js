document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let allData = [];
let filteredData = [];

async function initApp() {
    console.log("Initializing App...");

    // Initialize Map
    initMap();

    // Fetch Data
    try {
        const response = await fetch('data/collisions_processed.json');
        if (!response.ok) throw new Error('Failed to load data');
        allData = await response.json();
        filteredData = [...allData];

        populateFilters();
        updateUI();

    } catch (error) {
        console.error("Error loading data:", error);
    }

    // Event Listeners
    setupEventListeners();
}

function setupEventListeners() {
    const manufacturerSelect = document.getElementById('manufacturer-filter');
    const collisionTypeSelect = document.getElementById('collision-type-filter');
    const controlStateSelect = document.getElementById('control-state-filter');
    const severityInputs = document.querySelectorAll('#severity-filters input');
    const searchInput = document.getElementById('search-input');

    if (manufacturerSelect) manufacturerSelect.addEventListener('change', filterData);
    if (collisionTypeSelect) collisionTypeSelect.addEventListener('change', filterData);
    if (controlStateSelect) controlStateSelect.addEventListener('change', filterData);
    severityInputs.forEach(input => input.addEventListener('change', filterData));
    if (searchInput) searchInput.addEventListener('input', filterData);

    document.getElementById('reset-filters').addEventListener('click', () => {
        if (manufacturerSelect) manufacturerSelect.value = 'all';
        if (collisionTypeSelect) collisionTypeSelect.value = 'all';
        if (controlStateSelect) controlStateSelect.value = 'all';
        severityInputs.forEach(input => input.checked = true);
        if (searchInput) searchInput.value = '';
        filterData();
    });

}



function populateFilters() {
    const manufactures = [...new Set(allData.map(item => item.manufacturer))];
    const select = document.getElementById('manufacturer-filter');

    manufactures.forEach(m => {
        const option = document.createElement('option');
        option.value = m;
        option.textContent = m;
        select.appendChild(option);
    });

    // Populate Collision Types
    const types = [...new Set(allData.map(item => item.collision_type))].sort();
    const typeSelect = document.getElementById('collision-type-filter');

    types.forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        typeSelect.appendChild(option);
    });
}

function filterData() {
    const selectedManuf = document.getElementById('manufacturer-filter').value;
    const selectedType = document.getElementById('collision-type-filter').value;
    const selectedState = document.getElementById('control-state-filter').value;
    const checkedSeverities = Array.from(document.querySelectorAll('#severity-filters input:checked'))
        .map(input => input.value);
    const searchTerm = document.getElementById('search-input').value.toLowerCase();

    filteredData = allData.filter(item => {
        const matchManuf = selectedManuf === 'all' || item.manufacturer === selectedManuf;
        const matchType = selectedType === 'all' || item.collision_type === selectedType;
        const matchState = selectedState === 'all' || item.control_state === selectedState;

        // Exact match for severity string
        const matchSeverity = checkedSeverities.includes(item.severity);

        // Text Search
        const searchTarget = `${item.manufacturer} ${item.description} ${item.collision_type}`.toLowerCase();
        const matchSearch = searchTerm === '' || searchTarget.includes(searchTerm);

        return matchManuf && matchType && matchState && matchSeverity && matchSearch;
    });

    updateUI();
}

function updateUI() {
    updateList();
    updateMapMarkers(filteredData);

    document.getElementById('result-count').textContent = filteredData.length;
}

function updateList() {
    const listContainer = document.getElementById('collision-list');
    listContainer.innerHTML = '';

    filteredData.forEach(item => {
        const el = document.createElement('div');
        el.className = 'collision-item';
        el.innerHTML = `
            <div class="item-header">
                <span class="item-manuf">${item.manufacturer}</span>
                <span class="item-severity">${item.severity}</span>
            </div>
            <div class="item-date">${item.date}</div>
            <p class="item-desc">${item.description}</p>
        `;

        el.addEventListener('click', () => {
            focusMapOnItem(item);
        });

        listContainer.appendChild(el);
    });
}
