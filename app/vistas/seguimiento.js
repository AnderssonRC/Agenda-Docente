// seguimiento.js — Seguimiento de Estudiantes (situaciones, semáforo y ranking).
// Datos: usuarios/{uid}/datos/seguimiento_cursos, _estudiantes, _situaciones, _problematicas
import { html, Component } from "../lib.js";
import { watch, saveList } from "../data.js";
import {
  uid, enFondo, fechaHoyTexto, nombresDeListado, conteoTexto,
  ModuleHeader, Tabs, Cargando, construirGrafico, MiniChart
} from "../ui.js";

const TEMA = {
  header: "oklch(26% 0.05 25)", acento: "oklch(52% 0.19 25)",
  volver: "oklch(85% 0.03 25)", volverHover: "oklch(96% 0.01 25)",
  titulo: "oklch(97% 0.01 25)", sub: "oklch(70% 0.02 25)",
  tabActivo: "oklch(45% 0.16 25)", tabActivoBg: "oklch(96% 0.02 25)", tabInactivo: "oklch(70% 0.02 25)"
};
const COLORS = ["oklch(55% 0.14 25)", "oklch(50% 0.12 10)", "oklch(58% 0.16 40)", "oklch(48% 0.1 350)", "oklch(52% 0.14 15)", "oklch(60% 0.12 45)"];
const SEM = {
  rojo: { color: "oklch(52% 0.19 25)", ring: "oklch(90% 0.06 25)", bg: "oklch(93% 0.06 25)", text: "oklch(45% 0.19 25)", label: "Alerta" },
  morado: { color: "oklch(48% 0.18 300)", ring: "oklch(90% 0.06 300)", bg: "oklch(93% 0.06 300)", text: "oklch(42% 0.18 300)", label: "Reincidente" },
  amarillo: { color: "oklch(62% 0.15 85)", ring: "oklch(92% 0.06 85)", bg: "oklch(93% 0.05 85)", text: "oklch(45% 0.12 85)", label: "En proceso" },
  verde: { color: "oklch(48% 0.13 145)", ring: "oklch(90% 0.06 145)", bg: "oklch(93% 0.05 145)", text: "oklch(38% 0.1 145)", label: "Sin novedad" }
};
const SEVERIDAD = { rojo: 0, morado: 1, amarillo: 2, verde: 3 };
const DEFAULT_PROBLEMATICAS = ["Mal uso del celular", "Llegada tarde", "Mal uso del lenguaje", "Mal porte del uniforme"];
const K = { cursos: "seguimiento_cursos", estudiantes: "seguimiento_estudiantes", situaciones: "seguimiento_situaciones", problematicas: "seguimiento_problematicas" };

const LABEL = "display:block;font-size:11px;font-weight:700;margin-bottom:5px;color:oklch(45% 0.16 25);text-transform:uppercase;letter-spacing:0.07em;";
const LABEL6 = "display:block;font-size:11px;font-weight:700;margin-bottom:5px;color:oklch(45% 0.16 25);text-transform:uppercase;letter-spacing:0.06em;";
const INPUT = "width:100%;padding:10px 12px;border:1.5px solid oklch(88% 0.02 20);border-radius:6px;font-size:14px;box-sizing:border-box;background:oklch(99% 0.005 25);color:oklch(26% 0.03 20);";
const AREA = "width:100%;min-height:56px;padding:9px 12px;border:1.5px solid oklch(85% 0.02 20);border-radius:6px;font-size:13.5px;box-sizing:border-box;resize:vertical;background:oklch(99% 0.005 25);color:oklch(26% 0.03 20);";
const NOTA = "color:oklch(65% 0.02 20);font-weight:400;text-transform:none;";
const BTN_CANCELAR = "padding:12px 18px;background:transparent;color:oklch(45% 0.02 20);border:1.5px solid oklch(88% 0.02 20);border-radius:6px;font-size:14px;cursor:pointer;";
const BTN_OK = "flex:1;padding:12px;background:oklch(52% 0.19 25);color:oklch(97% 0.02 25);border:none;border-radius:6px;font-size:14.5px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;";
const SECCION = "font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:oklch(45% 0.16 25);margin-bottom:10px;";
const MODAL_FONDO = "position:fixed;inset:0;background:oklch(15% 0.02 25 / 0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:18px;";
const MODAL_CAJA = "background:oklch(99% 0.005 25);width:100%;max-width:420px;border-radius:14px;padding:24px;box-sizing:border-box;border-top:4px solid oklch(52% 0.19 25);";
const MODAL_TITULO = "font-family:'Fraunces',serif;font-size:17px;font-weight:600;margin-bottom:16px;color:oklch(26% 0.03 20);";

