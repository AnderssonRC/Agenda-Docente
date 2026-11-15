// rutas.js — registro de módulos y pantallas.
//
// PARA AGREGAR UN MÓDULO NUEVO:
//   1. Crea app/vistas/mi-modulo.js con `export default function MiModulo({ sesion }) {…}`
//      (copia uno existente como punto de partida).
//   2. Añade una entrada a MODULOS abajo. Aparecerá solo en el Inicio y
//      quedará disponible en index.html#/<ruta>.

export const MODULOS = [
  {
    ruta: "clases",
    titulo: "Diseño de Clase",
    descripcion: "Diseña tus clases: momentos, contenido, recursos y presentación.",
    emoji: "📘", tag: "Planeación",
    band: "linear-gradient(135deg, oklch(72% 0.1 60), oklch(62% 0.11 48))",
    tagColor: "oklch(45% 0.11 48)",
    cargar: () => import("./vistas/clases.js")
  },
  {
    ruta: "participacion",
    titulo: "Participación de Clase",
    descripcion: "Registra la participación de tus estudiantes en cada sesión.",
    emoji: "🙋", tag: "Participación",
    band: "linear-gradient(135deg, oklch(70% 0.1 40), oklch(58% 0.13 32))",
    tagColor: "oklch(46% 0.13 34)",
    cargar: () => import("./vistas/participacion.js")
  },
  {
    ruta: "seguimiento",
    titulo: "Seguimiento de Estudiantes",
    descripcion: "Da seguimiento al progreso y las situaciones de cada estudiante.",
    emoji: "📈", tag: "Seguimiento",
    band: "linear-gradient(135deg, oklch(72% 0.1 78), oklch(62% 0.11 68))",
    tagColor: "oklch(46% 0.12 68)",
    cargar: () => import("./vistas/seguimiento.js")
  }
];

export const RUTAS = {
  "": { titulo: "Agenda Docente", cargar: () => import("./vistas/inicio.js") },
  admin: { titulo: "Administración · Agenda Docente", soloAdmin: true, cargar: () => import("./vistas/admin.js") },
  login: { titulo: "Agenda Docente · Ingreso", cargar: () => import("./vistas/login.js") }
};
for (const m of MODULOS) RUTAS[m.ruta] = { titulo: m.titulo + " · Agenda Docente", cargar: m.cargar };
