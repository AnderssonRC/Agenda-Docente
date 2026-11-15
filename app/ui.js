// ui.js — utilidades y piezas de interfaz compartidas por los módulos.
import { html, useState, useContext, useEffect } from "./lib.js";
import { MODULOS } from "./rutas.js";
import { PanelCtx, abrirDivision, cerrarDivision, ANCHO_DIVISION } from "./panel.js";

/* ---------- utilidades ---------- */

export function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export function localDateStr(ts) {
  const d = new Date(ts);
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
export function todayLocal() { return localDateStr(Date.now()); }

export function fechaHoyTexto() {
  return new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

/** Cuenta los nombres de un listado pegado (uno por línea). */
export function nombresDeListado(listado) {
  return (listado || "").split("\n").map(n => n.trim()).filter(Boolean);
}
export function conteoTexto(listado) {
  const n = nombresDeListado(listado).length;
  return n === 0 ? "Ningún nombre detectado aún" : n + " estudiante" + (n !== 1 ? "s" : "") + " detectado" + (n !== 1 ? "s" : "");
}

/** Inserta un bloque de CSS una sola vez (cada vista trae sus estilos). */
export function css(id, texto) {
  if (document.getElementById(id)) return;
  const s = document.createElement("style");
  s.id = id;
  s.textContent = texto;
  document.head.appendChild(s);
}

/** Cierra un modal solo si el clic fue en el fondo oscuro, no dentro de la tarjeta. */
export const enFondo = (fn) => (e) => { if (e.target === e.currentTarget) fn(); };

/* ---------- encabezado y pestañas de módulo ---------- */
// `tema` define los colores de cada módulo (ver TEMA en cada vista).

css("ui-base", `
  .solo-amplio{display:none!important;}
  @media (min-width:${ANCHO_DIVISION}px){ .solo-amplio{display:flex!important;} }
  .menu-div button:hover{background:oklch(94% 0.02 65);}
`);

/** Icono de pantalla dividida (dos paneles). */
export const ICONO_DIVIDIR = html`<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M12 4v16" stroke="currentColor" stroke-width="2"/></svg>`;

/** Botón "Dividir pantalla": elige qué otro módulo abrir al lado. Solo tablet/computador. */
function BotonDividir({ tema }) {
  const ctx = useContext(PanelCtx);
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    if (!abierto) return;
    const f = (e) => { if (!e.target.closest(".menu-div-wrap")) setAbierto(false); };
    document.addEventListener("click", f);
    return () => document.removeEventListener("click", f);
  }, [abierto]);
  const otros = MODULOS.filter(m => m.ruta !== ctx.ruta);
  return html`
    <div class="menu-div-wrap solo-amplio" style="position:relative;flex-shrink:0;">
      <button onClick=${() => setAbierto(a => !a)} title="Dividir pantalla" aria-label="Dividir pantalla" style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:8px;border:1.5px solid ${tema.sub};background:transparent;color:${tema.volver};font-size:13px;font-weight:600;cursor:pointer;">
        ${ICONO_DIVIDIR}<span>Dividir</span>
      </button>
      ${abierto && html`
        <div class="menu-div" style="position:absolute;right:0;top:calc(100% + 8px);min-width:240px;background:oklch(99% 0.005 75);border:1px solid oklch(86% 0.02 60);border-radius:12px;padding:6px;box-shadow:0 16px 40px oklch(30% 0.04 50 / 0.25);z-index:80;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:oklch(50% 0.02 55);padding:8px 10px 6px;">Abrir al lado</div>
          ${otros.map(m => html`
            <button onClick=${() => { setAbierto(false); abrirDivision(m.ruta); }} style="width:100%;display:flex;align-items:center;gap:10px;padding:10px;border-radius:8px;border:none;background:transparent;cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;color:oklch(32% 0.03 50);text-align:left;">
              <span style="font-size:18px;">${m.emoji}</span>${m.titulo}
            </button>`)}
          <div style="font-size:11.5px;color:oklch(55% 0.02 55);padding:6px 10px 6px;line-height:1.4;">Los elementos visibles se configuran en el Inicio → menú del avatar → Pantalla dividida.</div>
        </div>`}
    </div>`;
}

