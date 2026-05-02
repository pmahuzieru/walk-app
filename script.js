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

function getLoopPoints(lat, lng, distanceKm) {
    console.log("getting loop points");
    const R = 6371;  // Earth radius in km

    const baseBearing = Math.random() * 2 * Math.PI;

    // spread points ~60-120 degrees apart
    const angleOffset = (Math.PI / 3) + Math.random() * (Math.PI / 3);

    const d = (distanceKm * (0.4 + Math.random() * 0.2)) / R;

    console.log(`baseBearing=${baseBearing}, angleOffset=${angleOffset}, d=${d}`);

    function computePoint(bearing) {
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

        return [(lat2 * 180) / Math.PI, (lng2 * 180) / Math.PI];
    }

    const pointA = computePoint(baseBearing);
    const pointB = computePoint(baseBearing + angleOffset);
    console.log(`pointA=${pointA}, pointB=${pointB}`);

    return [pointA, pointB];
}

// v2: use ORS walking route API
async function generateRoute() {
    console.log("generateRoute clicked");

    if (!userLocation) return;

    const distanceKm = parseFloat(document.getElementById("distance").value) || 3;

    const [lat, lng] = userLocation;

    const [A, B] = getLoopPoints(lat, lng, distanceKm);

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
                    [A[1], A[0]],
                    [B[1], B[0]],
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