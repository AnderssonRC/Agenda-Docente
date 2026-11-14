// clases.js — Creación de Clases (materias y actividades/planeaciones).
// Datos: usuarios/{uid}/datos/materias y .../actividades
import { html, Component, createRef } from "../lib.js";
import { watch, saveList } from "../data.js";
import { uid, todayLocal, enFondo, ModuleHeader, Tabs, Cargando } from "../ui.js";

const TEMA = {
  header: "oklch(24% 0.025 50)", acento: "oklch(40% 0.08 35)",
  volver: "oklch(85% 0.02 65)", volverHover: "oklch(96% 0.01 70)",
  titulo: "oklch(97% 0.01 70)", sub: "oklch(65% 0.015 60)",
  tabActivo: "oklch(40% 0.08 35)", tabActivoBg: "oklch(96% 0.012 75)", tabInactivo: "oklch(65% 0.015 60)"
};

const NEON = ["oklch(78% 0.27 145)", "oklch(75% 0.29 320)", "oklch(82% 0.19 200)", "oklch(80% 0.22 95)", "oklch(74% 0.26 30)", "oklch(72% 0.29 285)"];
const RESALTADOS = ["oklch(88% 0.19 100)", "oklch(80% 0.15 40)", "oklch(85% 0.13 145)", "oklch(82% 0.1 240)", "oklch(82% 0.15 350)"];
const SIN_CURSO = "__sin_curso__";

const LABEL = "display:block;font-size:11px;font-weight:700;margin-bottom:5px;color:oklch(40% 0.08 35);text-transform:uppercase;letter-spacing:0.07em;";
const INPUT = "width:100%;padding:10px 12px;border:1.5px solid oklch(88% 0.014 60);border-radius:6px;font-size:14px;box-sizing:border-box;background:oklch(99% 0.005 75);color:oklch(28% 0.03 50);";
const NOTA = "color:oklch(65% 0.015 60);font-weight:400;text-transform:none;";
const BTN_CANCELAR = "padding:12px 18px;background:transparent;color:oklch(45% 0.02 55);border:1.5px solid oklch(88% 0.014 60);border-radius:6px;font-size:14px;cursor:pointer;";
const BTN_OK = "flex:1;padding:12px;background:oklch(40% 0.08 35);color:oklch(97% 0.01 70);border:none;border-radius:6px;font-size:14.5px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;";
const SECCION = "font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:oklch(40% 0.08 35);";

const cursoDe = (m) => (m.curso && m.curso.trim()) ? m.curso.trim() : SIN_CURSO;
const nombreMateria = (m) => m.curso ? m.nombre + " · " + m.curso : m.nombre;

