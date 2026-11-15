// clases.js — Diseño de Clase (cursos, asignaturas y clases diseñadas).
// Datos: usuarios/{uid}/datos/materias, .../actividades y .../clases_cursos
//   materias:      { id, nombre, curso, color }
//   actividades:   { id, materiaId, fecha, titulo, objetivo, keywords, momentos[],
//                    descripcion(html), contenido(html), recordar, archivos, estado }
//   clases_cursos: { nombre, color, notas }   (opciones de cada curso)
import { html, Component, createRef } from "../lib.js";
import { watch, saveList } from "../data.js";
import { uid, todayLocal, enFondo, css, ModuleHeader, Cargando } from "../ui.js";
import { PanelCtx } from "../panel.js";
import { escapar, parsearIA, promptIA } from "./clases-ia.js";

const TEMA = {
  header: "oklch(24% 0.025 50)", acento: "oklch(40% 0.08 35)",
  volver: "oklch(85% 0.02 65)", volverHover: "oklch(96% 0.01 70)",
  titulo: "oklch(97% 0.01 70)", sub: "oklch(65% 0.015 60)",
  tabActivo: "oklch(40% 0.08 35)", tabActivoBg: "oklch(96% 0.012 75)", tabInactivo: "oklch(65% 0.015 60)"
};

const COLORES = [
  "oklch(78% 0.27 145)", "oklch(75% 0.29 320)", "oklch(82% 0.19 200)", "oklch(80% 0.22 95)", "oklch(74% 0.26 30)", "oklch(72% 0.29 285)",
  "oklch(55% 0.11 48)", "oklch(55% 0.12 160)", "oklch(52% 0.14 250)", "oklch(55% 0.17 15)", "oklch(45% 0.03 60)"
];
const RESALTADOS = ["oklch(88% 0.19 100)", "oklch(80% 0.15 40)", "oklch(85% 0.13 145)", "oklch(82% 0.1 240)", "oklch(82% 0.15 350)"];
const SIN_CURSO = "__sin_curso__";
const COLOR_CURSO = "oklch(55% 0.11 48)";
const K_CURSOS = "clases_cursos";
const QR_SRC = "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";

const TINTA = "oklch(28% 0.03 50)", TINTA2 = "oklch(45% 0.02 55)", TINTA3 = "oklch(60% 0.015 60)";
const BORDE = "oklch(88% 0.014 60)", PAPEL = "oklch(99% 0.005 75)", FONDO = "oklch(96% 0.012 75)";
const ACENTO = "oklch(40% 0.08 35)", VERDE = "oklch(45% 0.08 145)", AMBAR = "oklch(50% 0.1 70)";

const LABEL = "display:block;font-size:11px;font-weight:700;margin-bottom:5px;color:" + ACENTO + ";text-transform:uppercase;letter-spacing:0.07em;";
const INPUT = "width:100%;padding:10px 12px;border:1.5px solid " + BORDE + ";border-radius:6px;font-size:14px;box-sizing:border-box;background:" + PAPEL + ";color:" + TINTA + ";font-family:inherit;";
const NOTA = "color:" + TINTA3 + ";font-weight:400;text-transform:none;";
const BTN_CANCELAR = "padding:12px 18px;background:transparent;color:" + TINTA2 + ";border:1.5px solid " + BORDE + ";border-radius:6px;font-size:14px;cursor:pointer;font-family:inherit;";
const BTN_OK = "flex:1;padding:12px;background:" + ACENTO + ";color:oklch(97% 0.01 70);border:none;border-radius:6px;font-size:14.5px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;";
const SECCION = "font-size:11.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:" + ACENTO + ";";
const TARJETA = "background:" + PAPEL + ";border:1px solid " + BORDE + ";border-radius:14px;box-shadow:0 1px 3px oklch(20% 0.02 50 / 0.06);";
const BTN_HERR = "min-width:30px;height:30px;padding:0 8px;border-radius:5px;border:1px solid " + BORDE + ";background:" + PAPEL + ";color:" + TINTA + ";font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;";

css("v-clases", `
  .dc-raiz{container-type:inline-size;}
  .dc-cuerpo{display:flex;flex:1;position:relative;min-height:0;}
  .dc-barra{position:absolute;z-index:60;top:0;left:0;bottom:0;width:min(290px,86%);background:oklch(97.5% 0.01 72);border-right:1px solid ${BORDE};
    box-shadow:8px 0 30px oklch(20% 0.02 50 / 0.18);overflow-y:auto;box-sizing:border-box;padding:16px 12px 30px;}
  .dc-velo{position:absolute;inset:0;z-index:55;background:oklch(20% 0.02 50 / 0.3);}
  .dc-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:22px;align-items:start;}
  @container (min-width:820px){
    .dc-barra{position:sticky;top:0;height:100vh;box-shadow:none;width:270px;flex:none;}
    .dc-velo{display:none;}
  }
  @container (min-width:1060px){ .dc-grid{grid-template-columns:minmax(0,1fr) 310px;} }
  .dc-item{display:flex;align-items:center;gap:9px;padding:8px 9px;border-radius:9px;cursor:pointer;color:${TINTA};}
  .dc-item:hover{background:oklch(93% 0.015 65);}
  .dc-item.on{background:oklch(91% 0.03 60);}
  .dc-puntos{width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:${TINTA3};cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none;padding:0;}
  .dc-puntos:hover{background:oklch(88% 0.02 60);color:${TINTA};}
  .dc-menu{position:absolute;right:4px;top:calc(100% + 2px);z-index:95;min-width:200px;background:${PAPEL};border:1px solid oklch(86% 0.02 60);border-radius:11px;padding:5px;box-shadow:0 14px 36px oklch(25% 0.03 50 / 0.24);}
  .dc-menu button{width:100%;display:flex;align-items:center;gap:9px;padding:9px 10px;border:none;background:transparent;border-radius:7px;font-family:inherit;font-size:13.5px;font-weight:600;color:${TINTA};cursor:pointer;text-align:left;}
  .dc-menu button:hover{background:oklch(94% 0.02 65);}
  .dc-menu button.peligro{color:oklch(50% 0.17 25);}
  .dc-tarjeta{transition:transform .15s, box-shadow .15s;}
  .dc-tarjeta:hover{transform:translateY(-1px);box-shadow:0 6px 18px oklch(30% 0.05 50 / 0.12);}
  .dc-rico img, .dc-pres-cont img{max-width:100%;height:auto;border-radius:10px;display:block;margin:10px 0;}
  .dc-rico ul, .dc-pres-cont ul{margin:6px 0;padding-left:22px;}
  .dc-barra-sem{transition:opacity .12s;}
  .dc-pres-raiz{container-type:inline-size;}
  .dc-pres{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr) auto;height:100%;overflow-y:auto;}
  .dc-pres-lado{border-bottom:1px solid ${BORDE};}
  .dc-pres-pie{grid-column:1;}
  .dc-pres-bloques{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px;}
  .dc-pres-enum{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,200px),1fr));gap:10px;margin-top:12px;list-style:none;padding:0;}
  .dc-pres-cont p{margin:0 0 .6em;}
  .dc-mo{width:100%;text-align:left;border:1px solid transparent;background:transparent;font-family:inherit;cursor:pointer;display:flex;align-items:center;gap:11px;padding:9px 10px;border-radius:11px;color:${TINTA};}
  .dc-mo:hover{background:oklch(94% 0.012 65);}
  .dc-mo-seg{cursor:pointer;border:none;padding:0;height:9px;border-radius:4px;min-width:6px;transition:background .15s;}
  .dc-mo-nav{border:1px solid ${BORDE};background:${PAPEL};color:${TINTA2};border-radius:8px;padding:6px 11px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}
  .dc-mo-nav:hover:not(:disabled){border-color:${ACENTO};color:${ACENTO};}
  .dc-mo-nav:disabled{opacity:.4;cursor:default;}
  @container (min-width:760px){
    .dc-pres{grid-template-columns:minmax(290px,33%) minmax(0,1fr);grid-template-rows:minmax(0,1fr) auto;overflow:hidden;}
    .dc-pres-lado{border-bottom:none;border-right:1px solid ${BORDE};}
    .dc-pres-pie{grid-column:1 / -1;}
  }
  .dc-pres-btn{width:40px;height:40px;border-radius:10px;border:1px solid ${BORDE};background:${PAPEL};color:${TINTA2};cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex:none;}
  .dc-pres-btn:hover{border-color:${ACENTO};color:${ACENTO};}
`);

/* ---------- utilidades ---------- */

const cursoDe = (m) => (m.curso && m.curso.trim()) ? m.curso.trim() : SIN_CURSO;
const nombreCurso = (c) => c === SIN_CURSO ? "Sin curso" : c;
const nombreMateria = (m) => m.curso ? m.nombre + " · " + m.curso : m.nombre;

function blankForm() {
  return { materiaId: "", fecha: todayLocal(), titulo: "", objetivo: "", keywords: "", momentos: [], descripcion: "", contenido: "", recordar: "", archivos: "", estado: "Planeada" };
}
function parseKeywords(s) { return s ? s.split(",").map(k => k.trim()).filter(Boolean) : []; }
function parseEnlaces(s) { return s ? s.split(/\n+/).map(l => l.trim()).filter(Boolean) : []; }
function nombreEnlace(url) {
  if (url.indexOf("docs.google.com/document") !== -1) return "Documento de Google";
  if (url.indexOf("docs.google.com/presentation") !== -1) return "Presentación";
  if (url.indexOf("docs.google.com/spreadsheets") !== -1) return "Hoja de cálculo";
  if (url.indexOf("docs.google.com/forms") !== -1) return "Formulario";
  if (url.indexOf("drive.google.com") !== -1) return "Archivo en Drive";
  if (url.indexOf("youtube.com") !== -1 || url.indexOf("youtu.be") !== -1) return "Video de YouTube";
  return url.replace(/^https?:\/\//, "").split("/")[0] || url;
}
// Solo se abren enlaces web; evita que un "javascript:" pegado se ejecute.
function hrefSeguro(url) { return /^https?:\/\//i.test(url) ? url : "https://" + url.replace(/^[a-z]+:/i, ""); }
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function partesFecha(f) {
  const p = (f || "").split("-");
  if (p.length !== 3) return { dia: "", mes: "", anio: "" };
  return { dia: String(parseInt(p[2], 10)), mes: MESES[parseInt(p[1], 10) - 1] || p[1], anio: p[0] };
}
function fechaCorta(f) { const p = partesFecha(f); return p.dia ? p.dia + " " + p.mes + " " + p.anio : (f || ""); }
function fechaLarga(f) {
  if (!f) return "";
  const d = new Date(f + "T12:00:00");
  if (isNaN(d)) return f;
  const t = d.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
const minutosTotales = (ms) => (ms || []).reduce((s, m) => s + (parseInt(m.minutos, 10) || 0), 0);
function sello(hecha) {
  return {
    texto: hecha ? "✓ realizada" : "planeada",
    border: hecha ? "2px solid " + VERDE : "1.5px dashed oklch(60% 0.13 78)",
    color: hecha ? "oklch(28% 0.06 145)" : "oklch(45% 0.1 70)",
    bg: hecha ? "oklch(93% 0.03 145)" : "transparent"
  };
}

/* ---------- lectura cómoda en la presentación ---------- */

const mezcla = (c, p) => "color-mix(in oklab, " + c + " " + p + "%, " + PAPEL + ")";
/** Texto claro u oscuro según qué tan oscuro sea el color de fondo. */
function tintaSobre(c) {
  const claro = "oklch(98% 0.005 75)", oscuro = "oklch(22% 0.02 50)";
  const ok = /oklch\(\s*([\d.]+)%/.exec(c || "");
  if (ok) return parseFloat(ok[1]) < 62 ? claro : oscuro;
  const hx = /^#([0-9a-f]{6})$/i.exec(c || "");
  if (hx) { const n = parseInt(hx[1], 16); return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) < 150 ? claro : oscuro; }
  return oscuro;
}
function textoPlano(h) {
  return String(h || "").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
}

/** Separa el detalle de un momento por quién actúa (docente / estudiantes). */
function rolDe(frase) {
  if (/^(?:el|la)\s+(?:docente|profesora?|maestr[oa])\b/i.test(frase)) return "Docente";
  if (/^(?:los|las)\s+(?:estudiantes|alumn[oa]s|niñ[oa]s|grupos|equipos)\b/i.test(frase)) return "Estudiantes";
  return null;
}
function partirPorRol(texto) {
  const frases = String(texto || "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+(?=[¿¡"“A-ZÁÉÍÓÚÑ])/);
  const grupos = [];
  for (const f of frases) {
    const r = rolDe(f);
    if (r || !grupos.length) grupos.push({ rol: r, texto: f });
    else grupos[grupos.length - 1].texto += " " + f;
  }
  return grupos.some(g => g.rol) ? grupos : null;
}

/** "Intro: 1. A, 2. B, 3. C" → { intro, items }. Solo si hay al menos 3 seguidos. */
function partirEnumeracion(t) {
  const re = /(?:^|\s)(\d{1,2})[.)]\s+/g;
  const pos = [];
  let m, esperado = 1;
  while ((m = re.exec(t))) {
    if (+m[1] !== esperado) continue;
    const ini = m.index + (/^\s/.test(m[0]) ? 1 : 0);
    pos.push([ini, m.index + m[0].length]);
    esperado++;
  }
  if (pos.length < 3) return null;
  const items = pos.map((p, i) => t.slice(p[1], i + 1 < pos.length ? pos[i + 1][0] : t.length)
    .trim().replace(/\s*[,;]\s*(?:y\s*)?$/i, "").replace(/\s+y$/i, "").trim());
  return { intro: t.slice(0, pos[0][0]).trim(), items };
}

