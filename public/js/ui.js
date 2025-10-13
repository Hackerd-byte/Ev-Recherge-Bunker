export function showBunks(list) {
  const container = document.getElementById("bunk-list");
  container.innerHTML = "";
  list.forEach(b => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${b.name}</h3>
      <p>${b.address}</p>
      <p>Slots: ${b.totalSlots}</p>
      <button onclick="window.location='bunk.html?id=${b.id}'">View</button>
    `;
    container.appendChild(div);
  });
}
