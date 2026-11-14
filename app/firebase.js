// firebase.js
// Inicializa Firebase una sola vez para toda la app y reexporta las funciones
// que se usan. La versión del SDK vive solo aquí.
//
// La config es pública por diseño: lo que protege los datos son las Reglas
// de Firestore (firestore.rules), no estas claves.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

export {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGwWeZOgqgwQlQw57YuM1u778v9--ct4M",
  authDomain: "agenda-docente-dcfc9.firebaseapp.com",
  projectId: "agenda-docente-dcfc9",
  storageBucket: "agenda-docente-dcfc9.firebasestorage.app",
  messagingSenderId: "622939152881",
  appId: "1:622939152881:web:7af88915da0b7ab8322450"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Caché local persistente: los datos aparecen al instante desde el disco
// y se sincronizan con la nube en segundo plano. Si el navegador no lo
// soporta, se usa Firestore normal.
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });
} catch (e) {
  dbInstance = getFirestore(app);
}
export const db = dbInstance;
