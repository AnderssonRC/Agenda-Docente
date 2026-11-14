// login.js — inicio de sesión y registro de docentes.
import { html, useState, useEffect } from "../lib.js";
import { iniciarSesion, registrar } from "../session.js";
import { css, AboutModal } from "../ui.js";

css("v-login", `
  .lg{
    --bg:oklch(18% 0.028 60); --panel:oklch(24% 0.03 58); --line:oklch(38% 0.04 55);
    --ink:oklch(94% 0.02 70); --muted:oklch(72% 0.03 60);
    --neon:oklch(80% 0.15 75); --neon-strong:oklch(85% 0.17 78); --neon-ink:oklch(20% 0.04 60);
    --danger:oklch(70% 0.16 25); --danger-bg:oklch(30% 0.06 25);
    --ok:oklch(80% 0.13 145); --ok-bg:oklch(30% 0.05 145);
    --glow:0 0 22px oklch(80% 0.15 75 / 0.28); --glow-soft:0 0 14px oklch(80% 0.15 75 / 0.18);
    font-family:'Manrope',sans-serif;color:var(--ink);
    background:
      radial-gradient(ellipse 80% 60% at 15% 0%, oklch(30% 0.05 65 / 0.7), transparent 60%),
      radial-gradient(ellipse 70% 50% at 100% 100%, oklch(28% 0.05 50 / 0.6), transparent 55%),
      var(--bg);
    min-height:100vh;display:flex;align-items:stretch;position:relative;
  }
  .lg *{box-sizing:border-box}
  .lg::before{
    content:"";position:fixed;inset:0;pointer-events:none;opacity:0.5;
    background-image:
      linear-gradient(oklch(60% 0.04 60 / 0.05) 1px, transparent 1px),
      linear-gradient(90deg, oklch(60% 0.04 60 / 0.05) 1px, transparent 1px);
    background-size:46px 46px;
  }
  .lg .wrap{position:relative;z-index:1;width:100%;max-width:1180px;margin:0 auto;
    display:grid;grid-template-columns:1.05fr 0.95fr;gap:0;align-items:stretch;}
  .lg .hero{padding:clamp(28px,5vw,64px);display:flex;flex-direction:column;justify-content:center;gap:26px;}
  .lg .brand{display:flex;align-items:center;gap:12px;}
  .lg .brand .mark{width:46px;height:46px;border-radius:12px;object-fit:cover;box-shadow:var(--glow-soft);border:1px solid oklch(70% 0.1 75 / 0.4);}
  .lg .brand .name{line-height:1.05;}
  .lg .brand .name b{display:block;font-family:'Fraunces',serif;font-weight:700;font-size:19px;color:var(--ink);}
  .lg .brand .name span{display:block;font-size:12px;font-weight:700;letter-spacing:0.02em;color:var(--neon);text-shadow:var(--glow-soft);}
  .lg .eyebrow{font-size:12.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--neon);text-shadow:var(--glow-soft);}
  .lg .hero h1{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(34px,5.2vw,60px);line-height:1.02;margin:0;color:var(--ink);letter-spacing:-0.01em;}
  .lg .hero h1 .hl{color:var(--neon-strong);text-shadow:var(--glow);}
  .lg .lead{font-size:clamp(15px,1.6vw,17px);line-height:1.6;color:var(--muted);max-width:52ch;margin:0;}
  .lg .lead b{color:var(--ink);font-weight:600;}
  .lg .features{display:flex;flex-wrap:wrap;gap:18px 26px;margin-top:4px;}
  .lg .feature{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--muted);}
  .lg .feature svg{width:17px;height:17px;color:var(--neon);filter:drop-shadow(var(--glow-soft));flex:none;}
  .lg .formside{display:flex;align-items:center;justify-content:center;padding:clamp(24px,4vw,56px);}
  .lg .card{width:100%;max-width:420px;background:var(--panel);border:1px solid var(--line);border-radius:20px;
    padding:clamp(26px,3.5vw,36px);box-shadow:0 24px 60px oklch(10% 0.02 60 / 0.55), inset 0 1px 0 oklch(90% 0.05 75 / 0.06);}
  .lg .kicker{font-size:11.5px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:var(--neon);margin-bottom:6px;text-shadow:var(--glow-soft);}
  .lg h2{font-family:'Fraunces',serif;font-size:27px;font-weight:600;margin:0 0 6px;color:var(--ink);}
  .lg .sub{font-size:13.5px;color:var(--muted);margin:0 0 22px;line-height:1.5;}
  .lg label{display:block;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--neon);margin:0 0 6px;opacity:0.9;}
  .lg .field{margin-bottom:15px;}
  .lg input{width:100%;padding:13px 15px;border:1.5px solid var(--line);border-radius:11px;font-size:14.5px;font-family:inherit;
    background:oklch(20% 0.028 58);color:var(--ink);transition:border-color .15s, box-shadow .15s;}
  .lg input::placeholder{color:oklch(58% 0.03 60);}
  .lg input:focus{outline:none;border-color:var(--neon);box-shadow:var(--glow-soft);}
  .lg button.primary{width:100%;padding:14px;border:none;border-radius:11px;background:linear-gradient(180deg, var(--neon-strong), var(--neon));
    color:var(--neon-ink);font-size:15.5px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;margin-top:6px;box-shadow:var(--glow);
    display:flex;align-items:center;justify-content:center;gap:8px;transition:transform .12s, box-shadow .15s, filter .15s;}
  .lg button.primary:hover{filter:brightness(1.05);box-shadow:0 0 30px oklch(80% 0.15 75 / 0.4);}
  .lg button.primary:active{transform:translateY(1px);}
  .lg button.primary:disabled{opacity:.6;cursor:default;filter:none;box-shadow:none;}
  .lg button.primary svg{width:17px;height:17px;}
  .lg .switch{margin-top:18px;font-size:13.5px;color:var(--muted);text-align:center;}
  .lg .switch a, .lg .credit a{color:var(--neon);font-weight:700;cursor:pointer;text-decoration:none;text-shadow:var(--glow-soft);}
  .lg .switch a:hover{text-decoration:underline;}
  .lg .msg{font-size:13px;border-radius:11px;padding:11px 13px;margin-bottom:16px;line-height:1.45;}
  .lg .msg.err{background:var(--danger-bg);color:var(--danger);border:1px solid oklch(50% 0.1 25 / 0.5);}
  .lg .msg.info{background:var(--ok-bg);color:var(--ok);border:1px solid oklch(50% 0.08 145 / 0.5);}
  .lg .hint{font-weight:400;text-transform:none;letter-spacing:0;color:var(--muted);}
  .lg .credit{position:relative;z-index:1;grid-column:1 / -1;text-align:center;padding:16px;font-size:12.5px;color:var(--muted);border-top:1px solid oklch(40% 0.03 55 / 0.4);}
  .lg .credit b{color:var(--ink);}
  @media (max-width:860px){
    .lg .wrap{grid-template-columns:1fr;max-width:520px;}
    .lg .hero{padding:34px 26px 8px;gap:20px;text-align:left;}
    .lg .features{display:none;}
    .lg .formside{padding:20px 22px 34px;}
    .lg .hero h1{font-size:clamp(30px,9vw,44px);}
    .lg .lead{font-size:15px;}
  }
  @media (max-width:400px){
    .lg .card{padding:22px 18px;border-radius:16px;}
    .lg h2{font-size:23px;}
  }
`);