function blankSituacionForm() { return { problematicaId: "", reparacion: "", seguimiento: "", estado: "En proceso" }; }

const valorEstado = (estado) => estado === "Arreglado" ? 1 : estado === "No solucionado" ? -1 : 0;
const colorEstado = (estado) => estado === "Arreglado" ? SEM.verde.color : estado === "No solucionado" ? SEM.rojo.color : SEM.amarillo.color;

function semaforo(sits) {
  const noSol = sits.filter(s => s.estado === "No solucionado").length;
  const enProceso = sits.filter(s => s.estado === "En proceso").length;
  if (noSol >= 3) return "rojo";
  if (noSol === 2) return enProceso > 0 ? "morado" : "amarillo";
  return "verde";
}
const puntaje = (sits) => sits.reduce((sum, s) => sum + valorEstado(s.estado), 0);

/** Botones Arreglado / En proceso / No solucionado. */
function EstadoSelector({ valor, onCambio }) {
  const op = (estado, sem) => {
    const on = valor === estado;
    return html`<div onClick=${() => onCambio(estado)} style="flex:1;text-align:center;padding:8px 6px;font-size:12.5px;font-weight:700;cursor:pointer;border-radius:6px;border:${on ? "2px solid " + sem.color : "1.5px dashed oklch(85% 0.02 20)"};color:${on ? sem.text : "oklch(60% 0.02 20)"};background:${on ? sem.bg : "transparent"};">${estado}</div>`;
  };
  return html`<div style="display:flex;gap:6px;flex-wrap:wrap;">${op("Arreglado", SEM.verde)}${op("En proceso", SEM.amarillo)}${op("No solucionado", SEM.rojo)}</div>`;
}

export default class Seguimiento extends Component {
  state = {
    loaded: false,
    cursos: [], estudiantes: [], situaciones: [], problematicas: [],
    view: "todos", subview: "listado", search: "",
    cursoModalOpen: false, cursoForm: { nombre: "", descripcion: "" },
    estModalOpen: false, estForm: { listado: "", cursoId: "" },
    problematicasModalOpen: false, nuevaProblematica: "",
    viewingId: null,
    situacionForm: blankSituacionForm(),
    editSitId: null,
    editSitForm: { estado: "En proceso", reparacion: "", seguimiento: "" }
  };

  componentDidMount() {
    // La primera vez, se siembran las problemáticas por defecto.
    const semillas = { [K.problematicas]: DEFAULT_PROBLEMATICAS.map(nombre => ({ id: uid(), nombre })) };
    this.dejar = watch([K.cursos, K.estudiantes, K.situaciones, K.problematicas], d => this.setState({
      loaded: true,
      cursos: d[K.cursos], estudiantes: d[K.estudiantes],
      situaciones: d[K.situaciones], problematicas: d[K.problematicas]
    }), semillas);
  }
  componentWillUnmount() { this.dejar && this.dejar(); }

  /* ----- cursos y estudiantes ----- */
  openCursoModal = () => this.setState({ cursoModalOpen: true, cursoForm: { nombre: "", descripcion: "" } });
  closeCursoModal = () => this.setState({ cursoModalOpen: false });
  guardarCurso = () => {
    const { nombre, descripcion } = this.state.cursoForm;
    if (!nombre.trim()) return;
    const cursos = this.state.cursos;
    const nuevo = { id: uid(), nombre: nombre.trim(), descripcion: descripcion.trim(), color: COLORS[cursos.length % COLORS.length] };
    const nuevos = [...cursos, nuevo];
    this.setState({ cursos: nuevos, cursoModalOpen: false, view: nuevo.id });
    saveList(K.cursos, nuevos);
  };

