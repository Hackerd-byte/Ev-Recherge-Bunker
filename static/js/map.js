// map.js — Leaflet (OpenStreetMap) based map utility

// Initialize the Leaflet map
export function initMap(containerId, center = { lat: 12.9716, lng: 77.5946 }, zoom = 12) {
  // Create the map
  const map = L.map(containerId).setView([center.lat, center.lng], zoom);

  // Add OpenStreetMap tile layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(map);

  return map;
}

// Add a bunk marker on the map
export function addMarker(map, bunk, onClick) {
  const marker = L.marker([bunk.lat, bunk.lng]).addTo(map);

  // Add a popup with bunk info
  marker.bindPopup(`
    <b>${bunk.name}</b><br>
    ${bunk.address || "No address provided"}<br>
    <button onclick="window.location='bunk.html?id=${bunk.id}'">View</button>
  `);

  // Optional click event callback
  if (onClick) marker.on("click", () => onClick(bunk));
}
