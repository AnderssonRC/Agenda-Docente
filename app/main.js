// main.js — arranque de la app de una sola página.
// Carga Firebase y la sesión una vez; cada pantalla se descarga solo cuando
// se abre (y luego queda en memoria). Las rutas van en el hash: #/clases, #/admin…

import { html, render, useState, useEffect } from "./lib.js";
import { getSession, onSession } from "./session.js";
import { onDataError } from "./data.js";
import { RUTAS } from "./rutas.js";

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

function App() {
  const [ses, setSes] = useState(getSession);
  const ruta = useRuta();
  useEffect(() => onSession(setSes), []);

  const dentro = ses.status === "dentro";
  let nombre = !dentro ? "login" : ruta;
  if (dentro && RUTAS[nombre].soloAdmin && !ses.esAdmin) nombre = "";

  useEffect(() => {
    document.title = RUTAS[nombre].titulo;
    window.scrollTo(0, 0);
  }, [nombre]);

  useEffect(() => { if (dentro) precargar(); }, [dentro]);

  if (ses.status === "cargando") return html`<${Splash}/>`;
  return html`
    <${Vista} key=${nombre} nombre=${nombre} props=${{ sesion: ses }}/>
    <${Avisos}/>`;
}

const raiz = document.getElementById("app");
raiz.textContent = ""; // quita la pantalla de carga estática
render(html`<${App}/>`, raiz);