  openEstModal = () => {
    if (this.state.cursos.length === 0) { this.openCursoModal(); return; }
    const defaultCurso = this.state.view !== "todos" ? this.state.view : this.state.cursos[0].id;
    this.setState({ estModalOpen: true, estForm: { listado: "", cursoId: defaultCurso } });
  };
  closeEstModal = () => this.setState({ estModalOpen: false });
  guardarEstudiante = () => {
    const { listado, cursoId } = this.state.estForm;
    if (!cursoId) return;
    const nombres = nombresDeListado(listado);
    if (nombres.length === 0) return;
    const nuevos = [...this.state.estudiantes, ...nombres.map(nombre => ({ id: uid(), nombre, cursoId }))];
    this.setState({ estudiantes: nuevos, estModalOpen: false });
    saveList(K.estudiantes, nuevos);
  };
  eliminarEstudiante(id) {
    if (!confirm("¿Eliminar este estudiante y su historial?")) return;
    const estudiantes = this.state.estudiantes.filter(e => e.id !== id);
    const situaciones = this.state.situaciones.filter(s => s.estudianteId !== id);
    this.setState({ estudiantes, situaciones, viewingId: null });
    saveList(K.estudiantes, estudiantes);
    saveList(K.situaciones, situaciones);
  }
  reiniciarHistorial(id) {
    if (!confirm("¿Borrar todo el historial de situaciones de este estudiante?")) return;
    const situaciones = this.state.situaciones.filter(s => s.estudianteId !== id);
    this.setState({ situaciones });
    saveList(K.situaciones, situaciones);
  }

  /* ----- problemáticas ----- */
  openProblematicasModal = () => this.setState({ problematicasModalOpen: true, nuevaProblematica: "" });
  closeProblematicasModal = () => this.setState({ problematicasModalOpen: false });
  agregarProblematica = () => {
    const nombre = this.state.nuevaProblematica.trim();
    if (!nombre) return;
    const problematicas = [...this.state.problematicas, { id: uid(), nombre }];
    this.setState({ problematicas, nuevaProblematica: "" });
    saveList(K.problematicas, problematicas);
  };
  eliminarProblematica(id) {
    const problematicas = this.state.problematicas.filter(p => p.id !== id);
    this.setState({ problematicas });
    saveList(K.problematicas, problematicas);
  }

  /* ----- situaciones ----- */
  openSlide(id) { this.setState({ viewingId: id, situacionForm: blankSituacionForm() }); }
  closeSlide = () => this.setState({ viewingId: null });
  setSit(campo, valor) { this.setState(s => ({ situacionForm: { ...s.situacionForm, [campo]: valor } })); }

  guardarSituacion = () => {
    if (!this.state.viewingId) return;
    const f = this.state.situacionForm;
    const nueva = { id: uid(), estudianteId: this.state.viewingId, fecha: Date.now(), problematicaId: f.problematicaId, reparacion: f.reparacion.trim(), seguimiento: f.seguimiento.trim(), estado: f.estado };
    const situaciones = [...this.state.situaciones, nueva];
    this.setState({ situaciones, situacionForm: blankSituacionForm() });
    saveList(K.situaciones, situaciones);
  };

  abrirEditarSituacion(id) {
    const sit = this.state.situaciones.find(s => s.id === id);
    if (!sit) return;
    this.setState({ editSitId: id, editSitForm: { estado: sit.estado, reparacion: sit.reparacion || "", seguimiento: sit.seguimiento || "" } });
  }
  cerrarEditarSituacion = () => this.setState({ editSitId: null });
  setEditSit(campo, valor) { this.setState(s => ({ editSitForm: { ...s.editSitForm, [campo]: valor } })); }
  guardarEdicionSituacion = () => {
    if (!this.state.editSitId) return;
    const f = this.state.editSitForm;
    const situaciones = this.state.situaciones.map(s => s.id === this.state.editSitId
      ? { ...s, estado: f.estado, reparacion: f.reparacion.trim(), seguimiento: f.seguimiento.trim() }
      : s);
    this.setState({ situaciones, editSitId: null });
    saveList(K.situaciones, situaciones);
  };

