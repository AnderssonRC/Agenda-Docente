// auth-guard.js  (módulo ES)
// Protege cualquier página de la app: si no hay sesión válida y aprobada,
// redirige a login.html. Expone una promesa `sessionReady` que resuelve con
// el usuario de Firebase + su perfil de Firestore, para que la capa de datos
// sepa bajo qué uid guardar.
//
// Uso en una página protegida (login/admin NO usan esto):
//   <script type="module">
//     import { sessionReady } from './auth-guard.js';
//     window.__agendaSession = sessionReady;   // la capa de datos lo espera
//   </script>

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const LOGIN_URL = "login.html";

// Oculta el contenido hasta confirmar la sesión, para que no "parpadee"
// la app antes de una posible redirección.
const style = document.createElement("style");
style.textContent = "body{visibility:hidden}";
document.head.appendChild(style);
function revelar() { style.remove(); }

function irALogin(motivo) {
  const url = new URL(LOGIN_URL, location.href);
  if (motivo) url.searchParams.set("motivo", motivo);
  location.replace(url.toString());
}

export const sessionReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) { irALogin(); return; }

    let perfil = null;
    try {
      const snap = await getDoc(doc(db, "usuarios", user.uid));
      perfil = snap.exists() ? snap.data() : null;
    } catch (e) {
      // Si las reglas o la red fallan, por seguridad tratamos como no-aprobado.
      perfil = null;
    }

    if (!perfil) {
      // Registrado en Auth pero sin documento de perfil (caso raro): a login.
      await signOut(auth).catch(() => {});
      irALogin("sin-perfil");
      return;
    }

    if (!perfil.aprobado) {
      irALogin("pendiente");
      return;
    }

    revelar();
    resolve({ uid: user.uid, email: user.email, perfil });
  });
});

// Utilidad para botones de "Cerrar sesión" en las páginas.
export async function cerrarSesion() {
  await signOut(auth).catch(() => {});
  irALogin();
}
