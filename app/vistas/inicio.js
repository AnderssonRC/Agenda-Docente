// inicio.js — panel principal del docente.
import { html, useState, useEffect } from "../lib.js";
import { watch } from "../data.js";
import { cerrarSesion } from "../session.js";
import { MODULOS } from "../rutas.js";
import { css, AboutModal, ICONO_DIVIDIR } from "../ui.js";
import ConfigPantalla from "./config-pantalla.js";

css("v-inicio", `
  .statcard{transition:transform .16s, box-shadow .16s;}
  .statcard:hover{transform:translateY(-2px);box-shadow:0 8px 22px oklch(30% 0.05 50 / 0.12);}
  .modcard{transition:transform .18s, box-shadow .18s;}
  .modcard:hover{transform:translateY(-3px);box-shadow:0 12px 30px oklch(30% 0.06 45 / 0.18);}
  .modcard:hover .go{gap:11px;}
  .avatarwrap{position:relative;}
  .avatarmenu{position:absolute;right:0;top:52px;min-width:212px;background:oklch(99% 0.005 75);
    border:1px solid oklch(86% 0.02 60);border-radius:14px;padding:7px;
    box-shadow:0 16px 40px oklch(30% 0.04 50 / 0.22);z-index:60;transition:opacity .15s, transform .15s, visibility .15s;}
  .avatarmenu a, .avatarmenu button{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:9px;
    font-size:14px;font-weight:600;color:oklch(35% 0.03 50);background:transparent;border:none;cursor:pointer;font-family:inherit;text-align:left;box-sizing:border-box;}
  .avatarmenu a:hover, .avatarmenu button:hover{background:oklch(94% 0.02 65);}
  .avatarmenu .sep{height:1px;background:oklch(90% 0.015 60);margin:5px 4px;}
  .avatarbtn{cursor:pointer;user-select:none;}
`);

function Reloj() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const reloj = now.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const fecha = now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return html`
    <div style="text-align:right;flex:none;">
      <div style="font-family:'IBM Plex Mono',monospace;font-size:clamp(28px,6vw,42px);font-weight:600;color:oklch(98% 0.012 72);line-height:1;text-shadow:0 2px 14px oklch(30% 0.05 45 / 0.4);">${reloj}</div>
      <div style="font-size:13px;font-weight:600;color:oklch(90% 0.03 68);margin-top:9px;text-transform:capitalize;">${fecha}</div>
    </div>`;
}

