// participacion.js — Participación de Clase (puntos por estudiante).
// Datos: usuarios/{uid}/datos/participacion_cursos, _estudiantes, _registros
import { html, Component } from "../lib.js";
import { watch, saveList } from "../data.js";
import {
  uid, localDateStr, todayLocal, enFondo, nombresDeListado, conteoTexto,
  ModuleHeader, Tabs, Cargando, construirGrafico, MiniChart
} from "../ui.js";
import { PanelCtx } from "../panel.js";

const TEMA = {
  header: "oklch(28% 0.06 240)", acento: "oklch(60% 0.16 235)",
  volver: "oklch(85% 0.03 230)", volverHover: "oklch(96% 0.01 230)",
  titulo: "oklch(97% 0.01 230)", sub: "oklch(70% 0.02 230)",
  tabActivo: "oklch(38% 0.14 235)", tabActivoBg: "oklch(96% 0.02 230)", tabInactivo: "oklch(70% 0.02 230)"
};
const COLORS = ["oklch(60% 0.14 235)", "oklch(55% 0.12 200)", "oklch(58% 0.16 260)", "oklch(62% 0.1 220)", "oklch(52% 0.14 250)", "oklch(65% 0.12 210)"];
const K = { cursos: "participacion_cursos", estudiantes: "participacion_estudiantes", registros: "participacion_registros" };

const LABEL = "display:block;font-size:11px;font-weight:700;margin-bottom:5px;color:oklch(38% 0.14 235);text-transform:uppercase;letter-spacing:0.07em;";
const INPUT = "width:100%;padding:10px 12px;border:1.5px solid oklch(88% 0.02 225);border-radius:6px;font-size:14px;box-sizing:border-box;background:oklch(99% 0.005 230);color:oklch(26% 0.03 240);";
const NOTA = "color:oklch(65% 0.02 225);font-weight:400;text-transform:none;";
const BTN_CANCELAR = "padding:12px 18px;background:transparent;color:oklch(45% 0.02 235);border:1.5px solid oklch(88% 0.02 225);border-radius:6px;font-size:14px;cursor:pointer;";
const BTN_OK = "flex:1;padding:12px;background:oklch(60% 0.16 235);color:oklch(15% 0.03 240);border:none;border-radius:6px;font-size:14.5px;font-weight:700;font-family:'Fraunces',serif;cursor:pointer;";
const SECCION = "font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:oklch(38% 0.14 235);margin-bottom:10px;";
const MODAL_FONDO = "position:fixed;inset:0;background:oklch(15% 0.02 240 / 0.5);z-index:300;display:flex;align-items:center;justify-content:center;padding:18px;";
const MODAL_CAJA = "background:oklch(99% 0.005 230);width:100%;max-width:420px;border-radius:14px;padding:24px;box-sizing:border-box;border-top:4px solid oklch(60% 0.16 235);";
const MODAL_TITULO = "font-family:'Fraunces',serif;font-size:17px;font-weight:600;margin-bottom:16px;color:oklch(26% 0.03 240);";

export default class Participacion extends Component {
  static contextType = PanelCtx;
  state = {
    loaded: false,
    cursos: [], estudiantes: [], registros: [],
    view: "todos",
    search: "",
    cursoModalOpen: false, cursoForm: { nombre: "", descripcion: "" },
    estModalOpen: false, estForm: { listado: "", cursoId: "" },
    viewingId: null,
    slideForm: { cantidad: 1, motivo: "" }
  };

  componentDidMount() {
    this.dejar = watch([K.cursos, K.estudiantes, K.registros], d => this.setState({
      loaded: true, cursos: d[K.cursos], estudiantes: d[K.estudiantes], registros: d[K.registros]
    }));
  }
  componentWillUnmount() { this.dejar && this.dejar(); }

  /* ----- cursos ----- */
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