const RE_ETIQUETA = /^(?:<(?:b|strong)>)?\s*([^<:]{2,60}?)\s*(?:<\/(?:b|strong)>)?\s*:\s*(?:<\/(?:b|strong)>)?\s*([\s\S]*)$/i;
/**
 * Convierte el contenido (HTML del editor o texto pegado de la IA) en bloques:
 * tarjetas "Concepto: explicación", preguntas, párrafos e imágenes.
 * Devuelve null si el contenido ya trae su propia estructura (listas, tablas…).
 */
function bloquesContenido(fuente) {
  const h = String(fuente || "");
  if (!h.trim() || /<(?:ul|ol|table|h[1-6]|blockquote|pre)\b/i.test(h)) return null;
  const lineas = h.replace(/\r/g, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(?:div|p)>/gi, "\n").replace(/<(?:div|p)(?:\s[^>]*)?>/gi, "\n")
    .split("\n").map(l => l.trim()).filter(l => textoPlano(l) || /<img\b/i.test(l));
  const bloques = [];
  let grupo = null;
  for (const l of lineas) {
    const t = textoPlano(l);
    if (/<img\b/i.test(l)) { grupo = null; bloques.push({ tipo: "imagen", partes: [l] }); continue; }
    const m = RE_ETIQUETA.exec(l);
    const etiqueta = m && !/https?$/i.test(m[1]) && m[1].trim().split(/\s+/).length <= 7;
    if (etiqueta && !textoPlano(m[2])) {
      grupo = { tipo: "tarjeta", titulo: textoPlano(m[1]), partes: [] };
      bloques.push(grupo);
    } else if (etiqueta) {
      grupo = null;
      const titulo = textoPlano(m[1]);
      bloques.push({ tipo: /pregunta/i.test(titulo) || /\?\s*$/.test(t) ? "pregunta" : "tarjeta", titulo, partes: [m[2]] });
    } else if (grupo) {
      grupo.partes.push(l);
    } else {
      bloques.push({ tipo: /^¿[^?]+\?$/.test(t) ? "pregunta" : "parrafo", titulo: "", partes: [l] });
    }
  }
  return bloques.length ? bloques : null;
}

/** Lunes (YYYY-MM-DD) de la semana de una fecha. */
function lunesDe(f) {
  const d = new Date(f + "T12:00:00");
  if (isNaN(d)) return null;
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
/** Clases realizadas por semana, últimas `n` semanas. */
function porSemana(acts, n) {
  const hoy = new Date(todayLocal() + "T12:00:00");
  hoy.setDate(hoy.getDate() - ((hoy.getDay() + 6) % 7));
  const semanas = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy); d.setDate(d.getDate() - i * 7);
    const clave = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    semanas.push({ clave, etiqueta: d.getDate() + " " + MESES[d.getMonth()], realizadas: 0, planeadas: 0 });
  }
  const idx = new Map(semanas.map((s, i) => [s.clave, i]));
  acts.forEach(a => {
    const i = idx.get(lunesDe(a.fecha));
    if (i === undefined) return;
    if (a.estado === "Realizada") semanas[i].realizadas++; else semanas[i].planeadas++;
  });
  return semanas;
}

let qrPromesa = null;
function cargarQR() {
  if (window.qrcode) return Promise.resolve(window.qrcode);
  if (!qrPromesa) {
    qrPromesa = new Promise((ok, mal) => {
      const s = document.createElement("script");
      s.src = QR_SRC; s.async = true;
      s.onload = () => window.qrcode ? ok(window.qrcode) : mal(new Error("qr"));
      s.onerror = () => { qrPromesa = null; mal(new Error("qr")); };
      document.head.appendChild(s);
    });
  }
  return qrPromesa;
}

/* ---------- iconos ---------- */
const I = {
  puntos: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>`,
  menu: html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  lapiz: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  color: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 100 18c1.2 0 2-.8 2-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H17a4 4 0 004-4c0-4.4-4-8-9-8z" stroke="currentColor" stroke-width="2"/><circle cx="7.5" cy="11" r="1.3" fill="currentColor"/><circle cx="10.5" cy="7" r="1.3" fill="currentColor"/><circle cx="15" cy="7.5" r="1.3" fill="currentColor"/></svg>`,
  nota: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 3h10l4 4v14H5V3z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 11h6M9 15h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  basura: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  chincheta: html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M9 3h6l-1 6 4 4H6l4-4-1-6zM12 13v8" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  completa: html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5L20 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  cerrar: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  qr: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><path d="M14 14h3v3h-3zM18 18h3v3h-3z" fill="currentColor"/></svg>`,
  imagen: html`<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="2" fill="currentColor"/><path d="M21 16l-5-5-9 9" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  chispa: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" fill="currentColor"/></svg>`
};

/* ---------- selector de color (paleta + color libre) ---------- */
function SelectorColor({ valor, onCambio }) {
  const esLibre = valor && valor.charAt(0) === "#";
  return html`
    <div style="display:flex;gap:9px;flex-wrap:wrap;align-items:center;">
      ${COLORES.map(c => {
        const on = c === valor;
        return html`<button type="button" key=${c} onClick=${() => onCambio(c)} aria-label="Elegir color" style="width:30px;height:30px;border-radius:50%;background:${c};cursor:pointer;padding:0;box-shadow:${on ? "0 0 0 3px " + PAPEL + ", 0 0 0 5px " + c : "none"};border:${on ? "2px solid " + TINTA : "2px solid transparent"};"></button>`;
      })}
      <label title="Color personalizado" style="position:relative;width:30px;height:30px;border-radius:50%;cursor:pointer;background:${esLibre ? valor : "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)"};box-shadow:${esLibre ? "0 0 0 3px " + PAPEL + ", 0 0 0 5px " + valor : "none"};">
        <input type="color" value=${esLibre ? valor : "#c0703a"} onInput=${(e) => onCambio(e.target.value)} style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;"/>
      </label>
    </div>`;
}

export default class Clases extends Component {
  static contextType = PanelCtx;

  state = {
    loaded: false,
    materias: [], actividades: [], cursosCfg: [],
    view: "hoy",            // "hoy" o el nombre del curso
    materiaFiltro: null,    // id de asignatura dentro del curso
    barraAbierta: true,
    showRealizadas: false,
    menu: null,             // "c:<curso>" | "m:<id>"
    actModalOpen: false, editingId: null, form: blankForm(),
    iaAbierto: false, iaTexto: "", iaAviso: "",
    materiaModal: null,     // { editId, nombre, curso, color }
    cursoModal: null,       // { original, nombre, color, notas, foco }
    viewingId: null, verRecordar: false, momento: 0,
    qr: null,               // { url, nombre, img, error }
    hoverSemana: -1
  };

  descRef = createRef();
  contRef = createRef();
  presRef = createRef();

