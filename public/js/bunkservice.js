import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDocs,
  getDoc,
  runTransaction,
  serverTimestamp,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

let db;

export function initDB(app) {
  db = getFirestore(app);
}

// Add new bunk
export async function addBunk(bunk) {
  bunk.createdAt = serverTimestamp();
  const bunkRef = await addDoc(collection(db, "bunks"), bunk);
  return bunkRef.id;
}

// Get all bunks
export async function getBunks() {
  const snap = await getDocs(collection(db, "bunks"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get single bunk
export async function getBunk(id) {
  const ref = doc(db, "bunks", id);
  const snap = await getDoc(ref);
  return { id: snap.id, ...snap.data() };
}

// Create a booking (transaction)
export async function bookSlot(bunkId, slotId, userId) {
  const slotRef = doc(db, "bunks", bunkId, "slots", slotId);
  return runTransaction(db, async (tx) => {
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists()) throw "Slot not found";
    if (slotSnap.data().status !== "available") throw "Slot occupied";
    tx.update(slotRef, { status: "occupied", userId });
  });
}

// Update slot back to available
export async function releaseSlot(bunkId, slotId) {
  const slotRef = doc(db, "bunks", bunkId, "slots", slotId);
  await updateDoc(slotRef, { status: "available", userId: null });
}
