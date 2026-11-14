// data.js — datos de cada docente en Firestore.
//
// Cada "clave" (materias, actividades, …) es un documento en
// usuarios/{uid}/datos/{clave} con un campo `items` que guarda la lista completa.
//
// Cada clave se escucha en vivo (onSnapshot) una sola vez por sesión y su
// valor queda en memoria. Así:
//   - la primera lectura sale de la caché del navegador (casi instantánea);
//   - al volver a un módulo los datos ya están listos;
//   - si cambias algo en otra pestaña o dispositivo, se actualiza solo.
//
// Uso:
//   const dejar = watch(['materias', 'actividades'], (d) => { d.materias; d.actividades; });
//   saveList('materias', nuevaLista);
//   dejar();  // al salir de la vista

import { db, doc, onSnapshot, setDoc } from "./firebase.js";

let uid = null;
const entradas = new Map();
const avisos = new Set();

/** Recibe mensajes de error para mostrarlos al usuario. Devuelve la función para dejar de escuchar. */
export function onDataError(fn) { avisos.add(fn); return () => avisos.delete(fn); }
function avisar(msg, err) {
  console.error(msg, err);
  avisos.forEach(fn => fn(msg));
}

/** La sesión llama a esto al entrar o salir; limpia todo lo del usuario anterior. */
export function setUsuario(nuevoUid) {
  if (nuevoUid === uid) return;
  entradas.forEach(e => { e.unsub && e.unsub(); clearTimeout(e.timer); });
  entradas.clear();
  uid = nuevoUid;
}

function ref(clave) { return doc(db, "usuarios", uid, "datos", clave); }

function notificar(e) { e.subs.forEach(fn => fn()); }

function marcarListo(e) {
  clearTimeout(e.timer);
  e.listo = true;
  notificar(e);
}

function entrada(clave, semilla) {
  let e = entradas.get(clave);
  if (e) return e;
  if (!uid) throw new Error("data.js: no hay sesión");

  e = { items: [], listo: false, subs: new Set(), unsub: null, timer: null };
  entradas.set(clave, e);

  // Si no hay conexión y el documento no está en caché, no esperamos para
  // siempre: a los 8 s se muestra la lista vacía.
  e.timer = setTimeout(() => { if (!e.listo) marcarListo(e); }, 8000);

  e.unsub = onSnapshot(ref(clave), (snap) => {
    const d = snap.exists() ? snap.data() : null;
    if (d && Array.isArray(d.items)) {
      e.items = d.items;
      marcarListo(e);
      return;
    }
    // "No existe" según la caché local: esperamos la respuesta del servidor
    // antes de dar la lista por vacía (evita pisar datos reales).
    if (snap.metadata.fromCache) return;
    if (Array.isArray(semilla) && semilla.length) { saveList(clave, semilla); return; }
    e.items = [];
    marcarListo(e);
  }, (err) => {
    avisar("No se pudieron cargar tus datos. Revisa tu conexión.", err);
    marcarListo(e);
  });
  return e;
}

/**
 * Escucha varias claves. `cb` se llama cuando TODAS están cargadas y después
 * con cada cambio. `semillas` (opcional) = { clave: listaInicialSiNoExiste }.
 * Devuelve una función para dejar de escuchar.
 */
export function watch(claves, cb, semillas = {}) {
  const es = claves.map(c => entrada(c, semillas[c]));
  const emitir = () => {
    if (!es.every(e => e.listo)) return;
    const out = {};
    claves.forEach((c, i) => { out[c] = es[i].items; });
    cb(out);
  };
  es.forEach(e => e.subs.add(emitir));
  emitir();
  return () => es.forEach(e => e.subs.delete(emitir));
}

/** Guarda la lista completa de una clave. La interfaz se actualiza al instante. */
export function saveList(clave, lista) {
  const e = entrada(clave);
  e.items = Array.isArray(lista) ? lista : [];
  marcarListo(e);
  return setDoc(ref(clave), { items: e.items, actualizado: Date.now() })
    .catch(err => avisar("No se pudo guardar el último cambio. Revisa tu conexión.", err));
}
