import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { initAuth, login, register, logout } from "./auth.js";
import {
  initDB,
  addBunk,
  getBunks,
  getBunk,
  watchSlots,
  bookSlot
} from "./bunkservice.js";
import { showBunks } from "./ui.js";
// import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.esm.js";

// -----------------------------
// Firebase Configuration
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAZfXN8EO_NxnZk4N6H18wA1TktwR5wsYw",
  authDomain: "ev-recharge-bunker.firebaseapp.com",
  projectId: "ev-recharge-bunker",
  storageBucket: "ev-recharge-bunker.firebasestorage.app",
  messagingSenderId: "628165718463",
  appId: "1:628165718463:web:e0c150ae49c61c5f48310a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initAuth(app);
initDB(app);

// -----------------------------
// Initialize Leaflet Map (Home Page)
// -----------------------------
async function initLeafletMap(containerId) {
  const map = L.map(containerId).setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(map);

  const bunks = await getBunks();
  bunks.forEach(bunk => {
    const marker = L.marker([bunk.lat, bunk.lng]).addTo(map);
    marker.bindPopup(`
      <strong>${bunk.name}</strong><br>
      ${bunk.address}<br>
      <button class="popup-btn" onclick="window.location='bunk.html?id=${bunk.id}'">View</button>
    `);
  });

  showBunks(bunks);
}

// -----------------------------
// Main Page Logic
// -----------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Get current page filename (works for localhost + Netlify)
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  console.log("Current Page:", currentPage);

  // -----------------------------
  // INDEX PAGE (Home)
  // -----------------------------
  if (currentPage === "index.html" || currentPage === "") {
    await initLeafletMap("map");
  }

  // -----------------------------
  // ADMIN PAGE
  // -----------------------------
  else if (currentPage === "admin.html") {
    const signupBtn = document.getElementById("adminSignup");
    const loginBtn = document.getElementById("adminLogin");
    const logoutBtn = document.getElementById("adminLogout");
    const form = document.getElementById("createBunkForm");

    if (signupBtn) {
      signupBtn.onclick = async () => {
        console.log("Admin register clicked");
        await register(auth, adminEmail.value, adminPassword.value);
        alert("Admin registered successfully!");
      };
    }

    if (loginBtn) {
      loginBtn.onclick = async () => {
        console.log("Admin login clicked");
        await login(auth, adminEmail.value, adminPassword.value);
        alert("Admin logged in!");
      };
    }

    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        console.log("Admin logout clicked");
        await logout(auth);
        alert("Logged out successfully!");
      };
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const bunk = {
          name: bunkName.value.trim(),
          address: bunkAddress.value.trim(),
          phone: bunkPhone.value.trim(),
          lat: parseFloat(bunkLat.value),
          lng: parseFloat(bunkLng.value),
          totalSlots: parseInt(bunkSlots.value)
        };

        await addBunk(bunk);
        alert("EV Bunk created successfully!");
        e.target.reset();
      };
    }
  }

  // -----------------------------
  // BUNK DETAILS PAGE
  // -----------------------------
  else if (currentPage === "bunk.html") {
    const params = new URLSearchParams(location.search);
    const bunkId = params.get("id");

    if (!bunkId) {
      alert("No bunk ID provided!");
      return;
    }

    const bunk = await getBunk(bunkId);
    if (!bunk) {
      alert("Bunk not found!");
      return;
    }

    // Display bunk details
    const bunkDetails = document.getElementById("bunkDetails");
    if (bunkDetails) {
      bunkDetails.innerHTML = `
        <h2>${bunk.name}</h2>
        <p>${bunk.address}</p>
        <p>📞 ${bunk.phone}</p>
        <p>Total Slots: ${bunk.totalSlots}</p>
      `;
    }

    // Real-time slot updates
    const slotContainer = document.getElementById("slotContainer");
    watchSlots(bunkId, (slots) => {
      slotContainer.innerHTML = "";
      if (!slots.length) {
        slotContainer.innerHTML = `<p style="color:#ccc;text-align:center;">No slots available yet.</p>`;
        return;
      }

      slots.forEach(slot => {
        const available = slot.status === "available";
        const slotDiv = document.createElement("div");
        slotDiv.className = `slot-card ${available ? "available" : "occupied"}`;
        slotDiv.innerHTML = `
          <h4>Slot ${slot.slotNumber} (${slot.type})</h4>
          <p>Status: <strong>${slot.status.toUpperCase()}</strong></p>
          <button ${!available ? "disabled" : ""}>${available ? "Book Now" : "Occupied"}</button>
        `;

        if (available) {
          slotDiv.querySelector("button").addEventListener("click", async () => {
            try {
              const user = auth.currentUser;
              if (!user) {
                alert("Please log in before booking!");
                return;
              }

              await bookSlot(bunkId, slot.id, user.uid);
              alert(`✅ Slot ${slot.slotNumber} booked successfully!`);
            } catch (err) {
              alert("⚠️ " + (err.message || err));
            }
          });
        }

        slotContainer.appendChild(slotDiv);
      });
    });

    // Mini map for bunk
    const map = L.map("slotMap").setView([bunk.lat, bunk.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    L.marker([bunk.lat, bunk.lng]).addTo(map).bindPopup(bunk.name).openPopup();
  }

  // -----------------------------
  // UNKNOWN PAGE (optional)
  // -----------------------------
  else {
    console.warn("⚠️ Unknown page:", currentPage);
  }
});
