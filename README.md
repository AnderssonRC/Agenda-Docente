# Agenda Docente — Login con Firebase

App de gestión docente (Creación de Clases, Participación, Seguimiento) con
inicio de sesión por correo/contraseña, aprobación de docentes por un
administrador, y datos guardados por usuario en Firestore.

## Archivos

- `index.html` — redirige a `login.html`.
- `login.html` — inicio de sesión y registro de docentes.
- `admin.html` — panel de administración (aprobar/bloquear/eliminar docentes, dar/quitar admin).
- `Agenda Docente.dc.html` — home de la app (protegido).
- `Creacion de Clases.dc.html`, `Participacion de Clase.dc.html`, `Seguimiento de Estudiantes.dc.html` — módulos (protegidos).
- `firebase-config.js` — inicializa Firebase (config pública).
- `auth-guard.js` — exige sesión válida y aprobada; oculta la página si no.
- `firebase-data.js` — capa de datos: reemplaza localStorage por Firestore, por usuario.
- `firestore.rules` — **reglas de seguridad** (pegar en la consola de Firebase).
- `support.js`, `assets/logo.png` — framework y recursos originales.

## Puesta en marcha (una sola vez)

### 1. Reglas de Firestore
En la consola de Firebase → **Firestore Database → Reglas**, pega el contenido de
`firestore.rules` y **Publica**. Sin esto, la app no funcionará de forma segura.

### 2. Crear el primer administrador
Los administradores se designan a mano la primera vez:

1. Regístrate normalmente desde `login.html` con el correo que será admin.
2. En la consola → **Authentication → Users**, copia el **User UID** de ese correo.
3. En **Firestore Database → Datos**, abre la colección `usuarios` → el documento
   con ese UID, y edítalo:
   - `aprobado` → `true` (booleano)
   - `rol` → `admin` (texto)
4. Entra de nuevo en `login.html`: ese usuario irá directo al panel `admin.html`
   y desde ahí podrá aprobar al resto de docentes. Nadie más necesita tocar la consola.

### 3. Dominios autorizados (para GitHub Pages)
En **Authentication → Settings → Dominios autorizados**, añade tu dominio de
GitHub Pages: `TU-USUARIO.github.io`. (Sin esto el login falla al publicar.)

## Publicar en GitHub Pages

1. Crea un repositorio y sube **todos** estos archivos (incluye `support.js` y `assets/`).
2. En el repo → **Settings → Pages** → Source: rama `main`, carpeta `/root`. Guarda.
3. Espera a que GitHub publique la URL `https://TU-USUARIO.github.io/TU-REPO/`.
4. Añade ese dominio en Firebase (paso 3 de arriba).
5. Abre la URL: te llevará al login.

## Cómo funciona el acceso

- Un docente se **registra** → queda **pendiente** (`aprobado: false`), no puede entrar.
- Un **admin** lo **aprueba** desde `admin.html`.
- A partir de ahí el docente entra y ve **solo su propia data** (materias, cursos,
  estudiantes, etc.), guardada en `usuarios/{uid}/datos/...`.
- Las reglas impiden que un usuario lea/escriba la data de otro o se auto-apruebe.

## Notas

- Al **eliminar** un docente desde el panel se borra su **perfil** (pierde acceso).
  Su cuenta de inicio de sesión (Authentication) debe borrarse aparte desde la
  consola de Firebase si se desea, ya que eso no puede hacerse de forma segura
  desde el cliente.
- La config de Firebase en `firebase-config.js` es pública por diseño; la seguridad
  vive en las reglas de Firestore.
