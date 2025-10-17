import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { initAuth, login, register, logout } from "./auth.js";
import {
  initDB,
  addBunk,
  getBunks,
  getBunk,
  getSlots,
  watchSlots,
  bookSlot,
} from "./bunkservice.js";
import { showBunks } from "./ui.js";

// -----------------------------
// Firebase Config
// -----------------------------
const firebaseConfig = {
  apiKey: "AIzaSyAZfXN8EO_NxnZk4N6H18wA1TktwR5wsYw",
  authDomain: "ev-recharge-bunker.firebaseapp.com",
  projectId: "ev-recharge-bunker",
  storageBucket: "ev-recharge-bunker.firebasestorage.app",
  messagingSenderId: "628165718463",
  appId: "1:628165718463:web:e0c150ae49c61c5f48310a",
};

// -----------------------------
// Initialize Firebase
// -----------------------------
const app = initializeApp(firebaseConfig);
const auth = initAuth(app);
initDB(app);

document.addEventListener("DOMContentLoaded", async () => {
  const path = location.pathname.split("/").pop() || "index.html";
  console.log("Current Path:", path);

  // -----------------------------
  // HOME PAGE
  // -----------------------------
  if (path === "index.html" || path === "") {
    const map = L.map("map").setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const bunks = await getBunks();
    bunks.forEach((bunk) => {
      const marker = L.marker([bunk.lat, bunk.lng]).addTo(map);
      marker.bindPopup(`
        <strong>${bunk.name}</strong><br>
        ${bunk.address}<br>
        <button class="popup-btn" onclick="window.location.href='bunk.html?id=${bunk.id}'">View</button>
      `);
    });
    showBunks(bunks);
  }

  // -----------------------------
  // ADMIN PAGE
  // -----------------------------
  if (path === "admin.html") {
    const logoutBtn = document.getElementById("adminLogout");

    onAuthStateChanged(auth, (user) => {
      if (user) {
        logoutBtn.disabled = false;
        logoutBtn.onclick = async () => {
          try {
            await logout(auth); 
            alert("Logged out successfully!");
          } catch (err) {
            console.error("Logout error:", err);
          }
        };
      } else {
        logoutBtn.disabled = true;
        logoutBtn.onclick = () =>
          alert("You must be logged in to log out.");
      }
    });

    document.getElementById("adminSignup").onclick = async () => {
      try {
        await register(auth, adminEmail.value, adminPassword.value);
        alert("Admin registered successfully!");
      } catch (err) {
        console.error("Register error:", err);
        alert(err.message);
      }
    };

    document.getElementById("adminLogin").onclick = async () => {
      try {
        await login(auth, adminEmail.value, adminPassword.value);
      } catch (err) {
        console.error("Login error:", err);
        alert(err.message);
      }
    };

    document.getElementById("createBunkForm").onsubmit = async (e) => {
      e.preventDefault();
      const bunk = {
        name: bunkName.value.trim(),
        address: bunkAddress.value.trim(),
        phone: bunkPhone.value.trim(),
        lat: parseFloat(bunkLat.value),
        lng: parseFloat(bunkLng.value),
        totalSlots: parseInt(bunkSlots.value),
      };
      try {
        await addBunk(bunk);
        alert("EV Bunk created successfully!");
        e.target.reset();
      } catch (err) {
        console.error("Add bunk error:", err);
        alert(err.message);
      }
    };
  }

  // -----------------------------
  // BUNK DETAILS PAGE
  // -----------------------------
  if (path === "bunk.html") {
    const params = new URLSearchParams(location.search);
    const bunkId = params.get("id");
    const bunk = await getBunk(bunkId);

    const slotContainer = document.getElementById("slotContainer");

    // Display bunk info
    document.getElementById("bunkDetails").innerHTML = `
      <h2>${bunk.name}</h2>
      <p>${bunk.address}</p>
      <p>📞 ${bunk.phone}</p>
      <p>Total Slots: ${bunk.totalSlots}</p>
    `;

    // Function to render slots
    const renderSlots = (slots) => {
      slotContainer.innerHTML = "";

      if (!slots.length) {
        slotContainer.innerHTML = `<p style="color:#ccc;text-align:center;">No slots available yet.</p>`;
        return;
      }

      slots.forEach((slot) => {
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
            const user = auth.currentUser;
            if (!user) return alert("Please log in before booking!");
            try {
              await bookSlot(bunkId, slot.id, user.uid);
              alert(`✅ Slot ${slot.slotNumber} booked successfully!`);
            } catch (err) {
              alert("⚠️ " + (err.message || err));
            }
          });
        }

        slotContainer.appendChild(slotDiv);
      });
    };

    // Initial load (with expiry release)
    const initialSlots = await getSlots(bunkId);
    renderSlots(initialSlots);

    // Realtime updates
    watchSlots(bunkId, renderSlots);

    // Map
    const map = L.map("slotMap").setView([bunk.lat, bunk.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    L.marker([bunk.lat, bunk.lng]).addTo(map).bindPopup(bunk.name).openPopup();
  }
});
