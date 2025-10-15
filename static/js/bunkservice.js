import {getFirestore,collection,addDoc,doc,getDocs,getDoc,runTransaction,serverTimestamp,updateDoc,setDoc,onSnapshot} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

let db;


// Initialize Firestore
export function initDB(app) {
  db = getFirestore(app);
  console.log("Firestore initialized");
}

// Add New Bunk with Slots
export async function addBunk(bunk) {
  try {
    bunk.createdAt = serverTimestamp();
    const bunkRef = await addDoc(collection(db, "bunks"), bunk);
    for (let i = 1; i <= bunk.totalSlots; i++) {
      const slotRef = doc(collection(db, `bunks/${bunkRef.id}/slots`));
      await setDoc(slotRef, {
        slotNumber: i,
        type: i % 2 === 0 ? "Fast" : "Normal",
        status: "available",
        userId: null,
        createdAt: serverTimestamp()
      });
    }

    console.log(`Bunk added: ${bunk.name} with ${bunk.totalSlots} slots`);
    return bunkRef.id;
  } catch (error) {
    console.error("Error adding bunk:", error);
  }
}

// Get All Bunks
export async function getBunks() {
  const snap = await getDocs(collection(db, "bunks"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Get Single Bunk by ID
export async function getBunk(id) {
  const ref = doc(db, "bunks", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Bunk not found");
  return { id: snap.id, ...snap.data() };
}

// Get Slots for a Bunk
export async function getSlots(bunkId) {
  const snap = await getDocs(collection(db, `bunks/${bunkId}/slots`));
  const now = new Date();

  return snap.docs.map(d => {
    const slot = { id: d.id, ...d.data() };

    if (slot.status === "occupied" && slot.bookedAt?.toDate) {
      const bookedAt = slot.bookedAt.toDate();
      console.log(bookedAt); // Firestore Timestamp → JS Date
      const diffHours = (now - bookedAt) / (1000 * 60 * 60);

      if (diffHours >= SLOT_DURATION_HOURS) {
        slot.status = "available";  // Temporarily mark as available
      }
    }

    return slot;
  });

}

// Live Slot Updates (Realtime)
export function watchSlots(bunkId, callback) {
  const slotsRef = collection(db, `bunks/${bunkId}/slots`);
  return onSnapshot(slotsRef, (snapshot) => {
    const slots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(slots);
  });
}

// Book Slot (Transaction-safe)
export async function bookSlot(bunkId, slotId, userId) {
  const slotRef = doc(db, "bunks", bunkId, "slots", slotId);

  return runTransaction(db, async (tx) => {
    const slotSnap = await tx.get(slotRef);

    if (!slotSnap.exists()) throw new Error("Slot not found");
    if (slotSnap.data().status !== "available") throw new Error("Slot already occupied");

    tx.update(slotRef, {
      status: "occupied",
      userId: userId,
      bookedAt: serverTimestamp()
    });
  });
}

// -----------------------------
// Release Slot (Set Available)
// -----------------------------
export async function releaseSlot(bunkId, slotId) {
  const slotRef = doc(db, "bunks", bunkId, "slots", slotId);
  await updateDoc(slotRef, {
    status: "available",
    userId: null,
    releasedAt: serverTimestamp()
  });
}