export function ModuleHeader({ tema, titulo, children }) {
  const ctx = useContext(PanelCtx);
  return html`
    <header style="background:${tema.header};padding:14px clamp(16px,4vw,40px);">
      <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        ${ctx.secundario ? html`
          <button onClick=${cerrarDivision} class="h-c" style="display:flex;align-items:center;gap:6px;color:${tema.volver};--hc:${tema.volverHover};font-size:14px;font-weight:600;flex-shrink:0;background:none;border:none;cursor:pointer;padding:0;font-family:inherit;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
            Cerrar panel
          </button>`
        : html`
          <a href="#/" class="h-c" style="display:flex;align-items:center;gap:6px;color:${tema.volver};--hc:${tema.volverHover};font-size:14px;font-weight:600;flex-shrink:0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            Volver
          </a>`}
        ${!ctx.dividido && html`<img src="logo-192.png" alt="Agenda Docente" style="width:32px;height:32px;border-radius:8px;object-fit:cover;flex-shrink:0;"/>`}
        <div style="flex:1;min-width:120px;">
          <div style="font-family:'Fraunces',serif;font-size:clamp(18px,3vw,21px);font-weight:600;color:${tema.titulo};line-height:1.2;">${titulo}</div>
          <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:${tema.sub};margin-top:2px;">${fechaHoyTexto()}</div>
        </div>
        ${children}
        ${!ctx.secundario && html`<${BotonDividir} tema=${tema}/>`}
      </div>
    </header>`;
}

/** tabs: [{ id, label }] */
export function Tabs({ tema, tabs, activo, onSelect, onAdd, addLabel }) {
  return html`
    <nav style="background:${tema.header};border-bottom:3px solid ${tema.acento};display:flex;align-items:flex-end;gap:2px;padding:0 clamp(12px,4vw,36px);overflow-x:auto;">
      ${tabs.map(t => {
        const on = t.id === activo;
        return html`<div key=${t.id} onClick=${() => onSelect(t.id)} style="padding:11px 16px;font-size:13.5px;font-weight:600;color:${on ? tema.tabActivo : tema.tabInactivo};background:${on ? tema.tabActivoBg : "transparent"};border-radius:8px 8px 0 0;cursor:pointer;white-space:nowrap;font-family:${on ? "'Fraunces',serif" : "'Manrope',sans-serif"};">${t.label}</div>`;
      })}
      <div onClick=${onAdd} style="padding:11px 14px;font-size:13px;font-weight:600;color:${tema.tabInactivo};cursor:pointer;white-space:nowrap;">${addLabel}</div>
    </nav>`;
}

export function Cargando({ color }) {
  return html`<div style="text-align:center;padding:60px 20px;font-family:'Fraunces',serif;font-style:italic;font-size:15px;color:${color};">Cargando…</div>`;
}

/* ---------- gráfico de evolución ---------- */

/**
 * regs: registros con `fecha` (ms). valor(r) = cuánto suma cada uno.
 * colorPunto(r) = color del punto. Devuelve los datos para <MiniChart>.
 */
export function construirGrafico(regs, valor, colorPunto) {
  const orden = regs.slice().sort((a, b) => a.fecha - b.fecha);
  if (orden.length === 0) return { hasData: false };
  let running = 0;
  const cumulative = orden.map(r => { running += valor(r); return running; });
  const min = Math.min(0, ...cumulative), max = Math.max(0, ...cumulative);
  const range = (max - min) || 1;
  const w = 280, h = 100, pad = 8, chartH = h - 22;
  const n = cumulative.length;
  const xFor = (i) => n === 1 ? w / 2 : pad + (i * (w - pad * 2) / (n - 1));
  const yFor = (v) => chartH - pad - ((v - min) / range) * (chartH - pad * 2);
  const circles = cumulative.map((v, i) => {
    const d = new Date(orden[i].fecha);
    return {
      cx: xFor(i), cy: yFor(v),
      leftPct: (xFor(i) / w) * 100,
      color: colorPunto(orden[i]),
      dia: d.toLocaleDateString("es-CO", { day: "numeric", month: "short" }).replace(".", ""),
      hora: d.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", hour12: false }),
      // Con muchos puntos, la fecha va en puntos alternos (siempre el primero y el último).
      mostrar: n <= 5 ? true : (i % 2 === 0 || i === n - 1)
    };
  });
  return { hasData: true, points: circles.map(c => c.cx + "," + c.cy).join(" "), circles, zeroY: yFor(0) };
}