  /* ----- render ----- */
  render(_, s) {
    const tabs = [{ id: "todos", label: "Todos" }].concat(s.cursos.map(c => ({ id: c.id, label: c.nombre })));
    const cursoPorId = new Map(s.cursos.map(c => [c.id, c]));

    // Situaciones agrupadas por estudiante (se calcula una vez por render).
    const sitsDe = new Map();
    s.situaciones.forEach(sit => {
      if (!sitsDe.has(sit.estudianteId)) sitsDe.set(sit.estudianteId, []);
      sitsDe.get(sit.estudianteId).push(sit);
    });
    const sitsDeEst = (id) => sitsDe.get(id) || [];

    const estudiantesVista = s.view === "todos" ? s.estudiantes : s.estudiantes.filter(e => e.cursoId === s.view);
    const q = s.search.trim().toLowerCase();
    const filtrados = q ? estudiantesVista.filter(e => e.nombre.toLowerCase().includes(q)) : estudiantesVista;

    let rojo = 0, amarillo = 0, verde = 0;
    estudiantesVista.forEach(e => {
      const sem = semaforo(sitsDeEst(e.id));
      if (sem === "rojo") rojo++; else if (sem === "amarillo") amarillo++; else verde++;
    });

    const filas = filtrados.map(e => {
      const semKey = semaforo(sitsDeEst(e.id));
      return { e, semKey, sem: SEM[semKey], score: puntaje(sitsDeEst(e.id)), curso: cursoPorId.get(e.cursoId) };
    });
    const lista = s.subview === "ranking"
      ? filas.slice().sort((a, b) => SEVERIDAD[a.semKey] - SEVERIDAD[b.semKey] || a.score - b.score)
      : filas;

    const subBtn = (id, label) => {
      const on = s.subview === id;
      return html`<div onClick=${() => this.setState({ subview: id })} style="padding:8px 16px;border-radius:7px;font-size:13px;font-weight:700;cursor:pointer;background:${on ? "oklch(52% 0.19 25)" : "oklch(92% 0.02 20)"};color:${on ? "oklch(97% 0.02 25)" : "oklch(45% 0.02 20)"};">${label}</div>`;
    };

    const viendo = s.viewingId ? s.estudiantes.find(e => e.id === s.viewingId) : null;

    return html`
<div style="min-height:100vh;background:oklch(96% 0.02 25);display:flex;flex-direction:column;">

  <${ModuleHeader} tema=${TEMA} titulo="Seguimiento de Estudiantes">
    <button onClick=${this.openProblematicasModal} style="padding:9px 14px;border-radius:8px;border:1.5px dashed oklch(60% 0.03 25 / 0.5);background:transparent;color:oklch(85% 0.02 25);font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;">Problemáticas</button>
    <button onClick=${this.openEstModal} class="h-bg" style="padding:9px 16px;border-radius:8px;border:none;background:oklch(52% 0.19 25);--hbg:oklch(45% 0.19 25);color:oklch(97% 0.02 25);font-size:13.5px;font-weight:700;cursor:pointer;flex-shrink:0;">+ Estudiante</button>
  <//>

  <${Tabs} tema=${TEMA} tabs=${tabs} activo=${s.view} onSelect=${(id) => this.setState({ view: id })} onAdd=${this.openCursoModal} addLabel="+ Curso"/>

  <main style="flex:1;padding:22px clamp(16px,4vw,40px) 60px;max-width:820px;width:100%;margin:0 auto;box-sizing:border-box;">
    ${!s.loaded ? html`<${Cargando} color="oklch(50% 0.02 25)"/>`
    : s.cursos.length === 0 ? html`
      <div style="text-align:center;padding:60px 20px;">
        <div style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:15px;color:oklch(50% 0.02 25);border:1.5px dashed oklch(85% 0.02 20);border-radius:10px;padding:18px 26px;">Crea tu primer curso para comenzar el seguimiento.</div>
        <div style="margin-top:16px;">
          <button onClick=${this.openCursoModal} style="padding:11px 22px;border-radius:8px;border:none;background:oklch(52% 0.19 25);color:oklch(97% 0.02 25);font-size:14px;font-weight:700;cursor:pointer;">+ Crear curso</button>
        </div>
      </div>`
    : html`
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;">
        <div style="background:oklch(93% 0.06 25);border-radius:8px;padding:12px 14px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:600;color:oklch(45% 0.19 25);line-height:1;">${rojo}</div>
          <div style="font-size:11px;color:oklch(45% 0.1 25);margin-top:5px;font-weight:600;">🔴 alerta</div>
        </div>
        <div style="background:oklch(93% 0.05 85);border-radius:8px;padding:12px 14px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:600;color:oklch(48% 0.12 85);line-height:1;">${amarillo}</div>
          <div style="font-size:11px;color:oklch(45% 0.08 85);margin-top:5px;font-weight:600;">🟡 en proceso</div>
        </div>
        <div style="background:oklch(93% 0.05 145);border-radius:8px;padding:12px 14px;">
          <div style="font-family:'IBM Plex Mono',monospace;font-size:20px;font-weight:600;color:oklch(38% 0.1 145);line-height:1;">${verde}</div>
          <div style="font-size:11px;color:oklch(40% 0.08 145);margin-top:5px;font-weight:600;">🟢 sin novedad</div>
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-bottom:14px;">${subBtn("listado", "Listado")}${subBtn("ranking", "Ranking")}</div>

      ${estudiantesVista.length > 0 ? html`
        <input type="text" value=${s.search} onInput=${(e) => this.setState({ search: e.target.value })} placeholder="Buscar estudiante…" style="width:100%;padding:10px 14px;border:1.5px solid oklch(85% 0.02 20);border-radius:8px;font-size:14px;box-sizing:border-box;background:oklch(99% 0.005 25);color:oklch(26% 0.03 20);margin-bottom:14px;"/>`
      : html`
        <div style="text-align:center;padding:52px 20px;">
          <span style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:14px;color:oklch(50% 0.02 25);border:1.5px dashed oklch(85% 0.02 20);border-radius:8px;padding:12px 22px;">Aún no hay estudiantes en este listado</span>
        </div>`}

      ${q && estudiantesVista.length > 0 && filtrados.length === 0 && html`
        <div style="text-align:center;padding:30px 20px;">
          <span style="font-size:13.5px;color:oklch(50% 0.02 25);font-style:italic;font-family:'Fraunces',serif;">Sin resultados para "${s.search}"</span>
        </div>`}

      ${lista.map((row, i) => html`
        <div key=${row.e.id} onClick=${() => this.openSlide(row.e.id)} style="display:flex;align-items:center;gap:12px;background:oklch(99% 0.005 25);border:1px solid oklch(88% 0.02 20);border-radius:10px;padding:12px 14px;margin-bottom:8px;cursor:pointer;">
          ${s.subview === "ranking" && html`<div style="font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:700;color:oklch(60% 0.02 20);width:22px;flex-shrink:0;">${i + 1}</div>`}
          <div style="width:12px;height:12px;border-radius:50%;background:${row.sem.color};flex-shrink:0;box-shadow:0 0 0 3px ${row.sem.ring};"></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14.5px;font-weight:700;color:${row.sem.color};">${row.e.nombre}</div>
            ${s.view === "todos" && html`<div style="font-size:11.5px;color:oklch(50% 0.02 25);margin-top:1px;">${row.curso ? row.curso.nombre : ""}</div>`}
          </div>
          ${s.subview === "ranking"
            ? html`<div style="font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:600;color:oklch(45% 0.02 20);flex-shrink:0;">${(row.score > 0 ? "+" : "") + row.score}</div>`
            : html`<svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="color:oklch(70% 0.02 20);flex-shrink:0;"><polyline points="7,4 13,10 7,16" stroke="currentColor" stroke-width="2"/></svg>`}
        </div>`)}
    `}
  </main>

  ${s.cursoModalOpen && this.renderCursoModal()}
  ${s.estModalOpen && this.renderEstModal()}
  ${s.problematicasModalOpen && this.renderProblematicasModal()}
  ${viendo && this.renderSlide(viendo, cursoPorId.get(viendo.cursoId), sitsDeEst(viendo.id))}
  ${s.editSitId && this.renderEditarSituacion()}
</div>`;
  }

