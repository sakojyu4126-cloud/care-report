import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

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

// Initialize Firestore with Persistent IndexedDB Cache and Multi-Tab sync.
// This prevents re-downloading entire collections on every page refresh or tab open,
// dramatically reducing read quota consumption by up to 90-95%.
export const db = initializeFirestore(
  app,
  {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  },
  firebaseConfig.firestoreDatabaseId
);