const MOTIVOS = {
  "pendiente": ["Tu cuenta aún no ha sido aprobada por un administrador.", "info"],
  "sin-perfil": ["No encontramos tu perfil. Regístrate de nuevo o contacta al administrador.", "err"],
  "error": ["No pudimos verificar tu cuenta. Revisa tu conexión e intenta de nuevo.", "err"]
};

function errorLegible(code) {
  const m = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/missing-password": "Escribe tu contraseña.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/user-not-found": "No existe una cuenta con ese correo.",
    "auth/email-already-in-use": "Ese correo ya está registrado.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Espera un momento e intenta de nuevo.",
    "auth/network-request-failed": "Sin conexión. Revisa tu internet e intenta de nuevo."
  };
  return m[code] || "Ocurrió un error. Intenta de nuevo.";
}

const Flecha = () => html`<svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export default function Login({ sesion }) {
  const [vista, setVista] = useState("login");
  const [msg, setMsg] = useState(null); // [texto, tipo]
  const [ocupado, setOcupado] = useState(false);
  const [about, setAbout] = useState(false);
  const [f, setF] = useState({ email: "", pass: "", nombre: "", rEmail: "", rPass: "" });
  const campo = (k) => (e) => setF(prev => ({ ...prev, [k]: e.target.value }));

  // Cada vez que la sesión responde (p. ej. "pendiente"), mostramos el motivo.
  useEffect(() => {
    setOcupado(false);
    if (sesion.motivo && MOTIVOS[sesion.motivo]) setMsg(MOTIVOS[sesion.motivo]);
  }, [sesion]);

  async function entrar(e) {
    e.preventDefault();
    setMsg(null);
    const email = f.email.trim();
    if (!email || !f.pass) { setMsg(["Completa correo y contraseña.", "err"]); return; }
    setOcupado(true);
    try {
      await iniciarSesion(email, f.pass);
      // La sesión verifica la aprobación y abre la app sola.
    } catch (err) {
      setMsg([errorLegible(err.code), "err"]);
      setOcupado(false);
    }
  }

  async function crear(e) {
    e.preventDefault();
    setMsg(null);
    const nombre = f.nombre.trim(), email = f.rEmail.trim();
    if (!nombre || !email || !f.rPass) { setMsg(["Completa todos los campos.", "err"]); return; }
    setOcupado(true);
    try {
      await registrar(nombre, email, f.rPass);
      setVista("login");
      setF(prev => ({ ...prev, email, pass: "" }));
      setMsg(["¡Cuenta creada! Un administrador debe aprobarte antes de que puedas entrar.", "info"]);
    } catch (err) {
      setMsg([errorLegible(err.code), "err"]);
    } finally {
      setOcupado(false);
    }
  }

  const cambiar = (v) => { setMsg(null); setVista(v); };

  return html`
    <div class="lg">
      <div class="wrap">
        <section class="hero">
          <div class="brand">
            <img class="mark" src="logo-192.png" alt=""/>
            <div class="name"><b>Agenda Docente</b><span>RES COGITANS</span></div>
          </div>
          <div class="eyebrow">Todo en un solo lugar</div>
          <h1>Planeación, participación y <span class="hl">seguimiento</span>, sin complicarte.</h1>
          <p class="lead">
            <b>Agenda Docente. Todo en un solo lugar.</b> Planeación, Registro de Participación
            y Seguimiento de Estudiantes. Cada módulo con sus propias reglas.
          </p>
          <div class="features">
            <div class="feature"><svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Planeación de clases</div>
            <div class="feature"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Registro de participación</div>
            <div class="feature"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Seguimiento de estudiantes</div>
          </div>
        </section>

        <section class="formside">
          <div class="card">
            ${msg && html`<div class=${"msg " + msg[1]}>${msg[0]}</div>`}

            ${vista === "login" ? html`
              <form onSubmit=${entrar} novalidate>
                <div class="kicker">Tu cuenta de docente</div>
                <h2>Inicia sesión</h2>
                <p class="sub">Entra para planear, registrar y hacer seguimiento de tus clases.</p>
                <div class="field">
                  <label for="lEmail">Correo electrónico</label>
                  <input id="lEmail" type="email" autocomplete="email" placeholder="docente@colegio.edu" value=${f.email} onInput=${campo("email")}/>
                </div>
                <div class="field">
                  <label for="lPass">Contraseña</label>
                  <input id="lPass" type="password" autocomplete="current-password" placeholder="••••••••" value=${f.pass} onInput=${campo("pass")}/>
                </div>
                <button class="primary" type="submit" disabled=${ocupado}>${ocupado ? "Entrando…" : "Entrar"} ${Flecha()}</button>
                <div class="switch">¿Primera vez? <a onClick=${() => cambiar("registro")}>Crea una cuenta nueva</a></div>
              </form>
            ` : html`
              <form onSubmit=${crear} novalidate>
                <div class="kicker">Nueva cuenta</div>
                <h2>Crear cuenta</h2>
                <p class="sub">Regístrate y un administrador aprobará tu acceso.</p>
                <div class="field">
                  <label for="rNombre">Nombre</label>
                  <input id="rNombre" type="text" autocomplete="name" placeholder="Andrea Gómez" value=${f.nombre} onInput=${campo("nombre")}/>
                </div>
                <div class="field">
                  <label for="rEmail">Correo electrónico</label>
                  <input id="rEmail" type="email" autocomplete="email" placeholder="docente@colegio.edu" value=${f.rEmail} onInput=${campo("rEmail")}/>
                </div>
                <div class="field">
                  <label for="rPass">Contraseña <span class="hint">· mínimo 6 caracteres</span></label>
                  <input id="rPass" type="password" autocomplete="new-password" placeholder="••••••••" value=${f.rPass} onInput=${campo("rPass")}/>
                </div>
                <button class="primary" type="submit" disabled=${ocupado}>${ocupado ? "Creando…" : "Crear cuenta"} ${Flecha()}</button>
                <div class="switch">¿Ya tienes cuenta? <a onClick=${() => cambiar("login")}>Inicia sesión</a></div>
              </form>
            `}
          </div>
        </section>

        <div class="credit">Creado por <b>Andersson Cortes</b> y <a onClick=${() => setAbout(true)}>Res Cogitans</a></div>
      </div>
      <${AboutModal} abierto=${about} onCerrar=${() => setAbout(false)} oscuro=${true}/>
    </div>`;
}
