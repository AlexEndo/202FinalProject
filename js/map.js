let map;
let markers = [];

function initMap() {
    // Center of California
    map = L.map('map').setView([36.7783, -119.4179], 6);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
}

function updateMapMarkers(data) {
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];

    data.forEach(item => {
        if (item.lat && item.lon) {
            const marker = L.marker([item.lat, item.lon])
                .bindPopup(`
                    <b>${item.manufacturer}</b><br>
                    ${item.date}<br>
                    ${item.severity}<br><br>
                    ${item.description}
                `);

            marker.addTo(map);
            markers.push(marker);
        }
    });
}

function focusMapOnItem(item) {
    if (item.lat && item.lon) {
        map.setView([item.lat, item.lon], 13);
        // Find marker and open popup logic could go here
    }
}
