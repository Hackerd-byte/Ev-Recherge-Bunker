import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { initAuth, login, register, logout } from "./auth.js";
import { initDB, addBunk, getBunks, getBunk } from "./bunkservice.js";
import { initMap, addMarker } from "./map.js";
import { showBunks } from "./ui.js";

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

// Page logic
document.addEventListener("DOMContentLoaded", async () => {
  const path = location.pathname;

  // Home Page (index.html)
  if (path.endsWith("index.html") || path === "/") {
    const map = initMap("map");
    const bunks = await getBunks();
    bunks.forEach(b => addMarker(map, b, () => {
      window.location = `bunk.html?id=${b.id}`;
    }));
    showBunks(bunks);
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
  }
});
