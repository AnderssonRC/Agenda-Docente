// firebase-data.js  (módulo ES)
// Reemplaza el uso de localStorage de cada módulo por Firestore, guardando
// la data bajo usuarios/{uid}/datos/{clave}. Cada "clave" (p.ej. materias,
// actividades) se guarda como UN documento con un campo `items` que es la
// lista completa — así encaja con la forma en que los módulos ya leen/guardan
// listas enteras, y no hay que reescribir su lógica interna.
//
// Con la caché local persistente activada en firebase-config.js, getDoc
// devuelve primero la copia en disco (instantánea) y sincroniza con la nube
// en segundo plano, por lo que las visitas repetidas cargan casi al momento.
//
// Expone en window.AgendaData:
//   await AgendaData.ready            -> resuelve cuando hay sesión (uid listo)
//   await AgendaData.getList(clave, seedSiVacio?)  -> Array
//   await AgendaData.saveList(clave, lista)        -> void
// y window.__agendaDataReady -> promesa que resuelve con AgendaData listo.

import { db } from "./firebase-config.js";
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const AgendaData = {
  _uid: null,
  ready: null,

  _docRef(clave) {
    return doc(db, "usuarios", this._uid, "datos", clave);
  },

  async getList(clave, seedSiVacio) {
    await this.ready;
    const snap = await getDoc(this._docRef(clave));
    if (snap.exists() && Array.isArray(snap.data().items)) {
      return snap.data().items;
    }
    if (Array.isArray(seedSiVacio) && seedSiVacio.length) {
      await this.saveList(clave, seedSiVacio);
      return seedSiVacio;
    }
    return [];
  },

  async saveList(clave, lista) {
    await this.ready;
    await setDoc(this._docRef(clave), {
      items: Array.isArray(lista) ? lista : [],
      actualizado: Date.now()
    });
  }
};

AgendaData.ready = (async () => {
  // auth-guard.js debe haber puesto esta promesa antes de cargar este módulo.
  const session = await window.__agendaSession;
  AgendaData._uid = session.uid;
  return session;
})();

window.AgendaData = AgendaData;

// Promesa que los .dc.html esperan antes de leer datos. Resuelve cuando la
// sesión (y por tanto el uid) está lista, sin importar el orden de carga.
window.__agendaDataReady = AgendaData.ready.then(() => AgendaData);

export default AgendaData;