  renderCursoModal() {
    const cf = this.state.cursoForm;
    const set = (k) => (e) => { const v = e.target.value; this.setState(st => ({ cursoForm: { ...st.cursoForm, [k]: v } })); };
    return html`
    <div onClick=${enFondo(this.closeCursoModal)} style=${MODAL_FONDO}>
      <div style=${MODAL_CAJA}>
        <div style=${MODAL_TITULO}>Nuevo curso</div>
        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Nombre</label>
          <input type="text" value=${cf.nombre} onInput=${set("nombre")} placeholder="Décimo A" style=${INPUT}/>
        </div>
        <div style="margin-bottom:18px;">
          <label style=${LABEL}>Descripción <span style=${NOTA}>· opcional</span></label>
          <input type="text" value=${cf.descripcion} onInput=${set("descripcion")} placeholder="Convivencia y disciplina" style=${INPUT}/>
        </div>
        <div style="display:flex;gap:10px;">
          <button onClick=${this.closeCursoModal} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarCurso} style=${BTN_OK}>Crear curso</button>
        </div>
      </div>
    </div>`;
  }

  renderEstModal() {
    const ef = this.state.estForm;
    const set = (k) => (e) => { const v = e.target.value; this.setState(st => ({ estForm: { ...st.estForm, [k]: v } })); };
    return html`
    <div onClick=${enFondo(this.closeEstModal)} style=${MODAL_FONDO}>
      <div style=${MODAL_CAJA}>
        <div style=${MODAL_TITULO}>Nuevo estudiante</div>
        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Curso</label>
          <select value=${ef.cursoId} onChange=${set("cursoId")} style=${INPUT}>
            ${this.state.cursos.map(c => html`<option key=${c.id} value=${c.id}>${c.nombre}</option>`)}
          </select>
        </div>
        <div style="margin-bottom:18px;">
          <label style=${LABEL}>Listado <span style=${NOTA}>· pega el listado, un estudiante por línea</span></label>
          <textarea value=${ef.listado} onInput=${set("listado")} placeholder=${"Ana García\nCarlos Martínez\nLaura Pérez"} style="${INPUT}min-height:140px;resize:vertical;font-family:'IBM Plex Mono',monospace;"></textarea>
          <div style="font-size:11.5px;color:oklch(60% 0.02 20);margin-top:5px;">${conteoTexto(ef.listado)}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button onClick=${this.closeEstModal} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarEstudiante} style=${BTN_OK}>Añadir al listado</button>
        </div>
      </div>
    </div>`;
  }