  componentDidMount() {
    this.dejar = watch(["materias", "actividades", K_CURSOS], d =>
      this.setState({ loaded: true, materias: d.materias, actividades: d.actividades, cursosCfg: d[K_CURSOS] }));
    this.teclas = (e) => {
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && this.state.viewingId && !this.state.qr && !this.state.actModalOpen) {
        const t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
        this.irMomento(e.key === "ArrowRight" ? 1 : -1);
        return;
      }
      if (e.key !== "Escape") return;
      if (this.state.qr) this.setState({ qr: null });
      else if (this.state.viewingId) this.cerrarPresentacion();
      else if (this.state.menu) this.setState({ menu: null });
    };
    document.addEventListener("keydown", this.teclas);
  }
  componentWillUnmount() {
    this.dejar && this.dejar();
    document.removeEventListener("keydown", this.teclas);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.actModalOpen && !prevState.actModalOpen) this.cargarEditores();
  }
  cargarEditores() {
    if (this.descRef.current) this.descRef.current.innerHTML = this.state.form.descripcion || "";
    if (this.contRef.current) this.contRef.current.innerHTML = this.state.form.contenido || "";
  }

  /* ----- cursos (opciones guardadas por nombre) ----- */
  cfgCurso(c) { return this.state.cursosCfg.find(x => x.nombre === c) || null; }
  colorCurso(c) {
    const cfg = this.cfgCurso(c);
    if (cfg && cfg.color) return cfg.color;
    const m = this.state.materias.find(mm => cursoDe(mm) === c);
    return m ? m.color : COLOR_CURSO;
  }
  guardarCfgCurso(nombre, cambios, renombrarDe) {
    const base = renombrarDe || nombre;
    const previo = this.state.cursosCfg.find(x => x.nombre === base) || { nombre: base, color: "", notas: "" };
    const cursosCfg = this.state.cursosCfg.filter(x => x.nombre !== base && x.nombre !== nombre).concat([{ ...previo, ...cambios, nombre }]);
    this.setState({ cursosCfg });
    saveList(K_CURSOS, cursosCfg);
  }

  abrirCursoModal(curso, foco) {
    const cfg = this.cfgCurso(curso) || {};
    this.setState({ menu: null, cursoModal: { original: curso, nombre: curso === SIN_CURSO ? "" : curso, color: this.colorCurso(curso), notas: cfg.notas || "", foco } });
  }
  setCursoModal(campo, valor) { this.setState(s => ({ cursoModal: { ...s.cursoModal, [campo]: valor } })); }

  guardarCursoModal = () => {
    const cm = this.state.cursoModal;
    const nuevo = cm.nombre.trim() || SIN_CURSO;
    const viejo = cm.original;
    if (nuevo !== viejo && this.state.materias.some(m => cursoDe(m) === nuevo)) {
      alert("Ya existe un curso llamado \"" + nombreCurso(nuevo) + "\". Elige otro nombre.");
      return;
    }
    let materias = this.state.materias;
    if (nuevo !== viejo) {
      materias = materias.map(m => cursoDe(m) === viejo ? { ...m, curso: nuevo === SIN_CURSO ? "" : nuevo } : m);
      saveList("materias", materias);
    }
    const view = this.state.view === viejo ? nuevo : this.state.view;
    this.setState({ materias, view, cursoModal: null });
    this.guardarCfgCurso(nuevo, { color: cm.color, notas: cm.notas }, viejo);
  };

  eliminarCurso(curso) {
    this.setState({ menu: null });
    const ids = new Set(this.state.materias.filter(m => cursoDe(m) === curso).map(m => m.id));
    const nActs = this.state.actividades.filter(a => ids.has(a.materiaId)).length;
    const aviso = "¿Eliminar el curso \"" + nombreCurso(curso) + "\" con sus " + ids.size + " asignatura" + (ids.size !== 1 ? "s" : "") +
      (nActs ? " y " + nActs + " clase" + (nActs !== 1 ? "s" : "") : "") + "? Esta acción no se puede deshacer.";
    if (!confirm(aviso)) return;
    const materias = this.state.materias.filter(m => !ids.has(m.id));
    const actividades = this.state.actividades.filter(a => !ids.has(a.materiaId));
    const cursosCfg = this.state.cursosCfg.filter(x => x.nombre !== curso);
    const view = this.state.view === curso ? "hoy" : this.state.view;
    this.setState({ materias, actividades, cursosCfg, view, materiaFiltro: view === "hoy" ? null : this.state.materiaFiltro });
    saveList("materias", materias);
    saveList("actividades", actividades);
    saveList(K_CURSOS, cursosCfg);
  }

  /* ----- asignaturas ----- */
  abrirMateriaModal = (m) => {
    const cursoActual = this.state.view !== "hoy" && this.state.view !== SIN_CURSO ? this.state.view : "";
    this.setState({
      menu: null,
      materiaModal: m && m.id
        ? { editId: m.id, nombre: m.nombre, curso: m.curso || "", color: m.color }
        : { editId: null, nombre: "", curso: cursoActual, color: COLORES[this.state.materias.length % 6] }
    });
  };
  setMateria(campo, valor) { this.setState(s => ({ materiaModal: { ...s.materiaModal, [campo]: valor } })); }

  guardarMateria = () => {
    const mm = this.state.materiaModal;
    if (!mm.nombre.trim()) return;
    const datos = { nombre: mm.nombre.trim(), curso: mm.curso.trim(), color: mm.color || COLORES[0] };
    let materias, nueva;
    if (mm.editId) {
      materias = this.state.materias.map(m => m.id === mm.editId ? { ...m, ...datos } : m);
      nueva = materias.find(m => m.id === mm.editId);
    } else {
      nueva = { id: uid(), ...datos };
      materias = [...this.state.materias, nueva];
    }
    this.setState({ materias, materiaModal: null, view: cursoDe(nueva), materiaFiltro: mm.editId ? this.state.materiaFiltro : null });
    saveList("materias", materias);
  };

  eliminarMateria(id) {
    this.setState({ menu: null });
    const m = this.state.materias.find(x => x.id === id);
    if (!m) return;
    const nActs = this.state.actividades.filter(a => a.materiaId === id).length;
    const nombre = nombreMateria(m);
    const aviso = nActs > 0
      ? "¿Eliminar la asignatura \"" + nombre + "\"? Se borrarán también sus " + nActs + " clase" + (nActs !== 1 ? "s" : "") + ". Esta acción no se puede deshacer."
      : "¿Eliminar la asignatura \"" + nombre + "\"?";
    if (!confirm(aviso)) return;
    const materias = this.state.materias.filter(x => x.id !== id);
    const actividades = this.state.actividades.filter(a => a.materiaId !== id);
    const quedanEnCurso = materias.some(mm => cursoDe(mm) === cursoDe(m));
    const view = (this.state.view === cursoDe(m) && !quedanEnCurso) ? "hoy" : this.state.view;
    this.setState({ materias, actividades, view, materiaFiltro: this.state.materiaFiltro === id ? null : this.state.materiaFiltro });
    saveList("materias", materias);
    saveList("actividades", actividades);
  }

  /* ----- navegación ----- */
  elegir(view, materiaFiltro = null) {
    // Al elegir, la barra lateral se esconde para dar espacio a la clase.
    this.setState({ view, materiaFiltro, barraAbierta: false, menu: null });
  }

  /* ----- clases (actividades) ----- */
  openActividadModal = () => {
    const { materias, view, materiaFiltro } = this.state;
    if (materias.length === 0) { this.abrirMateriaModal(); return; }
    let defaultMateria = materias[0].id;
    if (materiaFiltro) defaultMateria = materiaFiltro;
    else if (view !== "hoy") {
      const enCurso = materias.find(m => cursoDe(m) === view);
      if (enCurso) defaultMateria = enCurso.id;
    }
    this.setState({ actModalOpen: true, editingId: null, iaAbierto: false, iaTexto: "", iaAviso: "", form: { ...blankForm(), materiaId: defaultMateria } });
  };
  openEditar(id) {
    const a = this.state.actividades.find(x => x.id === id);
    if (a) this.setState({ actModalOpen: true, editingId: id, iaAbierto: false, iaTexto: "", iaAviso: "", form: { ...blankForm(), ...a, momentos: (a.momentos || []).map(m => ({ ...m })) } });
  }
  closeActividadModal = () => this.setState({ actModalOpen: false });
  setField(campo, valor) { this.setState(s => ({ form: { ...s.form, [campo]: valor } })); }
  campo = (k) => (e) => this.setField(k, e.target.value);

  guardarActividad = () => {
    const f = { ...this.state.form, descripcion: this.descRef.current ? this.descRef.current.innerHTML : this.state.form.descripcion, contenido: this.contRef.current ? this.contRef.current.innerHTML : this.state.form.contenido };
    if (!f.titulo.trim() || !f.materiaId) { alert("Escribe un título y elige la asignatura."); return; }
    f.momentos = (f.momentos || []).filter(m => (m.nombre || "").trim() || (m.detalle || "").trim());
    const actividades = this.state.editingId
      ? this.state.actividades.map(a => a.id === this.state.editingId ? { ...f, id: a.id } : a)
      : [...this.state.actividades, { ...f, id: uid() }];
    this.setState({ actividades, actModalOpen: false });
    saveList("actividades", actividades);
  };

  toggleEstado(id) {
    const actividades = this.state.actividades.map(a => a.id === id ? { ...a, estado: a.estado === "Planeada" ? "Realizada" : "Planeada" } : a);
    this.setState({ actividades });
    saveList("actividades", actividades);
  }
  eliminarActividad(id) {
    if (!confirm("¿Eliminar esta clase?")) return;
    const actividades = this.state.actividades.filter(a => a.id !== id);
    this.setState({ actividades });
    saveList("actividades", actividades);
  }

  /* ----- momentos ----- */
  setMomento(i, campo, valor) {
    this.setState(s => {
      const momentos = s.form.momentos.slice();
      momentos[i] = { ...momentos[i], [campo]: valor };
      return { form: { ...s.form, momentos } };
    });
  }
  agregarMomento = (nombre = "") => this.setState(s => ({ form: { ...s.form, momentos: [...(s.form.momentos || []), { id: uid(), nombre, minutos: "", detalle: "" }] } }));
  quitarMomento(i) { this.setState(s => ({ form: { ...s.form, momentos: s.form.momentos.filter((_, j) => j !== i) } })); }
  moverMomento(i, d) {
    this.setState(s => {
      const ms = s.form.momentos.slice(), j = i + d;
      if (j < 0 || j >= ms.length) return null;
      [ms[i], ms[j]] = [ms[j], ms[i]];
      return { form: { ...s.form, momentos: ms } };
    });
  }
  plantillaMomentos = () => this.setState(s => ({
    form: { ...s.form, momentos: ["Inicio", "Desarrollo", "Cierre"].map(n => ({ id: uid(), nombre: n, minutos: "", detalle: "" })) }
  }));

  /* ----- importar con IA ----- */
  copiarPrompt = () => {
    const f = this.state.form;
    const m = this.state.materias.find(x => x.id === f.materiaId);
    const texto = promptIA(m ? m.nombre : "", m ? nombreCurso(cursoDe(m)) : "", f.titulo);
    const listo = () => this.setState({ iaAviso: "Instrucción copiada. Pégala en tu IA, cambia el tema y trae aquí la respuesta." });
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(listo, () => this.setState({ iaTexto: texto, iaAviso: "No se pudo copiar automáticamente: copia la instrucción desde el cuadro." }));
    else this.setState({ iaTexto: texto, iaAviso: "Copia la instrucción desde el cuadro." });
  };
  importarIA = () => {
    const r = parsearIA(this.state.iaTexto);
    if (!r.encontrados.length) { this.setState({ iaAviso: "No se reconoció el formato. Asegúrate de pegar la respuesta completa de la IA (con TÍTULO, OBJETIVO, MOMENTO…)." }); return; }
    // Lo que la IA trajo reemplaza esos campos; lo demás se conserva.
    this.setState(s => {
      const f = { ...s.form };
      if (r.titulo) f.titulo = r.titulo;
      if (r.objetivo) f.objetivo = r.objetivo;
      if (r.keywords) f.keywords = r.keywords;
      if (r.momentos.length) f.momentos = r.momentos.map(m => ({ id: uid(), ...m }));
      if (r.descripcion) f.descripcion = escapar(r.descripcion);
      if (r.contenido) f.contenido = escapar(r.contenido);
      if (r.recordar) f.recordar = r.recordar;
      if (r.recursos) f.archivos = [f.archivos, r.recursos].filter(Boolean).join("\n");
      return { form: f, iaAbierto: false, iaTexto: "", iaAviso: "Importado: " + r.encontrados.join(", ") + ". Revisa y ajusta antes de guardar." };
    }, () => this.cargarEditores());
  };

  /* ----- editores de texto (descripción y contenido) ----- */
  onEditor(campo, ref) { if (ref.current) this.setField(campo, ref.current.innerHTML); }
  formato(e, ref, campo, comando, valor) {
    e.preventDefault();
    if (ref.current) ref.current.focus();
    try { document.execCommand(comando, false, valor); }
    catch (err) { if (comando === "hiliteColor") document.execCommand("backColor", false, valor); }
    this.onEditor(campo, ref);
  }
  insertarImagen(e) {
    e.preventDefault();
    const sel = window.getSelection();
    const rango = sel && sel.rangeCount && this.contRef.current && this.contRef.current.contains(sel.anchorNode) ? sel.getRangeAt(0) : null;
    const url = (prompt("Pega el enlace de la imagen (https://…):") || "").trim();
    if (!url) return;
    if (!/^https?:\/\/\S+$/i.test(url)) { alert("El enlace debe empezar por https://"); return; }
    const ed = this.contRef.current;
    if (!ed) return;
    ed.focus();
    if (rango) { sel.removeAllRanges(); sel.addRange(rango); }
    else { const r = document.createRange(); r.selectNodeContents(ed); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
    document.execCommand("insertImage", false, url);
    this.onEditor("contenido", this.contRef);
  }

  /* ----- presentación ----- */
  abrirPresentacion(id) { this.setState({ viewingId: id, verRecordar: false, qr: null, momento: 0 }); }
  irMomento(delta) {
    const a = this.state.actividades.find(x => x.id === this.state.viewingId);
    const n = a && a.momentos ? a.momentos.length : 0;
    if (!n) return;
    this.setState(st => ({ momento: Math.max(0, Math.min(n - 1, (st.momento || 0) + delta)) }));
  }
  cerrarPresentacion = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    this.setState({ viewingId: null, qr: null });
  };
  pantallaCompleta = () => {
    const el = this.presRef.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  };
  mostrarQR(url) {
    const href = hrefSeguro(url);
    this.setState({ qr: { url: href, nombre: nombreEnlace(url), img: null, error: false } });
    cargarQR().then(qrcode => {
      const q = qrcode(0, "M");
      q.addData(href);
      q.make();
      const img = q.createDataURL(8, 2);
      this.setState(s => s.qr && s.qr.url === href ? { qr: { ...s.qr, img } } : null);
    }).catch(() => this.setState(s => s.qr ? { qr: { ...s.qr, error: true } } : null));
  }
  copiar(texto) { if (navigator.clipboard) navigator.clipboard.writeText(texto).catch(() => {}); }

  /* ----- render ----- */
  render(_, s) {
    const hoy = todayLocal();
    const v = (el) => this.context.ver("clases", el);

    const cursosOrden = [];
    s.materias.forEach(m => { const c = cursoDe(m); if (cursosOrden.indexOf(c) === -1) cursosOrden.push(c); });

    const materiasDeVista = s.view === "hoy" ? s.materias
      : s.materias.filter(m => cursoDe(m) === s.view && (!s.materiaFiltro || m.id === s.materiaFiltro));
    const idsVista = new Set(materiasDeVista.map(m => m.id));
    const baseActs = s.view === "hoy"
      ? s.actividades.filter(a => a.fecha === hoy)
      : s.actividades.filter(a => idsVista.has(a.materiaId));
    // Para el panel derecho: todo el curso (o todo, si es "Hoy").
    const actsContexto = s.view === "hoy" ? s.actividades : baseActs;

    const planeadas = baseActs.filter(a => a.estado === "Planeada").length;
    const realizadas = baseActs.filter(a => a.estado === "Realizada").length;
    const materiasEnVista = s.view === "hoy" ? s.materias.filter(m => baseActs.some(a => a.materiaId === m.id)) : materiasDeVista;

    const grupos = materiasEnVista.map(m => {
      const todas = baseActs.filter(a => a.materiaId === m.id).sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === "Planeada" ? -1 : 1;
        return a.estado === "Planeada" ? (a.fecha || "").localeCompare(b.fecha || "") : (b.fecha || "").localeCompare(a.fecha || "");
      });
      const visibles = s.showRealizadas ? todas : todas.filter(a => a.estado !== "Realizada");
      return { m, visibles, total: todas.length, pendientes: todas.filter(a => a.estado === "Planeada").length };
    });

    const materiaSel = s.materiaFiltro ? s.materias.find(m => m.id === s.materiaFiltro) : null;
    const tituloVista = s.view === "hoy" ? "Clases de hoy" : nombreCurso(s.view);
    const colorVista = s.view === "hoy" ? ACENTO : this.colorCurso(s.view);
    const verBarra = v("barra");
    const viendo = s.viewingId ? s.actividades.find(a => a.id === s.viewingId) : null;

    return html`
<div class="dc-raiz" style="min-height:100vh;background:${FONDO};display:flex;flex-direction:column;">

  ${v("encabezado") && html`
  <${ModuleHeader} tema=${TEMA} titulo="Diseño de Clase">
    <button onClick=${() => this.setState(st => ({ showRealizadas: !st.showRealizadas }))} style="display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;border:1.5px dashed ${s.showRealizadas ? "oklch(55% 0.08 145)" : "oklch(50% 0.02 60 / 0.4)"};background:${s.showRealizadas ? "oklch(35% 0.06 145 / 0.35)" : "transparent"};color:${s.showRealizadas ? "oklch(85% 0.05 145)" : "oklch(75% 0.015 60)"};font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;">${s.showRealizadas ? "Ocultar realizadas" : "Ver realizadas"}</button>
  <//>`}

  <div class="dc-cuerpo">
    ${verBarra && s.barraAbierta && html`
      <div class="dc-velo" onClick=${() => this.setState({ barraAbierta: false })}></div>
      ${this.renderBarra(cursosOrden, hoy)}`}

    <main style="flex:1;min-width:0;padding:20px clamp(16px,3.5vw,36px) 110px;box-sizing:border-box;">
      <div style="max-width:1180px;margin:0 auto;">
      ${!s.loaded ? html`<${Cargando} color="oklch(55% 0.02 55)"/>`
      : s.materias.length === 0 ? html`
        <div style="text-align:center;padding:60px 20px;">
          <div style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:15px;color:oklch(55% 0.02 55);border:1.5px dashed ${BORDE};border-radius:10px;padding:18px 26px;">Crea tu primera asignatura para comenzar a diseñar clases.</div>
          <div style="margin-top:16px;">
            <button onClick=${() => this.abrirMateriaModal()} style="padding:11px 22px;border-radius:8px;border:none;background:${ACENTO};color:oklch(97% 0.01 70);font-size:14px;font-weight:700;cursor:pointer;">+ Crear asignatura</button>
          </div>
        </div>`
      : html`
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">
          ${verBarra ? html`
            <button onClick=${() => this.setState(st => ({ barraAbierta: !st.barraAbierta }))} aria-label="Mostrar cursos" title="Cursos y asignaturas" style="display:flex;align-items:center;gap:7px;padding:8px 12px;border-radius:9px;border:1.5px solid ${BORDE};background:${PAPEL};color:${TINTA};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">${I.menu}<span>Cursos</span></button>`
          : html`
            <select value=${s.view} onChange=${(e) => this.elegir(e.target.value)} style="${INPUT}width:auto;padding:8px 10px;">
              <option value="hoy">Hoy</option>
              ${cursosOrden.map(c => html`<option key=${c} value=${c}>${nombreCurso(c)}</option>`)}
            </select>`}
          <div style="flex:1;min-width:180px;display:flex;align-items:center;gap:10px;">
            <span style="width:12px;height:30px;border-radius:4px;background:${colorVista};flex:none;"></span>
            <div style="min-width:0;">
              <div style="font-family:'Fraunces',serif;font-size:clamp(20px,3vw,25px);font-weight:600;color:${TINTA};line-height:1.15;">${tituloVista}</div>
              <div style="font-size:12.5px;color:${TINTA2};margin-top:2px;">
                ${materiaSel ? html`Asignatura: <b>${materiaSel.nombre}</b> · <a onClick=${() => this.setState({ materiaFiltro: null })} style="color:${ACENTO};font-weight:700;cursor:pointer;" class="h-u">ver todo el curso</a>`
                : s.view === "hoy" ? fechaLarga(hoy) : materiasDeVista.length + " asignatura" + (materiasDeVista.length !== 1 ? "s" : "")}
              </div>
            </div>
          </div>
        </div>

        <div class="dc-grid">
          <div style="min-width:0;">
            ${v("resumen") && html`
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;">
              ${[[planeadas, "planeadas", AMBAR], [realizadas, "realizadas", VERDE], [baseActs.length, "total", TINTA]].map(([n, l, c]) => html`
                <div style="background:oklch(92% 0.014 65);border-radius:10px;padding:12px 14px;">
                  <div style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:500;color:${c};line-height:1;">${n}</div>
                  <div style="font-size:11px;color:${TINTA2};margin-top:5px;font-weight:600;">${l}</div>
                </div>`)}
            </div>`}

            ${baseActs.length === 0 && html`
              <div style="text-align:center;padding:52px 20px;">
                <span style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:14px;color:oklch(55% 0.02 55);border:1.5px dashed ${BORDE};border-radius:8px;padding:12px 22px;">${s.view === "hoy" ? "No hay clases para hoy" : "Aún no hay clases diseñadas aquí"}</span>
                <div style="margin-top:14px;"><button onClick=${this.openActividadModal} style="padding:10px 18px;border-radius:8px;border:1.5px solid ${ACENTO};background:transparent;color:${ACENTO};font-size:13.5px;font-weight:700;cursor:pointer;">+ Diseñar una clase</button></div>
              </div>`}

            ${grupos.filter(g => g.total > 0 || s.view !== "hoy").map(g => this.renderGrupo(g))}
          </div>

          ${v("panel") && this.renderPanel(actsContexto, hoy)}
        </div>
      `}
      </div>
    </main>
  </div>

  ${v("boton") && html`<button onClick=${this.openActividadModal} title="Nueva clase" aria-label="Nueva clase" class="h-bg" style="position:fixed;bottom:22px;right:22px;width:56px;height:56px;border-radius:50%;background:${ACENTO};--hbg:oklch(33% 0.08 35);color:oklch(97% 0.01 70);font-size:28px;border:none;cursor:pointer;box-shadow:0 6px 18px oklch(30% 0.1 35 / 0.4);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;z-index:50;">+</button>`}

  ${s.actModalOpen && this.renderActividadModal()}
  ${s.materiaModal && this.renderMateriaModal()}
  ${s.cursoModal && this.renderCursoModal()}
  ${viendo && this.renderPresentacion(viendo)}
