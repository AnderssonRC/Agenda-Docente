// panel.js — Pantalla dividida (solo tablet y computador).
//
// - `PanelCtx` le dice a cada módulo si está en pantalla dividida y qué
//   elementos debe mostrar (según la configuración del docente).
// - `abrirDivision(ruta)` / `cerrarDivision()` controlan el segundo panel.
// - La configuración se guarda en usuarios/{uid}/datos/config_pantalla, así que
//   se respeta en todos los dispositivos del docente.
import { createContext } from "./lib.js";

/** Ancho mínimo de pantalla para ofrecer la división (tablet en adelante). */
export const ANCHO_DIVISION = 768;
export const CLAVE_CONFIG = "config_pantalla";

/**
 * Elementos que se pueden ocultar en pantalla dividida, por módulo.
 * `alto` = proporción aproximada para la previsualización.
 */
export const ELEMENTOS = {
  clases: {
    titulo: "Diseño de Clase",
    items: [
      { id: "encabezado", label: "Encabezado", alto: 1 },
      { id: "barra", label: "Barra lateral de cursos", lado: true },
      { id: "resumen", label: "Resumen (planeadas / realizadas)", alto: 1 },
      { id: "lista", label: "Clases planeadas", alto: 4, fijo: true },
      { id: "panel", label: "Panel de actividades y gráfico", lado: "der" },
      { id: "boton", label: "Botón de nueva clase", flotante: true }
    ]
  },
  participacion: {
    titulo: "Participación de Clase",
    items: [
      { id: "encabezado", label: "Encabezado", alto: 1 },
      { id: "pestanas", label: "Pestañas de cursos", alto: 0.6 },
      { id: "resumen", label: "Resumen (estudiantes / puntos hoy)", alto: 1 },
      { id: "buscador", label: "Buscador", alto: 0.6 },
      { id: "lista", label: "Listado de estudiantes", alto: 4, fijo: true },
      { id: "botones", label: "Botones rápidos − / +", enLista: true }
    ]
  },
  seguimiento: {
    titulo: "Seguimiento de Estudiantes",
    items: [
      { id: "encabezado", label: "Encabezado", alto: 1 },
      { id: "pestanas", label: "Pestañas de cursos", alto: 0.6 },
      { id: "resumen", label: "Semáforo (alerta / proceso / sin novedad)", alto: 1 },
      { id: "vistas", label: "Botones Listado / Ranking", alto: 0.6 },
      { id: "buscador", label: "Buscador", alto: 0.6 },
      { id: "lista", label: "Listado de estudiantes", alto: 4, fijo: true }
    ]
  }
};

/** Lo que viene oculto por defecto en pantalla dividida (lo menos necesario). */
export const OCULTOS_POR_DEFECTO = ["clases.panel", "clases.resumen", "participacion.resumen", "seguimiento.resumen"];

/** Lee la configuración guardada (lista con un solo objeto). */
export function leerOcultos(items) {
  const c = Array.isArray(items) && items.find(x => x && x.id === "pantalla");
  return new Set(c && Array.isArray(c.ocultos) ? c.ocultos : OCULTOS_POR_DEFECTO);
}
export function itemsConfig(ocultos) {
  return [{ id: "pantalla", ocultos: Array.from(ocultos) }];
}

/**
 * Valor por defecto: fuera de la pantalla dividida todo se ve.
 * ver(modulo, elemento) -> boolean
 */
export const PanelCtx = createContext({
  dividido: false,
  secundario: false,
  ruta: "",
  ver: () => true
});

/* ---------- estado de la división ---------- */

let estado = { ruta: null };
const subs = new Set();
const emitir = () => subs.forEach(fn => fn(estado));

export function onDivision(fn) { subs.add(fn); fn(estado); return () => subs.delete(fn); }
export function abrirDivision(ruta) { estado = { ruta }; emitir(); }
export function cerrarDivision() { if (estado.ruta) { estado = { ruta: null }; emitir(); } }
export function divisionActual() { return estado.ruta; }

export function pantallaAmplia() {
  return typeof window !== "undefined" && window.innerWidth >= ANCHO_DIVISION;
}