  renderProblematicasModal() {
    const s = this.state;
    return html`
    <div onClick=${enFondo(this.closeProblematicasModal)} style=${MODAL_FONDO}>
      <div style="${MODAL_CAJA}max-width:440px;">
        <div style="${MODAL_TITULO}margin-bottom:6px;">Problemáticas predefinidas</div>
        <div style="font-size:12.5px;color:oklch(50% 0.02 20);margin-bottom:14px;">Úsalas para registrar situaciones más rápido.</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;max-height:220px;overflow-y:auto;">
          ${s.problematicas.map(p => html`
            <div key=${p.id} style="display:flex;align-items:center;gap:8px;background:oklch(94% 0.02 20);border-radius:7px;padding:8px 10px;">
              <div style="flex:1;font-size:13.5px;color:oklch(28% 0.03 20);">${p.nombre}</div>
              <button onClick=${() => this.eliminarProblematica(p.id)} class="h-c" style="width:22px;height:22px;border-radius:50%;border:none;background:transparent;color:oklch(55% 0.02 20);--hc:oklch(50% 0.18 25);cursor:pointer;font-size:14px;">×</button>
            </div>`)}
        </div>
        <form onSubmit=${(e) => { e.preventDefault(); this.agregarProblematica(); }} style="display:flex;gap:8px;">
          <input type="text" value=${s.nuevaProblematica} onInput=${(e) => this.setState({ nuevaProblematica: e.target.value })} placeholder="Nueva problemática" style="flex:1;padding:9px 12px;border:1.5px solid oklch(88% 0.02 20);border-radius:6px;font-size:13.5px;box-sizing:border-box;background:oklch(99% 0.005 25);color:oklch(26% 0.03 20);"/>
          <button type="submit" style="padding:9px 14px;border-radius:6px;border:none;background:oklch(52% 0.19 25);color:oklch(97% 0.02 25);font-size:13px;font-weight:700;cursor:pointer;">Añadir</button>
        </form>
        <div style="margin-top:16px;">
          <button onClick=${this.closeProblematicasModal} style="width:100%;padding:11px;background:transparent;color:oklch(45% 0.02 20);border:1.5px solid oklch(88% 0.02 20);border-radius:6px;font-size:14px;cursor:pointer;">Cerrar</button>
        </div>
      </div>
    </div>`;
  }

