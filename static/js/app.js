import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { initAuth, login, register, logout } from "./auth.js";
import { initDB, addBunk, getBunks, getBunk } from "./bunkservice.js";
import { showBunks } from "./ui.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZfXN8EO_NxnZk4N6H18wA1TktwR5wsYw",
  authDomain: "ev-recharge-bunker.firebaseapp.com",
  projectId: "ev-recharge-bunker",
  storageBucket: "ev-recharge-bunker.firebasestorage.app",
  messagingSenderId: "628165718463",
  appId: "1:628165718463:web:e0c150ae49c61c5f48310a"
};

const app = initializeApp(firebaseConfig);
const auth = initAuth(app);
initDB(app);

// -----------------------------
// Leaflet map initializer
// -----------------------------
async function initLeafletMap(containerId) {
  // Create base map centered on India
  const map = L.map(containerId).setView([20.5937, 78.9629], 5);

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Fetch bunks and add markers
  const bunks = await getBunks();
  bunks.forEach(bunk => {
    const marker = L.marker([bunk.lat, bunk.lng]).addTo(map);
    marker.bindPopup(`
      <strong>${bunk.name}</strong><br>
      ${bunk.address}<br>
      <button onclick="window.location='bunk.html?id=${bunk.id}'">View</button>
    `);
  });

  // Also show list view
  showBunks(bunks);
}

// -----------------------------
// Page logic
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  const path = location.pathname;

  // Home Page (index.html)
  if (path.endsWith("index.html") || path === "/" || path === "/public/") {
    await initLeafletMap("map");
  }

  // Admin Page
  if (path.endsWith("admin.html")) {
    document.getElementById("adminSignup").onclick = async () => {
      await register(auth, adminEmail.value, adminPassword.value);
      alert("Admin registered!");
    };
    document.getElementById("adminLogin").onclick = async () => {
      await login(auth, adminEmail.value, adminPassword.value);
      alert("Admin logged in!");
    };
    document.getElementById("adminLogout").onclick = async () => {
      await logout(auth);
      alert("Logged out!");
    };

    document.getElementById("createBunkForm").onsubmit = async (e) => {
      e.preventDefault();
      const bunk = {
        name: bunkName.value,
        address: bunkAddress.value,
        phone: bunkPhone.value,
        lat: parseFloat(bunkLat.value),
        lng: parseFloat(bunkLng.value),
        totalSlots: parseInt(bunkSlots.value)
      };
      await addBunk(bunk);
      alert("Bunk created successfully!");
      e.target.reset();
    };
  }

  // Bunk Details
  if (path.endsWith("bunk.html")) {
    const params = new URLSearchParams(location.search);
    const bunkId = params.get("id");
    const bunk = await getBunk(bunkId);
    document.getElementById("bunkDetails").innerHTML = `
      <h2>${bunk.name}</h2>
      <p>${bunk.address}</p>
      <p>Contact: ${bunk.phone}</p>
      <p>Slots: ${bunk.totalSlots}</p>
    `;

    // Optional mini map on bunk page
    const map = L.map("slotList").setView([bunk.lat, bunk.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([bunk.lat, bunk.lng]).addTo(map).bindPopup(bunk.name).openPopup();
  }
});
