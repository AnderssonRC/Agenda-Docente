// admin.js — panel de administración (aprobar/bloquear/eliminar docentes, dar/quitar admin).
// main.js solo muestra esta vista a administradores; además las reglas de
// Firestore impiden que alguien que no sea admin lea o cambie perfiles.
import { html, useState, useEffect } from "../lib.js";
import { db, doc, collection, getDocs, updateDoc, deleteDoc } from "../firebase.js";
import { cerrarSesion } from "../session.js";
import { css } from "../ui.js";

css("v-admin", `
  .adm{
    --bg:oklch(96% 0.012 75); --card:oklch(99% 0.005 75);
    --line:oklch(88% 0.02 60); --ink:oklch(28% 0.03 50);
    --muted:oklch(48% 0.02 55);
    --ok:oklch(45% 0.1 145); --okbg:oklch(93% 0.05 145);
    --warn:oklch(45% 0.12 70); --warnbg:oklch(94% 0.06 78);
    --danger:oklch(50% 0.18 25);
    background:var(--bg);color:var(--ink);min-height:100vh;
  }
  .adm *{box-sizing:border-box}
  .adm header{background:oklch(24% 0.025 50);padding:14px clamp(16px,4vw,40px);display:flex;align-items:center;gap:14px;flex-wrap:wrap;}
  .adm header img{width:32px;height:32px;border-radius:8px;object-fit:cover;}
  .adm header .title{font-family:'Fraunces',serif;font-size:20px;font-weight:600;color:oklch(97% 0.01 70);flex:1;}
  .adm header .who{font-size:12.5px;color:oklch(70% 0.02 60);}
  .adm header .hbtn{padding:8px 14px;border-radius:8px;border:1px solid oklch(45% 0.03 55);background:transparent;color:oklch(85% 0.02 65);font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
  .adm main{max-width:900px;margin:0 auto;padding:24px clamp(16px,4vw,40px) 60px;}
  .adm h2{font-family:'Fraunces',serif;font-size:18px;font-weight:600;margin:0 0 4px;}
  .adm .hint{font-size:13px;color:var(--muted);margin:0 0 18px;}
  .adm .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:22px;}
  .adm .stat{background:oklch(92% 0.014 65);border-radius:10px;padding:14px 16px;}
  .adm .stat .n{font-family:'IBM Plex Mono',monospace;font-size:24px;font-weight:600;line-height:1;}
  .adm .stat .l{font-size:11.5px;color:var(--muted);margin-top:6px;font-weight:600;}
  .adm table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;}
  .adm th,.adm td{text-align:left;padding:12px 14px;font-size:13.5px;border-bottom:1px solid var(--line);vertical-align:middle;}
  .adm th{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--muted);background:oklch(97% 0.008 70);}
  .adm tr:last-child td{border-bottom:none;}
  .adm .badge{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;white-space:nowrap;}
  .adm .badge.ok{background:var(--okbg);color:var(--ok);}
  .adm .badge.pend{background:var(--warnbg);color:var(--warn);}
  .adm .badge.admin{background:oklch(92% 0.05 285);color:oklch(45% 0.15 285);}
  .adm .badge.doc{background:oklch(92% 0.014 65);color:var(--muted);}
  .adm .acts{display:flex;gap:6px;flex-wrap:wrap;}
  .adm .acts button{padding:6px 11px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--ink);font-family:inherit;}
  .adm .acts button:disabled{opacity:.5;cursor:default;}
  .adm .acts button.pos{border-color:var(--ok);color:var(--ok);}
  .adm .acts button.neg{border-color:var(--danger);color:var(--danger);}
  .adm .empty{text-align:center;color:var(--muted);font-family:'Fraunces',serif;font-style:italic;padding:40px 20px;}
  .adm .msg{font-size:13px;border-radius:8px;padding:10px 12px;margin-bottom:14px;background:oklch(94% 0.05 25);color:var(--danger);border:1px solid oklch(85% 0.08 25);}
  .adm .mono{font-family:'IBM Plex Mono',monospace;font-size:11.5px;color:var(--muted);}
  @media(max-width:640px){ .adm .hideSm{display:none} }
`);