  renderSlide(est, curso, sits) {
    const s = this.state, f = s.situacionForm;
    const sem = SEM[semaforo(sits)];
    const chart = construirGrafico(sits, r => valorEstado(r.estado), r => colorEstado(r.estado));
    const historial = sits.slice().sort((a, b) => b.fecha - a.fecha);
    const probPorId = new Map(s.problematicas.map(p => [p.id, p]));
    const BTN_SEC = "padding:8px 14px;border-radius:6px;border:1px solid oklch(88% 0.02 20);background:transparent;color:oklch(45% 0.02 20);font-size:12.5px;font-weight:600;cursor:pointer;";
    return html`
    <div onClick=${enFondo(this.closeSlide)} style="position:fixed;inset:0;background:oklch(15% 0.02 25 / 0.72);z-index:400;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
      <div style="background:oklch(99% 0.005 25);width:100%;max-width:720px;max-height:90vh;overflow-y:auto;border-radius:16px;box-sizing:border-box;box-shadow:0 24px 70px oklch(15% 0.03 25 / 0.5);border-top:6px solid ${sem.color};position:relative;">
        <button onClick=${this.closeSlide} aria-label="Cerrar" style="position:absolute;top:16px;right:16px;width:34px;height:34px;border-radius:50%;border:1px solid oklch(88% 0.02 20);background:oklch(99% 0.005 25);color:oklch(45% 0.02 20);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>
        <div style="padding:clamp(28px,5vw,44px);">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
            <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:5px 12px;border-radius:999px;background:oklch(94% 0.015 20);color:oklch(40% 0.02 20);">${curso ? curso.nombre : ""}</span>
            <span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:5px 12px;border-radius:999px;background:${sem.bg};color:${sem.text};">
              <span style="width:8px;height:8px;border-radius:50%;background:${sem.color};"></span>${sem.label}
            </span>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:24px;">
            <h2 style="font-family:'Fraunces',serif;font-size:clamp(24px,4vw,30px);font-weight:600;color:${sem.color};margin:0;line-height:1.2;">${est.nombre}</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onClick=${() => this.reiniciarHistorial(est.id)} style=${BTN_SEC}>Reiniciar historial</button>
              <button onClick=${() => this.eliminarEstudiante(est.id)} class="h-b h-c h-bg" style="${BTN_SEC}--hb:oklch(45% 0.18 25);--hc:oklch(45% 0.18 25);--hbg:oklch(94% 0.03 25);">Eliminar estudiante</button>
            </div>
          </div>

          <div style="background:oklch(94% 0.015 20);border-radius:10px;padding:16px 18px;margin-bottom:24px;">
            <div style="${SECCION}margin-bottom:12px;">Nueva situación del estudiante</div>
            <div style="font-family:'IBM Plex Mono',monospace;font-size:12px;color:oklch(55% 0.02 20);margin-bottom:10px;">Fecha: ${fechaHoyTexto()}</div>
            <div style="margin-bottom:10px;">
              <label style=${LABEL6}>Problemática <span style=${NOTA}>· opcional</span></label>
              <select value=${f.problematicaId} onChange=${(e) => this.setSit("problematicaId", e.target.value)} style="width:100%;padding:9px 12px;border:1.5px solid oklch(85% 0.02 20);border-radius:6px;font-size:13.5px;background:oklch(99% 0.005 25);color:oklch(26% 0.03 20);box-sizing:border-box;">
                <option value="">Sin especificar</option>
                ${s.problematicas.map(p => html`<option key=${p.id} value=${p.id}>${p.nombre}</option>`)}
              </select>
            </div>
            <div style="margin-bottom:10px;">
              <label style=${LABEL6}>Reparación</label>
              <textarea value=${f.reparacion} onInput=${(e) => this.setSit("reparacion", e.target.value)} placeholder="Acción correctiva acordada con el estudiante" style=${AREA}></textarea>
            </div>
            <div style="margin-bottom:10px;">
              <label style=${LABEL6}>Seguimiento</label>
              <textarea value=${f.seguimiento} onInput=${(e) => this.setSit("seguimiento", e.target.value)} placeholder="Notas de seguimiento" style=${AREA}></textarea>
            </div>
            <div style="margin-bottom:12px;">
              <label style=${LABEL6}>Estado</label>
              <${EstadoSelector} valor=${f.estado} onCambio=${(v) => this.setSit("estado", v)}/>
            </div>
            <button onClick=${this.guardarSituacion} style="width:100%;padding:11px;background:oklch(52% 0.19 25);color:oklch(97% 0.02 25);border:none;border-radius:6px;font-size:14px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;">Guardar situación</button>
          </div>

          <div style=${SECCION}>Progreso</div>
          <${MiniChart} chart=${chart} linea="oklch(48% 0.16 25)" eje="oklch(85% 0.02 20)" colorDia="oklch(42% 0.03 40)" colorHora="oklch(58% 0.02 40)" colorVacio="oklch(50% 0.02 25)"/>

          <div style=${SECCION}>Historial de situaciones</div>
          ${historial.length === 0 && html`<div style="font-size:13px;color:oklch(50% 0.02 25);font-style:italic;font-family:'Fraunces',serif;">Sin registros todavía</div>`}
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${historial.map(sit => {
              const prob = probPorId.get(sit.problematicaId);
              const color = colorEstado(sit.estado);
              return html`
              <div key=${sit.id} style="padding:11px 13px;background:oklch(96% 0.012 20);border-radius:8px;border-left:4px solid ${color};">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
                  <span style="font-size:12px;font-weight:700;color:${color};">${sit.estado}</span>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:oklch(60% 0.02 20);">${new Date(sit.fecha).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <button onClick=${() => this.abrirEditarSituacion(sit.id)} style="border:1px solid oklch(80% 0.03 25);background:oklch(99% 0.005 25);color:oklch(45% 0.12 25);font-size:11px;font-weight:700;padding:4px 12px;border-radius:6px;cursor:pointer;">Editar</button>
                  </div>
                </div>
                ${prob && html`<div style="font-size:12.5px;font-weight:600;color:oklch(30% 0.03 20);margin-top:5px;">${prob.nombre}</div>`}
                ${sit.reparacion && html`<div style="font-size:13px;color:oklch(35% 0.02 20);margin-top:4px;"><strong>Reparación:</strong> ${sit.reparacion}</div>`}
                ${sit.seguimiento && html`<div style="font-size:13px;color:oklch(35% 0.02 20);margin-top:4px;"><strong>Seguimiento:</strong> ${sit.seguimiento}</div>`}
              </div>`;
            })}
          </div>
        </div>
      </div>
    </div>`;
  }

