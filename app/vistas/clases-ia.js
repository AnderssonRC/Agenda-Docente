// clases-ia.js — Importar una clase creada con IA (ChatGPT, Gemini, Claude…).
//
// No se conecta a ninguna IA: el docente copia una instrucción, la pega en la
// IA que prefiera y trae la respuesta. Aquí se lee esa respuesta y se reparte
// en los campos de la clase, incluidos los MOMENTOS.
// Acepta: el formato que pide la instrucción, JSON, o texto con encabezados
// sueltos ("Inicio (10 min)", "**Desarrollo:**", "Momento 2 – Práctica"…).

export function escapar(t) {
  return String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function promptIA(asignatura, curso, tema) {
  return `Diseña una clase de ${asignatura || "[ASIGNATURA]"}${curso ? " para el curso " + curso : ""} sobre: ${tema || "[ESCRIBE AQUÍ EL TEMA]"}.

Responde SOLO con este formato exacto (sin tablas, sin texto antes ni después). Cada sección empieza con su etiqueta en mayúsculas y dos puntos:

TÍTULO: título corto de la clase
OBJETIVO: objetivo de aprendizaje en una o dos frases
PALABRAS CLAVE: palabra1, palabra2, palabra3, palabra4
DESCRIPCIÓN: de qué trata la clase y cómo se conduce (un párrafo)
MOMENTO: Inicio | 10 min
qué hace el docente y qué hacen los estudiantes
MOMENTO: Desarrollo | 30 min
qué hace el docente y qué hacen los estudiantes
MOMENTO: Cierre | 10 min
qué hace el docente y qué hacen los estudiantes
CONTENIDO: conceptos, definiciones, ejemplos o preguntas que se proyectarán
RECORDAR: materiales o tareas que el docente debe tener presentes
RECURSOS: enlaces útiles, uno por línea (solo si existen de verdad)

Puedes usar más o menos momentos (por ejemplo Exploración, Estructuración, Transferencia, Evaluación).`;
}

const SECCIONES = [
  ["titulo", /^t[ií]tulo(?:\s+de\s+la\s+clase)?$/i],
  ["objetivo", /^objetivos?(?:\s+de\s+(?:aprendizaje|la\s+clase))?$/i],
  ["keywords", /^(?:palabras?\s+clave|conceptos\s+clave|keywords)$/i],
  ["descripcion", /^(?:descripci[oó]n|resumen|introducci[oó]n\s+general)$/i],
  ["contenido", /^(?:contenidos?|tema(?:s)?\s+a\s+desarrollar)$/i],
  ["recordar", /^(?:recordar|notas?\s+(?:para\s+el\s+)?docente|materiales)$/i],
  ["recursos", /^(?:recursos|enlaces|links|referencias)$/i],
  ["momentos", /^(?:momentos(?:\s+de\s+la\s+clase)?|secuencia\s+did[aá]ctica|estructura\s+de\s+la\s+clase)$/i]
];

const NOMBRES_MOMENTO = "inicio|apertura|exploraci[oó]n|motivaci[oó]n|activaci[oó]n(?:\\s+de\\s+saberes(?:\\s+previos)?)?|saberes\\s+previos|desarrollo|estructuraci[oó]n|conceptualizaci[oó]n|pr[aá]ctica|ejercitaci[oó]n|transferencia|aplicaci[oó]n|cierre|evaluaci[oó]n|socializaci[oó]n|retroalimentaci[oó]n|reflexi[oó]n|consolidaci[oó]n|plenaria";
const RE_MOMENTO_NOMBRADO = new RegExp("^(?:momento\\s*\\d*\\s*[:.\\-–—]?\\s*)?(" + NOMBRES_MOMENTO + ")\\b(.*)$", "i");
const RE_MINUTOS = /(\d{1,3})\s*(?:min(?:utos|s)?\.?|')/i;

/** Quita viñetas, numeración y negritas de markdown. */
function limpiar(linea) {
  return linea
    .replace(/^\s*(?:#{1,6}\s*|>\s*)/, "")
    .replace(/\*\*|__/g, "")
    .replace(/^\s*(?:[-*•·]\s+|\d+[.)]\s+)/, "")
    .trim();
}

/** Separa "Inicio | 10 min" o "Desarrollo (30 minutos): texto" en nombre, minutos y texto. */
function partirMomento(cabeza) {
  let texto = "";
  let c = cabeza;
  const dos = c.indexOf(":");
  if (dos !== -1) { texto = c.slice(dos + 1).trim(); c = c.slice(0, dos); }
  const mm = c.match(RE_MINUTOS) || texto.match(/^\(?\s*(\d{1,3})\s*min/i);
  const minutos = mm ? mm[1] : "";
  if (!(c.match(RE_MINUTOS)) && mm) texto = texto.replace(/^\(?\s*\d{1,3}\s*min(?:utos|s)?\.?\s*\)?\s*[-–—|:]?\s*/i, "");
  const nombre = c.replace(RE_MINUTOS, "").replace(/[|()[\]–—\-]+/g, " ").replace(/^\s*momento\s*\d*\s*[:.]?\s*/i, "").replace(/\s+/g, " ").trim();
  return { nombre: nombre ? nombre.charAt(0).toUpperCase() + nombre.slice(1) : "", minutos, texto };
}

function desdeJSON(texto) {
  const i = texto.indexOf("{"), j = texto.lastIndexOf("}");
  if (i === -1 || j <= i) return null;
  let o;
  try { o = JSON.parse(texto.slice(i, j + 1)); } catch (e) { return null; }
  if (!o || typeof o !== "object") return null;
  const g = (...ks) => { for (const k of ks) { const v = o[k]; if (v != null && v !== "") return v; } return ""; };
  const lista = (v) => Array.isArray(v) ? v.join(v.every(x => typeof x === "string" && x.length < 40) ? ", " : "\n") : String(v || "");
  const ms = g("momentos", "Momentos", "secuencia", "moments");
  return {
    titulo: String(g("titulo", "título", "title", "Título")),
    objetivo: String(g("objetivo", "objetivo_de_aprendizaje", "objective", "Objetivo")),
    keywords: lista(g("palabras_clave", "palabrasClave", "palabras clave", "keywords")),
    descripcion: String(g("descripcion", "descripción", "description")),
    contenido: lista(g("contenido", "contenidos", "content")),
    recordar: lista(g("recordar", "materiales", "notas")),
    recursos: lista(g("recursos", "enlaces", "links")).split(/[\n,]+\s*/).filter(l => /^https?:\/\//i.test(l.trim())).join("\n"),
    momentos: Array.isArray(ms) ? ms.map(m => typeof m === "string" ? { nombre: m, minutos: "", detalle: "" } : {
      nombre: String(m.nombre || m.name || m.momento || m.titulo || ""),
      minutos: String(m.minutos || m.tiempo || m.duracion || m.duración || "").replace(/[^\d]/g, ""),
      detalle: lista(m.detalle || m.descripcion || m.descripción || m.actividades || m.description || "")
    }) : []
  };
}

/**
 * Lee la respuesta de la IA. Devuelve los campos encontrados y
 * `encontrados`: lista legible de lo que se reconoció.
 */
export function parsearIA(texto) {
  const r = { titulo: "", objetivo: "", keywords: "", descripcion: "", contenido: "", recordar: "", recursos: "", momentos: [], encontrados: [] };
  if (!texto || !texto.trim()) return r;

  const j = desdeJSON(texto);
  if (j && (j.titulo || j.objetivo || j.momentos.length)) {
    Object.assign(r, j);
  } else {
    const partes = { titulo: [], objetivo: [], keywords: [], descripcion: [], contenido: [], recordar: [], recursos: [] };
    let actual = null, momento = null;
    const cerrarMomento = () => { if (momento) { r.momentos.push({ nombre: momento.nombre, minutos: momento.minutos, detalle: momento.lineas.join("\n").trim() }); momento = null; } };

    texto.replace(/\r/g, "").split("\n").forEach(cruda => {
      const linea = limpiar(cruda);
      if (!linea) { if (momento) momento.lineas.push(""); else if (actual && partes[actual]) partes[actual].push(""); return; }
      if (/^[-=_*]{3,}$/.test(linea)) return;

      // ¿"ETIQUETA: valor"?
      const dos = linea.match(/^([^:]{2,40}):\s*(.*)$/);
      if (dos) {
        const etiqueta = dos[1].trim();
        // MOMENTO: Inicio | 10 min
        if (/^momento\s*\d*$/i.test(etiqueta)) {
          cerrarMomento();
          const p = partirMomento(dos[2]);
          momento = { nombre: p.nombre, minutos: p.minutos, lineas: p.texto ? [p.texto] : [] };
          actual = "momentos";
          return;
        }
        const sec = SECCIONES.find(([, re]) => re.test(etiqueta));
        if (sec) {
          cerrarMomento();
          actual = sec[0];
          if (actual !== "momentos" && dos[2]) partes[actual].push(dos[2]);
          return;
        }
      } else {
        const sec = SECCIONES.find(([, re]) => re.test(linea.replace(/[:.]$/, "")));
        if (sec) { cerrarMomento(); actual = sec[0]; return; }
      }

      // Encabezado de momento sin la palabra "MOMENTO" (p. ej. "Inicio (10 min):").
      // Solo si es corto o venía marcado como título/negrita, para no confundir
      // frases como "Desarrollo de la guía en grupos…".
      const m = linea.match(RE_MOMENTO_NOMBRADO);
      const marcado = /^\s*(#{1,6}|\*\*|__|\d+[.)])/.test(cruda) || /:\s*$/.test(linea) || RE_MINUTOS.test(linea.slice(0, 40));
      if (m && (actual === "momentos" || momento || marcado) && (linea.length <= 60 || marcado) && !(m[2] && /^\s+de\s/i.test(m[2]) && !marcado)) {
        cerrarMomento();
        const p = partirMomento(linea);
        momento = { nombre: p.nombre, minutos: p.minutos, lineas: p.texto ? [p.texto] : [] };
        actual = "momentos";
        return;
      }

      if (momento) momento.lineas.push(linea);
      else if (actual && partes[actual]) partes[actual].push(linea);
    });
    cerrarMomento();

    const unir = (k) => partes[k].join("\n").replace(/\n{3,}/g, "\n\n").trim();
    r.titulo = unir("titulo").split("\n")[0];
    r.objetivo = unir("objetivo");
    r.keywords = unir("keywords").split(/\n+/).join(", ").replace(/\s*,\s*/g, ", ").replace(/\.$/, "");
    r.descripcion = unir("descripcion");
    r.contenido = unir("contenido");
    r.recordar = unir("recordar");
    r.recursos = (unir("recursos").match(/https?:\/\/[^\s)>\]]+/gi) || []).join("\n");
  }

  r.momentos = r.momentos.filter(m => m.nombre || m.detalle);
  if (r.titulo) r.encontrados.push("título");
  if (r.objetivo) r.encontrados.push("objetivo");
  if (r.keywords) r.encontrados.push("palabras clave");
  if (r.momentos.length) r.encontrados.push(r.momentos.length + " momento" + (r.momentos.length !== 1 ? "s" : ""));
  if (r.descripcion) r.encontrados.push("descripción");
  if (r.contenido) r.encontrados.push("contenido");
  if (r.recordar) r.encontrados.push("recordar");
  if (r.recursos) r.encontrados.push("recursos");
  return r;
}