export default function Admin({ sesion }) {
  const miUid = sesion.user.uid;
  const perfil = sesion.perfil || {};
  const [usuarios, setUsuarios] = useState(null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(null); // uid en proceso

  async function cargar() {
    try {
      const qs = await getDocs(collection(db, "usuarios"));
      const lista = [];
      qs.forEach(d => lista.push({ uid: d.id, ...d.data() }));
      // Pendientes primero, luego por nombre.
      lista.sort((a, b) => {
        if (!!a.aprobado !== !!b.aprobado) return a.aprobado ? 1 : -1;
        return (a.nombre || a.email || "").localeCompare(b.nombre || b.email || "");
      });
      setUsuarios(lista);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los usuarios. Revisa las reglas de Firestore.");
      setUsuarios([]);
    }
  }
  useEffect(() => { cargar(); }, []);

  async function ejecutar(act, uid) {
    setError("");
    const ref = doc(db, "usuarios", uid);
    try {
      if (act === "eliminar") {
        if (!confirm("¿Eliminar el perfil de este docente? Esto quita su acceso. (Su cuenta de inicio de sesión debe borrarse aparte desde la consola de Firebase.)")) return;
        setOcupado(uid);
        await deleteDoc(ref);
      } else {
        setOcupado(uid);
        const cambios = {
          aprobar: { aprobado: true },
          bloquear: { aprobado: false },
          hacerAdmin: { rol: "admin" },
          quitarAdmin: { rol: "docente" }
        }[act];
        await updateDoc(ref, cambios);
      }
      await cargar();
    } catch (e) {
      console.error(e);
      setError("No se pudo completar la acción. Revisa las reglas de Firestore.");
    } finally {
      setOcupado(null);
    }
  }

  const lista = usuarios || [];
  const n = (x) => usuarios ? x : "–";

  return html`
    <div class="adm">
      <header>
        <img src="logo-192.png" alt=""/>
        <div class="title">Administración de usuarios</div>
        <div class="who">${perfil.nombre ? perfil.nombre + " · admin" : "admin"}</div>
        <a href="#/" class="hbtn" style="text-decoration:none;">Ir a la aplicación</a>
        <button class="hbtn" onClick=${cerrarSesion}>Cerrar sesión</button>
      </header>
      <main>
        <h2>Docentes</h2>
        <p class="hint">Aprueba o bloquea el acceso de cada docente. Solo los usuarios aprobados pueden entrar a la app.</p>

        ${error && html`<div class="msg">${error}</div>`}

        <div class="stats">
          <div class="stat"><div class="n">${n(lista.length)}</div><div class="l">registrados</div></div>
          <div class="stat"><div class="n" style="color:var(--warn)">${n(lista.filter(u => !u.aprobado).length)}</div><div class="l">pendientes</div></div>
          <div class="stat"><div class="n" style="color:oklch(45% 0.15 285)">${n(lista.filter(u => u.rol === "admin").length)}</div><div class="l">administradores</div></div>
        </div>

        ${usuarios === null ? html`<div class="empty">Cargando usuarios…</div>`
        : lista.length === 0 ? (!error && html`<div class="empty">Aún no hay usuarios registrados.</div>`)
        : html`
          <table>
            <thead><tr><th>Docente</th><th>Estado</th><th>Rol</th><th>Acciones</th></tr></thead>
            <tbody>
              ${lista.map(u => html`
                <tr key=${u.uid}>
                  <td>${u.nombre || "(sin nombre)"}<div class="mono hideSm">${u.email || ""}</div></td>
                  <td>${u.aprobado ? html`<span class="badge ok">Aprobado</span>` : html`<span class="badge pend">Pendiente</span>`}</td>
                  <td>${u.rol === "admin" ? html`<span class="badge admin">Admin</span>` : html`<span class="badge doc">Docente</span>`}</td>
                  <td>
                    ${u.uid === miUid ? html`<span class="mono">— tú —</span>` : html`
                      <div class="acts">
                        ${u.aprobado
                          ? html`<button class="neg" disabled=${ocupado === u.uid} onClick=${() => ejecutar("bloquear", u.uid)}>Bloquear</button>`
                          : html`<button class="pos" disabled=${ocupado === u.uid} onClick=${() => ejecutar("aprobar", u.uid)}>Aprobar</button>`}
                        ${u.rol === "admin"
                          ? html`<button disabled=${ocupado === u.uid} onClick=${() => ejecutar("quitarAdmin", u.uid)}>Quitar admin</button>`
                          : html`<button disabled=${ocupado === u.uid} onClick=${() => ejecutar("hacerAdmin", u.uid)}>Hacer admin</button>`}
                        <button class="neg" disabled=${ocupado === u.uid} onClick=${() => ejecutar("eliminar", u.uid)}>Eliminar</button>
                      </div>`}
                  </td>
                </tr>`)}
            </tbody>
          </table>`}
      </main>
    </div>`;
}
