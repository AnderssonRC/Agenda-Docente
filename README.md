# Agenda Docente

App de gestión docente (Creación de Clases, Participación, Seguimiento) con
inicio de sesión por correo/contraseña, aprobación de docentes por un
administrador, y datos guardados por usuario en Firestore.

Es una **app de una sola página**: `index.html` carga Firebase y la sesión una
vez, y cada pantalla se cambia sin recargar (`index.html#/clases`,
`#/participacion`, `#/seguimiento`, `#/admin`). No necesita compilar nada:
se sube tal cual a GitHub Pages.

## Archivos

```
index.html            Contenedor único de la app
app/
  main.js             Arranque, rutas y avisos de error
  rutas.js            Registro de módulos (aquí se agregan módulos nuevos)
  firebase.js         Inicializa Firebase (config pública + versión del SDK)
  session.js          Login, registro, perfil y cierre de sesión
  data.js             Datos por usuario en Firestore (watch / saveList)
  ui.js               Piezas compartidas: encabezado, pestañas, gráfico, modal "Acerca de"
  lib.js              Preact + htm
  vistas/
    login.js  inicio.js  admin.js
    clases.js  participacion.js  seguimiento.js
vendor/               Preact, hooks y htm (copias locales, ~16 KB)
firestore.rules       Reglas de seguridad (pegar en la consola de Firebase)
*.dc.html, login.html, admin.html
                      Páginas antiguas: solo redirigen a la nueva para no romper enlaces
```

## Agregar un módulo nuevo

1. Copia una vista existente (p. ej. `app/vistas/participacion.js`) como
   `app/vistas/mi-modulo.js` y ajústala.
2. Añade una entrada en `MODULOS` dentro de `app/rutas.js`.
   Aparece sola en el Inicio y queda disponible en `index.html#/mi-modulo`.

Para guardar datos, usa `watch([...claves], cb)` y `saveList(clave, lista)`
de `app/data.js`. Cada clave se guarda en `usuarios/{uid}/datos/{clave}`, y las
reglas ya permiten que cada docente lea y escriba solo las suyas.

## Por qué es rápida

- Firebase y la sesión se cargan **una sola vez**; moverse entre módulos no recarga la página.
- Cada módulo se descarga solo al abrirlo, y los demás se precargan en segundo plano.
- El perfil aprobado se recuerda en el navegador: al volver, la app abre al
  instante y la aprobación se confirma con Firestore por detrás (si un admin
  bloqueó al docente, se cierra su sesión).
- Los datos se leen primero de la caché local y se mantienen sincronizados en
  vivo, así que al volver a un módulo ya están listos.

## Puesta en marcha (una sola vez)

### 1. Reglas de Firestore
En la consola de Firebase → **Firestore Database → Reglas**, pega el contenido de
`firestore.rules` y **Publica**.

### 2. Crear el primer administrador
1. Regístrate desde la app con el correo que será admin.
2. En la consola → **Authentication → Users**, copia el **User UID** de ese correo.
3. En **Firestore Database → Datos**, abre `usuarios` → el documento con ese UID y edita:
   - `aprobado` → `true` (booleano)
   - `rol` → `admin` (texto)
4. Vuelve a entrar: en el menú del avatar aparecerá **Administrar usuarios**.

### 3. Dominios autorizados (para GitHub Pages)
En **Authentication → Settings → Dominios autorizados**, añade `TU-USUARIO.github.io`.

## Publicar en GitHub Pages

1. Sube **todos** los archivos, incluidas las carpetas `app/` y `vendor/`.
2. En el repo → **Settings → Pages** → Source: rama `main`, carpeta `/root`.
3. Abre `https://TU-USUARIO.github.io/TU-REPO/`.

## Cómo funciona el acceso

- Un docente se **registra** → queda **pendiente** (`aprobado: false`).
- Un **admin** lo **aprueba** desde el panel de administración.
- El docente ve **solo su propia data**, guardada en `usuarios/{uid}/datos/...`.
- Las reglas impiden leer/escribir la data de otro o auto-aprobarse.

## Notas

- Al **eliminar** un docente desde el panel se borra su **perfil** (pierde acceso).
  Su cuenta de Authentication debe borrarse aparte desde la consola de Firebase.
- La config de Firebase en `app/firebase.js` es pública por diseño; la seguridad
  vive en las reglas de Firestore.
