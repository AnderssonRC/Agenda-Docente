// session.js — inicio de sesión y perfil del docente.
//
// Estado público (getSession / onSession):
//   { status: 'cargando' }                         comprobando sesión
//   { status: 'fuera', motivo? }                   mostrar login
//   { status: 'dentro', user, perfil, esAdmin }    app disponible
//
// Para que la app abra al instante, el perfil aprobado se guarda en el
// navegador. Al recargar se usa esa copia de inmediato y se confirma con
// Firestore en segundo plano; si el admin lo bloqueó, se cierra la sesión.

import {
  auth, db, doc, getDoc, setDoc,
  onAuthStateChanged, signOut,
  signInWithEmailAndPassword, createUserWithEmailAndPassword
} from "./firebase.js";
import { setUsuario } from "./data.js";

const CLAVE_CACHE = "agenda_perfil";

let estado = { status: "cargando" };
const subs = new Set();
let ignorarCambios = false; // durante el registro

export function getSession() { return estado; }
export function onSession(fn) { subs.add(fn); return () => subs.delete(fn); }

function publicar(nuevo) {
  estado = nuevo;
  subs.forEach(fn => fn(estado));
}

function leerCache(uid) {
  try {
    const c = JSON.parse(localStorage.getItem(CLAVE_CACHE) || "null");
    return c && c.uid === uid ? c.perfil : null;
  } catch { return null; }
}
function guardarCache(uid, perfil) {
  try { localStorage.setItem(CLAVE_CACHE, JSON.stringify({ uid, perfil })); } catch {}
}
function borrarCache() {
  try { localStorage.removeItem(CLAVE_CACHE); } catch {}
}

function entrar(user, perfil) {
  setUsuario(user.uid);
  publicar({ status: "dentro", user, perfil, esAdmin: perfil.rol === "admin" });
}
function salir(motivo) {
  setUsuario(null);
  publicar({ status: "fuera", motivo });
}

onAuthStateChanged(auth, async (user) => {
  if (ignorarCambios) return;

  if (!user) {
    if (estado.status !== "fuera") salir();
    return;
  }

  const cache = leerCache(user.uid);
  if (cache && cache.aprobado && estado.status !== "dentro") entrar(user, cache);

  let perfil;
  try {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    perfil = snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("No se pudo leer el perfil:", e);
    if (estado.status === "dentro") return; // sin conexión: seguimos con la copia local
    perfil = undefined;
  }

  // Si mientras tanto cambió el usuario, ignoramos esta respuesta.
  if (!auth.currentUser || auth.currentUser.uid !== user.uid) return;

  if (perfil === undefined) {
    await signOut(auth).catch(() => {});
    salir("error");
    return;
  }
  if (!perfil) {
    borrarCache();
    await signOut(auth).catch(() => {});
    salir("sin-perfil");
    return;
  }
  if (!perfil.aprobado) {
    borrarCache();
    await signOut(auth).catch(() => {});
    salir("pendiente");
    return;
  }

  guardarCache(user.uid, perfil);
  const igual = cache && JSON.stringify(cache) === JSON.stringify(perfil);
  if (!(igual && estado.status === "dentro")) entrar(user, perfil);
});

export async function iniciarSesion(email, pass) {
  await signInWithEmailAndPassword(auth, email, pass);
  // El resto (verificar aprobación y abrir la app) lo hace onAuthStateChanged.
}

/** Crea la cuenta y el perfil pendiente; luego cierra la sesión hasta que un admin apruebe. */
export async function registrar(nombre, email, pass) {
  ignorarCambios = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    // Las reglas obligan aprobado:false y rol:docente al crear.
    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nombre, email, aprobado: false, rol: "docente", creado: Date.now()
    });
  } finally {
    await signOut(auth).catch(() => {});
    ignorarCambios = false;
  }
}

export async function cerrarSesion() {
  borrarCache();
  if (location.hash && location.hash !== "#/") location.hash = "#/";
  await signOut(auth).catch(() => {});
}