export function MiniChart({ chart, linea, eje, colorDia, colorHora, colorVacio }) {
  if (!chart.hasData) {
    return html`<div style="font-size:13px;color:${colorVacio};font-style:italic;font-family:'Fraunces',serif;margin-bottom:20px;">Aún no hay suficientes registros para el gráfico.</div>`;
  }
  return html`
    <div style="position:relative;margin-bottom:38px;">
      <svg viewBox="0 0 280 100" style="width:100%;height:140px;display:block;" preserveAspectRatio="none">
        <line x1="0" y1=${chart.zeroY} x2="280" y2=${chart.zeroY} stroke=${eje} stroke-width="1"/>
        <polyline points=${chart.points} fill="none" stroke=${linea} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${chart.circles.map(pt => html`<circle cx=${pt.cx} cy=${pt.cy} r="3" fill=${pt.color}/>`)}
      </svg>
      ${chart.circles.map(pt => html`
        <div style="position:absolute;left:${pt.leftPct}%;top:100%;transform:translate(-50%,6px);text-align:center;font-family:'IBM Plex Mono',monospace;line-height:1.25;white-space:nowrap;display:${pt.mostrar ? "block" : "none"};">
          <div style="font-size:10.5px;font-weight:600;color:${colorDia};">${pt.dia}</div>
          <div style="font-size:10px;color:${colorHora};">${pt.hora}</div>
        </div>`)}
    </div>`;
}

/* ---------- Acerca de Res Cogitans ---------- */

const TEXTO_ABOUT = "Res Cogitans es un proyecto que busca reivindicar el arte creador de los docentes, pues son Artesanos en su enseñar. Por esa razón, y sin descanso, se busca crear herramientas digitales, físicas y epistémicas que permitan al docente reivindicarse en su hacer social y político, mostrándose como un sabedor que une intelecto y materialidad (producción real), además de estar autorizado a ejercer bajo su razón intelectual y sus años de experiencia, cualquier tipo de transformación y decisión. Esto reivindica al docente como experto de la enseñanza, pues nadie más que él sabe el complejo Arte de Educar.";

/** oscuro = estilo del login; claro = estilo de la app. */
export function AboutModal({ abierto, onCerrar, oscuro }) {
  const c = oscuro
    ? { overlay: "oklch(12% 0.02 55 / 0.72)", panel: "oklch(24% 0.03 58)", borde: "1px solid oklch(38% 0.04 55)", sombra: "0 24px 60px oklch(6% 0.02 55 / 0.6)",
        titulo: "oklch(94% 0.02 70)", lema: "oklch(80% 0.15 75)", lemaSombra: "0 0 14px oklch(80% 0.15 75 / 0.18)",
        cerrar: "oklch(72% 0.03 60)", cerrarBg: "oklch(20% 0.028 58)", texto: "oklch(94% 0.02 70)", linea: "oklch(38% 0.04 55)", firma: "oklch(72% 0.03 60)" }
    : { overlay: "oklch(20% 0.03 45 / 0.55)", panel: "oklch(99% 0.005 75)", borde: "none", sombra: "0 24px 60px oklch(15% 0.03 50 / 0.4)",
        titulo: "oklch(28% 0.03 50)", lema: "oklch(55% 0.1 60)", lemaSombra: "none",
        cerrar: "oklch(55% 0.02 50)", cerrarBg: "oklch(95% 0.01 65)", texto: "oklch(35% 0.02 50)", linea: "oklch(90% 0.015 60)", firma: "oklch(45% 0.03 50)" };
  return html`
    <div onClick=${enFondo(onCerrar)} style="position:fixed;inset:0;background:${c.overlay};display:flex;align-items:center;justify-content:center;padding:20px;z-index:200;opacity:${abierto ? 1 : 0};visibility:${abierto ? "visible" : "hidden"};transition:opacity .18s, visibility .18s;">
      <div style="background:${c.panel};border:${c.borde};max-width:560px;width:100%;max-height:86vh;overflow-y:auto;border-radius:20px;padding:clamp(26px,4vw,38px);box-shadow:${c.sombra};box-sizing:border-box;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
          <img src="logo-res-cogitas.png" alt="" style="width:44px;height:44px;border-radius:11px;object-fit:cover;"/>
          <div style="line-height:1.1;">
            <div style="font-family:'Fraunces',serif;font-size:21px;font-weight:700;color:${c.titulo};">Res Cogitans</div>
            <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;color:${c.lema};text-shadow:${c.lemaSombra};">EL ARTE DE EDUCAR</div>
          </div>
          <div style="flex:1;"></div>
          <div onClick=${onCerrar} style="cursor:pointer;font-size:24px;line-height:1;color:${c.cerrar};width:34px;height:34px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:${c.cerrarBg};">×</div>
        </div>
        <p style="font-size:15px;line-height:1.72;color:${c.texto};margin:0 0 16px;font-family:'Fraunces',serif;">${TEXTO_ABOUT}</p>
        <div style="border-top:1px solid ${c.linea};padding-top:14px;font-size:13.5px;color:${c.firma};font-style:italic;">Att: Andersson Cortes y Res Cogitans</div>
      </div>
    </div>`;
}
