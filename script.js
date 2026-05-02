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

function getRandomPoint(lat, lng, distanceKm) {
    const R = 6371;  // Earth radius in km

    const bearing = Math.random() * 2 * Math.PI;

    const d = distanceKm / R;

    const lat1 = (lat * Math.PI) / 180;
    const lng1 = (lng * Math.PI) / 180;

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(d) +
            Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
    );

    const lng2 =
        lng1 +
        Math.atan2(
            Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
            Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
        );

    return [ (lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
}

// v2: use ORS walking route API
async function generateRoute() {
    if (!userLocation) return;

    const distanceKm = parseFloat(document.getElementById("distance").value) || 3;

    const [lat, lng] = userLocation;

    const destination = getRandomPoint(lat, lng, distanceKm / 2);

    const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjA1NmU5MmFkZmJjYjQ2MTE5ZjIyNjdiYjNjZTY0YWEyIiwiaCI6Im11cm11cjY0In0=";

    const response = await fetch(
        "https://api.openrouteservice.org/v2/directions/foot-walking",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: apiKey,
            },
            body: JSON.stringify({
                coordinates: [
                    [lng, lat],
                    [destination[1], destination[0]],
                    [lng, lat],
                ],
            }),
        }
    );

    const data = await response.json()

    const encoded = data.routes[0].geometry;
    const decoded = polyline.decode(encoded);
    const coords = decoded;

    if (routeLayer) {
        map.removeLayer(routeLayer);
    }

    routeLayer = L.polyline(coords, { color: "#4ea1ff" }).addTo(map);

    map.fitBounds(routeLayer.getBounds());
}

// button listener
document.getElementById("generate").addEventListener("click", generateRoute);