import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "modular-plateau-7gtt6",
  appId: "1:157406072124:web:13cb76d62239e4cd6ce239",
  apiKey: "AIzaSyD7p4Ex809nnQRN0zIxjek0REhB303E0L0",
  authDomain: "modular-plateau-7gtt6.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-a2017bf2-9d41-419a-a708-7cb9a9f70c66",
  storageBucket: "modular-plateau-7gtt6.firebasestorage.app",
  messagingSenderId: "157406072124",
  measurementId: ""
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate connection as per instruction:
// "CRITICAL CONSTRAINT: When the application initially boots, call getFromServer to test the connection."
import { collection, getDocs } from 'firebase/firestore';

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase Connection Successful!");
    
    // Diagnostic log for debugging database contents
    const resSnap = await getDocs(collection(db, 'residents'));
    console.log("DIAGNOSTIC: Residents in Firestore:");
    resSnap.forEach(d => {
      console.log(` - ID: ${d.id}, Name: ${d.data().name}, Room: ${d.data().roomNumber}`);
    });

    const repSnap = await getDocs(collection(db, 'reports'));
    console.log("DIAGNOSTIC: Reports in Firestore:");
    repSnap.forEach(d => {
      console.log(` - ReportID: ${d.id}, ResidentID: ${d.data().residentId}, Date: ${d.data().date}`);
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline.");
    } else {
      console.log("Firebase connection response:", error);
    }
  }
}
testConnection();