</div>`;
  }

  /* ----- barra lateral ----- */
  renderBarra(cursosOrden, hoy) {
    const s = this.state;
    const nHoy = s.actividades.filter(a => a.fecha === hoy && a.estado === "Planeada").length;
    const menuDe = (clave, items) => s.menu === clave && html`
      <div style="position:fixed;inset:0;z-index:90;" onClick=${(e) => { e.stopPropagation(); this.setState({ menu: null }); }}></div>
      <div class="dc-menu" onClick=${(e) => e.stopPropagation()}>${items}</div>`;
    const puntos = (clave) => html`
      <button class="dc-puntos" aria-label="Opciones" title="Opciones" onClick=${(e) => { e.stopPropagation(); this.setState(st => ({ menu: st.menu === clave ? null : clave })); }}>${I.puntos}</button>`;

    return html`
    <aside class="dc-barra" aria-label="Cursos y asignaturas">
      <div style="display:flex;align-items:center;justify-content:space-between;margin:0 4px 10px;">
        <div style="${SECCION}">Tus cursos</div>
        <button onClick=${() => this.setState({ barraAbierta: false })} class="dc-puntos" aria-label="Esconder barra" title="Esconder">${I.cerrar}</button>
      </div>

      <div class=${"dc-item" + (s.view === "hoy" ? " on" : "")} onClick=${() => this.elegir("hoy")}>
        <span style="width:22px;height:22px;border-radius:6px;background:${ACENTO};color:oklch(97% 0.01 70);font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;flex:none;">${new Date().getDate()}</span>
        <span style="flex:1;font-weight:700;font-size:14px;">Hoy</span>
        ${nHoy > 0 && html`<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:${AMBAR};">${nHoy}</span>`}
      </div>

      <div style="height:1px;background:${BORDE};margin:10px 4px;"></div>

      ${cursosOrden.map(c => {
        const color = this.colorCurso(c);
        const mats = s.materias.filter(m => cursoDe(m) === c);
        const ids = new Set(mats.map(m => m.id));
        const pend = s.actividades.filter(a => ids.has(a.materiaId) && a.estado === "Planeada").length;
        const cfg = this.cfgCurso(c);
        const claveC = "c:" + c;
        return html`
        <div key=${c} style="margin-bottom:8px;">
          <div class=${"dc-item" + (s.view === c && !s.materiaFiltro ? " on" : "")} onClick=${() => this.elegir(c)} style="position:relative;">
            <span style="width:14px;height:14px;border-radius:4px;background:${color};flex:none;"></span>
            <span style="flex:1;min-width:0;font-weight:700;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${nombreCurso(c)}</span>
            ${cfg && cfg.notas && html`<span title="Tiene notas" style="color:${TINTA3};display:flex;">${I.nota}</span>`}
            ${pend > 0 && html`<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:${AMBAR};">${pend}</span>`}
            ${puntos(claveC)}
            ${menuDe(claveC, html`
              <button onClick=${() => this.abrirCursoModal(c, "nombre")}>${I.lapiz} Cambiar nombre</button>
              <button onClick=${() => this.abrirCursoModal(c, "color")}>${I.color} Cambiar color</button>
              <button onClick=${() => this.abrirCursoModal(c, "notas")}>${I.nota} Notas del curso</button>
              <button class="peligro" onClick=${() => this.eliminarCurso(c)}>${I.basura} Eliminar curso</button>`)}
          </div>
          ${mats.map(m => {
            const claveM = "m:" + m.id;
            return html`
            <div key=${m.id} class=${"dc-item" + (s.materiaFiltro === m.id ? " on" : "")} onClick=${() => this.elegir(c, m.id)} style="position:relative;padding:6px 9px 6px 30px;">
              <span style="width:9px;height:9px;border-radius:50%;background:${m.color};flex:none;"></span>
              <span style="flex:1;min-width:0;font-size:13.5px;color:${TINTA2};font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.nombre}</span>
              ${puntos(claveM)}
              ${menuDe(claveM, html`
                <button onClick=${() => this.abrirMateriaModal(m)}>${I.lapiz} Editar asignatura</button>
                <button onClick=${() => this.abrirMateriaModal(m)}>${I.color} Cambiar color</button>
                <button class="peligro" onClick=${() => this.eliminarMateria(m.id)}>${I.basura} Eliminar asignatura</button>`)}
            </div>`;
          })}
        </div>`;
      })}

      <button onClick=${() => this.abrirMateriaModal()} style="width:100%;margin-top:8px;padding:10px;border-radius:9px;border:1.5px dashed oklch(80% 0.02 60);background:transparent;color:${ACENTO};font-size:13.5px;font-weight:700;cursor:pointer;font-family:inherit;">+ Asignatura</button>
    </aside>`;
  }

  /* ----- lista de clases ----- */
  renderGrupo({ m, visibles, total, pendientes }) {
    const s = this.state;
    return html`
    <section key=${m.id} style="margin-bottom:22px;">
      <div style="display:flex;align-items:center;gap:10px;margin:0 2px 10px;">
        <span style="width:10px;height:10px;border-radius:50%;background:${m.color};flex:none;"></span>
        <div style="flex:1;min-width:0;font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${TINTA2};">${s.view === "hoy" ? nombreMateria(m) : m.nombre}</div>
        <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;padding:2px 9px;border-radius:4px;color:${pendientes === 0 ? VERDE : "oklch(45% 0.1 70)"};border:1px ${pendientes === 0 ? "solid" : "dashed"} ${pendientes === 0 ? VERDE : "oklch(45% 0.1 70)"};background:${pendientes === 0 ? "oklch(94% 0.03 145)" : "transparent"};white-space:nowrap;">${total === 0 ? "sin clases" : pendientes === 0 ? "✓ al día" : pendientes + " pendiente" + (pendientes !== 1 ? "s" : "")}</span>
      </div>
      ${visibles.length === 0 && total > 0 && html`<div style="padding:10px 4px 4px;font-size:13px;color:${VERDE};font-style:italic;font-family:'Fraunces',serif;">Todo realizado</div>`}
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${visibles.map(a => this.renderTarjeta(a, m))}
      </div>
    </section>`;
  }

  renderTarjeta(a, m) {
    const hecha = a.estado === "Realizada";
    const se = sello(hecha);
    const p = partesFecha(a.fecha);
    const kws = parseKeywords(a.keywords);
    const nMom = (a.momentos || []).length;
    const mins = minutosTotales(a.momentos);
    return html`
    <div key=${a.id} class="dc-tarjeta" onClick=${() => this.abrirPresentacion(a.id)} style="${TARJETA}display:flex;overflow:hidden;cursor:pointer;opacity:${hecha ? 0.72 : 1};">
      <div style="width:64px;flex:none;background:${m.color};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 0;color:oklch(20% 0.02 50);">
        <div style="font-family:'Fraunces',serif;font-size:24px;font-weight:700;line-height:1;">${p.dia}</div>
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;margin-top:3px;">${p.mes}</div>
      </div>
      <div style="flex:1;min-width:0;padding:13px 15px;">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <div style="flex:1;min-width:0;font-family:'Fraunces',serif;font-size:16.5px;font-weight:600;line-height:1.3;color:${hecha ? TINTA3 : TINTA};text-decoration:${hecha ? "line-through" : "none"};">${a.titulo}</div>
          <span onClick=${(e) => { e.stopPropagation(); this.toggleEstado(a.id); }} title="Cambiar estado" style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;white-space:nowrap;cursor:pointer;border:${se.border};color:${se.color};background:${se.bg};transform:${hecha ? "rotate(-2deg)" : "rotate(2deg)"};flex:none;">${se.texto}</span>
        </div>
        ${a.objetivo && html`<div style="font-size:13.5px;color:${TINTA2};line-height:1.45;margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${a.objetivo}</div>`}
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:9px;">
          ${kws.slice(0, 4).map(k => html`<span style="font-family:'IBM Plex Mono',monospace;font-size:11px;padding:3px 8px;background:oklch(93% 0.014 65);color:oklch(35% 0.02 55);border-radius:5px;">${k}</span>`)}
          ${nMom > 0 && html`<span style="font-size:11.5px;color:${TINTA3};font-weight:600;">· ${nMom} momento${nMom !== 1 ? "s" : ""}${mins ? " · " + mins + " min" : ""}</span>`}
          ${a.recordar && html`<span title=${a.recordar} style="display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:700;color:oklch(45% 0.11 80);background:oklch(94% 0.08 95);padding:3px 8px;border-radius:5px;">${I.chincheta} Recordar</span>`}
        </div>
      </div>
    </div>`;
  }

  /* ----- panel derecho: avance, gráfico, próxima clase, recordatorios ----- */
  renderPanel(acts, hoy) {
    const s = this.state;
    const total = acts.length;
    const hechas = acts.filter(a => a.estado === "Realizada").length;
    const pct = total ? Math.round(hechas * 100 / total) : 0;
    const semanas = porSemana(acts, 8);
    const maxSem = Math.max(1, ...semanas.map(x => x.realizadas));
    const proximas = acts.filter(a => a.estado === "Planeada" && (a.fecha || "") >= hoy).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
    const proxima = proximas[0];
    const atrasadas = acts.filter(a => a.estado === "Planeada" && a.fecha && a.fecha < hoy).length;
    const recordatorios = acts.filter(a => a.estado === "Planeada" && a.recordar).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "")).slice(0, 4);
    const cfg = s.view !== "hoy" ? this.cfgCurso(s.view) : null;
    const materia = (id) => s.materias.find(m => m.id === id);
    const hs = s.hoverSemana;

    return html`
    <aside style="display:flex;flex-direction:column;gap:14px;min-width:0;">
      ${s.view !== "hoy" && html`
        <div style="background:oklch(95% 0.07 95);border:1px solid oklch(87% 0.08 92);border-radius:14px;padding:14px 16px;box-shadow:0 2px 6px oklch(60% 0.08 90 / 0.15);">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
            <div style="${SECCION}color:oklch(42% 0.09 75);">Notas del curso</div>
            <button onClick=${() => this.abrirCursoModal(s.view, "notas")} style="border:none;background:transparent;color:oklch(42% 0.09 75);font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;">${cfg && cfg.notas ? "Editar" : "+ Agregar"}</button>
          </div>
          <div style="font-size:13.5px;color:oklch(32% 0.04 70);line-height:1.5;white-space:pre-wrap;">${cfg && cfg.notas ? cfg.notas : html`<i style="color:oklch(52% 0.05 75);">Sin notas. Úsalas para acuerdos, horario o lo que debes tener en cuenta con este grupo.</i>`}</div>
        </div>`}

      <div style="${TARJETA}padding:16px 18px;">
        <div style="${SECCION}margin-bottom:10px;">Avance ${s.view === "hoy" ? "general" : "del curso"}</div>
        <div style="display:flex;align-items:baseline;gap:8px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:34px;font-weight:600;color:${TINTA};line-height:1;">${pct}%</div>
          <div style="font-size:12.5px;color:${TINTA2};">${hechas} de ${total} clases realizadas</div>
        </div>
        <div role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow=${pct} aria-label="Clases realizadas" style="height:8px;border-radius:4px;background:oklch(92% 0.014 65);margin-top:12px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${VERDE};border-radius:4px;"></div>
        </div>
        ${atrasadas > 0 && html`<div style="font-size:12px;color:oklch(48% 0.14 40);margin-top:9px;font-weight:600;">⚠ ${atrasadas} clase${atrasadas !== 1 ? "s" : ""} con fecha pasada sin marcar como realizada${atrasadas !== 1 ? "s" : ""}</div>`}
      </div>

      <div style="${TARJETA}padding:16px 18px;">
        <div style="${SECCION}margin-bottom:2px;">Clases realizadas por semana</div>
        <div style="font-size:12px;color:${TINTA3};margin-bottom:12px;">Últimas 8 semanas</div>
        <div style="position:relative;">
          <div style="display:flex;align-items:flex-end;gap:2px;height:96px;border-bottom:1px solid ${BORDE};" onMouseLeave=${() => this.setState({ hoverSemana: -1 })}>
            ${semanas.map((w, i) => html`
              <div key=${w.clave} onMouseEnter=${() => this.setState({ hoverSemana: i })} onClick=${() => this.setState({ hoverSemana: i })} style="flex:1;height:100%;display:flex;align-items:flex-end;justify-content:center;cursor:default;">
                <div class="dc-barra-sem" style="width:min(70%,22px);height:${w.realizadas ? Math.max(4, w.realizadas / maxSem * 88) : 2}px;background:${w.realizadas ? VERDE : BORDE};border-radius:4px 4px 0 0;opacity:${hs === -1 || hs === i ? 1 : 0.45};"></div>
              </div>`)}
          </div>
          ${hs >= 0 && html`
            <div style="position:absolute;bottom:calc(100% - 8px);left:${(hs + 0.5) / semanas.length * 100}%;transform:translateX(-50%);background:${TINTA};color:oklch(97% 0.01 70);font-size:11.5px;padding:6px 9px;border-radius:7px;white-space:nowrap;pointer-events:none;box-shadow:0 4px 12px oklch(20% 0.02 50 / 0.25);">
              Semana del ${semanas[hs].etiqueta}<br/><b>${semanas[hs].realizadas}</b> realizada${semanas[hs].realizadas !== 1 ? "s" : ""} · ${semanas[hs].planeadas} pendiente${semanas[hs].planeadas !== 1 ? "s" : ""}
            </div>`}
          <div style="display:flex;gap:2px;margin-top:5px;">
            ${semanas.map((w, i) => html`<div key=${w.clave} style="flex:1;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:${TINTA3};white-space:nowrap;">${i % 3 === 1 || i === semanas.length - 1 ? w.etiqueta : ""}</div>`)}
          </div>
        </div>
      </div>

      <div style="${TARJETA}padding:16px 18px;">
        <div style="${SECCION}margin-bottom:10px;">Próxima clase</div>
        ${proxima ? html`
          <div onClick=${() => this.abrirPresentacion(proxima.id)} style="cursor:pointer;">
            <div style="font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:${TINTA};line-height:1.3;">${proxima.titulo}</div>
            <div style="font-size:12.5px;color:${TINTA2};margin-top:4px;">${proxima.fecha === hoy ? "Hoy" : fechaCorta(proxima.fecha)} · ${materia(proxima.materiaId) ? nombreMateria(materia(proxima.materiaId)) : ""}</div>
          </div>
          ${proximas.length > 1 && html`<div style="font-size:12px;color:${TINTA3};margin-top:8px;">y ${proximas.length - 1} más planeada${proximas.length - 1 !== 1 ? "s" : ""}</div>`}`
        : html`<div style="font-size:13px;color:${TINTA3};font-style:italic;font-family:'Fraunces',serif;">No hay clases próximas planeadas.</div>`}
      </div>

      ${recordatorios.length > 0 && html`
        <div style="${TARJETA}padding:16px 18px;">
          <div style="${SECCION}margin-bottom:10px;display:flex;align-items:center;gap:6px;">${I.chincheta} Para recordar</div>
          ${recordatorios.map(a => html`
            <div key=${a.id} onClick=${() => this.abrirPresentacion(a.id)} style="cursor:pointer;padding:8px 10px;border-radius:8px;background:oklch(96% 0.04 95);margin-bottom:6px;">
              <div style="font-size:11.5px;font-weight:700;color:oklch(45% 0.09 75);">${fechaCorta(a.fecha)} · ${a.titulo}</div>
              <div style="font-size:13px;color:oklch(32% 0.04 70);margin-top:2px;white-space:pre-wrap;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${a.recordar}</div>
            </div>`)}
        </div>`}
    </aside>`;
  }

  /* ----- modal de clase ----- */
  renderActividadModal() {
    const s = this.state, f = s.form;
    let materiasParaSelect = s.materias;
    if (s.view !== "hoy" && !s.editingId) {
      const soloDelCurso = s.materias.filter(m => cursoDe(m) === s.view);
      if (soloDelCurso.length > 0) materiasParaSelect = soloDelCurso;
    }
    const estadoBtn = (valor) => {
      const on = f.estado === valor;
      const realizada = valor === "Realizada";
      const border = on ? (realizada ? "2px solid " + VERDE : "1.5px dashed oklch(60% 0.13 78)") : "1.5px dashed " + BORDE;
      const color = on ? (realizada ? "oklch(28% 0.06 145)" : "oklch(45% 0.1 70)") : TINTA3;
      const bg = on && realizada ? "oklch(93% 0.03 145)" : "transparent";
      return html`<div onClick=${() => this.setField("estado", valor)} style="flex:1;text-align:center;padding:9px 6px;font-size:13px;font-weight:700;cursor:pointer;border-radius:5px;border:${border};color:${color};background:${bg};">${valor}</div>`;
    };
    const barraFormato = (ref, campo, extra) => html`
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px;">
        <button type="button" onMouseDown=${(e) => this.formato(e, ref, campo, "bold")} title="Negrita" style=${BTN_HERR}><b>B</b></button>
        <button type="button" onMouseDown=${(e) => this.formato(e, ref, campo, "underline")} title="Subrayar" style="${BTN_HERR}text-decoration:underline;">U</button>
        <button type="button" onMouseDown=${(e) => this.formato(e, ref, campo, "insertUnorderedList")} title="Lista" style=${BTN_HERR}>• Lista</button>
        <span style="width:1px;height:20px;background:${BORDE};"></span>
        ${RESALTADOS.map(c => html`<div onMouseDown=${(e) => this.formato(e, ref, campo, "hiliteColor", c)} title="Resaltar" style="width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;border:1px solid oklch(80% 0.01 60);"></div>`)}
        <div onMouseDown=${(e) => this.formato(e, ref, campo, "hiliteColor", "transparent")} title="Quitar resaltado" style="font-size:11px;color:${TINTA2};cursor:pointer;padding:4px 8px;border:1px dashed ${BORDE};border-radius:5px;">Quitar</div>
        ${extra}
      </div>`;
    const EDITOR = "width:100%;min-height:80px;max-height:260px;overflow-y:auto;padding:10px 12px;border:1.5px solid " + BORDE + ";border-radius:6px;font-size:14px;box-sizing:border-box;white-space:pre-wrap;background:" + PAPEL + ";color:" + TINTA + ";outline:none;line-height:1.5;";
    const mins = minutosTotales(f.momentos);

    return html`
    <div onClick=${enFondo(this.closeActividadModal)} style="position:fixed;inset:0;background:oklch(20% 0.02 50 / 0.5);z-index:300;display:flex;align-items:flex-end;justify-content:center;">
      <div style="background:${PAPEL};width:100%;max-width:720px;border-radius:18px 18px 0 0;padding:8px 22px 30px;max-height:94vh;overflow-y:auto;box-shadow:0 -8px 40px oklch(20% 0.02 50 / 0.25);border-top:4px solid ${ACENTO};box-sizing:border-box;">
        <div style="width:36px;height:4px;background:${BORDE};border-radius:2px;margin:8px auto 16px;"></div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
          <div style="flex:1;font-family:'Fraunces',serif;font-size:19px;font-weight:600;color:${TINTA};">${s.editingId ? "Editar clase" : "Diseñar clase"}</div>
          <button type="button" onClick=${() => this.setState(st => ({ iaAbierto: !st.iaAbierto }))} style="display:flex;align-items:center;gap:7px;padding:8px 14px;border-radius:999px;border:1.5px solid oklch(55% 0.15 290);background:${s.iaAbierto ? "oklch(55% 0.15 290)" : "transparent"};color:${s.iaAbierto ? "oklch(98% 0.01 290)" : "oklch(45% 0.15 290)"};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">${I.chispa} Importar desde IA</button>
        </div>

        ${s.iaAbierto && html`
          <div style="border:1.5px solid oklch(85% 0.06 290);background:oklch(97% 0.015 290);border-radius:12px;padding:14px 16px;margin-bottom:16px;">
            <div style="font-size:13.5px;color:oklch(32% 0.05 290);line-height:1.55;margin-bottom:10px;">
              <b>1.</b> Copia la instrucción y pégala en tu IA (ChatGPT, Gemini, Claude…). Cambia el tema por el de tu clase.<br/>
              <b>2.</b> Copia la respuesta completa y pégala abajo. Se llenan solos el título, objetivo, palabras clave, <b>momentos de la clase</b>, descripción, contenido y recursos.
            </div>
            <button type="button" onClick=${this.copiarPrompt} style="padding:8px 14px;border-radius:8px;border:none;background:oklch(55% 0.15 290);color:oklch(98% 0.01 290);font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;">Copiar instrucción para la IA</button>
            <textarea value=${s.iaTexto} onInput=${(e) => this.setState({ iaTexto: e.target.value })} placeholder="Pega aquí la respuesta de la IA…" style="${INPUT}min-height:130px;resize:vertical;font-family:'IBM Plex Mono',monospace;font-size:12.5px;"></textarea>
            <div style="display:flex;gap:8px;margin-top:10px;align-items:center;flex-wrap:wrap;">
              <button type="button" onClick=${this.importarIA} disabled=${!s.iaTexto.trim()} style="padding:9px 16px;border-radius:8px;border:none;background:${s.iaTexto.trim() ? ACENTO : BORDE};color:oklch(97% 0.01 70);font-size:13.5px;font-weight:700;cursor:${s.iaTexto.trim() ? "pointer" : "default"};font-family:inherit;">Importar a la clase</button>
            </div>
          </div>`}
        ${s.iaAviso && html`<div role="status" style="font-size:13px;color:oklch(35% 0.08 290);background:oklch(95% 0.03 290);border-radius:8px;padding:9px 12px;margin-bottom:14px;">${s.iaAviso}</div>`}

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:12px;">
          <div>
            <label style=${LABEL}>Asignatura</label>
            <select value=${f.materiaId} onChange=${this.campo("materiaId")} style=${INPUT}>
              ${materiasParaSelect.map(m => html`<option key=${m.id} value=${m.id}>${nombreMateria(m)}</option>`)}
            </select>
          </div>
          <div>
            <label style=${LABEL}>Fecha</label>
            <input type="date" value=${f.fecha} onInput=${this.campo("fecha")} style="${INPUT}font-size:13px;font-family:'IBM Plex Mono',monospace;"/>
          </div>
          <div>
            <label style=${LABEL}>Estado</label>
            <div style="display:flex;gap:6px;">${estadoBtn("Planeada")}${estadoBtn("Realizada")}</div>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Título</label>
          <input type="text" value=${f.titulo} onInput=${this.campo("titulo")} placeholder="Taller sobre la genealogía de la verdad" style=${INPUT}/>
        </div>

        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Objetivo de aprendizaje</label>
          <textarea value=${f.objetivo} onInput=${this.campo("objetivo")} placeholder="El estudiante comprende la crítica nietzscheana al concepto de verdad y la contrasta con la postura kantiana." style="${INPUT}min-height:60px;resize:vertical;"></textarea>
        </div>

        <div style="margin-bottom:16px;">
          <label style=${LABEL}>Palabras clave <span style=${NOTA}>· separadas por comas</span></label>
          <input type="text" value=${f.keywords} onInput=${this.campo("keywords")} placeholder="Ej: perspectivismo, genealogía, apolíneo, dionisíaco" style=${INPUT}/>
        </div>

        <div style="margin-bottom:16px;border:1px solid ${BORDE};border-radius:12px;padding:12px 14px;background:oklch(98% 0.008 72);">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
            <label style="${LABEL}margin:0;flex:1;">Momentos de la clase ${mins > 0 && html`<span style=${NOTA}>· ${mins} min en total</span>`}</label>
            ${(!f.momentos || f.momentos.length === 0) && html`<button type="button" onClick=${this.plantillaMomentos} style="padding:6px 11px;border-radius:7px;border:1px dashed ${BORDE};background:transparent;color:${TINTA2};font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;">Usar Inicio · Desarrollo · Cierre</button>`}
          </div>
          ${(f.momentos || []).map((mo, i) => html`
            <div key=${mo.id || i} style="background:${PAPEL};border:1px solid ${BORDE};border-radius:9px;padding:9px 10px;margin-bottom:8px;">
              <div style="display:flex;gap:6px;align-items:center;margin-bottom:6px;">
                <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;font-weight:700;color:${ACENTO};width:18px;">${i + 1}</span>
                <input type="text" value=${mo.nombre} onInput=${(e) => this.setMomento(i, "nombre", e.target.value)} placeholder="Nombre del momento" style="${INPUT}padding:7px 10px;flex:1;width:auto;min-width:0;font-weight:700;"/>
                <input type="number" min="0" value=${mo.minutos} onInput=${(e) => this.setMomento(i, "minutos", e.target.value)} placeholder="min" title="Minutos" style="${INPUT}padding:7px 8px;width:64px;font-family:'IBM Plex Mono',monospace;"/>
                <button type="button" onClick=${() => this.moverMomento(i, -1)} title="Subir" aria-label="Subir" style="${BTN_HERR}min-width:28px;height:28px;">↑</button>
                <button type="button" onClick=${() => this.moverMomento(i, 1)} title="Bajar" aria-label="Bajar" style="${BTN_HERR}min-width:28px;height:28px;">↓</button>
                <button type="button" onClick=${() => this.quitarMomento(i)} title="Quitar" aria-label="Quitar momento" style="${BTN_HERR}min-width:28px;height:28px;color:oklch(50% 0.17 25);">×</button>
              </div>
              <textarea value=${mo.detalle} onInput=${(e) => this.setMomento(i, "detalle", e.target.value)} placeholder="¿Qué pasa en este momento?" style="${INPUT}min-height:48px;resize:vertical;font-size:13.5px;"></textarea>
            </div>`)}
          <button type="button" onClick=${() => this.agregarMomento()} style="padding:7px 12px;border-radius:7px;border:1.5px dashed oklch(80% 0.02 60);background:transparent;color:${ACENTO};font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;">+ Agregar momento</button>
        </div>

        <div style="margin-bottom:14px;">
          <label style=${LABEL}>Descripción <span style=${NOTA}>· respeta espacios y saltos de línea</span></label>
          ${barraFormato(this.descRef, "descripcion")}
          <div style="position:relative;">
            <div ref=${this.descRef} class="dc-rico" contenteditable="true" onInput=${() => this.onEditor("descripcion", this.descRef)} style=${EDITOR}></div>
            ${!f.descripcion && html`<span style="position:absolute;top:10px;left:12px;color:${TINTA3};font-size:14px;pointer-events:none;">De qué trata la clase y cómo la vas a conducir.</span>`}
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label style=${LABEL}>Contenido <span style=${NOTA}>· texto e imágenes por enlace</span></label>
          ${barraFormato(this.contRef, "contenido", html`
            <span style="width:1px;height:20px;background:${BORDE};"></span>
            <button type="button" onMouseDown=${(e) => this.insertarImagen(e)} title="Insertar imagen desde un enlace" style=${BTN_HERR}>${I.imagen} Imagen</button>`)}
          <div style="position:relative;">
            <div ref=${this.contRef} class="dc-rico" contenteditable="true" onInput=${() => this.onEditor("contenido", this.contRef)} style="${EDITOR}min-height:110px;max-height:340px;"></div>
            ${!f.contenido && html`<span style="position:absolute;top:10px;left:12px;color:${TINTA3};font-size:14px;pointer-events:none;">Conceptos, citas, ejemplos, imágenes que proyectarás…</span>`}
          </div>
        </div>

        <div style="margin-bottom:14px;">
          <label style="${LABEL}display:flex;align-items:center;gap:6px;color:oklch(45% 0.1 75);">${I.chincheta} Recordar <span style=${NOTA}>· notas solo para ti (no se proyectan a menos que las abras)</span></label>
          <textarea value=${f.recordar} onInput=${this.campo("recordar")} placeholder="Ej: llevar marcadores, devolver talleres, preguntar a Laura por la tarea." style="${INPUT}min-height:56px;resize:vertical;background:oklch(97% 0.04 95);border-color:oklch(88% 0.07 92);"></textarea>
        </div>

        <div style="margin-bottom:6px;">
          <label style=${LABEL}>Enlaces y recursos <span style=${NOTA}>· uno por línea; en la presentación se muestran como código QR</span></label>
          <textarea value=${f.archivos} onInput=${this.campo("archivos")} placeholder=${"https://drive.google.com/…\nhttps://docs.google.com/document/…"} style="${INPUT}min-height:56px;resize:vertical;"></textarea>
        </div>

        <div style="display:flex;gap:10px;margin-top:18px;">
          <button onClick=${this.closeActividadModal} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarActividad} style=${BTN_OK}>${s.editingId ? "Actualizar" : "Guardar"}</button>
        </div>
      </div>
    </div>`;
  }

  /* ----- modal de asignatura ----- */
  renderMateriaModal() {
    const mm = this.state.materiaModal;
    return html`
    <div onClick=${enFondo(() => this.setState({ materiaModal: null }))} style="position:fixed;inset:0;background:oklch(20% 0.02 50 / 0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:18px;">
      <div style="background:${PAPEL};width:100%;max-width:440px;border-radius:14px;padding:24px;box-sizing:border-box;border-top:4px solid ${mm.color || ACENTO};">
        <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:600;margin-bottom:16px;color:${TINTA};">${mm.editId ? "Editar asignatura" : "Nueva asignatura"}</div>
        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Nombre</label>
          <input type="text" value=${mm.nombre} onInput=${(e) => this.setMateria("nombre", e.target.value)} placeholder="Filosofía" style=${INPUT}/>
        </div>
        <div style="margin-bottom:16px;">
          <label style=${LABEL}>Curso <span style=${NOTA}>· agrupa las asignaturas de un mismo curso</span></label>
          <input type="text" list="dc-cursos" value=${mm.curso} onInput=${(e) => this.setMateria("curso", e.target.value)} placeholder="Décimo A" style=${INPUT}/>
          <datalist id="dc-cursos">${[...new Set(this.state.materias.map(m => m.curso).filter(Boolean))].map(c => html`<option key=${c} value=${c}/>`)}</datalist>
        </div>
        <div style="margin-bottom:18px;">
          <label style="${LABEL}margin-bottom:8px;">Color de la asignatura</label>
          <${SelectorColor} valor=${mm.color} onCambio=${(c) => this.setMateria("color", c)}/>
        </div>
        <div style="display:flex;gap:10px;">
          <button onClick=${() => this.setState({ materiaModal: null })} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarMateria} style=${BTN_OK}>${mm.editId ? "Guardar cambios" : "Crear asignatura"}</button>
        </div>
      </div>
    </div>`;
  }

  /* ----- modal de curso (nombre, color, notas) ----- */
  renderCursoModal() {
    const cm = this.state.cursoModal;
    const cerrar = () => this.setState({ cursoModal: null });
    return html`
    <div onClick=${enFondo(cerrar)} style="position:fixed;inset:0;background:oklch(20% 0.02 50 / 0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:18px;">
      <div style="background:${PAPEL};width:100%;max-width:460px;max-height:92vh;overflow-y:auto;border-radius:14px;padding:24px;box-sizing:border-box;border-top:4px solid ${cm.color};">
        <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:600;margin-bottom:16px;color:${TINTA};">Curso: ${nombreCurso(cm.original)}</div>
        <div style="margin-bottom:14px;">
          <label style=${LABEL}>Nombre del curso</label>
          <input type="text" value=${cm.nombre} autofocus=${cm.foco === "nombre"} onInput=${(e) => this.setCursoModal("nombre", e.target.value)} placeholder="Décimo A" style=${INPUT}/>
          <div style="font-size:11.5px;color:${TINTA3};margin-top:4px;">Se cambia en todas sus asignaturas.</div>
        </div>
        <div style="margin-bottom:16px;">
          <label style="${LABEL}margin-bottom:8px;">Color del curso</label>
          <${SelectorColor} valor=${cm.color} onCambio=${(c) => this.setCursoModal("color", c)}/>
        </div>
        <div style="margin-bottom:18px;">
          <label style=${LABEL}>Notas sobre el curso</label>
          <textarea value=${cm.notas} autofocus=${cm.foco === "notas"} onInput=${(e) => this.setCursoModal("notas", e.target.value)} placeholder="Horario, acuerdos del grupo, estudiantes a tener en cuenta…" style="${INPUT}min-height:110px;resize:vertical;background:oklch(97% 0.04 95);border-color:oklch(88% 0.07 92);"></textarea>
        </div>
        <div style="display:flex;gap:10px;">
          <button onClick=${cerrar} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarCursoModal} style=${BTN_OK}>Guardar</button>
        </div>
      </div>
    </div>`;
  }

  /* ----- momentos: barra de tiempo + lista; se despliega el momento activo ----- */
  renderMomentos(momentos, mins, color) {
    const act = Math.min(this.state.momento || 0, momentos.length - 1);
    const sobre = tintaSobre(color);
    const elegir = (i) => this.setState({ momento: i });
    let acumulado = 0;
    return html`
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:26px 0 10px;">
        <div style=${SECCION}>Momentos</div>
        ${mins > 0 && html`<div style="font-size:12.5px;font-weight:700;color:${TINTA2};">${mins} min en total</div>`}
      </div>
      <div style="display:flex;gap:3px;margin-bottom:12px;" role="tablist" aria-label="Momentos de la clase">
        ${momentos.map((mo, i) => html`
          <button class="dc-mo-seg" role="tab" aria-selected=${i === act} onClick=${() => elegir(i)} title=${(mo.nombre || "Momento " + (i + 1)) + (mo.minutos ? " · " + mo.minutos + " min" : "")}
            style="flex:${parseInt(mo.minutos, 10) || 1} 1 0;background:${i === act ? color : i < act ? mezcla(color, 55) : mezcla(color, 25)};"></button>`)}
      </div>
      <ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:4px;">
        ${momentos.map((mo, i) => {
          const on = i === act;
          const desde = acumulado;
          acumulado += parseInt(mo.minutos, 10) || 0;
          const roles = on && mo.detalle ? partirPorRol(mo.detalle) : null;
          return html`
          <li key=${mo.id || i} style="border-radius:12px;${on ? "background:" + PAPEL + ";border:1px solid " + BORDE + ";box-shadow:0 2px 10px oklch(25% 0.03 50 / 0.07);" : "border:1px solid transparent;"}">
            <button class="dc-mo" onClick=${() => elegir(i)} aria-expanded=${on} style="${on ? "background:transparent;" : ""}">
              <span style="width:28px;height:28px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;${on ? "background:" + color + ";color:" + sobre + ";" : "background:" + PAPEL + ";color:" + TINTA2 + ";border:1.5px solid " + mezcla(color, 60) + ";"}">${i + 1}</span>
              <span style="flex:1;min-width:0;">
                <span style="display:block;font-size:15px;font-weight:700;color:${on ? TINTA : TINTA2};">${mo.nombre || "Momento " + (i + 1)}</span>
                ${mins > 0 && mo.minutos && html`<span style="display:block;font-size:12px;color:${TINTA3};margin-top:1px;">min ${desde}–${acumulado}</span>`}
              </span>
              ${mo.minutos && html`<span style="flex:none;font-size:12.5px;font-weight:700;padding:3px 9px;border-radius:999px;background:${on ? mezcla(color, 25) : "oklch(93% 0.01 65)"};color:${TINTA};">${mo.minutos} min</span>`}
            </button>
            ${on && mo.detalle && html`
              <div style="padding:2px 14px 14px 49px;">
                ${roles ? roles.map(g => html`
                  <div style="margin-top:8px;">
                    ${g.rol && html`<div style="display:inline-block;font-size:10.5px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:${TINTA2};background:${g.rol === "Docente" ? "oklch(93% 0.02 60)" : mezcla(color, 22)};padding:2px 8px;border-radius:5px;margin-bottom:4px;">${g.rol}</div>`}
                    <div style="font-size:14.5px;color:oklch(32% 0.02 55);line-height:1.55;">${g.texto}</div>
                  </div>`)
                : html`<div style="font-size:14.5px;color:oklch(32% 0.02 55);line-height:1.55;white-space:pre-wrap;">${mo.detalle}</div>`}
              </div>`}
          </li>`;
        })}
      </ol>
      ${momentos.length > 1 && html`
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;">
          <button class="dc-mo-nav" disabled=${act === 0} onClick=${() => this.irMomento(-1)}>← Anterior</button>
          <button class="dc-mo-nav" disabled=${act === momentos.length - 1} onClick=${() => this.irMomento(1)}>Siguiente →</button>
          <span style="font-size:11.5px;color:${TINTA3};margin-left:auto;">También con ← →</span>
        </div>`}`;
  }

  /* ----- contenido en tarjetas: conceptos, listas numeradas, preguntas ----- */
  renderContenido(fuente, color) {
    const TXT = "font-size:clamp(16px,1.3vw,19px);line-height:1.6;color:oklch(30% 0.02 55);";
    const bloques = bloquesContenido(fuente);
    if (!bloques) return html`<div class="dc-pres-cont" dangerouslySetInnerHTML=${{ __html: fuente }} style="${TXT}white-space:pre-wrap;max-width:75ch;"></div>`;

    const parte = (p, k) => {
      const enumr = !/</.test(p) ? partirEnumeracion(textoPlano(p)) : null;
      if (!enumr) return html`<div key=${k} class="dc-pres-cont" dangerouslySetInnerHTML=${{ __html: p }} style="${TXT}${k ? "margin-top:6px;" : ""}"></div>`;
      return html`
        <div key=${k}>
          ${enumr.intro && html`<div style=${TXT}>${enumr.intro}</div>`}
          <ol class="dc-pres-enum">
            ${enumr.items.map((it, i) => {
              const par = /^(.+?)\s*\(([^()]+)\)\.?$/.exec(it);
              return html`
              <li style="display:flex;gap:10px;align-items:flex-start;background:oklch(97.5% 0.008 72);border:1px solid ${BORDE};border-radius:12px;padding:12px 13px;">
                <span style="width:26px;height:26px;border-radius:50%;flex:none;background:${color};color:${tintaSobre(color)};font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;">${i + 1}</span>
                <span style="min-width:0;">
                  <span style="display:block;font-size:clamp(15px,1.2vw,17.5px);font-weight:700;color:${TINTA};line-height:1.3;">${par ? par[1] : it}</span>
                  ${par && html`<span style="display:block;font-size:clamp(13.5px,1.05vw,15px);color:${TINTA2};margin-top:3px;line-height:1.35;">${par[2]}</span>`}
                </span>
              </li>`;
            })}
          </ol>
        </div>`;
    };
    const largo = (b) => b.tipo !== "tarjeta" || b.partes.some(p => !/</.test(p) && partirEnumeracion(textoPlano(p))) || b.partes.reduce((n, p) => n + textoPlano(p).length, 0) > 240;

    // Las tarjetas cortas seguidas comparten fila; el resto ocupa todo el ancho.
    const filas = [];
    bloques.forEach(b => {
      const ultima = filas[filas.length - 1];
      if (!largo(b) && ultima && ultima.corta) ultima.items.push(b);
      else filas.push({ corta: !largo(b), items: [b] });
    });
    const bloque = (b, i) => {
          if (b.tipo === "imagen") return html`<div key=${i} class="dc-pres-cont" dangerouslySetInnerHTML=${{ __html: b.partes[0] }} style=${TXT}></div>`;
          if (b.tipo === "parrafo") return html`<div key=${i}>${b.partes.map(parte)}</div>`;
          if (b.tipo === "pregunta") return html`
            <div key=${i} style="display:flex;gap:16px;align-items:center;background:${mezcla(color, 16)};border:1px solid ${mezcla(color, 40)};border-radius:16px;padding:clamp(16px,2vw,24px);">
              <span aria-hidden="true" style="width:46px;height:46px;border-radius:50%;flex:none;background:${color};color:${tintaSobre(color)};font-family:'Fraunces',serif;font-size:26px;font-weight:700;display:flex;align-items:center;justify-content:center;">?</span>
              <div style="min-width:0;">
                ${b.titulo && html`<div style="${SECCION}color:${TINTA2};margin-bottom:5px;">${b.titulo}</div>`}
                ${b.partes.map((p, k) => html`<div key=${k} class="dc-pres-cont" dangerouslySetInnerHTML=${{ __html: p }} style="font-family:'Fraunces',serif;font-size:clamp(19px,1.75vw,26px);font-weight:500;color:${TINTA};line-height:1.4;"></div>`)}
              </div>
            </div>`;
          return html`
            <article key=${i} style="background:${PAPEL};border:1px solid ${BORDE};border-top:4px solid ${color};border-radius:14px;padding:clamp(14px,1.6vw,20px) clamp(16px,1.8vw,22px);box-shadow:0 1px 3px oklch(20% 0.02 50 / 0.05);">
              <h3 style="margin:0 0 8px;font-family:'Fraunces',serif;font-size:clamp(18px,1.5vw,22px);font-weight:600;color:${TINTA};line-height:1.25;">${b.titulo}</h3>
              ${b.partes.map(parte)}
            </article>`;
    };
    return html`
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${filas.map((f, i) => f.items.length > 1
          ? html`<div key=${i} class="dc-pres-bloques">${f.items.map(bloque)}</div>`
          : bloque(f.items[0], i))}
      </div>`;
  }

  /* ----- presentación para el docente ----- */
  // Objetivo arriba a la izquierda, palabras clave debajo; descripción y
  // contenido ocupan la mayor parte; abajo la fecha (izquierda) y el título.
  renderPresentacion(a) {
    const s = this.state;
    const materia = s.materias.find(m => m.id === a.materiaId);
    const hecha = a.estado === "Realizada";
    const kws = parseKeywords(a.keywords);
    const enlaces = parseEnlaces(a.archivos);
    const color = materia ? materia.color : "oklch(85% 0.02 65)";
    const momentos = a.momentos || [];
    const mins = minutosTotales(momentos);
    const vacio = !a.descripcion && !a.contenido;

    return html`
    <div ref=${this.presRef} class="dc-pres-raiz" role="dialog" aria-label=${"Presentación: " + a.titulo} style="position:fixed;inset:0;z-index:400;background:${PAPEL};display:flex;flex-direction:column;">
      <div style="height:6px;background:${color};flex:none;"></div>
      <div class="dc-pres" style="flex:1;min-height:0;">

        <div class="dc-pres-lado" style="padding:clamp(20px,2.6vw,36px);overflow-y:auto;background:oklch(97.5% 0.008 72);">
          <div style="background:${PAPEL};border:1px solid ${BORDE};border-left:5px solid ${color};border-radius:14px;padding:16px 18px;box-shadow:0 1px 3px oklch(20% 0.02 50 / 0.05);">
            <div style="${SECCION}margin-bottom:7px;">Objetivo</div>
            <div style="font-family:'Fraunces',serif;font-size:clamp(17px,1.45vw,21px);font-weight:500;color:${TINTA};line-height:1.45;">${a.objetivo || html`<i style="color:${TINTA3};">Sin objetivo</i>`}</div>
          </div>

          ${kws.length > 0 && html`
            <div style="${SECCION}margin:22px 0 9px;">Palabras clave</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;">
              ${kws.map(kw => html`<span style="font-size:clamp(13.5px,1.05vw,15px);font-weight:600;padding:6px 13px;background:${mezcla(color, 22)};border:1px solid ${mezcla(color, 45)};color:${TINTA};border-radius:999px;">${kw}</span>`)}
            </div>`}

          ${momentos.length > 0 && this.renderMomentos(momentos, mins, color)}
        </div>

        <div style="padding:clamp(22px,3.2vw,48px);overflow-y:auto;min-width:0;">
          <div style="max-width:1150px;">
          ${a.descripcion && html`
            <section style="margin-bottom:clamp(22px,3vw,36px);">
              <div style="${SECCION}margin-bottom:10px;">De qué trata la clase</div>
              <div class="dc-pres-cont" dangerouslySetInnerHTML=${{ __html: a.descripcion }} style="font-size:clamp(17px,1.5vw,22px);color:oklch(28% 0.02 55);line-height:1.65;white-space:pre-wrap;max-width:72ch;"></div>
            </section>`}
          ${a.contenido && html`
            <section>
              <div style="${SECCION}margin-bottom:12px;">Contenido</div>
              ${this.renderContenido(a.contenido, color)}
            </section>`}
          </div>
          ${vacio && html`
            <div style="height:100%;display:flex;align-items:center;justify-content:center;text-align:center;">
              <div>
                <div style="font-family:'Fraunces',serif;font-style:italic;font-size:17px;color:${TINTA3};margin-bottom:12px;">Esta clase aún no tiene descripción ni contenido.</div>
                <button onClick=${() => { this.cerrarPresentacion(); this.openEditar(a.id); }} style="padding:10px 18px;border-radius:8px;border:1.5px solid ${ACENTO};background:transparent;color:${ACENTO};font-size:14px;font-weight:700;cursor:pointer;">Agregar contenido</button>
              </div>
            </div>`}
        </div>

        <div class="dc-pres-pie" style="border-top:1px solid ${BORDE};padding:14px clamp(16px,2.5vw,32px);display:flex;align-items:center;gap:clamp(12px,2vw,26px);flex-wrap:wrap;background:${PAPEL};">
          <div style="flex:none;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:${TINTA2};">${fechaLarga(a.fecha)}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
              <span style="width:9px;height:9px;border-radius:50%;background:${color};"></span>
              <span style="font-size:12px;font-weight:700;color:${TINTA3};text-transform:uppercase;letter-spacing:0.06em;">${materia ? nombreMateria(materia) : ""}</span>
            </div>
          </div>
          <h2 style="flex:1;min-width:200px;font-family:'Fraunces',serif;font-size:clamp(22px,2.8vw,38px);font-weight:600;color:${TINTA};margin:0;line-height:1.15;">${a.titulo}</h2>

          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${enlaces.map(l => html`
              <div style="display:flex;border:1px solid ${BORDE};border-radius:10px;overflow:hidden;">
                <a href=${hrefSeguro(l)} target="_blank" rel="noopener" class="h-u" style="padding:9px 11px;font-size:13px;font-weight:700;color:${ACENTO};white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;">↗ ${nombreEnlace(l)}</a>
                <button onClick=${() => this.mostrarQR(l)} title="Mostrar código QR para los estudiantes" aria-label="Código QR" style="border:none;border-left:1px solid ${BORDE};background:oklch(96% 0.012 70);color:${TINTA};padding:0 10px;cursor:pointer;display:flex;align-items:center;">${I.qr}</button>
              </div>`)}
            <span style="width:1px;height:30px;background:${BORDE};margin:0 2px;"></span>
            ${a.recordar && html`<button class="dc-pres-btn" onClick=${() => this.setState(st => ({ verRecordar: !st.verRecordar }))} title="Recordar (solo para ti)" aria-label="Recordar" style="color:oklch(45% 0.11 80);background:${s.verRecordar ? "oklch(93% 0.08 95)" : PAPEL};">${I.chincheta}</button>`}
            <button class="dc-pres-btn" onClick=${() => this.toggleEstado(a.id)} title=${hecha ? "Marcar como planeada" : "Marcar como realizada"} aria-label="Cambiar estado" style="${hecha ? "background:oklch(93% 0.03 145);color:" + VERDE + ";border-color:" + VERDE + ";" : ""}">${I.check}</button>
            <button class="dc-pres-btn" onClick=${() => { this.cerrarPresentacion(); this.openEditar(a.id); }} title="Editar" aria-label="Editar">${I.lapiz}</button>
            <button class="dc-pres-btn" onClick=${() => { this.cerrarPresentacion(); this.eliminarActividad(a.id); }} title="Eliminar" aria-label="Eliminar">${I.basura}</button>
            <button class="dc-pres-btn" onClick=${this.pantallaCompleta} title="Pantalla completa" aria-label="Pantalla completa">${I.completa}</button>
            <button class="dc-pres-btn" onClick=${this.cerrarPresentacion} title="Cerrar (Esc)" aria-label="Cerrar" style="background:${TINTA};color:${PAPEL};border-color:${TINTA};">${I.cerrar}</button>
          </div>
        </div>
      </div>

      ${s.verRecordar && a.recordar && html`
        <div style="position:absolute;right:clamp(16px,2.5vw,32px);bottom:96px;width:min(320px,calc(100% - 32px));background:oklch(95% 0.08 95);border:1px solid oklch(85% 0.09 92);border-radius:12px;padding:14px 16px;box-shadow:0 14px 34px oklch(30% 0.05 80 / 0.25);transform:rotate(-1deg);">
          <div style="${SECCION}color:oklch(42% 0.09 75);margin-bottom:6px;display:flex;align-items:center;gap:6px;">${I.chincheta} Recordar</div>
          <div style="font-size:14.5px;color:oklch(30% 0.04 70);line-height:1.5;white-space:pre-wrap;">${a.recordar}</div>
        </div>`}

      ${s.qr && html`
        <div onClick=${enFondo(() => this.setState({ qr: null }))} style="position:absolute;inset:0;background:oklch(15% 0.01 50 / 0.75);display:flex;align-items:center;justify-content:center;padding:20px;z-index:5;">
          <div style="background:${PAPEL};border-radius:20px;padding:clamp(20px,3vw,34px);text-align:center;max-width:min(560px,100%);box-sizing:border-box;">
            <div style="font-family:'Fraunces',serif;font-size:clamp(20px,2.4vw,28px);font-weight:600;color:${TINTA};margin-bottom:4px;">${s.qr.nombre}</div>
            <div style="font-size:14px;color:${TINTA2};margin-bottom:16px;">Escanea con la cámara del celular</div>
            <div style="width:min(60vh,420px,80vw);aspect-ratio:1;margin:0 auto;display:flex;align-items:center;justify-content:center;background:white;border-radius:12px;">
              ${s.qr.img ? html`<img src=${s.qr.img} alt=${"Código QR de " + s.qr.nombre} style="width:100%;height:100%;image-rendering:pixelated;"/>`
              : s.qr.error ? html`<div style="font-size:14px;color:${TINTA2};padding:20px;">No se pudo generar el QR (¿sin conexión?). Usa "Copiar enlace".</div>`
              : html`<div style="font-family:'Fraunces',serif;font-style:italic;color:${TINTA3};">Generando…</div>`}
            </div>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;flex-wrap:wrap;">
              <button onClick=${() => this.copiar(s.qr.url)} style="padding:10px 16px;border-radius:8px;border:1.5px solid ${BORDE};background:transparent;color:${TINTA};font-size:14px;font-weight:700;cursor:pointer;">Copiar enlace</button>
              <button onClick=${() => this.setState({ qr: null })} style="padding:10px 16px;border-radius:8px;border:none;background:${ACENTO};color:oklch(97% 0.01 70);font-size:14px;font-weight:700;cursor:pointer;">Listo</button>
            </div>
          </div>
        </div>`}
    </div>`;
  }
}