  renderEditarSituacion() {
    const f = this.state.editSitForm;
    return html`
    <div onClick=${enFondo(this.cerrarEditarSituacion)} style="position:fixed;inset:0;background:oklch(20% 0.02 25 / 0.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:500;">
      <div style="background:oklch(99% 0.005 25);border-radius:16px;padding:24px;width:100%;max-width:440px;box-shadow:0 20px 50px oklch(20% 0.03 25 / 0.25);box-sizing:border-box;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
          <div style="font-family:'Fraunces',serif;font-size:19px;font-weight:600;color:oklch(28% 0.03 20);">Editar situación</div>
          <div onClick=${this.cerrarEditarSituacion} style="cursor:pointer;font-size:22px;line-height:1;color:oklch(55% 0.02 20);">×</div>
        </div>
        <div style="margin-bottom:12px;">
          <label style=${LABEL6}>Estado</label>
          <${EstadoSelector} valor=${f.estado} onCambio=${(v) => this.setEditSit("estado", v)}/>
        </div>
        <div style="margin-bottom:12px;">
          <label style=${LABEL6}>Reparación</label>
          <textarea value=${f.reparacion} onInput=${(e) => this.setEditSit("reparacion", e.target.value)} placeholder="Acción correctiva acordada con el estudiante" style=${AREA}></textarea>
        </div>
        <div style="margin-bottom:16px;">
          <label style=${LABEL6}>Seguimiento</label>
          <textarea value=${f.seguimiento} onInput=${(e) => this.setEditSit("seguimiento", e.target.value)} placeholder="Notas de seguimiento" style=${AREA}></textarea>
        </div>
        <div style="display:flex;gap:8px;">
          <button onClick=${this.cerrarEditarSituacion} style="flex:1;padding:11px;background:transparent;color:oklch(45% 0.02 25);border:1.5px solid oklch(85% 0.02 20);border-radius:6px;font-size:14px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;">Cancelar</button>
          <button onClick=${this.guardarEdicionSituacion} style="flex:1;padding:11px;background:oklch(52% 0.19 25);color:oklch(97% 0.02 25);border:none;border-radius:6px;font-size:14px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;">Guardar cambios</button>
        </div>
      </div>
    </div>`;
  }
}
