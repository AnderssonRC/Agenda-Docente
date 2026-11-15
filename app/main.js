// main.js — arranque de la app de una sola página.
// Carga Firebase y la sesión una vez; cada pantalla se descarga solo cuando
// se abre (y luego queda en memoria). Las rutas van en el hash: #/clases, #/admin…

import { html, render, useState, useEffect } from "./lib.js";
import { getSession, onSession } from "./session.js";
import { onDataError, watch } from "./data.js";
import { RUTAS, MODULOS } from "./rutas.js";
import {
  PanelCtx, onDivision, abrirDivision, cerrarDivision, pantallaAmplia,
  leerOcultos, CLAVE_CONFIG
} from "./panel.js";

const ES_MODULO = new Set(MODULOS.map(m => m.ruta));

const cargadas = {}; // ruta -> componente ya descargado

function rutaActual() {
  const r = location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  return Object.prototype.hasOwnProperty.call(RUTAS, r) && r !== "login" ? r : "";
}

function useRuta() {
  const [ruta, setRuta] = useState(rutaActual);
  useEffect(() => {
    const f = () => setRuta(rutaActual());
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return ruta;
}

function Splash() {
  return html`
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:oklch(96% 0.012 75);">
      <img src="logo-192.png" alt="" style="width:64px;height:64px;border-radius:16px;opacity:.85;"/>
    </div>`;
}

function Vista({ nombre, props }) {
  const [Comp, setComp] = useState(() => cargadas[nombre] || null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cargadas[nombre]) return;
    let vivo = true;
    RUTAS[nombre].cargar()
      .then(m => { cargadas[nombre] = m.default; if (vivo) setComp(() => m.default); })
      .catch(e => { console.error(e); if (vivo) setError(true); });
    return () => { vivo = false; };
  }, [nombre]);

  if (error) {
    return html`<div style="padding:60px 20px;text-align:center;font-family:'Fraunces',serif;color:oklch(45% 0.02 55);">
      No se pudo cargar esta sección. <a href="" style="text-decoration:underline;">Recargar</a></div>`;
  }
  if (!Comp) return html`<${Splash}/>`;
  return html`<${Comp} ...${props}/>`;
}

/** Aviso flotante para errores de guardado/carga. */
function Avisos() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let t;
    const off = onDataError(m => { setMsg(m); clearTimeout(t); t = setTimeout(() => setMsg(""), 6000); });
    return () => { off(); clearTimeout(t); };
  }, []);
  if (!msg) return null;
  return html`<div role="alert" style="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:1000;background:oklch(30% 0.06 25);color:oklch(96% 0.02 25);padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 10px 30px oklch(20% 0.03 25 / 0.35);max-width:calc(100% - 32px);">${msg}</div>`;
}

function precargar() {
  const ir = () => Object.keys(RUTAS).forEach(r => {
    if (r === "login" || cargadas[r]) return;
    RUTAS[r].cargar().then(m => { cargadas[r] = m.default; }).catch(() => {});
  });
  ("requestIdleCallback" in window) ? requestIdleCallback(ir, { timeout: 3000 }) : setTimeout(ir, 1500);
}

/** Barra central de la pantalla dividida: arrastrar para cambiar el tamaño, intercambiar o cerrar. */
function Divisor({ onRatio, onIntercambiar }) {
  const mover = (e) => onRatio(Math.min(0.75, Math.max(0.25, e.clientX / window.innerWidth)));
  const empezar = (e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    const t = e.currentTarget;
    t.setPointerCapture(e.pointerId);
    t.onpointermove = mover;
    t.onpointerup = () => { t.onpointermove = null; t.onpointerup = null; };
  };
  const BTN = "width:26px;height:26px;border-radius:50%;border:none;background:oklch(32% 0.02 60);color:oklch(92% 0.01 70);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;";
  return html`
    <div onPointerDown=${empezar} title="Arrastra para cambiar el tamaño" style="flex:0 0 14px;background:oklch(22% 0.02 55);cursor:col-resize;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;touch-action:none;user-select:none;position:relative;z-index:5;">
      <button onClick=${onIntercambiar} title="Intercambiar paneles" aria-label="Intercambiar paneles" style=${BTN}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 7h13l-4-4M17 17H4l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div style="width:4px;height:42px;border-radius:2px;background:oklch(50% 0.02 60);"></div>
      <button onClick=${cerrarDivision} title="Cerrar pantalla dividida" aria-label="Cerrar pantalla dividida" style=${BTN}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
      </button>
    </div>`;
}

