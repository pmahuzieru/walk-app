let map;
let userLocation = null;
let routeLayer = null;

// Initialize map
function initMap(lat, lng) {
    map = L.map("map").setView([lat, lng], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();
}

// Get user location
navigator.geolocation.getCurrentPosition(
    (pos) => {
        const { latitude, longitude } = pos.coords;
        userLocation = [latitude, longitude];
        initMap(latitude, longitude);
    },
    () => {
        alert("Could not get location");
    }
);

// Generate random route (basic v1)
function generateRoute() {
    if (!userLocation) return;

    const distanceKm = parseFloat(document.getElementById("distance").value) || 3;

    const [lat, lng] = userLocation;

    // simple random offsets
    const offset = distanceKm / 100;

    const pointA = [
        lat + (Math.random() - 0.5) * offset,
        lng + (Math.random() - 0.5) * offset,
    ];

    const pointB = [
        lat + (Math.random() - 0.5) * offset,
        lng + (Math.random() - 0.5) * offset,
    ];

    const route = [userLocation, pointA, pointB, userLocation];

    // remove previous route
    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    routeLayer = L.polyline(route, { color: "#4ea1ff"}).addTo(map);

    map.fitBounds(routeLayer.getBounds());
}

// button listener
document.getElementById("generate").addEventListener("click", generateRoute);