function blankForm() {
  return { materiaId: "", fecha: todayLocal(), titulo: "", objetivo: "", keywords: "", descripcion: "", archivos: "", estado: "Planeada" };
}
function parseKeywords(s) { return s ? s.split(",").map(k => k.trim()).filter(Boolean) : []; }
function parseEnlaces(s) { return s ? s.split(/\n+/).map(l => l.trim()).filter(Boolean) : []; }
function nombreEnlace(url) {
  if (url.indexOf("docs.google.com/document") !== -1) return "Documento de Google";
  if (url.indexOf("docs.google.com/presentation") !== -1) return "Presentación";
  if (url.indexOf("docs.google.com/spreadsheets") !== -1) return "Hoja de cálculo";
  if (url.indexOf("drive.google.com") !== -1) return "Archivo en Drive";
  if (url.indexOf("youtube.com") !== -1 || url.indexOf("youtu.be") !== -1) return "Video de YouTube";
  return url.replace(/^https?:\/\//, "").split("/")[0] || url;
}
// Solo se abren enlaces web; evita que un "javascript:" pegado se ejecute.
function hrefSeguro(url) { return /^https?:\/\//i.test(url) ? url : "https://" + url.replace(/^[a-z]+:/i, ""); }
function fechaCorta(f) {
  if (!f) return "";
  const p = f.split("-");
  if (p.length !== 3) return f;
  const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return p[2] + " " + (meses[parseInt(p[1], 10) - 1] || p[1]) + " " + p[0];
}
function sello(hecha) {
  return {
    texto: hecha ? "✓ realizada" : "planeada",
    border: hecha ? "2px solid oklch(45% 0.08 145)" : "1.5px dashed oklch(60% 0.13 78)",
    color: hecha ? "oklch(28% 0.06 145)" : "oklch(45% 0.1 70)",
    bg: hecha ? "oklch(93% 0.03 145)" : "transparent"
  };
}

export default class Clases extends Component {
  state = {
    loaded: false,
    materias: [],
    actividades: [],
    view: "hoy",
    showRealizadas: false,
    actModalOpen: false,
    editingId: null,
    form: blankForm(),
    materiaModalOpen: false,
    materiaForm: { nombre: "", curso: "", color: NEON[0] },
    viewingId: null
  };

  descRef = createRef();

  componentDidMount() {
    this.dejar = watch(["materias", "actividades"], d =>
      this.setState({ loaded: true, materias: d.materias, actividades: d.actividades }));
  }
  componentWillUnmount() { this.dejar && this.dejar(); }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.actModalOpen && !prevState.actModalOpen && this.descRef.current) {
      this.descRef.current.innerHTML = this.state.form.descripcion || "";
    }
  }

  /* ----- editor de descripción (subrayado y resaltado) ----- */
  syncDesc() { if (this.descRef.current) this.setField("descripcion", this.descRef.current.innerHTML); }
  formato(e, comando, valor) {
    e.preventDefault();
    if (this.descRef.current) this.descRef.current.focus();
    try { document.execCommand(comando, false, valor); }
    catch (err) { if (comando === "hiliteColor") document.execCommand("backColor", false, valor); }
    this.syncDesc();
  }

  /* ----- materias ----- */
  openMateriaModal = () => this.setState({ materiaModalOpen: true, materiaForm: { nombre: "", curso: "", color: NEON[0] } });
  closeMateriaModal = () => this.setState({ materiaModalOpen: false });
  setMateria(campo, valor) { this.setState(s => ({ materiaForm: { ...s.materiaForm, [campo]: valor } })); }

  guardarMateria = () => {
    const { nombre, curso, color } = this.state.materiaForm;
    if (!nombre.trim()) return;
    const nueva = { id: uid(), nombre: nombre.trim(), curso: curso.trim(), color: color || NEON[0] };
    const materias = [...this.state.materias, nueva];
    // La pestaña es el curso de la materia (o "Sin curso").
    this.setState({ materias, materiaModalOpen: false, view: cursoDe(nueva) });
    saveList("materias", materias);
  };

  eliminarMateria(id) {
    const m = this.state.materias.find(x => x.id === id);
    if (!m) return;
    const nActs = this.state.actividades.filter(a => a.materiaId === id).length;
    const nombre = nombreMateria(m);
    const aviso = nActs > 0
      ? "¿Eliminar la asignatura \"" + nombre + "\"? Se borrarán también sus " + nActs + " actividad" + (nActs !== 1 ? "es" : "") + ". Esta acción no se puede deshacer."
      : "¿Eliminar la asignatura \"" + nombre + "\"?";
    if (!confirm(aviso)) return;
    const materias = this.state.materias.filter(x => x.id !== id);
    const actividades = this.state.actividades.filter(a => a.materiaId !== id);
    // Si la pestaña era el curso de esta materia y ya no quedan materias en él, vuelve a "Hoy".
    const quedanEnCurso = materias.some(mm => cursoDe(mm) === cursoDe(m));
    const view = (this.state.view === cursoDe(m) && !quedanEnCurso) ? "hoy" : this.state.view;
    this.setState({ materias, actividades, view });
    saveList("materias", materias);
    saveList("actividades", actividades);
  }

  /* ----- actividades ----- */
  openActividadModal = () => {
    const { materias, view } = this.state;
    if (materias.length === 0) { this.openMateriaModal(); return; }
    // En un curso, sugiere su primera materia; si no, la primera de todas.
    let defaultMateria = materias[0].id;
    if (view !== "hoy") {
      const enCurso = materias.find(m => cursoDe(m) === view);
      if (enCurso) defaultMateria = enCurso.id;
    }
    this.setState({ actModalOpen: true, editingId: null, form: { ...blankForm(), materiaId: defaultMateria } });
  };
  openEditar(id) {
    const a = this.state.actividades.find(x => x.id === id);
    if (a) this.setState({ actModalOpen: true, editingId: id, form: { ...blankForm(), ...a } });
  }
  closeActividadModal = () => this.setState({ actModalOpen: false });
  setField(campo, valor) { this.setState(s => ({ form: { ...s.form, [campo]: valor } })); }
  campo = (k) => (e) => this.setField(k, e.target.value);

  guardarActividad = () => {
    const f = this.state.form;
    if (!f.titulo.trim() || !f.materiaId) return;
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
    if (!confirm("¿Eliminar esta actividad?")) return;
    const actividades = this.state.actividades.filter(a => a.id !== id);
    this.setState({ actividades });
    saveList("actividades", actividades);
  }

  /* ----- render ----- */
  render(_, s) {
    const hoy = todayLocal();

    const cursosOrden = [];
    s.materias.forEach(m => { const c = cursoDe(m); if (cursosOrden.indexOf(c) === -1) cursosOrden.push(c); });
    const tabs = [{ id: "hoy", label: "Hoy" }].concat(cursosOrden.map(c => ({ id: c, label: c === SIN_CURSO ? "Sin curso" : c })));

    const materiasDeVista = s.view === "hoy" ? s.materias : s.materias.filter(m => cursoDe(m) === s.view);
    const idsVista = new Set(materiasDeVista.map(m => m.id));
    const baseActs = s.view === "hoy"
      ? s.actividades.filter(a => a.fecha === hoy)
      : s.actividades.filter(a => idsVista.has(a.materiaId));

    const planeadas = baseActs.filter(a => a.estado === "Planeada").length;
    const realizadas = baseActs.filter(a => a.estado === "Realizada").length;
    const materiasEnVista = s.view === "hoy" ? s.materias.filter(m => baseActs.some(a => a.materiaId === m.id)) : materiasDeVista;

    const grupos = materiasEnVista.map(m => {
      const todas = baseActs.filter(a => a.materiaId === m.id).sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === "Planeada" ? -1 : 1;
        return (b.fecha || "").localeCompare(a.fecha || "");
      });
      const visibles = s.showRealizadas ? todas : todas.filter(a => a.estado !== "Realizada");
      return { m, visibles, pendientes: todas.filter(a => a.estado === "Planeada").length };
    });

    // En un curso (y creando), el desplegable muestra solo sus materias.
    let materiasParaSelect = s.materias;
    if (s.view !== "hoy" && !s.editingId) {
      const soloDelCurso = s.materias.filter(m => cursoDe(m) === s.view);
      if (soloDelCurso.length > 0) materiasParaSelect = soloDelCurso;
    }

    const viendo = s.viewingId ? s.actividades.find(a => a.id === s.viewingId) : null;

    return html`
<div style="min-height:100vh;background:oklch(96% 0.012 75);display:flex;flex-direction:column;">

  <${ModuleHeader} tema=${TEMA} titulo="Creación de Clases">
    <button onClick=${() => this.setState(st => ({ showRealizadas: !st.showRealizadas }))} style="display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:999px;border:1.5px dashed ${s.showRealizadas ? "oklch(55% 0.08 145)" : "oklch(50% 0.02 60 / 0.4)"};background:${s.showRealizadas ? "oklch(35% 0.06 145 / 0.35)" : "transparent"};color:${s.showRealizadas ? "oklch(85% 0.05 145)" : "oklch(75% 0.015 60)"};font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;">${s.showRealizadas ? "Ocultar realizadas" : "Ver realizadas"}</button>
  <//>

  <${Tabs} tema=${TEMA} tabs=${tabs} activo=${s.view} onSelect=${(id) => this.setState({ view: id })} onAdd=${this.openMateriaModal} addLabel="+ Materia"/>

  <main style="flex:1;padding:22px clamp(16px,4vw,40px) 110px;max-width:820px;width:100%;margin:0 auto;box-sizing:border-box;">
    ${!s.loaded ? html`<${Cargando} color="oklch(55% 0.02 55)"/>`
    : s.materias.length === 0 ? html`
      <div style="text-align:center;padding:60px 20px;">
        <div style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:15px;color:oklch(55% 0.02 55);border:1.5px dashed oklch(88% 0.014 60);border-radius:10px;padding:18px 26px;">Crea tu primera materia para comenzar a planear clases.</div>
        <div style="margin-top:16px;">
          <button onClick=${this.openMateriaModal} style="padding:11px 22px;border-radius:8px;border:none;background:oklch(40% 0.08 35);color:oklch(97% 0.01 70);font-size:14px;font-weight:700;cursor:pointer;">+ Crear materia</button>
        </div>
      </div>`
    : html`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:22px;">
        ${[[planeadas, "planeadas", "oklch(50% 0.1 70)"], [realizadas, "realizadas", "oklch(45% 0.08 145)"], [baseActs.length, "total", "oklch(28% 0.03 50)"]].map(([n, l, c]) => html`
          <div style="background:oklch(92% 0.014 65);border-radius:8px;padding:12px 14px;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:500;color:${c};line-height:1;">${n}</div>
            <div style="font-size:11px;color:oklch(45% 0.02 55);margin-top:5px;font-weight:600;">${l}</div>
          </div>`)}
      </div>

      ${baseActs.length === 0 && html`
        <div style="text-align:center;padding:52px 20px;">
          <span style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:14px;color:oklch(55% 0.02 55);border:1.5px dashed oklch(88% 0.014 60);border-radius:8px;padding:12px 22px;">${s.view === "hoy" ? "No hay actividades planeadas para hoy" : "Aún no hay actividades en esta materia"}</span>
        </div>`}

      ${grupos.map(({ m, visibles, pendientes }) => html`
        <div key=${m.id} style="background:oklch(99% 0.005 75);border-radius:12px;box-shadow:0 1px 3px oklch(20% 0.02 50 / 0.08);border:1px solid oklch(88% 0.014 60);margin-bottom:16px;overflow:hidden;border-left:5px solid ${m.color};">
          <div style="display:flex;align-items:center;gap:10px;padding:12px 15px 11px;border-bottom:1px dashed oklch(88% 0.014 60);">
            <div style="flex:1;min-width:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:oklch(45% 0.02 55);">${nombreMateria(m)}</div>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;padding:2px 9px;border-radius:4px;color:${pendientes === 0 ? "oklch(45% 0.08 145)" : "oklch(45% 0.1 70)"};border:1px ${pendientes === 0 ? "solid" : "dashed"} ${pendientes === 0 ? "oklch(45% 0.08 145)" : "oklch(45% 0.1 70)"};background:${pendientes === 0 ? "oklch(94% 0.03 145)" : "transparent"};white-space:nowrap;">${pendientes === 0 ? "✓ al día" : pendientes + " pendiente" + (pendientes !== 1 ? "s" : "")}</span>
            <button onClick=${() => this.eliminarMateria(m.id)} title="Eliminar asignatura" style="flex-shrink:0;width:28px;height:28px;border-radius:6px;border:1px solid oklch(88% 0.014 60);background:transparent;color:oklch(55% 0.12 25);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H6a1 1 0 01-1-1V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
          <div style="padding:2px 12px 10px;">
            ${visibles.length === 0 && html`<div style="padding:14px 4px 8px;text-align:center;font-size:13px;color:oklch(45% 0.08 145);font-style:italic;font-family:'Fraunces',serif;">Todo realizado</div>`}
            ${visibles.map(a => {
              const hecha = a.estado === "Realizada";
              const se = sello(hecha);
              return html`
                <div key=${a.id} style="border-radius:8px;border:1px solid transparent;margin-top:7px;">
                  <div onClick=${() => this.setState({ viewingId: a.id })} style="display:flex;align-items:flex-start;gap:10px;padding:11px 13px;cursor:pointer;">
                    <div style="flex:1;min-width:0;">
                      <div style="font-family:'Fraunces',serif;font-size:15.5px;font-weight:600;line-height:1.3;color:${hecha ? "oklch(65% 0.015 60)" : "oklch(28% 0.03 50)"};text-decoration:${hecha ? "line-through" : "none"};">${a.titulo}</div>
                      <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:oklch(65% 0.015 60);margin-top:3px;">${fechaCorta(a.fecha)}</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;padding-top:1px;">
                      <span onClick=${(e) => { e.stopPropagation(); this.toggleEstado(a.id); }} style="font-size:11px;font-weight:700;padding:4px 10px;border-radius:4px;white-space:nowrap;cursor:pointer;border:${se.border};color:${se.color};background:${se.bg};transform:${hecha ? "rotate(-2deg)" : "rotate(2deg)"};">${se.texto}</span>
                      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="color:oklch(65% 0.015 60);flex-shrink:0;"><polyline points="7,4 13,10 7,16" stroke="currentColor" stroke-width="2"/></svg>
                    </div>
                  </div>
                </div>`;
            })}
          </div>
        </div>`)}
    `}
  </main>

  <button onClick=${this.openActividadModal} title="Nueva actividad" class="h-bg" style="position:fixed;bottom:22px;right:22px;width:56px;height:56px;border-radius:50%;background:oklch(40% 0.08 35);--hbg:oklch(33% 0.08 35);color:oklch(97% 0.01 70);font-size:28px;border:none;cursor:pointer;box-shadow:0 6px 18px oklch(30% 0.1 35 / 0.4);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;">+</button>

  ${s.actModalOpen && this.renderActividadModal(materiasParaSelect)}
  ${s.materiaModalOpen && this.renderMateriaModal()}
  ${viendo && this.renderSlide(viendo)}
</div>`;
  }

  renderActividadModal(materiasParaSelect) {
    const s = this.state, f = s.form;
    const estadoBtn = (valor) => {
      const on = f.estado === valor;
      const realizada = valor === "Realizada";
      const border = on ? (realizada ? "2px solid oklch(45% 0.08 145)" : "1.5px dashed oklch(60% 0.13 78)") : "1.5px dashed oklch(88% 0.014 60)";
      const color = on ? (realizada ? "oklch(28% 0.06 145)" : "oklch(45% 0.1 70)") : "oklch(65% 0.015 60)";
      const bg = on && realizada ? "oklch(93% 0.03 145)" : "transparent";
      return html`<div onClick=${() => this.setField("estado", valor)} style="flex:1;text-align:center;padding:9px 6px;font-size:13px;font-weight:700;cursor:pointer;border-radius:5px;border:${border};color:${color};background:${bg};">${valor}</div>`;
    };
    return html`
    <div onClick=${enFondo(this.closeActividadModal)} style="position:fixed;inset:0;background:oklch(20% 0.02 50 / 0.5);z-index:300;display:flex;align-items:flex-end;justify-content:center;">
      <div style="background:oklch(99% 0.005 75);width:100%;max-width:640px;border-radius:18px 18px 0 0;padding:8px 22px 30px;max-height:92vh;overflow-y:auto;box-shadow:0 -8px 40px oklch(20% 0.02 50 / 0.25);border-top:4px solid oklch(40% 0.08 35);box-sizing:border-box;">
        <div style="width:36px;height:4px;background:oklch(88% 0.014 60);border-radius:2px;margin:8px auto 16px;"></div>
        <div style="font-family:'Fraunces',serif;font-size:18px;font-weight:600;margin-bottom:16px;color:oklch(28% 0.03 50);">${s.editingId ? "Editar actividad" : "Nueva actividad"}</div>

        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Materia</label>
          <select value=${f.materiaId} onChange=${this.campo("materiaId")} style=${INPUT}>
            ${materiasParaSelect.map(m => html`<option key=${m.id} value=${m.id}>${nombreMateria(m)}</option>`)}
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
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

        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Palabras clave <span style=${NOTA}>· separadas por comas</span></label>
          <input type="text" value=${f.keywords} onInput=${this.campo("keywords")} placeholder="Ej: perspectivismo, genealogía, apolíneo, dionisíaco" style=${INPUT}/>
        </div>

        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Descripción / nota <span style=${NOTA}>· opcional, respeta espacios y saltos de línea tal como los escribes</span></label>
          <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:6px;">
            <button onMouseDown=${(e) => this.formato(e, "underline")} title="Subrayar selección" style="width:30px;height:30px;border-radius:5px;border:1px solid oklch(88% 0.014 60);background:oklch(99% 0.005 75);color:oklch(28% 0.03 50);font-size:13px;font-weight:800;text-decoration:underline;cursor:pointer;">U</button>
            <span style="width:1px;height:20px;background:oklch(88% 0.014 60);"></span>
            ${RESALTADOS.map(c => html`<div onMouseDown=${(e) => this.formato(e, "hiliteColor", c)} title="Resaltar" style="width:20px;height:20px;border-radius:50%;background:${c};cursor:pointer;border:1px solid oklch(80% 0.01 60);"></div>`)}
            <div onMouseDown=${(e) => this.formato(e, "hiliteColor", "transparent")} title="Quitar resaltado" style="font-size:11px;color:oklch(45% 0.02 55);cursor:pointer;padding:4px 8px;border:1px dashed oklch(88% 0.014 60);border-radius:5px;">Quitar</div>
          </div>
          <div style="position:relative;">
            <div ref=${this.descRef} contenteditable="true" onInput=${() => this.syncDesc()} style="width:100%;min-height:70px;max-height:220px;overflow-y:auto;padding:10px 12px;border:1.5px solid oklch(88% 0.014 60);border-radius:6px;font-size:14px;box-sizing:border-box;white-space:pre-wrap;background:oklch(99% 0.005 75);color:oklch(28% 0.03 50);outline:none;"></div>
            ${!f.descripcion && html`<span style="position:absolute;top:10px;left:12px;color:oklch(65% 0.015 60);font-size:14px;pointer-events:none;">Ej: 15 min introducción, 20 min taller en grupos, 10 min puesta en común.</span>`}
          </div>
        </div>

        <div style="margin-bottom:6px;">
          <label style=${LABEL}>Enlaces y archivos <span style=${NOTA}>· uno por línea</span></label>
          <textarea value=${f.archivos} onInput=${this.campo("archivos")} placeholder=${"https://drive.google.com/…\nhttps://docs.google.com/document/…"} style="${INPUT}min-height:56px;resize:vertical;"></textarea>
        </div>

        <div style="display:flex;gap:10px;margin-top:16px;">
          <button onClick=${this.closeActividadModal} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarActividad} style=${BTN_OK}>${s.editingId ? "Actualizar" : "Guardar"}</button>
        </div>
      </div>
    </div>`;
  }

  renderMateriaModal() {
    const mf = this.state.materiaForm;
    return html`
    <div onClick=${enFondo(this.closeMateriaModal)} style="position:fixed;inset:0;background:oklch(20% 0.02 50 / 0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:18px;">
      <div style="background:oklch(99% 0.005 75);width:100%;max-width:420px;border-radius:14px;padding:24px;box-sizing:border-box;border-top:4px solid oklch(40% 0.08 35);">
        <div style="font-family:'Fraunces',serif;font-size:17px;font-weight:600;margin-bottom:16px;color:oklch(28% 0.03 50);">Nueva materia</div>
        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Nombre</label>
          <input type="text" value=${mf.nombre} onInput=${(e) => this.setMateria("nombre", e.target.value)} placeholder="Filosofía" style=${INPUT}/>
        </div>
        <div style="margin-bottom:16px;">
          <label style=${LABEL}>Curso <span style=${NOTA}>· agrupa las asignaturas de un mismo curso</span></label>
          <input type="text" value=${mf.curso} onInput=${(e) => this.setMateria("curso", e.target.value)} placeholder="Décimo A" style=${INPUT}/>
        </div>
        <div style="margin-bottom:18px;">
          <label style="${LABEL}margin-bottom:8px;">Color</label>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            ${NEON.map(c => {
              const on = c === mf.color;
              return html`<div onClick=${() => this.setMateria("color", c)} style="width:34px;height:34px;border-radius:50%;background:${c};cursor:pointer;box-shadow:${on ? "0 0 0 3px oklch(99% 0.005 75), 0 0 0 5px " + c : "none"};border:${on ? "2px solid oklch(28% 0.03 50)" : "2px solid transparent"};"></div>`;
            })}
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <button onClick=${this.closeMateriaModal} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarMateria} style=${BTN_OK}>Crear materia</button>
        </div>
      </div>
    </div>`;
  }

  renderSlide(a) {
    const s = this.state;
    const materia = s.materias.find(m => m.id === a.materiaId);
    const hecha = a.estado === "Realizada";
    const se = sello(hecha);
    const kws = parseKeywords(a.keywords);
    const enlaces = parseEnlaces(a.archivos);
    const color = materia ? materia.color : "oklch(85% 0.02 65)";
    const cerrar = () => this.setState({ viewingId: null });
    const BTN = "padding:10px 18px;border-radius:6px;border:1px solid oklch(88% 0.014 60);background:transparent;color:oklch(45% 0.02 55);font-size:14px;font-weight:600;cursor:pointer;";
    return html`
    <div onClick=${enFondo(cerrar)} style="position:fixed;inset:0;background:oklch(15% 0.01 50 / 0.72);z-index:400;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
      <div style="background:oklch(99% 0.005 75);width:100%;max-width:760px;max-height:90vh;overflow-y:auto;border-radius:16px;box-sizing:border-box;box-shadow:0 24px 70px oklch(15% 0.02 50 / 0.5);border-top:6px solid ${color};position:relative;">
        <button onClick=${cerrar} aria-label="Cerrar" style="position:absolute;top:16px;right:16px;width:34px;height:34px;border-radius:50%;border:1px solid oklch(88% 0.014 60);background:oklch(99% 0.005 75);color:oklch(45% 0.02 55);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>
        <div style="padding:clamp(28px,5vw,52px);">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
            <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:5px 12px;border-radius:999px;background:${color};color:oklch(18% 0.02 50);">${materia ? nombreMateria(materia) : ""}</span>
            <span style="font-size:12px;font-weight:700;padding:5px 12px;border-radius:6px;white-space:nowrap;border:${se.border};color:${se.color};background:${se.bg};">${se.texto}</span>
            <span style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(65% 0.015 60);">${fechaCorta(a.fecha)}</span>
          </div>
          <h2 style="font-family:'Fraunces',serif;font-size:clamp(24px,4vw,32px);font-weight:600;color:oklch(24% 0.03 50);margin:0 0 26px;line-height:1.2;">${a.titulo}</h2>

          ${a.objetivo && html`
            <div style="${SECCION}margin:0 0 6px;">Objetivo de aprendizaje</div>
            <div style="font-size:17px;color:oklch(24% 0.03 50);line-height:1.6;margin-bottom:24px;">${a.objetivo}</div>`}
          ${kws.length > 0 && html`
            <div style="${SECCION}margin:0 0 8px;">Palabras clave</div>
            <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:24px;">
              ${kws.map(kw => html`<span style="font-family:'IBM Plex Mono',monospace;font-size:13px;padding:6px 12px;background:oklch(92% 0.014 65);color:oklch(30% 0.02 55);border-radius:6px;">${kw}</span>`)}
            </div>`}
          ${a.descripcion && html`
            <div style="${SECCION}margin:0 0 6px;">Descripción</div>
            <div style="margin-bottom:24px;">
              <div dangerouslySetInnerHTML=${{ __html: a.descripcion }} style="font-size:16px;color:oklch(40% 0.02 55);line-height:1.65;white-space:pre-wrap;"></div>
            </div>`}
          ${enlaces.length > 0 && html`
            <div style="${SECCION}margin:0 0 8px;">Enlaces</div>
            <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;">
              ${enlaces.map(l => html`<a href=${hrefSeguro(l)} target="_blank" rel="noopener" class="h-u" style="font-size:15px;color:oklch(40% 0.08 35);font-weight:600;word-break:break-all;">↗ ${nombreEnlace(l)}</a>`)}
            </div>`}

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;border-top:1px dashed oklch(88% 0.014 60);padding-top:20px;">
            <button onClick=${() => this.toggleEstado(a.id)} style="padding:10px 18px;border-radius:6px;border:1.5px solid oklch(40% 0.08 35);background:transparent;color:oklch(40% 0.08 35);font-size:14px;font-weight:700;cursor:pointer;">${hecha ? "Marcar como planeada" : "Marcar como realizada"}</button>
            <button onClick=${() => { cerrar(); this.openEditar(a.id); }} style=${BTN}>Editar</button>
            <button onClick=${() => { cerrar(); this.eliminarActividad(a.id); }} style=${BTN}>Eliminar</button>
          </div>
        </div>
      </div>
    </div>`;
  }
}