const PANEL_FUERA = "flex:1 1 0;min-width:0;height:100vh;overflow:hidden;position:relative;transform:translateZ(0);";
const PANEL_DENTRO = "height:100%;overflow-y:auto;overflow-x:hidden;";

function App() {
  const [ses, setSes] = useState(getSession);
  const ruta = useRuta();
  const [segunda, setSegunda] = useState(null);
  const [amplia, setAmplia] = useState(pantallaAmplia);
  const [ratio, setRatio] = useState(0.5);
  const [ocultos, setOcultos] = useState(() => leerOcultos(null));
  useEffect(() => onSession(setSes), []);
  useEffect(() => onDivision(s => setSegunda(s.ruta)), []);
  useEffect(() => {
    const f = () => setAmplia(pantallaAmplia());
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  const dentro = ses.status === "dentro";
  let nombre = !dentro ? "login" : ruta;
  if (dentro && RUTAS[nombre].soloAdmin && !ses.esAdmin) nombre = "";

  // Configuración de la pantalla dividida (qué elementos se ven).
  useEffect(() => {
    if (!dentro) return;
    return watch([CLAVE_CONFIG], d => setOcultos(leerOcultos(d[CLAVE_CONFIG])));
  }, [dentro]);

  // Solo se divide entre módulos; al ir al Inicio o al salir, se cierra.
  useEffect(() => {
    if (segunda && (!dentro || !ES_MODULO.has(nombre))) cerrarDivision();
  }, [nombre, dentro, segunda]);

  const dividido = dentro && amplia && !!segunda && ES_MODULO.has(nombre) && segunda !== nombre;

  useEffect(() => {
    document.title = RUTAS[nombre].titulo;
    window.scrollTo(0, 0);
  }, [nombre]);

  useEffect(() => { if (dentro) precargar(); }, [dentro]);

  if (ses.status === "cargando") return html`<${Splash}/>`;

  const ver = (mod, el) => !ocultos.has(mod + "." + el);
  const ctxPrincipal = { dividido, secundario: false, ruta: nombre, ver: dividido ? ver : () => true };
  const ctxSecundario = { dividido, secundario: true, ruta: segunda, ver };
  const intercambiar = () => { const actual = nombre; location.hash = "#/" + segunda; abrirDivision(actual); };

  // La estructura es la misma con o sin división, para que el módulo
  // principal no se reinicie (ni pierda lo que estaba abierto) al dividir.
  return html`
    <div style=${dividido ? "display:flex;height:100vh;overflow:hidden;" : ""}>
      <div style=${dividido ? PANEL_FUERA + "flex:0 0 calc(" + (ratio * 100) + "% - 7px);" : ""}>
        <div style=${dividido ? PANEL_DENTRO : ""}>
          <${PanelCtx.Provider} value=${ctxPrincipal}>
            <${Vista} key=${nombre} nombre=${nombre} props=${{ sesion: ses }}/>
          <//>
        </div>
      </div>
      ${dividido && html`<${Divisor} onRatio=${setRatio} onIntercambiar=${intercambiar}/>`}
      ${dividido && html`
        <div style=${PANEL_FUERA}>
          <div style=${PANEL_DENTRO}>
            <${PanelCtx.Provider} value=${ctxSecundario}>
              <${Vista} key=${"b-" + segunda} nombre=${segunda} props=${{ sesion: ses }}/>
            <//>
          </div>
        </div>`}
    </div>
    <${Avisos}/>`;
}

const raiz = document.getElementById("app");
raiz.textContent = ""; // quita la pantalla de carga estática
render(html`<${App}/>`, raiz);