export default function Inicio({ sesion }) {
  const perfil = sesion.perfil || {};
  const userName = perfil.nombre || (sesion.user && sesion.user.email) || "Docente";
  const isAdmin = sesion.esAdmin;
  const [menu, setMenu] = useState(false);
  const [about, setAbout] = useState(false);
  const [configDiv, setConfigDiv] = useState(false);
  const [cont, setCont] = useState(null);

  useEffect(() => watch(["materias", "actividades", "seguimiento_estudiantes"], d => setCont({
    materias: d.materias.length,
    actividades: d.actividades.length,
    estudiantes: d.seguimiento_estudiantes.length
  })), []);

  // Cerrar el menú al hacer clic fuera.
  useEffect(() => {
    if (!menu) return;
    const f = (e) => {
      const w = document.getElementById("avatarwrap");
      if (w && !w.contains(e.target)) setMenu(false);
    };
    document.addEventListener("click", f);
    return () => document.removeEventListener("click", f);
  }, [menu]);

  const v = (n) => cont ? String(n) : "–";
  const stats = [
    { emoji: "📚", valor: v(cont && cont.materias), label: "Asignaturas", tint: "oklch(88% 0.05 55)" },
    { emoji: "📝", valor: v(cont && cont.actividades), label: "Clases diseñadas", tint: "oklch(86% 0.06 40)" },
    { emoji: "👥", valor: v(cont && cont.estudiantes), label: "Seguimientos de estudiantes", tint: "oklch(88% 0.055 70)" }
  ];

  return html`
<div style="min-height:100vh;background:oklch(96% 0.012 75);display:flex;flex-direction:column;">

  <header style="display:flex;align-items:center;gap:16px;padding:12px clamp(16px,4vw,40px);background:oklch(24% 0.03 45);position:sticky;top:0;z-index:40;">
    <div style="display:flex;align-items:center;gap:11px;min-width:0;">
      <img src="logo-192.png" alt="" style="width:38px;height:38px;border-radius:10px;object-fit:cover;flex:none;"/>
      <div style="line-height:1.05;min-width:0;">
        <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:700;color:oklch(97% 0.01 70);white-space:nowrap;">Agenda Docente</div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.04em;color:oklch(78% 0.1 70);">RES COGITANS</div>
      </div>
    </div>
    <div style="flex:1;"></div>
    <div class="avatarwrap" id="avatarwrap">
      <div class="avatarbtn" onClick=${() => setMenu(m => !m)} style="display:flex;align-items:center;gap:8px;">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(145deg, oklch(70% 0.12 72), oklch(58% 0.11 55));display:flex;align-items:center;justify-content:center;color:oklch(22% 0.04 50);font-weight:800;font-size:16px;">${(userName.charAt(0) || "D").toUpperCase()}</div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="color:oklch(80% 0.03 65);flex:none;transform:${menu ? "rotate(180deg)" : "rotate(0deg)"};transition:transform .15s;"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <div class="avatarmenu" style="opacity:${menu ? 1 : 0};visibility:${menu ? "visible" : "hidden"};transform:${menu ? "translateY(0)" : "translateY(-6px)"};">
        <div style="padding:9px 12px 6px;">
          <div style="font-size:14px;font-weight:700;color:oklch(28% 0.03 50);">${userName}</div>
          <div style="font-size:12px;color:oklch(55% 0.02 55);margin-top:2px;">${isAdmin ? "Administrador" : "Docente"}</div>
        </div>
        <div class="sep"></div>
        ${isAdmin && html`
          <a href="#/admin">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="color:oklch(45% 0.15 285);flex:none;"><path d="M12 2l7 4v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-4z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
            Administrar usuarios
          </a>
          <div class="sep"></div>`}
        <div style="padding:6px 12px 2px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:oklch(55% 0.02 55);">Configuración</div>
        <button onClick=${() => { setMenu(false); setConfigDiv(true); }}>
          <span style="color:oklch(48% 0.09 50);display:flex;flex:none;">${ICONO_DIVIDIR}</span>
          Pantalla dividida
        </button>
        <div class="sep"></div>
        <button onClick=${cerrarSesion}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style="color:oklch(50% 0.12 25);flex:none;"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  </header>

  <main style="flex:1;padding:clamp(20px,4vw,34px) clamp(16px,4vw,40px) 56px;max-width:1200px;width:100%;margin:0 auto;box-sizing:border-box;">

    <section style="border-radius:22px;background:linear-gradient(125deg, oklch(34% 0.06 42), oklch(48% 0.09 50));padding:clamp(24px,5vw,38px) clamp(22px,5vw,42px);position:relative;overflow:hidden;margin-bottom:26px;">
      <div style="position:absolute;right:-50px;top:-50px;width:230px;height:230px;border-radius:50%;background:oklch(64% 0.1 60 / 0.28);"></div>
      <div style="position:absolute;right:90px;bottom:-70px;width:150px;height:150px;border-radius:50%;background:oklch(74% 0.09 65 / 0.2);"></div>
      <div style="position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:24px;flex-wrap:wrap;">
        <div style="min-width:240px;">
          <span style="display:inline-block;background:oklch(98% 0.01 70 / 0.16);color:oklch(97% 0.01 70);font-size:13px;font-weight:600;padding:6px 14px;border-radius:999px;margin-bottom:14px;">Panel del docente</span>
          <h1 style="font-family:'Fraunces',serif;font-size:clamp(26px,4.5vw,36px);font-weight:600;color:oklch(98% 0.01 70);margin:0 0 10px;line-height:1.05;">¡Hola, ${userName}!</h1>
          <p style="font-size:clamp(14px,2.2vw,16px);color:oklch(93% 0.02 65);margin:0;max-width:520px;line-height:1.5;">Planeación, participación y seguimiento de tus estudiantes, todo en un solo lugar.</p>
        </div>
        <${Reloj}/>
      </div>
    </section>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 210px), 1fr));gap:16px;margin-bottom:34px;">
      ${stats.map(st => html`
        <div class="statcard" style="background:oklch(99% 0.005 75);border:1px solid oklch(89% 0.015 60);border-radius:16px;padding:20px;display:flex;align-items:center;gap:16px;">
          <div style="width:54px;height:54px;border-radius:14px;background:${st.tint};display:flex;align-items:center;justify-content:center;font-size:28px;line-height:1;flex:none;">${st.emoji}</div>
          <div style="min-width:0;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:30px;font-weight:600;color:oklch(30% 0.03 50);line-height:1;">${st.valor}</div>
            <div style="font-size:12.5px;color:oklch(48% 0.02 55);margin-top:6px;font-weight:600;">${st.label}</div>
          </div>
        </div>`)}
    </div>

    <h2 style="font-size:19px;font-weight:700;color:oklch(32% 0.03 50);margin:0 0 18px;">Tus módulos</h2>

    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(min(100%, 300px), 1fr));gap:22px;">
      ${MODULOS.map(mod => html`
        <a class="modcard" href=${"#/" + mod.ruta} style="display:flex;flex-direction:column;border:1px solid oklch(89% 0.015 60);border-radius:20px;overflow:hidden;background:oklch(99% 0.005 75);box-shadow:0 1px 2px oklch(20% 0.02 50 / 0.04);">
          <div style="background:${mod.band};padding:30px 26px;display:flex;align-items:center;justify-content:center;">
            <span style="font-size:52px;line-height:1;">${mod.emoji}</span>
          </div>
          <div style="padding:22px 24px;display:flex;flex-direction:column;gap:8px;flex:1;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${mod.tagColor};">${mod.tag}</span>
            <h3 style="font-size:19px;font-weight:700;color:oklch(28% 0.03 50);margin:0;">${mod.titulo}</h3>
            <p style="font-size:14px;color:oklch(48% 0.02 55);margin:0;line-height:1.5;">${mod.descripcion}</p>
            <span class="go" style="margin-top:10px;display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:${mod.tagColor};transition:gap .18s;">
              Entrar al módulo
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </span>
          </div>
        </a>`)}
    </div>
  </main>

  <footer style="text-align:center;padding:20px 16px 28px;font-size:12.5px;color:oklch(50% 0.02 55);">
    Creado por <b style="color:oklch(35% 0.03 50);">Andersson Cortes</b> y
    ${" "}<a onClick=${() => setAbout(true)} style="color:oklch(48% 0.11 55);font-weight:700;cursor:pointer;">Res Cogitans</a>
  </footer>

  <${AboutModal} abierto=${about} onCerrar=${() => setAbout(false)}/>
  ${configDiv && html`<${ConfigPantalla} onCerrar=${() => setConfigDiv(false)}/>`}
</div>`;
}
