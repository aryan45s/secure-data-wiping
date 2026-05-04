import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBJfsg21ves7rbAnm5yhr-uomKTOAGserE",
  authDomain: "data-wiping-6bb65.firebaseapp.com",
  projectId: "data-wiping-6bb65",
  storageBucket: "data-wiping-6bb65.firebasestorage.app",
  messagingSenderId: "1045097459058",
  appId: "1:1045097459058:web:e6988713b7ccee5e2601eb"
};

let app, db;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (error) {
  console.warn("Firebase initialization failed. Please check your configuration.", error);
}

export const saveCertificate = async (certificateData) => {
  if (!db) {
    console.warn("Firebase is not initialized. Certificate data will not be saved to the cloud.");
    return null;
  }
  try {
    const docRef = await addDoc(collection(db, "certificates"), certificateData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const getCertificateById = async (certificateId) => {
  if (!db) return null;
  try {
    const q = query(collection(db, "certificates"), where("certificateId", "==", certificateId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data(); // Return the first matching certificate
    }
    return null;
  } catch (error) {
    console.error("Error fetching document: ", error);
    return null;
  }
};