  /* ----- estudiantes ----- */
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
    const nuevos = [...this.state.estudiantes, ...nombres.map(nombre => ({ id: uid(), nombre, cursoId, puntosTotales: 0 }))];
    this.setState({ estudiantes: nuevos, estModalOpen: false });
    saveList(K.estudiantes, nuevos);
  };

  /* ----- puntos ----- */
  // Los puntos del mismo día se acumulan en un solo registro por estudiante.
  registrarPuntos(estudianteId, delta, motivo) {
    if (!delta) return;
    const hoy = todayLocal();
    const motivoLimpio = motivo && motivo.trim() ? motivo.trim() : "Ajuste rápido";
    const idx = this.state.registros.findIndex(r => r.estudianteId === estudianteId && localDateStr(r.fecha) === hoy);
    let registros;
    if (idx !== -1) {
      const existente = this.state.registros[idx];
      const motivoFinal = motivoLimpio === "Ajuste rápido"
        ? existente.motivo
        : (existente.motivo && existente.motivo !== "Ajuste rápido" ? existente.motivo + "; " + motivoLimpio : motivoLimpio);
      registros = this.state.registros.slice();
      registros[idx] = { ...existente, puntos: existente.puntos + delta, motivo: motivoFinal, fecha: Date.now() };
    } else {
      registros = [...this.state.registros, { id: uid(), fecha: Date.now(), estudianteId, puntos: delta, motivo: motivoLimpio }];
    }
    const estudiantes = this.state.estudiantes.map(e => e.id === estudianteId ? { ...e, puntosTotales: (e.puntosTotales || 0) + delta } : e);
    this.setState({ estudiantes, registros });
    saveList(K.estudiantes, estudiantes);
    saveList(K.registros, registros);
  }

  reiniciarPuntos(estudianteId) {
    if (!confirm("¿Reiniciar los puntos de este estudiante a 0? Se borrará su historial y gráfico.")) return;
    const estudiantes = this.state.estudiantes.map(e => e.id === estudianteId ? { ...e, puntosTotales: 0 } : e);
    const registros = this.state.registros.filter(r => r.estudianteId !== estudianteId);
    this.setState({ estudiantes, registros });
    saveList(K.estudiantes, estudiantes);
    saveList(K.registros, registros);
  }

  eliminarEstudiante(id) {
    if (!confirm("¿Eliminar este estudiante y su historial de puntos?")) return;
    const estudiantes = this.state.estudiantes.filter(e => e.id !== id);
    const registros = this.state.registros.filter(r => r.estudianteId !== id);
    this.setState({ estudiantes, registros, viewingId: null });
    saveList(K.estudiantes, estudiantes);
    saveList(K.registros, registros);
  }

  openSlide(id) { this.setState({ viewingId: id, slideForm: { cantidad: 1, motivo: "" } }); }
  closeSlide = () => this.setState({ viewingId: null });
  setSlide(campo, valor) { this.setState(s => ({ slideForm: { ...s.slideForm, [campo]: valor } })); }

  /* ----- render ----- */
  render(_, s) {
    const hoy = todayLocal();
    const tabs = [{ id: "todos", label: "Todos" }].concat(s.cursos.map(c => ({ id: c.id, label: c.nombre })));
    const cursoPorId = new Map(s.cursos.map(c => [c.id, c]));

    const estudiantesVista = s.view === "todos" ? s.estudiantes : s.estudiantes.filter(e => e.cursoId === s.view);
    const idsVista = new Set(estudiantesVista.map(e => e.id));
    const puntosHoy = s.registros
      .filter(r => idsVista.has(r.estudianteId) && localDateStr(r.fecha) === hoy)
      .reduce((sum, r) => sum + r.puntos, 0);

    const q = s.search.trim().toLowerCase();
    const filtrados = q ? estudiantesVista.filter(e => e.nombre.toLowerCase().includes(q)) : estudiantesVista;
    const viendo = s.viewingId ? s.estudiantes.find(e => e.id === s.viewingId) : null;
    // En pantalla dividida, solo los elementos que el docente dejó visibles.
    const v = (el) => this.context.ver("participacion", el);

    return html`
<div style="min-height:100vh;background:oklch(96% 0.02 230);display:flex;flex-direction:column;">

  ${v("encabezado") && html`
  <${ModuleHeader} tema=${TEMA} titulo="Participación de Clase">
    <button onClick=${this.openEstModal} class="h-bg" style="padding:9px 16px;border-radius:8px;border:none;background:oklch(60% 0.16 235);--hbg:oklch(68% 0.16 235);color:oklch(15% 0.03 240);font-size:13.5px;font-weight:700;cursor:pointer;flex-shrink:0;">+ Estudiante</button>
  <//>`}

  ${v("pestanas") && html`<${Tabs} tema=${TEMA} tabs=${tabs} activo=${s.view} onSelect=${(id) => this.setState({ view: id })} onAdd=${this.openCursoModal} addLabel="+ Curso"/>`}

  <main style="flex:1;padding:22px clamp(16px,4vw,40px) 60px;max-width:820px;width:100%;margin:0 auto;box-sizing:border-box;">
    ${!s.loaded ? html`<${Cargando} color="oklch(50% 0.02 230)"/>`
    : s.cursos.length === 0 ? html`
      <div style="text-align:center;padding:60px 20px;">
        <div style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:15px;color:oklch(50% 0.02 230);border:1.5px dashed oklch(85% 0.02 225);border-radius:10px;padding:18px 26px;">Crea tu primer curso o asignatura para comenzar a llevar el listado.</div>
        <div style="margin-top:16px;">
          <button onClick=${this.openCursoModal} style="padding:11px 22px;border-radius:8px;border:none;background:oklch(60% 0.16 235);color:oklch(15% 0.03 240);font-size:14px;font-weight:700;cursor:pointer;">+ Crear curso</button>
        </div>
      </div>`
    : html`
      ${v("resumen") && html`
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:22px;">
        ${[[estudiantesVista.length, "estudiantes"], [puntosHoy, "puntos otorgados hoy"]].map(([n, l]) => html`
          <div style="background:oklch(92% 0.02 225);border-radius:8px;padding:12px 14px;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:500;color:oklch(30% 0.05 235);line-height:1;">${n}</div>
            <div style="font-size:11px;color:oklch(45% 0.02 235);margin-top:5px;font-weight:600;">${l}</div>
          </div>`)}
      </div>`}

      ${estudiantesVista.length === 0 ? html`
        <div style="text-align:center;padding:52px 20px;">
          <span style="display:inline-block;font-family:'Fraunces',serif;font-style:italic;font-size:14px;color:oklch(50% 0.02 230);border:1.5px dashed oklch(85% 0.02 225);border-radius:8px;padding:12px 22px;">Aún no hay estudiantes en este listado</span>
        </div>`
      : v("buscador") && html`
        <input type="text" value=${s.search} onInput=${(e) => this.setState({ search: e.target.value })} placeholder="Buscar estudiante…" style="width:100%;padding:10px 14px;border:1.5px solid oklch(85% 0.02 225);border-radius:8px;font-size:14px;box-sizing:border-box;background:oklch(99% 0.005 230);color:oklch(26% 0.03 240);margin-bottom:14px;"/>`}

      ${q && estudiantesVista.length > 0 && filtrados.length === 0 && html`
        <div style="text-align:center;padding:30px 20px;">
          <span style="font-size:13.5px;color:oklch(50% 0.02 230);font-style:italic;font-family:'Fraunces',serif;">Sin resultados para "${s.search}"</span>
        </div>`}

      ${filtrados.map(e => {
        const curso = cursoPorId.get(e.cursoId);
        return html`
        <div key=${e.id} style="display:flex;align-items:center;gap:10px;background:oklch(99% 0.005 230);border:1px solid oklch(88% 0.02 225);border-left:5px solid ${curso ? curso.color : "oklch(80% 0.02 225)"};border-radius:10px;padding:10px 14px;margin-bottom:8px;">
          ${v("botones") && html`<button onClick=${() => this.registrarPuntos(e.id, -1)} class="h-bg" style="width:30px;height:30px;border-radius:50%;border:1.5px solid oklch(55% 0.18 25);background:transparent;--hbg:oklch(93% 0.05 25);color:oklch(45% 0.18 25);font-size:17px;font-weight:700;cursor:pointer;flex-shrink:0;">−</button>`}
          <div style="width:44px;text-align:center;font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;color:oklch(28% 0.03 240);flex-shrink:0;">${e.puntosTotales || 0}</div>
          ${v("botones") && html`<button onClick=${() => this.registrarPuntos(e.id, 1)} class="h-bg" style="width:30px;height:30px;border-radius:50%;border:1.5px solid oklch(48% 0.13 150);background:transparent;--hbg:oklch(93% 0.05 150);color:oklch(40% 0.13 150);font-size:17px;font-weight:700;cursor:pointer;flex-shrink:0;">+</button>`}
          <div onClick=${() => this.openSlide(e.id)} style="flex:1;min-width:0;cursor:pointer;padding:2px 4px;">
            <div style="font-size:14.5px;font-weight:700;color:oklch(26% 0.03 240);">${e.nombre}</div>
            ${s.view === "todos" && html`<div style="font-size:11.5px;color:oklch(50% 0.02 230);margin-top:1px;">${curso ? curso.nombre : ""}</div>`}
          </div>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style="color:oklch(70% 0.02 225);flex-shrink:0;"><polyline points="7,4 13,10 7,16" stroke="currentColor" stroke-width="2"/></svg>
        </div>`;
      })}
    `}
  </main>

  ${s.cursoModalOpen && this.renderCursoModal()}
  ${s.estModalOpen && this.renderEstModal()}
  ${viendo && this.renderSlide(viendo, cursoPorId.get(viendo.cursoId))}
</div>`;
  }

  renderCursoModal() {
    const cf = this.state.cursoForm;
    const set = (k) => (e) => { const v = e.target.value; this.setState(st => ({ cursoForm: { ...st.cursoForm, [k]: v } })); };
    return html`
    <div onClick=${enFondo(this.closeCursoModal)} style=${MODAL_FONDO}>
      <div style=${MODAL_CAJA}>
        <div style=${MODAL_TITULO}>Nuevo curso / asignatura</div>
        <div style="margin-bottom:12px;">
          <label style=${LABEL}>Nombre</label>
          <input type="text" value=${cf.nombre} onInput=${set("nombre")} placeholder="Filosofía 11°" style=${INPUT}/>
        </div>
        <div style="margin-bottom:18px;">
          <label style=${LABEL}>Descripción <span style=${NOTA}>· opcional</span></label>
          <input type="text" value=${cf.descripcion} onInput=${set("descripcion")} placeholder="Ética y pensamiento crítico" style=${INPUT}/>
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
          <div style="font-size:11.5px;color:oklch(60% 0.02 225);margin-top:5px;">${conteoTexto(ef.listado)}</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button onClick=${this.closeEstModal} style=${BTN_CANCELAR}>Cancelar</button>
          <button onClick=${this.guardarEstudiante} style=${BTN_OK}>Añadir al listado</button>
        </div>
      </div>
    </div>`;
  }

  renderSlide(est, curso) {
    const s = this.state, sf = s.slideForm;
    const regs = s.registros.filter(r => r.estudianteId === est.id);
    const chart = construirGrafico(regs, r => r.puntos, () => "oklch(48% 0.16 235)");
    const historial = regs.slice().sort((a, b) => b.fecha - a.fecha);
    const color = curso ? curso.color : "oklch(80% 0.02 225)";
    const cantidad = Math.abs(parseInt(sf.cantidad, 10) || 1);
    const BTN_SEC = "padding:8px 14px;border-radius:6px;border:1px solid oklch(88% 0.02 225);background:transparent;color:oklch(45% 0.02 235);font-size:12.5px;font-weight:600;cursor:pointer;";
    return html`
    <div onClick=${enFondo(this.closeSlide)} style="position:fixed;inset:0;background:oklch(15% 0.02 240 / 0.72);z-index:400;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
      <div style="background:oklch(99% 0.005 230);width:100%;max-width:720px;max-height:90vh;overflow-y:auto;border-radius:16px;box-sizing:border-box;box-shadow:0 24px 70px oklch(15% 0.03 240 / 0.5);border-top:6px solid ${color};position:relative;">
        <button onClick=${this.closeSlide} aria-label="Cerrar" style="position:absolute;top:16px;right:16px;width:34px;height:34px;border-radius:50%;border:1px solid oklch(88% 0.02 225);background:oklch(99% 0.005 230);color:oklch(45% 0.02 235);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;">×</button>
        <div style="padding:clamp(28px,5vw,44px);">
          <span style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:5px 12px;border-radius:999px;background:${color};color:oklch(15% 0.03 240);">${curso ? curso.nombre : ""}</span>
          <h2 style="font-family:'Fraunces',serif;font-size:clamp(24px,4vw,30px);font-weight:600;color:oklch(24% 0.03 240);margin:14px 0 6px;line-height:1.2;">${est.nombre}</h2>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px;flex-wrap:wrap;">
            <div style="font-family:'IBM Plex Mono',monospace;font-size:26px;font-weight:600;color:oklch(38% 0.14 235);">${est.puntosTotales || 0} pts</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button onClick=${() => this.reiniciarPuntos(est.id)} class="h-b h-c h-bg" style="${BTN_SEC}--hb:oklch(45% 0.1 70);--hc:oklch(45% 0.1 70);--hbg:oklch(94% 0.04 70);">Reiniciar puntos</button>
              <button onClick=${() => this.eliminarEstudiante(est.id)} class="h-b h-c h-bg" style="${BTN_SEC}--hb:oklch(45% 0.18 25);--hc:oklch(45% 0.18 25);--hbg:oklch(94% 0.03 25);">Eliminar estudiante</button>
            </div>
          </div>

          <div style="background:oklch(94% 0.015 225);border-radius:10px;padding:16px 18px;margin-bottom:22px;">
            <div style=${SECCION}>Agregar o quitar puntos</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <input type="number" min="1" value=${sf.cantidad} onInput=${(e) => this.setSlide("cantidad", e.target.value)} style="width:70px;padding:9px 10px;border:1.5px solid oklch(85% 0.02 225);border-radius:6px;font-size:14px;font-family:'IBM Plex Mono',monospace;box-sizing:border-box;background:oklch(99% 0.005 230);color:oklch(26% 0.03 240);"/>
              <input type="text" value=${sf.motivo} onInput=${(e) => this.setSlide("motivo", e.target.value)} placeholder="Motivo (ej. participación en clase)" style="flex:1;min-width:160px;padding:9px 12px;border:1.5px solid oklch(85% 0.02 225);border-radius:6px;font-size:14px;box-sizing:border-box;background:oklch(99% 0.005 230);color:oklch(26% 0.03 240);"/>
              <button onClick=${() => this.registrarPuntos(est.id, -cantidad, sf.motivo)} style="padding:9px 16px;border-radius:6px;border:1.5px solid oklch(55% 0.18 25);background:transparent;color:oklch(45% 0.18 25);font-size:14px;font-weight:700;cursor:pointer;">− Quitar</button>
              <button onClick=${() => this.registrarPuntos(est.id, cantidad, sf.motivo)} style="padding:9px 16px;border-radius:6px;border:none;background:oklch(48% 0.13 150);color:oklch(97% 0.02 150);font-size:14px;font-weight:700;cursor:pointer;">+ Agregar</button>
            </div>
          </div>

          <div style=${SECCION}>Evolución de puntos</div>
          <${MiniChart} chart=${chart} linea="oklch(48% 0.16 235)" eje="oklch(85% 0.02 225)" colorDia="oklch(40% 0.05 235)" colorHora="oklch(56% 0.03 235)" colorVacio="oklch(50% 0.02 230)"/>

          <div style=${SECCION}>Historial</div>
          ${historial.length === 0 && html`<div style="font-size:13px;color:oklch(50% 0.02 230);font-style:italic;font-family:'Fraunces',serif;">Sin registros todavía</div>`}
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${historial.map(r => html`
              <div key=${r.id} style="display:flex;align-items:center;gap:10px;padding:9px 12px;background:oklch(96% 0.012 225);border-radius:8px;">
                <div style="font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:${r.puntos >= 0 ? "oklch(40% 0.13 150)" : "oklch(45% 0.18 25)"};width:38px;flex-shrink:0;">${(r.puntos > 0 ? "+" : "") + r.puntos}</div>
                <div style="flex:1;min-width:0;">
                  <div style="font-size:13.5px;color:oklch(28% 0.03 240);">${r.motivo}</div>
                  <div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:oklch(60% 0.02 225);margin-top:2px;">${new Date(r.fecha).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>`)}
          </div>
        </div>
      </div>
    </div>`;
  }
}
